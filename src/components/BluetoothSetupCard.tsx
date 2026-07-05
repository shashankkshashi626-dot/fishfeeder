import React, { useState, useRef, useCallback } from "react";
import {
  Bluetooth, Loader2, CheckCircle2, XCircle,
  Send, ChevronDown, ChevronUp, Wifi, Lock, Server, User
} from "lucide-react";
import { BleClient } from "@capacitor-community/bluetooth-le";

const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHAR_UUID    = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
const DEVICE_NAME  = "OhmNest";

type Step = "idle" | "scanning" | "connected" | "sending" | "success" | "error";

interface FormData {
  ssid: string;
  wifipass: string;
  mqttHost: string;
  mqttUser: string;
  mqttPass: string;
}

export const BluetoothSetupCard: React.FC = () => {
  const [expanded, setExpanded]   = useState(false);
  const [step, setStep]           = useState<Step>("idle");
  const [deviceId, setDeviceId]   = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [deviceName, setDeviceName] = useState(DEVICE_NAME);
  const [form, setForm]           = useState<FormData>({
    ssid: "", wifipass: "", mqttHost: "", mqttUser: "", mqttPass: "",
  });
  const bleInitialized = useRef(false);

  const set = (key: keyof FormData, val: string) =>
    setForm(f => ({ ...f, [key]: val }));

  const initBle = useCallback(async () => {
    if (bleInitialized.current) return;
    try {
      await BleClient.initialize({ androidNeverForLocation: true });
      bleInitialized.current = true;
    } catch (e: any) {
      // Already initialized is fine
      if (e?.message?.includes("already initialized")) {
        bleInitialized.current = true;
      } else {
        throw e;
      }
    }
  }, []);

  const handleScan = async () => {
    try {
      setStep("scanning");
      setStatusMsg(`Scanning for "${DEVICE_NAME}"...`);

      await initBle();

      // Check if Bluetooth is enabled
      const enabled = await BleClient.isEnabled();
      if (!enabled) {
        setStep("error");
        setStatusMsg("Bluetooth is turned off. Please enable Bluetooth and try again.");
        return;
      }

      // Request device (shows native picker on Android)
      const device = await BleClient.requestDevice({
        namePrefix: DEVICE_NAME,
        optionalServices: [SERVICE_UUID],
      });

      if (!device) {
        setStep("error");
        setStatusMsg("No device selected.");
        return;
      }

      setStatusMsg("Connecting to GATT server...");

      // Connect with a timeout
      await BleClient.connect(device.deviceId, (disconnectedDeviceId) => {
        console.log(`[BLE] Device ${disconnectedDeviceId} disconnected`);
        if (step !== "success") {
          setStep("idle");
          setDeviceId(null);
          setStatusMsg("Device disconnected.");
        }
      });

      // Small delay to let GATT stabilize after connection
      await new Promise(resolve => setTimeout(resolve, 500));

      // Discover services
      const services = await BleClient.getServices(device.deviceId);
      console.log("[BLE] Services:", JSON.stringify(services));

      setDeviceId(device.deviceId);
      setDeviceName(device.name || DEVICE_NAME);
      setStep("connected");
      setStatusMsg(`Connected to ${device.name || DEVICE_NAME}`);
    } catch (e: any) {
      console.error("[BLE] Scan/connect error:", e);
      setStep("error");
      setStatusMsg(e?.message || "Scan cancelled or failed.");
    }
  };

  const handleSend = async () => {
    if (!deviceId) return;
    if (!form.ssid || !form.mqttHost) {
      setStatusMsg("WiFi SSID and MQTT Host are required.");
      return;
    }
    try {
      setStep("sending");
      setStatusMsg("Sending credentials to OhmNest ESP32...");

      const payload = JSON.stringify({
        ssid:     form.ssid,
        wifipass: form.wifipass,
        mqttHost: form.mqttHost,
        mqttUser: form.mqttUser,
        mqttPass: form.mqttPass,
      });

      // Encode string to DataView for BLE write
      const encoder = new TextEncoder();
      const encoded = encoder.encode(payload);
      const dataView = new DataView(encoded.buffer);

      await BleClient.write(deviceId, SERVICE_UUID, CHAR_UUID, dataView);

      // Small delay before disconnect
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        await BleClient.disconnect(deviceId);
      } catch (_) {
        // ESP32 may have already restarted and disconnected
      }

      setStep("success");
      setStatusMsg("Credentials saved! ESP32 is restarting...");
    } catch (e: any) {
      console.error("[BLE] Write error:", e);
      setStep("error");
      setStatusMsg(e?.message || "Failed to send credentials.");
    }
  };

  const handleReset = async () => {
    if (deviceId) {
      try { await BleClient.disconnect(deviceId); } catch (_) {}
    }
    setStep("idle");
    setDeviceId(null);
    setStatusMsg("");
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-violet-500 text-slate-700 dark:text-slate-300 font-mono placeholder:font-sans placeholder:text-slate-400";
  const labelClass = "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5";

  const statusColor =
    step === "success" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/30"
    : step === "error" ? "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/30"
    : "bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-400 border-violet-200/50 dark:border-violet-800/30";

  return (
    <div className="rounded-3xl border border-violet-200/60 dark:border-violet-900/30 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl shadow-xl overflow-hidden">

      {/* Header toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-5 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md ${
            step === "connected" || step === "success"
              ? "bg-gradient-to-tr from-violet-500 to-indigo-600 shadow-violet-500/25"
              : "bg-gradient-to-tr from-slate-400 to-slate-500 shadow-slate-400/10"
          }`}>
            <Bluetooth className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-800 dark:text-white">Device Setup via Bluetooth</p>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {step === "idle"      && "Update WiFi & MQTT credentials wirelessly"}
              {step === "scanning"  && "Scanning for OhmNest..."}
              {step === "connected" && `Connected · ${deviceName}`}
              {step === "sending"   && "Sending credentials..."}
              {step === "success"   && "✓ Credentials saved!"}
              {step === "error"     && "Error — tap to expand & retry"}
            </p>
          </div>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-slate-400" />
          : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-slate-100 dark:border-slate-800/50 pt-5">

          {/* Status banner */}
          {statusMsg && (
            <div className={`flex items-center gap-2.5 p-3.5 rounded-2xl text-sm font-medium border ${statusColor}`}>
              {(step === "scanning" || step === "sending") && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
              {step === "success"   && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {step === "error"     && <XCircle className="w-4 h-4 shrink-0" />}
              {(step === "connected" || step === "idle") && <Bluetooth className="w-4 h-4 shrink-0" />}
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Credential form — connected state */}
          {(step === "connected" || step === "sending") && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Fill in the new credentials to send. Leave blank to keep the current value on the ESP32.
              </p>

              <div className="space-y-3 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40">
                <p className="text-[10px] font-extrabold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">WiFi Network</p>
                <div className="space-y-1.5">
                  <label className={labelClass}><Wifi className="w-3 h-3" /> Network Name (SSID)</label>
                  <input type="text" value={form.ssid} onChange={e => set("ssid", e.target.value)} placeholder="MyHomeWiFi" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}><Lock className="w-3 h-3" /> WiFi Password</label>
                  <input type="password" value={form.wifipass} onChange={e => set("wifipass", e.target.value)} placeholder="••••••••" className={inputClass} />
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40">
                <p className="text-[10px] font-extrabold text-violet-600 dark:text-violet-400 uppercase tracking-widest">MQTT Broker</p>
                <div className="space-y-1.5">
                  <label className={labelClass}><Server className="w-3 h-3" /> Broker Host</label>
                  <input type="text" value={form.mqttHost} onChange={e => set("mqttHost", e.target.value)} placeholder="xxxx.hivemq.cloud" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={labelClass}><User className="w-3 h-3" /> Username</label>
                    <input type="text" value={form.mqttUser} onChange={e => set("mqttUser", e.target.value)} placeholder="fishuser" className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}><Lock className="w-3 h-3" /> Password</label>
                    <input type="password" value={form.mqttPass} onChange={e => set("mqttPass", e.target.value)} placeholder="••••••" className={inputClass} />
                  </div>
                </div>
              </div>

              <button onClick={handleSend} disabled={step === "sending"}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:from-violet-700 hover:to-indigo-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 shadow-lg shadow-violet-500/20">
                {step === "sending"
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                  : <><Send className="w-4 h-4" /> Send to OhmNest ESP32</>}
              </button>
            </div>
          )}

          {/* Success */}
          {step === "success" && (
            <div className="text-center space-y-3 py-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">ESP32 is restarting!</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                New credentials saved to flash. The device will reconnect in ~10 seconds.
              </p>
              <button onClick={handleReset}
                className="mt-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Configure Again
              </button>
            </div>
          )}

          {/* Scanning animation */}
          {step === "scanning" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-2 border-violet-200 dark:border-violet-900 animate-ping" />
                <div className="absolute inset-0 rounded-full bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
                  <Bluetooth className="w-7 h-7 text-violet-500" />
                </div>
              </div>
              <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">Scanning for OhmNest...</p>
              <p className="text-xs text-slate-500 text-center">Select the device from the Bluetooth popup</p>
            </div>
          )}

          {/* Idle / Error — scan button */}
          {(step === "idle" || step === "error") && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Power on your ESP32. It advertises as{" "}
                <strong className="text-violet-500">OhmNest</strong> for 60 seconds after boot.
                If not found, restart the ESP32 and tap Scan within 60 seconds.
              </p>
              <button onClick={handleScan}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:from-violet-700 hover:to-indigo-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-violet-500/20">
                <Bluetooth className="w-4 h-4" /> Scan for OhmNest Device
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BluetoothSetupCard;
