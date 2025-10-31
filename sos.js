// sos.js
import { DEFAULT_CONTACTS, SOS_SETTINGS, USER_PROFILE } from "./contacts-config.js";

let countdownTimer = null;
let contacts = [];
let userProfile = {};

// Load user profile
function loadUserProfile() {
  const saved = localStorage.getItem("userProfile");
  const isFirstVisit = localStorage.getItem("profileInitialized") !== "true";
  
  if (isFirstVisit) {
    // First visit: load default profile
    userProfile = { ...USER_PROFILE };
    localStorage.setItem("userProfile", JSON.stringify(userProfile));
    localStorage.setItem("profileInitialized", "true");
  } else if (saved) {
    userProfile = JSON.parse(saved);
  } else {
    userProfile = { ...USER_PROFILE };
  }
  
  renderProfile();
}

// Save user profile
function saveUserProfile() {
  localStorage.setItem("userProfile", JSON.stringify(userProfile));
  renderProfile();
}

// Render profile form
function renderProfile() {
  document.getElementById("userName").value = userProfile.name || "";
  document.getElementById("userBloodType").value = userProfile.bloodType || "";
  document.getElementById("userMedicalInfo").value = userProfile.medicalInfo || "";
  document.getElementById("userEmergencyNote").value = userProfile.emergencyNote || "";
  
  const statusEl = document.getElementById("profileStatus");
  if (userProfile.name) {
    statusEl.textContent = `✅ Profile saved as: ${userProfile.name}`;
    statusEl.style.color = "#51cf66";
  } else {
    statusEl.textContent = "⚠️ Profile not set - please add your name";
    statusEl.style.color = "#ffa94d";
  }
  
  // Hide form if profile editing is disabled
  if (!SOS_SETTINGS.allowProfileEditing) {
    document.getElementById("userName").disabled = true;
    document.getElementById("userBloodType").disabled = true;
    document.getElementById("userMedicalInfo").disabled = true;
    document.getElementById("userEmergencyNote").disabled = true;
    document.getElementById("saveProfile").style.display = "none";
  }
}

// Save profile from form
window.saveProfile = function() {
  userProfile.name = document.getElementById("userName").value.trim() || "User";
  userProfile.bloodType = document.getElementById("userBloodType").value.trim();
  userProfile.medicalInfo = document.getElementById("userMedicalInfo").value.trim();
  userProfile.emergencyNote = document.getElementById("userEmergencyNote").value.trim();
  
  saveUserProfile();
  alert("✅ Profile saved successfully!");
};

// Load contacts from storage
function loadContacts() {
  const saved = localStorage.getItem("emergencyContacts");
  const isFirstVisit = localStorage.getItem("contactsInitialized") !== "true";
  
  if (isFirstVisit && SOS_SETTINGS.autoLoadDefaultContacts) {
    // First visit: load default contacts
    contacts = [...DEFAULT_CONTACTS];
    localStorage.setItem("emergencyContacts", JSON.stringify(contacts));
    localStorage.setItem("contactsInitialized", "true");
    console.log("✅ Default contacts loaded:", contacts);
  } else if (saved) {
    // Load saved contacts
    contacts = JSON.parse(saved);
  } else {
    // Fallback to default contacts
    contacts = [...DEFAULT_CONTACTS];
  }
  
  renderContacts();
}

// Save contacts to storage
function saveContacts() {
  localStorage.setItem("emergencyContacts", JSON.stringify(contacts));
  renderContacts();
}

// Render contacts list
function renderContacts() {
  const listEl = document.getElementById("contactsList");
  if (contacts.length === 0) {
    listEl.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.5); padding: 20px;">No emergency contacts added yet</p>';
    return;
  }

  listEl.innerHTML = contacts.map((contact, index) => `
    <div class="contact-item">
      <div class="contact-info">
        <div class="contact-name">${contact.name}</div>
        <div class="contact-phone">${contact.phone}</div>
      </div>
      ${SOS_SETTINGS.allowUIContactManagement ? 
        `<button class="btn-remove" onclick="window.removeContact(${index})">Remove</button>` 
        : ''}
    </div>
  `).join("");
  
  // Hide/show add contact form based on settings
  if (!SOS_SETTINGS.allowUIContactManagement) {
    document.getElementById("contactName").style.display = "none";
    document.getElementById("contactPhone").style.display = "none";
    document.getElementById("addContact").style.display = "none";
  }
}

