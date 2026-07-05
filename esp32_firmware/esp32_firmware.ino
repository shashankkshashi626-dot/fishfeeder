/**
 * FishFeeder v2.0 - ESP32 Firmware Sketch
 * 
 * Features:
 *  - BLE Provisioning: Receive WiFi + MQTT credentials wirelessly from Android app
 *  - Credentials persist to flash (Preferences NVS) — survives reboots
 *  - HiveMQ Cloud TLS MQTT connection for telemetry and servo control
 *  - DS18B20 water temp, food level, water level, battery, power source sensors
 * 
 * Hardware Connections:
 *  - Dispenser Servo Signal Pin: GPIO 25
 *  - DS18B20 Temp Sensor: GPIO 32 (Requires 4.7k pullup resistor to 3.3V)
 *  - Water Level Switch Pin: GPIO 33 (Digital input, active low with pullup)
 *  - Food Level Sensor Pin: GPIO 34 (Analog input - IR/distance sensor)
 *  - Battery Voltage Pin: GPIO 35 (Analog input - through voltage divider)
 *  - USB/Adapter Power Sense: GPIO 26 (Digital input - VBUS sense)
 *  - Status LED: GPIO 2 (Built-in LED)
 * 
 * BLE Setup:
 *  - Advertises as "FeedMe-Setup" for 60s after boot
 *  - Send JSON via BLE to update credentials without re-flashing
 *  - Service UUID:        4fafc201-1fb5-459e-8fcc-c5c9c331914b
 *  - Characteristic UUID: beb5483e-36e1-4688-b7f5-ea07361b26a8
 * 
 * Library Dependencies (Install via Arduino Library Manager):
 *  - PubSubClient (by Nick O'Leary)
 *  - OneWire (by Paul Stoffregen)
 *  - DallasTemperature (by Miles Burton)
 *  - ESP32Servo (by John K. Bennett)
 *  - ArduinoJson (by Benoit Blanchon)  <-- NEW
 *  BLEDevice, Preferences are built into ESP32 Arduino core
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ESP32Servo.h>
#include <Preferences.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ArduinoJson.h>
#include "time.h"

// ==========================================
// BLE CONFIGURATION
// ==========================================
#define BLE_SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define BLE_CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define BLE_DEVICE_NAME         "OhmNest"
#define BLE_TIMEOUT_MS          30000   // BLE advertises for 30 seconds after trigger

// ==========================================
// PREFERENCES (FLASH STORAGE) NAMESPACE
// ==========================================
#define PREFS_NS "feedme_creds"

// ==========================================
// HARDCODED DEFAULT CREDENTIALS
// (Used only if no credentials are saved in flash)
// ==========================================
#define DEFAULT_SSID       "Homies"
#define DEFAULT_WIFIPASS   "Act@2026*"
#define DEFAULT_MQTT_HOST  "0996b9bcc0b44d5599eaaf687e45ea8e.s1.eu.hivemq.cloud"
#define DEFAULT_MQTT_USER  "fishuser"
#define DEFAULT_MQTT_PASS  "Fishpass1234"

// Active credential buffers (loaded from flash at boot)
char cfg_ssid[64];
char cfg_wifipass[64];
char cfg_mqtt_host[128];
char cfg_mqtt_user[64];
char cfg_mqtt_pass[64];

// Time Zone (UTC+5:30 for India)
const long  gmtOffset_sec     = 19800;
const int   daylightOffset_sec = 0;
const char* ntpServer          = "pool.ntp.org";
const int   mqtt_port          = 8883;

// Pin Allocations
#define STATUS_LED     2
#define SERVO_PIN      25
#define POWER_SENSE    26
#define TEMP_PIN       32
#define WATER_LVL_PIN  33
#define FOOD_LVL_PIN   34
#define BATT_SENSE     35
#define TOUCH_PIN      12   // Capacitive Touch 5 is GPIO 12
#define TOUCH_THRESHOLD 40  // Capacitive threshold (untouched ~70, touched < 30)

// Hardware instances
WiFiClientSecure netClient;
PubSubClient     mqttClient(netClient);
OneWire          oneWire(TEMP_PIN);
DallasTemperature tempSensors(&oneWire);
Servo            feederServo;
Preferences      prefs;

// BLE instances
BLEServer*         pServer         = nullptr;
BLECharacteristic* pCharacteristic = nullptr;
bool               bleActive       = false;
bool               bleClientConnected = false;
unsigned long      bleStartTime    = 0;

// WiFi/MQTT deferred init flag
bool               wifiMqttReady   = false;

// Session metrics
int           todayFeedCount      = 0;
String        lastFeedTimeStr     = "No Data Received";
unsigned long lastTelemetryPublish = 0;
const unsigned long telemetryInterval = 6000;

// ==========================================
// LOAD CREDENTIALS FROM FLASH
// Falls back to hardcoded defaults if empty
// ==========================================
void loadCredentials() {
  prefs.begin(PREFS_NS, true); // read-only

  String s_ssid  = prefs.getString("ssid",      DEFAULT_SSID);
  String s_pass  = prefs.getString("wifipass",  DEFAULT_WIFIPASS);
  String s_host  = prefs.getString("mqttHost",  DEFAULT_MQTT_HOST);
  String s_user  = prefs.getString("mqttUser",  DEFAULT_MQTT_USER);
  String s_mpass = prefs.getString("mqttPass",  DEFAULT_MQTT_PASS);
  prefs.end();

  s_ssid.trim();
  s_pass.trim();
  s_host.trim();
  s_user.trim();
  s_mpass.trim();

  s_ssid.toCharArray(cfg_ssid,      sizeof(cfg_ssid));
  s_pass.toCharArray(cfg_wifipass,  sizeof(cfg_wifipass));
  s_host.toCharArray(cfg_mqtt_host, sizeof(cfg_mqtt_host));
  s_user.toCharArray(cfg_mqtt_user, sizeof(cfg_mqtt_user));
  s_mpass.toCharArray(cfg_mqtt_pass, sizeof(cfg_mqtt_pass));

  Serial.println("\n[Credentials] Loaded from flash:");
  Serial.printf("  WiFi SSID : %s\n", cfg_ssid);
  Serial.printf("  MQTT Host : %s\n", cfg_mqtt_host);
  Serial.printf("  MQTT User : %s\n", cfg_mqtt_user);
}

// ==========================================
// BLE GATT CALLBACK — receives JSON credentials
// ==========================================
class ProvisionCallback : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* pChar) override {
    String raw = pChar->getValue();
    if (raw.length() == 0) return;

    Serial.printf("\n[BLE Rx] Received %d bytes\n", raw.length());
    Serial.println(raw.c_str());

    // Parse JSON
    StaticJsonDocument<512> doc;
    DeserializationError err = deserializeJson(doc, raw.c_str());

    if (err) {
      Serial.printf("[BLE] JSON parse error: %s\n", err.c_str());
      pChar->setValue("ERR:Invalid JSON format");
      pChar->notify();
      return;
    }

    // Save each field to flash if present in JSON
    prefs.begin(PREFS_NS, false); // read-write
    bool saved = false;

    if (doc.containsKey("ssid") && strlen(doc["ssid"]) > 0) {
      String val = doc["ssid"].as<String>();
      val.trim();
      prefs.putString("ssid", val);
      saved = true;
    }
    if (doc.containsKey("wifipass")) {
      String val = doc["wifipass"].as<String>();
      val.trim();
      prefs.putString("wifipass", val);
      saved = true;
    }
    if (doc.containsKey("mqttHost") && strlen(doc["mqttHost"]) > 0) {
      String val = doc["mqttHost"].as<String>();
      val.trim();
      prefs.putString("mqttHost", val);
      saved = true;
    }
    if (doc.containsKey("mqttUser")) {
      String val = doc["mqttUser"].as<String>();
      val.trim();
      prefs.putString("mqttUser", val);
      saved = true;
    }
    if (doc.containsKey("mqttPass")) {
      String val = doc["mqttPass"].as<String>();
      val.trim();
      prefs.putString("mqttPass", val);
      saved = true;
    }
    prefs.end();

    if (saved) {
      Serial.println("[BLE] Credentials saved to flash! Restarting in 1.5s...");
      pChar->setValue("OK:Credentials saved. Restarting ESP32...");
      pChar->notify();
      delay(1500);
      ESP.restart();
    } else {
      pChar->setValue("ERR:No valid fields found in JSON");
      pChar->notify();
    }
  }
};

// ==========================================
// BLE SERVER CONNECTION CALLBACKS
// ==========================================
class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) override {
    bleClientConnected = true;
    Serial.println("[BLE] Client connected");
  }
  void onDisconnect(BLEServer* pServer) override {
    bleClientConnected = false;
    Serial.println("[BLE] Client disconnected");
    // Re-advertise so client can reconnect if needed
    if (bleActive) {
      BLEDevice::startAdvertising();
    }
  }
};

// ==========================================
// BLE SERVER — starts advertising
// ==========================================
void startBLE() {
  BLEDevice::init(BLE_DEVICE_NAME);
  BLEDevice::setMTU(512);

  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  BLEService* pService = pServer->createService(BLE_SERVICE_UUID);

  pCharacteristic = pService->createCharacteristic(
    BLE_CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ  |
    BLECharacteristic::PROPERTY_WRITE |
    BLECharacteristic::PROPERTY_NOTIFY
  );
  pCharacteristic->addDescriptor(new BLE2902());
  pCharacteristic->setCallbacks(new ProvisionCallback());

  pService->start();

  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(BLE_SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  BLEDevice::startAdvertising();

  bleActive    = true;
  bleStartTime = millis();

  Serial.printf("[BLE] Advertising as '%s' for %d seconds...\n", BLE_DEVICE_NAME, BLE_TIMEOUT_MS / 1000);
  Serial.printf("[BLE] Service UUID:        %s\n", BLE_SERVICE_UUID);
  Serial.printf("[BLE] Characteristic UUID: %s\n", BLE_CHARACTERISTIC_UUID);
}

// ==========================================
// BLE TIMEOUT CHECK — stops BLE after 60s to save power
// ==========================================
void stopBLE() {
  if (!bleActive) return;
  BLEDevice::stopAdvertising();
  BLEDevice::deinit(true);  // fully release BLE radio for WiFi
  bleActive = false;
  bleClientConnected = false;
  Serial.println("[BLE] Stopped and radio released for WiFi.");
}

void checkBLETimeout() {
  if (bleActive && !bleClientConnected && (millis() - bleStartTime > BLE_TIMEOUT_MS)) {
    Serial.println("[BLE] Advertising timeout. Switching to WiFi mode.");
    stopBLE();
  }
}

// ==========================================
// WIFI MANAGEMENT
// ==========================================
void connectWiFi() {
  Serial.printf("\n[WiFi] Connecting to: %s\n", cfg_ssid);

  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(500);
  WiFi.begin(cfg_ssid, cfg_wifipass);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 30) {
    delay(500);
    Serial.print(".");
    digitalWrite(STATUS_LED, !digitalRead(STATUS_LED));
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(STATUS_LED, HIGH);
    Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    digitalWrite(STATUS_LED, LOW);
    Serial.println("\n[WiFi] Connection timeout. Will retry...");
  }
}

// ==========================================
// MQTT MANAGEMENT & LWT SETUP
// ==========================================
void connectMQTT() {
  while (!mqttClient.connected()) {
    if (WiFi.status() != WL_CONNECTED) {
      connectWiFi();
    }

    Serial.printf("[MQTT] Connecting to %s...", cfg_mqtt_host);

    String clientId = "esp32_feeder_" + String(random(0xffff), HEX);

    const char* lwtTopic   = "fishfeeder/esp/status";
    const char* lwtMessage = "Offline";

    if (mqttClient.connect(clientId.c_str(), cfg_mqtt_user, cfg_mqtt_pass,
                           lwtTopic, 1, true, lwtMessage)) {
      Serial.println(" Connected!");
      mqttClient.publish("fishfeeder/esp/status", "Online", true);
      mqttClient.subscribe("fishfeeder/servo/cmd", 1);
      digitalWrite(STATUS_LED, HIGH);
      publishTelemetry();
    } else {
      Serial.printf(" failed rc=%d | Retrying in 5s...\n", mqttClient.state());
      digitalWrite(STATUS_LED, LOW);
      delay(5000);
    }
  }
}

// ==========================================
// MQTT MESSAGE CALLBACK
// ==========================================
void mqttMessageReceived(char* topic, byte* payload, unsigned int length) {
  String msg = "";
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
  msg.trim();

  Serial.printf("\n[MQTT Rx] Topic: %s | Payload: %s\n", topic, msg.c_str());

  if (String(topic) == "fishfeeder/servo/cmd" && msg == "FEED") {
    triggerFeedingCycle();
  }
}

// ==========================================
// FEEDING HARDWARE CONTROL
// ==========================================
void triggerFeedingCycle() {
  Serial.println("Dispense cycle requested! Triggering servo sweep...");

  mqttClient.publish("fishfeeder/servo/status", "Feeding");

  feederServo.attach(SERVO_PIN);
  for (int pos = 0; pos <= 120; pos += 4) { feederServo.write(pos); delay(15); }
  delay(500);
  for (int pos = 120; pos >= 0; pos -= 4) { feederServo.write(pos); delay(15); }
  delay(150);
  feederServo.detach();

  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    char timeBuffer[32];
    strftime(timeBuffer, sizeof(timeBuffer), "%I:%M %p", &timeinfo);
    lastFeedTimeStr = String(timeBuffer);
  } else {
    lastFeedTimeStr = "Time Unavailable";
  }

  todayFeedCount++;
  mqttClient.publish("fishfeeder/feed/count", String(todayFeedCount).c_str(), true);
  mqttClient.publish("fishfeeder/feed/time",  lastFeedTimeStr.c_str(), true);
  mqttClient.publish("fishfeeder/servo/status", "Done");
  Serial.printf("Feeding complete. Time: %s | Count: %d\n", lastFeedTimeStr.c_str(), todayFeedCount);
  delay(1000);
  mqttClient.publish("fishfeeder/servo/status", "Waiting");
}

// ==========================================
// TELEMETRY SAMPLING & PUBLISHING
// ==========================================
void publishTelemetry() {
  if (!mqttClient.connected()) return;
  Serial.println("\nSampling sensors and publishing telemetry...");

  int rssi = WiFi.RSSI();
  mqttClient.publish("fishfeeder/wifi/rssi", String(rssi).c_str(), true);

  tempSensors.requestTemperatures();
  float tempC = tempSensors.getTempCByIndex(0);
  if (tempC != DEVICE_DISCONNECTED_C && tempC > -50.0 && tempC < 85.0) {
    mqttClient.publish("fishfeeder/watertemp", String(tempC, 2).c_str(), true);
  } else {
    Serial.println("Water temp sensor read failed or disconnected.");
  }

  String wlStatus = (digitalRead(WATER_LVL_PIN) == LOW) ? "Normal" : "Low";
  mqttClient.publish("fishfeeder/waterlevel", wlStatus.c_str(), true);

  int rawFood    = analogRead(FOOD_LVL_PIN);
  int foodPct    = constrain(map(rawFood, 4095, 1200, 0, 100), 0, 100);
  mqttClient.publish("fishfeeder/foodlevel", String(foodPct).c_str(), true);

  int rawBat  = analogRead(BATT_SENSE);
  float volts = rawBat * (3.3 / 4095.0) * 2.0;
  mqttClient.publish("fishfeeder/battery", String(volts, 2).c_str(), true);

  String pSrc = (digitalRead(POWER_SENSE) == HIGH) ? "USB" : "Battery";
  mqttClient.publish("fishfeeder/powersource", pSrc.c_str(), true);

  Serial.printf("[Telemetry Tx] RSSI: %d dBm | Temp: %.2fC | Water: %s | Food: %d%% | Batt: %.2fV | Power: %s\n",
                rssi, tempC, wlStatus.c_str(), foodPct, volts, pSrc.c_str());
}

// ==========================================
// TOUCH SENSOR TRIGGER CHECK
// ==========================================
bool checkTouchTrigger() {
  int touchVal = touchRead(TOUCH_PIN);
  if (touchVal < TOUCH_THRESHOLD) {
    delay(50); // debounce
    touchVal = touchRead(TOUCH_PIN);
    if (touchVal < TOUCH_THRESHOLD) {
      Serial.printf("[Touch] Triggered! Value: %d (Threshold: %d)\n", touchVal, TOUCH_THRESHOLD);
      return true;
    }
  }
  return false;
}

void startBLEMode() {
  Serial.println("\n[Touch] Activating BLE provisioning mode...");
  digitalWrite(STATUS_LED, LOW);
  
  // 1. Disconnect WiFi and MQTT to free radio
  mqttClient.disconnect();
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  delay(300);

  // 2. Start BLE advertising
  startBLE();
  wifiMqttReady = false; // Reset WiFi ready flag so it can be re-inited later
}

// ==========================================
// START WIFI + MQTT
// ==========================================
void initWiFiAndMQTT() {
  if (wifiMqttReady) return;

  Serial.println("\n[Init] Starting WiFi + MQTT...");
  connectWiFi();

  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("[NTP] Synchronizing RTC with time server...");

  netClient.setInsecure(); // Use setCACert() for production security
  mqttClient.setServer(cfg_mqtt_host, mqtt_port);
  mqttClient.setCallback(mqttMessageReceived);
  connectMQTT();

  wifiMqttReady = true;
}

// ==========================================
// SETUP ENTRYPOINT
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== FishFeeder v2.0 + Touch BLE Setup ===");

  // Hardware init
  pinMode(STATUS_LED,    OUTPUT);
  pinMode(WATER_LVL_PIN, INPUT_PULLUP);
  pinMode(POWER_SENSE,   INPUT);
  digitalWrite(STATUS_LED, LOW);
  tempSensors.begin();

  // Load credentials from NVS
  loadCredentials();

  // Boot directly to WiFi and MQTT mode
  initWiFiAndMQTT();
  Serial.println("[Setup] System running in WiFi mode. Touch GPIO12 (T5) to activate BLE setup.");
}

// ==========================================
// MAIN LOOP
// ==========================================
void loop() {
  if (bleActive) {
    // BLE mode is active — handle timeout and connection
    checkBLETimeout();
    // Blink LED rapidly in BLE mode
    digitalWrite(STATUS_LED, (millis() / 150) % 2);
    delay(10);
    return;
  }

  // Normal WiFi/MQTT mode
  if (!wifiMqttReady) {
    initWiFiAndMQTT();
  }

  // Check touch sensor to trigger BLE configuration mode
  if (checkTouchTrigger()) {
    startBLEMode();
    return;
  }

  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();

  // Periodic telemetry
  unsigned long now = millis();
  if (now - lastTelemetryPublish >= telemetryInterval) {
    lastTelemetryPublish = now;
    publishTelemetry();
  }
}

