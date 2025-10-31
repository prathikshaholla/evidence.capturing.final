// shake.js
import { sendWhatsAppSOS } from "./sos.js";

let lastShakeTime = 0;
let shakeThreshold = 15; // Adjust sensitivity (lower = more sensitive)
let statusEl;
let shakeIntensity = 0;

// Ask permission for motion sensors on iOS/Android
async function requestMotionPermission() {
  if (typeof DeviceMotionEvent.requestPermission === "function") {
    try {
      const response = await DeviceMotionEvent.requestPermission();
      if (response === "granted") {
        initShakeDetection();
      } else {
        alert("Permission denied. Please allow motion access in settings.");
      }
    } catch (err) {
      console.error("Error requesting motion permission:", err);
    }
  } else {
    // For Android / non-iOS browsers
    initShakeDetection();
  }
}

function initShakeDetection() {
  window.addEventListener("devicemotion", event => {
    const { x, y, z } = event.accelerationIncludingGravity;
    const totalAcceleration = Math.sqrt(x * x + y * y + z * z);

    // Log shake intensity to server constantly
    if (totalAcceleration > 5) { // Log any significant movement
      logShakeIntensity(totalAcceleration, x, y, z);
    }

    if (totalAcceleration > shakeThreshold) {
      const now = Date.now();
      if (now - lastShakeTime > 2000) {
        lastShakeTime = now;
        shakeIntensity = totalAcceleration;
        console.log("🚨 Shake detected! Intensity:", totalAcceleration.toFixed(2), "Sending SOS...");
        statusEl.textContent = "🚨 Shake detected! Sending SOS...";
        sendWhatsAppSOS(shakeIntensity);
      }
    }
  });

  statusEl.textContent = "✅ Motion sensors active. Shake to trigger SOS.";
}

// Log shake intensity to server
async function logShakeIntensity(intensity, x, y, z) {
  try {
    await fetch("http://localhost:3000/shake-intensity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intensity: intensity.toFixed(2),
        acceleration: { x: x.toFixed(2), y: y.toFixed(2), z: z.toFixed(2) },
        timestamp: new Date().toISOString()
      }),
    });
  } catch (err) {
    // Silently fail for continuous logging
    console.log("Shake intensity logged");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  statusEl = document.getElementById("status");
  statusEl.textContent = "⚙️ Waiting for motion sensor permission...";
  requestMotionPermission();
});