// Add contact
window.addContact = function() {
  const nameInput = document.getElementById("contactName");
  const phoneInput = document.getElementById("contactPhone");
  
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  
  if (!name || !phone) {
    alert("Please enter both name and phone number");
    return;
  }
  
  // Basic phone validation
  if (!phone.startsWith("+")) {
    alert("Please include country code (e.g., +919876543210)");
    return;
  }
  
  contacts.push({ name, phone });
  saveContacts();
  
  nameInput.value = "";
  phoneInput.value = "";
  
  alert(`✅ ${name} added as emergency contact`);
};

// Remove contact
window.removeContact = function(index) {
  if (confirm(`Remove ${contacts[index].name} from emergency contacts?`)) {
    contacts.splice(index, 1);
    saveContacts();
  }
};

// Start countdown
export function startSOSCountdown() {
  if (contacts.length === 0) {
    alert("⚠️ No emergency contacts configured! Please add contacts first.");
    return;
  }

  const modal = document.getElementById("countdownModal");
  const numberEl = document.getElementById("countdownNumber");
  let count = SOS_SETTINGS.countdownDuration;
  
  modal.classList.add("active");
  numberEl.textContent = count;
  
  // Play sound if available
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77eefTRAMUKfj8LZjHAU4kdfyy3ksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUrgc7y2Yk2CBlou+3nn00QDFCn4/C2YxwFOJHX8st5LAUkd8fw3ZBAC');
    audio.play().catch(() => {});
  } catch (e) {}
  
  countdownTimer = setInterval(() => {
    count--;
    numberEl.textContent = count;
    
    if (count <= 0) {
      clearInterval(countdownTimer);
      modal.classList.remove("active");
      sendWhatsAppSOS(null); // Pass null for manual trigger (no shake intensity)
    }
  }, 1000);
}

// Cancel countdown
function cancelCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  
  const modal = document.getElementById("countdownModal");
  modal.classList.remove("active");
  
  const statusEl = document.getElementById("status");
  statusEl.textContent = "✅ SOS cancelled. Motion sensors still active.";
  
  console.log("✅ SOS cancelled by user");
}

