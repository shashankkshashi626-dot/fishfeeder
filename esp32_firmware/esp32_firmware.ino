/**
 * FishFeeder v2.0 - ESP32 Firmware Sketch
 * 
 * This firmware connects an ESP32 micro-controller directly to HiveMQ Cloud MQTT Broker
 * over a secure TLS connection (port 8883). It subscribes to feed commands, 
 * controls the dispenser servo, and publishes real-time sensor telemetry.
 * 
 * Hardware Connections:
 *  - Dispenser Servo Signal Pin: GPIO 25
 *  - DS18B20 Temp Sensor: GPIO 32 (Requires 4.7k pullup resistor to 3.3V)
 *  - Water Level Switch Pin: GPIO 33 (Digital input, active low with pullup)
 *  - Food Level Sensor Pin: GPIO 34 (Analog input - e.g., IR/distance sensor)
 *  - Battery Voltage Pin: GPIO 35 (Analog input - through voltage divider)
 *  - USB/Adapter Power Sense: GPIO 26 (Digital input - VBUS sense)
 *  - Status LED: GPIO 2 (Built-in LED)
 * 
 * Library Dependencies (Install via Arduino Library Manager):
 *  - PubSubClient (by Nick O'Leary)
 *  - OneWire (by Paul Stoffregen)
 *  - DallasTemperature (by Miles Burton)
 *  - ESP32Servo (by John K. Bennett)
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ESP32Servo.h>
#include "time.h"

// ==========================================
// CONFIGURATIONS - UPDATE THESE DETAILS
// ==========================================
const char* ssid = "Homies";
const char* password = "Act@2026*";

// HiveMQ Cloud details (e.g. xxxxx.s1.eu.hivemq.cloud)
// Do NOT include "wss://" or ports in the host string.
const char* mqtt_host = "0996b9bcc0b44d5599eaaf687e45ea8e.s1.eu.hivemq.cloud"; 
const int mqtt_port = 8883; // Secure MQTT TLS Port
const char* mqtt_user = "fishuser";
const char* mqtt_pass = "Fish@123456";

// Time Zone offset (seconds). Example: UTC+5:30 = 5.5 * 3600 = 19800
const long gmtOffset_sec = 19800; 
const int daylightOffset_sec = 0;
const char* ntpServer = "pool.ntp.org";

// Pin Allocations
#define STATUS_LED     2
#define SERVO_PIN      25
#define POWER_SENSE    26
#define TEMP_PIN       32
#define WATER_LVL_PIN  33
#define FOOD_LVL_PIN   34
#define BATT_SENSE     35

// MQTT Client & SSL Network Connections
WiFiClientSecure netClient;
PubSubClient mqttClient(netClient);

// Hardware Instances
OneWire oneWire(TEMP_PIN);
DallasTemperature tempSensors(&oneWire);
Servo feederServo;

// Local Session Metrics
int todayFeedCount = 0;
String lastFeedTimeStr = "No Data Received";
unsigned long lastTelemetryPublish = 0;
const unsigned long telemetryInterval = 6000; // Publish sensors every 6 seconds

// ==========================================
// SETUP ENTRYPOINT
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\nInitializing FishFeeder v2.0...");

  // Setup pin modes
  pinMode(STATUS_LED, OUTPUT);
  pinMode(WATER_LVL_PIN, INPUT_PULLUP);
  pinMode(POWER_SENSE, INPUT);
  digitalWrite(STATUS_LED, LOW);

  // Initialize sensors
  tempSensors.begin();

  // Initialize WiFi connection
  connectWiFi();

  // Configure NTP real-time clock syncing
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("Synchronizing local RTC with NTP server...");

  // Configure Secure SSL Network Settings
  // Note: For convenience in dev, we use setInsecure() to bypass checking the specific root CA.
  // In production, load the HiveMQ Let's Encrypt Root Certificate into netClient using netClient.setCACert(cert).
  netClient.setInsecure();

  // Setup MQTT settings
  mqttClient.setServer(mqtt_host, mqtt_port);
  mqttClient.setCallback(mqttMessageReceived);
  
  // Connect to MQTT Broker
  connectMQTT();
}

// ==========================================
// LOOP COORDINATOR
// ==========================================
void loop() {
  // Re-establish MQTT connection if dropped
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();

  // Periodically read and publish telemetry
  unsigned long currentMillis = millis();
  if (currentMillis - lastTelemetryPublish >= telemetryInterval) {
    lastTelemetryPublish = currentMillis;
    publishTelemetry();
  }
}

// ==========================================
// WIFI MANAGEMENT
// ==========================================
void connectWiFi() {
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    digitalWrite(STATUS_LED, !digitalRead(STATUS_LED)); // Blink LED while connecting
  }
  
  digitalWrite(STATUS_LED, HIGH); // LED stays on when Wi-Fi is connected
  Serial.println("\nWi-Fi connection established!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

// ==========================================
// MQTT MANAGEMENT & LWT SETUP
// ==========================================
void connectMQTT() {
  while (!mqttClient.connected()) {
    // If Wi-Fi connection drops, reconnect Wi-Fi first
    if (WiFi.status() != WL_CONNECTED) {
      connectWiFi();
    }
    
    Serial.print("Connecting to HiveMQ Cloud MQTT Broker...");
    
    // Generate unique client ID
    String clientId = "esp32_feeder_" + String(random(0xffff), HEX);
    
    // MQTT LWT parameters: topic, QoS, retained, message
    const char* lwtTopic = "fishfeeder/esp/status";
    const char* lwtMessage = "Offline";
    boolean lwtRetain = true;
    int lwtQos = 1;

    // Connect using LWT parameters to publish Offline state if ESP32 drops connection unexpectedly
    if (mqttClient.connect(clientId.c_str(), mqtt_user, mqtt_pass, lwtTopic, lwtQos, lwtRetain, lwtMessage)) {
      Serial.println("\nConnected to HiveMQ Cloud!");
      
      // Publish "Online" state as a retained message
      mqttClient.publish("fishfeeder/esp/status", "Online", true);
      
      // Subscribe to command topic with QoS 1
      mqttClient.subscribe("fishfeeder/servo/cmd", 1);
      
      // Update LED state to show connection success
      digitalWrite(STATUS_LED, HIGH);
      
      // Initial telemetry publish immediately on connection
      publishTelemetry();
    } else {
      Serial.print(" failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" | Retrying in 5 seconds...");
      digitalWrite(STATUS_LED, LOW);
      delay(5000);
    }
  }
}

// ==========================================
// MQTT MESSAGE CALLBACK (LISTENERS)
// ==========================================
void mqttMessageReceived(char* topic, byte* payload, unsigned int length) {
  // Convert payload buffer to a clean string
  String msg = "";
  for (int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }
  msg.trim();

  Serial.printf("\n[MQTT Rx] Topic: %s | Payload: %s\n", topic, msg.c_str());

  if (String(topic) == "fishfeeder/servo/cmd") {
    if (msg == "FEED") {
      triggerFeedingCycle();
    }
  }
}

// ==========================================
// FEEDING HARDWARE CONTROL ROUTINE
// ==========================================
void triggerFeedingCycle() {
  Serial.println("Dispense cycle requested! Triggering servo sweep...");
  
  // 1. Publish "Feeding" status
  mqttClient.publish("fishfeeder/servo/status", "Feeding");

  // 2. Attach Servo and perform a clean 0 to 120 degree sweep
  feederServo.attach(SERVO_PIN);
  
  // Sweep out to drop food
  for (int pos = 0; pos <= 120; pos += 4) {
    feederServo.write(pos);
    delay(15);
  }
  delay(500); // Wait for pellets to drop
  
  // Sweep back to home position
  for (int pos = 120; pos >= 0; pos -= 4) {
    feederServo.write(pos);
    delay(15);
  }
  delay(150);
  feederServo.detach(); // Detach to save power and eliminate servo jitter

  // 3. Get timestamp from local RTC
  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    char timeBuffer[32];
    strftime(timeBuffer, sizeof(timeBuffer), "%I:%M %p", &timeinfo);
    lastFeedTimeStr = String(timeBuffer);
  } else {
    lastFeedTimeStr = "Time Unavailable";
  }

  // 4. Increment feed count
  todayFeedCount++;

  // 5. Publish Feed confirmation status, timestamp and feed count updates
  mqttClient.publish("fishfeeder/feed/count", String(todayFeedCount).c_str(), true);
  mqttClient.publish("fishfeeder/feed/time", lastFeedTimeStr.c_str(), true);
  mqttClient.publish("fishfeeder/servo/status", "Done");
  
  Serial.printf("Feeding cycle complete. Last Feed: %s | Count: %d\n", lastFeedTimeStr.c_str(), todayFeedCount);
  
  // Return servo status to Waiting after small delay
  delay(1000);
  mqttClient.publish("fishfeeder/servo/status", "Waiting");
}

// ==========================================
// TELEMETRY SAMPLING & PUBLISHING
// ==========================================
void publishTelemetry() {
  if (!mqttClient.connected()) return;

  Serial.println("\nSampling sensors and publishing telemetry...");

  // 1. Read WiFi RSSI
  int rssi = WiFi.RSSI();
  mqttClient.publish("fishfeeder/wifi/rssi", String(rssi).c_str(), true);

  // 2. Read DS18B20 Water Temperature
  tempSensors.requestTemperatures();
  float tempC = tempSensors.getTempCByIndex(0);
  if (tempC != DEVICE_DISCONNECTED_C && tempC > -50.0 && tempC < 85.0) {
    mqttClient.publish("fishfeeder/watertemp", String(tempC, 2).c_str(), true);
  } else {
    Serial.println("Water temp sensor read failed or disconnected.");
  }

  // 3. Read Water Level Digital Switch
  // Digital pin is pulled high. Switch closed (low) = Normal, Switch open (high) = Low
  String wlStatus = (digitalRead(WATER_LVL_PIN) == LOW) ? "Normal" : "Low";
  mqttClient.publish("fishfeeder/waterlevel", wlStatus.c_str(), true);

  // 4. Read Food Storage Level (Analog Infrared/Distance)
  // Maps raw analog range (e.g. 4095 = empty/far, 1500 = full/close) to 0-100%
  int rawFoodLevel = analogRead(FOOD_LVL_PIN);
  int foodPercent = map(rawFoodLevel, 4095, 1200, 0, 100);
  foodPercent = constrain(foodPercent, 0, 100);
  mqttClient.publish("fishfeeder/foodlevel", String(foodPercent).c_str(), true);

  // 5. Read Battery Voltage
  // Reads analog pin attached to resistor divider (e.g. divider ratio = 2.0)
  int rawBattery = analogRead(BATT_SENSE);
  float voltage = rawBattery * (3.3 / 4095.0) * 2.0; // scale based on voltage divider
  mqttClient.publish("fishfeeder/battery", String(voltage, 2).c_str(), true);

  // 6. Read Power Source (Sense USB VBUS)
  // Input High = USB power connection, Input Low = Battery backup power
  String pSource = (digitalRead(POWER_SENSE) == HIGH) ? "USB" : "Battery";
  mqttClient.publish("fishfeeder/powersource", pSource.c_str(), true);

  Serial.printf("[Telemetry Tx] RSSI: %d dBm | Temp: %.2fC | Water: %s | Food: %d%% | Batt: %.2fV | Power: %s\n", 
                rssi, tempC, wlStatus.c_str(), foodPercent, voltage, pSource.c_str());
}
