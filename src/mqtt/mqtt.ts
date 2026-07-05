import mqtt from 'mqtt';

export interface MQTTConfig {
  brokerUrl: string;
  username?: string;
  password?: string;
}

/**
 * Creates and returns an MQTT client connected to HiveMQ Cloud or any target broker.
 * Employs clean session, auto-reconnect, and client configurations.
 */
export const connectMQTT = (config: MQTTConfig): mqtt.MqttClient => {
  const { brokerUrl, username, password } = config;
  
  // Set up connection options
  const options: mqtt.IClientOptions = {
    clean: true,            // Clean session
    connectTimeout: 5000,   // Wait 5 seconds before timeout
    reconnectPeriod: 4000,  // Reconnect after 4 seconds if disconnected
    clientId: `fishfeeder_web_${Math.random().toString(16).substring(2, 10)}`,
  };

  if (username) {
    options.username = username;
  }
  
  if (password) {
    options.password = password;
  }

  // Connect using MQTT.js over WebSockets
  return mqtt.connect(brokerUrl, options);
};