// Send SOS to all contacts
export async function sendWhatsAppSOS(shakeIntensity = null) {
  console.log("📡 SOS triggered!");

  const statusEl = document.getElementById("status");
  statusEl.textContent = "📍 Getting location...";

  // Get user location
  let location = { latitude: "Unknown", longitude: "Unknown" };
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    });
    location = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    };
    console.log("📍 Location fetched:", location);
  } catch (err) {
    console.warn("⚠️ Location not available:", err.message);
  }

  const time = new Date().toLocaleString();
  const mapsLink = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  
  // Build message with user profile info
  let message = `🚨 *EMERGENCY SOS ALERT*\n\n`;
  message += `👤 Name: ${userProfile.name || "Unknown"}\n`;
  message += `📅 Time: ${time}\n`;
  message += `📍 Location: ${mapsLink}\n`;
  
  if (shakeIntensity) {
    message += `⚠️ Shake Intensity: ${shakeIntensity.toFixed(2)}\n`;
  }
  
  if (userProfile.bloodType) {
    message += `🩸 Blood Type: ${userProfile.bloodType}\n`;
  }
  if (userProfile.medicalInfo) {
    message += `💊 Medical Info: ${userProfile.medicalInfo}\n`;
  }
  if (userProfile.emergencyNote) {
    message += `\n📝 Note: ${userProfile.emergencyNote}\n`;
  }
  
  message += `\nThis is an automated emergency alert. Please respond immediately.`;

  // Log to server
  try {
    await fetch("http://localhost:3000/sos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: userProfile.name || "Unknown",
        time: new Date().toISOString(),
        triggeredBy: "Shake Detection",
        location,
        userProfile,
        intensity: shakeIntensity ? shakeIntensity.toFixed(2) : "N/A",
        contactsNotified: contacts.length
      }),
    });
    console.log("✅ SOS logged on server");
  } catch (err) {
    console.error("❌ Failed to send to server:", err);
  }

  // Send to all emergency contacts via WhatsApp simultaneously
  const encodedMessage = encodeURIComponent(message);
  
  console.log(`📤 Preparing to send SOS to ${contacts.length} contact(s)...`);
  console.log("Contacts:", contacts);
  
  statusEl.textContent = `📤 Sending SOS to ${contacts.length} contact(s) with your location...`;
  
  // Send to ALL contacts at the SAME time (no delays)
  contacts.forEach((contact) => {
    try {
      const phoneNumber = contact.phone.replace(/[^0-9]/g, "");
      const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
      console.log(`Opening WhatsApp for ${contact.name}: ${whatsappURL}`);
      const newWindow = window.open(whatsappURL, "_blank");
      if (!newWindow) {
        console.error(`❌ Failed to open WhatsApp for ${contact.name} - popup blocked?`);
        alert(`⚠️ Cannot open WhatsApp for ${contact.name}. Please check browser popup settings.`);
      } else {
        console.log(`✅ SOS with location sent to ${contact.name} (${contact.phone})`);
      }
    } catch (err) {
      console.error(`❌ Error sending to ${contact.name}:`, err);
    }
  });

  statusEl.textContent = `✅ SOS with location sent to ${contacts.length} contact(s) via WhatsApp!`;
  
  // Show alert
  setTimeout(() => {
    alert(`🚨 Emergency SOS sent to ${contacts.length} contact(s)!\n\n📍 Location included in all messages\n\nContacts notified:\n${contacts.map(c => `• ${c.name}`).join('\n')}`);
  }, 500);

  // Show fallback WhatsApp links modal after sending
  const linksModal = document.getElementById("whatsappLinksModal");
  const linksList = document.getElementById("whatsappLinksList");
  if (linksModal && linksList) {
    // Fill the list with clickable WhatsApp URLs
    linksList.innerHTML = contacts.map(contact => {
      const phoneNumber = contact.phone.replace(/[^0-9]/g, "");
      const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
      return `<a href=\"${whatsappURL}\" target=\"_blank\" style=\"color:white;text-decoration:underline;display:block;margin:9px 0;word-break:break-all;font-size:16px;\">${contact.name || contact.phone}</a>`;
    }).join("");
    // Show the modal
    linksModal.classList.add("active");
    linksModal.classList.remove("hidden");
  }
  // Add close handler
  const closeLinksModal = document.getElementById("closeLinksModal");
  if (closeLinksModal && linksModal) {
    closeLinksModal.onclick = () => {
      linksModal.classList.remove("active");
      linksModal.classList.add("hidden");
    };
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadContacts();
  loadUserProfile();
  
  // Reset to default contacts function (accessible via console or button)
  window.resetToDefaultContacts = function() {
    if (confirm("Reset to default emergency contacts? This will replace all current contacts.")) {
      contacts = [...DEFAULT_CONTACTS];
      saveContacts();
      alert("✅ Contacts reset to defaults");
    }
  };
  
  // Reset to default profile
  window.resetToDefaultProfile = function() {
    if (confirm("Reset profile to default settings?")) {
      userProfile = { ...USER_PROFILE };
      saveUserProfile();
      alert("✅ Profile reset to defaults");
    }
  };
  
  document.getElementById("addContact").addEventListener("click", window.addContact);
  document.getElementById("saveProfile").addEventListener("click", window.saveProfile);
  document.getElementById("cancelSOS").addEventListener("click", cancelCountdown);
  document.getElementById("sendSOS").addEventListener("click", () => {
    startSOSCountdown();
  });
  
  // Allow Enter key to add contact
  document.getElementById("contactPhone").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      window.addContact();
    }
  });
});
