import { useEffect, useRef } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useAuth } from "../components/AuthContext";
import type { MQTTDataState } from "../hooks/useMQTT";

export const useNotifications = (mqttState: MQTTDataState) => {
  const { user } = useAuth();
  
  // Track previous states to trigger notifications only on transitions
  const prevServoStatus = useRef<string | null>(null);
  const prevEspOnline = useRef<boolean | null>(null);
  const prevWaterLevel = useRef<string | null>(null);
  const hasAlertedLowFood = useRef<boolean>(false);
  const hasAlertedHighTemp = useRef<boolean>(false);

  // Request permissions on initialization
  useEffect(() => {
    const requestPermission = async () => {
      try {
        const status = await LocalNotifications.checkPermissions();
        if (status.display !== "granted") {
          await LocalNotifications.requestPermissions();
        }
      } catch (e) {
        console.warn("[LocalNotifications] Permission error:", e);
      }
    };
    requestPermission();
  }, []);

  useEffect(() => {
    if (!user) return;

    const thresholds = user.thresholds || {
      foodLow: 20,
      waterLow: 30,
      tempHigh: 28,
      tempLow: 18
    };

    const sendPush = async (title: string, body: string) => {
      try {
        console.log(`[Push Notification] ${title}: ${body}`);
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: Math.floor(Math.random() * 100000),
              sound: "beep.wav",
              smallIcon: "res://ic_stat_name",
              actionTypeId: "FEED_ACTIONS"
            }
          ]
        });
      } catch (e) {
        console.error("[LocalNotifications] Failed to trigger notification:", e);
      }
    };

    // 1. Monitor ESP32 Online / Offline Status
    if (mqttState.espOnline !== null) {
      if (prevEspOnline.current === true && mqttState.espOnline === false) {
        sendPush(
          `Device Offline`,
          `${user.aquariumName} has lost connection to the server.`
        );
      }
      prevEspOnline.current = mqttState.espOnline;
    }

    // 2. Monitor Feeding Completion
    if (mqttState.servoStatus !== null) {
      if (prevServoStatus.current === "Feeding" && mqttState.servoStatus === "Done") {
        sendPush(
          `Feeding Completed`,
          `Your fish in ${user.aquariumName} were successfully fed.`
        );
      } else if (prevServoStatus.current === "Feeding" && mqttState.servoStatus === "Error") {
        sendPush(
          `Feeding FAILED 🚨`,
          `Dispatcher motor error detected in ${user.aquariumName}! Check for pellet blockage.`
        );
      }
      prevServoStatus.current = mqttState.servoStatus;
    }

    // 3. Monitor Water Level Low Switch
    if (mqttState.waterLevel !== null) {
      if (prevWaterLevel.current === "Normal" && mqttState.waterLevel === "Low") {
        sendPush(
          `Water Level Low Alert 🚨`,
          `Water level sensor indicates low water in ${user.aquariumName}.`
        );
      }
      prevWaterLevel.current = mqttState.waterLevel;
    }

    // 4. Monitor Low Food Level threshold (using user config)
    if (mqttState.foodLevel !== null) {
      if (mqttState.foodLevel < thresholds.foodLow) {
        if (!hasAlertedLowFood.current) {
          sendPush(
            `Food Storage Running Low`,
            `Food is at ${mqttState.foodLevel}%. Please refill the dispenser.`
          );
          hasAlertedLowFood.current = true;
        }
      } else {
        // Reset alert state when refilled
        hasAlertedLowFood.current = false;
      }
    }

    // 5. Monitor Temperature High warning (using user config)
    if (mqttState.waterTemp !== null) {
      if (mqttState.waterTemp > thresholds.tempHigh) {
        if (!hasAlertedHighTemp.current) {
          sendPush(
            `Water Temperature High Alarm 🌡️`,
            `Temperature is ${mqttState.waterTemp.toFixed(1)}°C (Limit: ${thresholds.tempHigh}°C).`
          );
          hasAlertedHighTemp.current = true;
        }
      } else {
        hasAlertedHighTemp.current = false;
      }
    }

  }, [mqttState, user]);
};

export default useNotifications;
