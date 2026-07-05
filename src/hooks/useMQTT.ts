import { useState, useEffect, useCallback, useRef } from 'react';
import { connectMQTT } from '../mqtt/mqtt';
import mqtt from 'mqtt';

export interface ActivityEvent {
  id: string;
  time: string;
  message: string;
}

export interface MQTTDataState {
  // Connection states
  mqttConnected: boolean;
  mqttError: string | null;
  espOnline: boolean | null; // null means waiting for first message
  
  // ESP32 telemetry data
  wifiRssi: number | null;
  servoStatus: 'Waiting' | 'Feeding' | 'Done' | 'Error' | null;
  lastFeedTime: string | null;
  feedCount: number | null;
  foodLevel: number | null;
  waterTemp: number | null;
  waterLevel: 'Normal' | 'Low' | null;
  batteryVoltage: number | null;
  powerSource: 'Battery' | 'USB' | 'DC Adapter' | null;
  
  // Timeline events
  activityLog: ActivityEvent[];
}

export const useMQTT = () => {
  const [data, setData] = useState<MQTTDataState>({
    mqttConnected: false,
    mqttError: null,
    espOnline: null,
    wifiRssi: null,
    servoStatus: null,
    lastFeedTime: null,
    feedCount: null,
    foodLevel: null,
    waterTemp: null,
    waterLevel: null,
    batteryVoltage: null,
    powerSource: null,
    activityLog: []
  });

  const clientRef = useRef<mqtt.MqttClient | null>(null);

  // Helper to add activity events dynamically from MQTT occurrences
  const addActivity = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    setData(prev => ({
      ...prev,
      activityLog: [
        {
          id: `${Date.now()}-${Math.random()}`,
          time: timestamp,
          message
        },
        ...prev.activityLog
      ].slice(0, 30) // Cap log at last 30 events
    }));
  }, []);

  // Connect & subscribe to topics
  useEffect(() => {
    const cleanString = (str: string | null | undefined): string | undefined => {
      if (!str) return undefined;
      let cleaned = str.trim();
      if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
          (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.substring(1, cleaned.length - 1).trim();
      }
      return cleaned;
    };

    const brokerUrl = cleanString(localStorage.getItem('override_mqtt_url') || import.meta.env.VITE_MQTT_BROKER_URL);
    const username = cleanString(localStorage.getItem('override_mqtt_user') || import.meta.env.VITE_MQTT_USERNAME);
    const password = cleanString(localStorage.getItem('override_mqtt_pass') || import.meta.env.VITE_MQTT_PASSWORD);

    if (!brokerUrl) {
      console.warn("MQTT URL (VITE_MQTT_BROKER_URL) is missing. Check .env configurations.");
      setData(prev => ({
        ...prev,
        mqttError: "MQTT Broker URL is not configured. Please check your .env settings."
      }));
      return;
    }

    try {
      console.log(`Attempting connection to MQTT broker: ${brokerUrl}`);
      const client = connectMQTT({ brokerUrl, username, password });
      clientRef.current = client;

      client.on('connect', () => {
        console.log("MQTT Client Connected to HiveMQ Cloud");
        setData(prev => ({
          ...prev,
          mqttConnected: true,
          mqttError: null
        }));
        
        // Log broker connection event
        addActivity("MQTT Connected");

        // Subscribe to all required topics
        const topics = [
          'fishfeeder/servo/status',
          'fishfeeder/esp/status',
          'fishfeeder/wifi/rssi',
          'fishfeeder/feed/count',
          'fishfeeder/feed/time',
          'fishfeeder/foodlevel',
          'fishfeeder/watertemp',
          'fishfeeder/waterlevel',
          'fishfeeder/battery',
          'fishfeeder/powersource'
        ];

        client.subscribe(topics, { qos: 1 }, (err) => {
          if (err) {
            console.error("Subscription error:", err);
            setData(prev => ({ ...prev, mqttError: "Failed to subscribe to MQTT topics" }));
          } else {
            console.log("Successfully subscribed to all telemetry topics");
          }
        });
      });

      client.on('message', (topic, payload) => {
        const msg = payload.toString().trim();
        console.log(`[MQTT RX] ${topic}: ${msg}`);

        setData(prev => {
          const updates: Partial<MQTTDataState> = {};
          let activityMessage: string | null = null;

          switch (topic) {
            case 'fishfeeder/esp/status':
              const isOnline = msg.toLowerCase() === 'online';
              if (prev.espOnline !== isOnline) {
                updates.espOnline = isOnline;
                activityMessage = isOnline ? "ESP32 Connected" : "ESP32 Offline";
              }
              break;

            case 'fishfeeder/servo/status':
              // Expect: "Waiting", "Feeding", "Done", "Error"
              const newStatus = msg as MQTTDataState['servoStatus'];
              if (prev.servoStatus !== newStatus) {
                updates.servoStatus = newStatus;
                if (newStatus === 'Feeding') activityMessage = "Feeder Activated";
                if (newStatus === 'Done') activityMessage = "Feeding Cycle Completed";
                if (newStatus === 'Error') activityMessage = "Servo Motor Fault Detected";
              }
              break;

            case 'fishfeeder/wifi/rssi':
              const rssi = parseInt(msg, 10);
              if (!isNaN(rssi)) updates.wifiRssi = rssi;
              break;

            case 'fishfeeder/feed/count':
              const count = parseInt(msg, 10);
              if (!isNaN(count)) {
                updates.feedCount = count;
                // Add event if count increases
                if (prev.feedCount !== null && count > prev.feedCount) {
                  activityMessage = `Fish Fed (Count: ${count})`;
                }
              }
              break;

            case 'fishfeeder/feed/time':
              if (prev.lastFeedTime !== msg) {
                updates.lastFeedTime = msg;
                // Avoid logging during initialization
                if (prev.lastFeedTime !== null) {
                  activityMessage = `Dispensed food at ${msg}`;
                }
              }
              break;

            case 'fishfeeder/foodlevel':
              const food = parseFloat(msg);
              if (!isNaN(food)) updates.foodLevel = food;
              break;

            case 'fishfeeder/watertemp':
              const temp = parseFloat(msg);
              if (!isNaN(temp)) updates.waterTemp = temp;
              break;

            case 'fishfeeder/waterlevel':
              const wl = msg as MQTTDataState['waterLevel'];
              if (prev.waterLevel !== wl) {
                updates.waterLevel = wl;
                if (wl === 'Low') activityMessage = "Water Level Alert: Low Detected!";
              }
              break;

            case 'fishfeeder/battery':
              const volt = parseFloat(msg);
              if (!isNaN(volt)) updates.batteryVoltage = volt;
              break;

            case 'fishfeeder/powersource':
              const source = msg as MQTTDataState['powerSource'];
              updates.powerSource = source;
              break;

            default:
              break;
          }

          // If there is an activity log trigger, prepend it
          let newLog = prev.activityLog;
          if (activityMessage) {
            const timestamp = new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });
            newLog = [
              {
                id: `${Date.now()}-${Math.random()}`,
                time: timestamp,
                message: activityMessage
              },
              ...prev.activityLog
            ].slice(0, 30);
          }

          return {
            ...prev,
            ...updates,
            activityLog: newLog
          };
        });
      });

      client.on('close', () => {
        console.warn("MQTT Connection Closed");
        setData(prev => {
          // If we were previously connected, trigger a log event
          const disconnected = prev.mqttConnected;
          return {
            ...prev,
            mqttConnected: false,
            activityLog: disconnected 
              ? [
                  {
                    id: `${Date.now()}-${Math.random()}`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    message: "MQTT Disconnected"
                  },
                  ...prev.activityLog
                ].slice(0, 30)
              : prev.activityLog
          };
        });
      });

      client.on('error', (err) => {
        console.error("MQTT Client Error:", err);
        setData(prev => ({
          ...prev,
          mqttConnected: false,
          mqttError: err.message || "MQTT connection error"
        }));
      });

    } catch (e: any) {
      console.error("Unexpected MQTT Initialization Error:", e);
      setData(prev => ({
        ...prev,
        mqttConnected: false,
        mqttError: e.message || "Failed to initialize MQTT connection"
      }));
    }

    // Clean up client on unmount
    return () => {
      if (clientRef.current) {
        console.log("Disconnecting MQTT client on component unmount");
        clientRef.current.end();
      }
    };
  }, [addActivity]);

  // Method to publish feed commands to the servo
  const feedNow = useCallback(() => {
    if (!clientRef.current || !data.mqttConnected) {
      console.error("Cannot feed: MQTT client disconnected");
      return;
    }
    
    console.log("Publishing feed command: FEED to fishfeeder/servo/cmd");
    // Publish feeding command with QoS 1
    clientRef.current.publish('fishfeeder/servo/cmd', 'FEED', { qos: 1, retain: false });
  }, [data.mqttConnected]);

  return {
    ...data,
    feedNow
  };
};
