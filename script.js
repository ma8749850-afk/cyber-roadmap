// ===============================
// Firebase Setup
// ===============================

const firebaseConfig = {
  apiKey: "AIzaSyBp1MBq44Vc8RpzCfAk-PpJB2qz6WOCr1o",
  authDomain: "cyber-roadmap-chat.firebaseapp.com",
  databaseURL: "https://cyber-roadmap-chat-default-rtdb.firebaseio.com",
  projectId: "cyber-roadmap-chat",
  storageBucket: "cyber-roadmap-chat.firebasestorage.app",
  messagingSenderId: "527807248570",
  appId: "1:527807248570:web:cd7458c3e03c1e905a6a83"
};

const FCM_VAPID_KEY = "BFyd026baY5qlI3hrzk_NrC-BF68dYJdyf4vVSoTVIHjVpHwn4i3o5z-Z4x4RC1dW-AZgS5Tfxo5lRGqGHkw73w";

let db = null;
let messaging = null;

if (typeof firebase !== "undefined") {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  db = firebase.database();
}

function initializeNotifications() {
  if (!getCurrentUsername()) {
    return;
  }

  const isMessagingSupported =
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    typeof firebase !== "undefined" &&
    typeof firebase.messaging === "function";

  if (!isMessagingSupported) {
    return;
  }

  messaging = firebase.messaging();

  navigator.serviceWorker
    .register("firebase-messaging-sw.js")
    .then(() => Notification.requestPermission())
    .then((permission) => {
      if (permission !== "granted") {
        return null;
      }

      const tokenOptions = FCM_VAPID_KEY.includes("PASTE_YOUR")
        ? {}
        : { vapidKey: FCM_VAPID_KEY };

      return messaging.getToken(tokenOptions);
    })
    .then((token) => {
      if (token) {
        console.log("User Token:", token);
        saveNotificationToken(token);
      }
    })
    .catch((error) => {
      console.warn("Notifications setup skipped:", error);
    });

  messaging.onMessage((payload) => {
    if (document.visibilityState !== "visible" || Notification.permission !== "granted") {
      return;
    }

    const notification = payload.notification || {};

    if (!notification.title) {
      return;
    }

    new Notification(notification.title, {
      body: notification.body || ""
    });
  });
}

function saveNotificationToken(token) {
  if (!db || !token) {
    return;
  }

  const username = ensureUsername();

  if (!username) {
    return;
  }

  const safeUsername = username.replace(/[.#$/\[\]]/g, "_");
  const safeToken = token.replace(/[.#$/\[\]]/g, "_");

  db.ref(`notificationTokens/${safeUsername}/${safeToken}`).set({
    username,
    token,
    updatedAt: Date.now()
  });
}

function showLocalChatNotification(messageData) {
  const isNotificationAvailable =
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted";

  if (!isNotificationAvailable || !messageData || !messageData.username) {
    return;
  }

  const title = `New message from ${messageData.username}`;
  const options = {
    body: messageData.message || "You received a new chat message."
  };

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        registration.showNotification(title, options);
        return;
      }

      new Notification(title, options);
    });
    return;
  }

  new Notification(title, options);
}

// ===============================
// Shared Data
// ===============================

const STORAGE_KEYS = {
  authSession: "cyberRoadmapSessionUser",
  profileCachePrefix: "cyberRoadmapProfileCache"
};

function createEmptyProfile() {
  return {
    completion: {},
    expanded: {},
    lastReadChatTimestamp: 0,
    lastRoadmapNodeId: ""
  };
}

const appState = {
  currentUser: null,
  profile: createEmptyProfile(),
  profileSyncTimeout: null,
  authUiBound: false,
  searchTerm: ""
};

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeRoadmapNode(node, pathParts) {
  const id = pathParts.join("__");
  const normalizedChildren = (node.children || []).map((child, index) =>
    normalizeRoadmapNode(child, [...pathParts, `${index}-${slugify(child.title)}`])
  );

  return {
    id,
    title: node.title,
    description: node.description || "",
    resources: Array.isArray(node.resources) ? node.resources : [],
    children: normalizedChildren
  };
}

function sanitizeKey(value) {
  return String(value || "").trim().replace(/[.#$/\[\]\s]+/g, "_").toLowerCase();
}

function getProfileCacheKey(username) {
  return `${STORAGE_KEYS.profileCachePrefix}:${sanitizeKey(username)}`;
}

function normalizeProfile(rawProfile) {
  const fallback = createEmptyProfile();
  const source = rawProfile && typeof rawProfile === "object" ? rawProfile : {};

  return {
    completion: source.completion && typeof source.completion === "object" ? source.completion : fallback.completion,
    expanded: source.expanded && typeof source.expanded === "object" ? source.expanded : fallback.expanded,
    lastReadChatTimestamp: Number(source.lastReadChatTimestamp || 0),
    lastRoadmapNodeId: typeof source.lastRoadmapNodeId === "string" ? source.lastRoadmapNodeId : ""
  };
}

const CUSTOM_ROADMAP_SOURCE = {
  title: "Cyber Security",
  description: "A complete structured cybersecurity learning roadmap from fundamentals to advanced certifications.",
  resources: [],
  children: [
    { title: "Fundamental IT Skills", description: "", resources: [], children: [
      { title: "Computer Hardware", description: "", resources: [], children: [
        { title: "CPU", description: "", resources: [], children: [] },
        { title: "RAM", description: "", resources: [], children: [] },
        { title: "Storage", description: "", resources: [], children: [] },
        { title: "Motherboard", description: "", resources: [], children: [] },
        { title: "Power Supply", description: "", resources: [], children: [] }
      ]},
      { title: "Connection Types", description: "", resources: [], children: [
        { title: "USB", description: "", resources: [], children: [] },
        { title: "Ethernet", description: "", resources: [], children: [] },
        { title: "HDMI", description: "", resources: [], children: [] },
        { title: "Wireless", description: "", resources: [], children: [] }
      ]},
      { title: "OS Independent Troubleshooting", description: "", resources: [], children: [
        { title: "Hardware diagnosis", description: "", resources: [], children: [] },
        { title: "Boot problems", description: "", resources: [], children: [] },
        { title: "Performance issues", description: "", resources: [], children: [] }
      ]},
      { title: "Office Suites", description: "", resources: [], children: [
        { title: "Microsoft Office", description: "", resources: [], children: [] },
        { title: "Google Suite", description: "", resources: [], children: [] },
        { title: "iCloud tools", description: "", resources: [], children: [] }
      ]}
    ]},
    { title: "Computer Networking Basics", description: "", resources: [], children: [
      { title: "Wireless Technologies", description: "", resources: [], children: [
        { title: "WiFi", description: "", resources: [], children: [] },
        { title: "Bluetooth", description: "", resources: [], children: [] },
        { title: "NFC", description: "", resources: [], children: [] },
        { title: "Infrared", description: "", resources: [], children: [] }
      ]},
      { title: "Networking Fundamentals", description: "", resources: [], children: [
        { title: "OSI Model", description: "", resources: [], children: [] },
        { title: "TCP/IP Model", description: "", resources: [], children: [] },
        { title: "Packet communication", description: "", resources: [], children: [] }
      ]},
      { title: "Network Protocols", description: "", resources: [], children: [
        { title: "HTTP / HTTPS", description: "", resources: [], children: [] },
        { title: "FTP / SFTP", description: "", resources: [], children: [] },
        { title: "SSH", description: "", resources: [], children: [] },
        { title: "RDP", description: "", resources: [], children: [] },
        { title: "DNS", description: "", resources: [], children: [] }
      ]},
      { title: "Common Ports", description: "", resources: [], children: [
        { title: "80", description: "", resources: [], children: [] },
        { title: "443", description: "", resources: [], children: [] },
        { title: "21", description: "", resources: [], children: [] },
        { title: "22", description: "", resources: [], children: [] },
        { title: "3389", description: "", resources: [], children: [] }
      ]},
      { title: "IP Addressing", description: "", resources: [], children: [
        { title: "Public vs Private IP", description: "", resources: [], children: [] },
        { title: "Subnet Mask", description: "", resources: [], children: [] },
        { title: "CIDR", description: "", resources: [], children: [] },
        { title: "Default Gateway", description: "", resources: [], children: [] }
      ]},
      { title: "Network Devices", description: "", resources: [], children: [
        { title: "Router", description: "", resources: [], children: [] },
        { title: "Switch", description: "", resources: [], children: [] },
        { title: "Firewall", description: "", resources: [], children: [] },
        { title: "VPN", description: "", resources: [], children: [] }
      ]},
      { title: "Network Topologies", description: "", resources: [], children: [
        { title: "Star", description: "", resources: [], children: [] },
        { title: "Ring", description: "", resources: [], children: [] },
        { title: "Mesh", description: "", resources: [], children: [] },
        { title: "Bus", description: "", resources: [], children: [] }
      ]}
    ]},
    { title: "Operating Systems", description: "", resources: [], children: [
      { title: "Windows", description: "", resources: [], children: [
        { title: "Installation", description: "", resources: [], children: [] },
        { title: "Configuration", description: "", resources: [], children: [] },
        { title: "User Management", description: "", resources: [], children: [] },
        { title: "Troubleshooting", description: "", resources: [], children: [] }
      ]},
      { title: "Linux", description: "", resources: [], children: [
        { title: "File System", description: "", resources: [], children: [] },
        { title: "Permissions", description: "", resources: [], children: [] },
        { title: "Package Management", description: "", resources: [], children: [] },
        { title: "Shell Commands", description: "", resources: [], children: [] }
      ]},
      { title: "MacOS", description: "", resources: [], children: [
        { title: "File System", description: "", resources: [], children: [] },
        { title: "System Preferences", description: "", resources: [], children: [] },
        { title: "Software Management", description: "", resources: [], children: [] }
      ]}
    ]},
    { title: "Virtualization", description: "", resources: [], children: [
      { title: "Concepts", description: "", resources: [], children: [
        { title: "Hypervisor", description: "", resources: [], children: [] },
        { title: "Guest OS", description: "", resources: [], children: [] },
        { title: "Host OS", description: "", resources: [], children: [] }
      ]},
      { title: "Virtualization Platforms", description: "", resources: [], children: [
        { title: "VMware", description: "", resources: [], children: [] },
        { title: "VirtualBox", description: "", resources: [], children: [] },
        { title: "Proxmox", description: "", resources: [], children: [] },
        { title: "ESXi", description: "", resources: [], children: [] }
      ]}
    ]},
    { title: "Security Fundamentals", description: "", resources: [], children: [
      { title: "CIA Triad", description: "", resources: [], children: [
        { title: "Confidentiality", description: "", resources: [], children: [] },
        { title: "Integrity", description: "", resources: [], children: [] },
        { title: "Availability", description: "", resources: [], children: [] }
      ]},
      { title: "Authentication Concepts", description: "", resources: [], children: [
        { title: "Authentication", description: "", resources: [], children: [] },
        { title: "Authorization", description: "", resources: [], children: [] },
        { title: "MFA / 2FA", description: "", resources: [], children: [] }
      ]},
      { title: "Security Architecture", description: "", resources: [], children: [
        { title: "Defense in Depth", description: "", resources: [], children: [] },
        { title: "Zero Trust", description: "", resources: [], children: [] },
        { title: "Network Segmentation", description: "", resources: [], children: [] }
      ]}
    ]},
    { title: "Cryptography", description: "", resources: [], children: [
      { title: "Hashing", description: "", resources: [], children: [
        { title: "MD5", description: "", resources: [], children: [] },
        { title: "SHA", description: "", resources: [], children: [] }
      ]},
      { title: "Encryption", description: "", resources: [], children: [
        { title: "Symmetric Encryption", description: "", resources: [], children: [] },
        { title: "Asymmetric Encryption", description: "", resources: [], children: [] }
      ]},
      { title: "Key Concepts", description: "", resources: [], children: [
        { title: "Public Key", description: "", resources: [], children: [] },
        { title: "Private Key", description: "", resources: [], children: [] },
        { title: "Key Exchange", description: "", resources: [], children: [] }
      ]},
      { title: "PKI", description: "", resources: [], children: [
        { title: "Certificates", description: "", resources: [], children: [] },
        { title: "Certificate Authorities", description: "", resources: [], children: [] }
      ]}
    ]},
    { title: "Security Tools", description: "", resources: [], children: [
      { title: "Network Tools", description: "", resources: [], children: [
        { title: "Nmap", description: "", resources: [], children: [] },
        { title: "Wireshark", description: "", resources: [], children: [] },
        { title: "tcpdump", description: "", resources: [], children: [] },
        { title: "traceroute", description: "", resources: [], children: [] }
      ]},
      { title: "System Tools", description: "", resources: [], children: [
        { title: "ipconfig", description: "", resources: [], children: [] },
        { title: "netstat", description: "", resources: [], children: [] },
        { title: "ping", description: "", resources: [], children: [] },
        { title: "arp", description: "", resources: [], children: [] }
      ]},
      { title: "Forensics Tools", description: "", resources: [], children: [
        { title: "FTK Imager", description: "", resources: [], children: [] },
        { title: "Autopsy", description: "", resources: [], children: [] },
        { title: "WinHex", description: "", resources: [], children: [] }
      ]}
    ]},
    { title: "Security Operations", description: "", resources: [], children: [
      { title: "Incident Response", description: "", resources: [], children: [
        { title: "Preparation", description: "", resources: [], children: [] },
        { title: "Identification", description: "", resources: [], children: [] },
        { title: "Containment", description: "", resources: [], children: [] },
        { title: "Eradication", description: "", resources: [], children: [] },
        { title: "Recovery", description: "", resources: [], children: [] },
        { title: "Lessons Learned", description: "", resources: [], children: [] }
      ]},
      { title: "Threat Intelligence", description: "", resources: [], children: [
        { title: "OSINT", description: "", resources: [], children: [] },
        { title: "Indicators of Compromise", description: "", resources: [], children: [] },
        { title: "Threat Hunting", description: "", resources: [], children: [] }
      ]},
      { title: "Vulnerability Management", description: "", resources: [], children: [
        { title: "Scanning", description: "", resources: [], children: [] },
        { title: "Risk Analysis", description: "", resources: [], children: [] },
        { title: "Patch Management", description: "", resources: [], children: [] }
      ]}
    ]},
    { title: "Common Attacks", description: "", resources: [], children: [
      { title: "Social Engineering", description: "", resources: [], children: [
        { title: "Phishing", description: "", resources: [], children: [] },
        { title: "Smishing", description: "", resources: [], children: [] },
        { title: "Whaling", description: "", resources: [], children: [] },
        { title: "Impersonation", description: "", resources: [], children: [] }
      ]},
      { title: "Network Attacks", description: "", resources: [], children: [
        { title: "MITM", description: "", resources: [], children: [] },
        { title: "DNS Poisoning", description: "", resources: [], children: [] },
        { title: "Rogue Access Point", description: "", resources: [], children: [] },
        { title: "Deauthentication", description: "", resources: [], children: [] }
      ]},
      { title: "Web Attacks", description: "", resources: [], children: [
        { title: "SQL Injection", description: "", resources: [], children: [] },
        { title: "XSS", description: "", resources: [], children: [] },
        { title: "CSRF", description: "", resources: [], children: [] },
        { title: "Directory Traversal", description: "", resources: [], children: [] }
      ]},
      { title: "System Attacks", description: "", resources: [], children: [
        { title: "Buffer Overflow", description: "", resources: [], children: [] },
        { title: "Privilege Escalation", description: "", resources: [], children: [] },
        { title: "Pass the Hash", description: "", resources: [], children: [] }
      ]}
    ]},
    { title: "Cloud Security", description: "", resources: [], children: [
      { title: "Cloud Models", description: "", resources: [], children: [
        { title: "SaaS", description: "", resources: [], children: [] },
        { title: "PaaS", description: "", resources: [], children: [] },
        { title: "IaaS", description: "", resources: [], children: [] }
      ]},
      { title: "Cloud Providers", description: "", resources: [], children: [
        { title: "AWS", description: "", resources: [], children: [] },
        { title: "Azure", description: "", resources: [], children: [] },
        { title: "GCP", description: "", resources: [], children: [] }
      ]},
      { title: "Cloud Storage", description: "", resources: [], children: [
        { title: "Google Drive", description: "", resources: [], children: [] },
        { title: "OneDrive", description: "", resources: [], children: [] },
        { title: "Dropbox", description: "", resources: [], children: [] },
        { title: "iCloud", description: "", resources: [], children: [] }
      ]}
    ]},
    { title: "Programming", description: "", resources: [], children: [
      { title: "Python", description: "", resources: [], children: [] },
      { title: "Go", description: "", resources: [], children: [] },
      { title: "JavaScript", description: "", resources: [], children: [] },
      { title: "Bash", description: "", resources: [], children: [] },
      { title: "PowerShell", description: "", resources: [], children: [] }
    ]},
    { title: "Practice Platforms", description: "", resources: [], children: [
      { title: "TryHackMe", description: "", resources: [], children: [] },
      { title: "HackTheBox", description: "", resources: [], children: [] },
      { title: "VulnHub", description: "", resources: [], children: [] },
      { title: "picoCTF", description: "", resources: [], children: [] },
      { title: "SANS Holiday Hack Challenge", description: "", resources: [], children: [] }
    ]},
    { title: "Certifications", description: "", resources: [], children: [
      { title: "Beginner", description: "", resources: [], children: [
        { title: "CompTIA A+", description: "", resources: [], children: [] },
        { title: "Linux+", description: "", resources: [], children: [] },
        { title: "Network+", description: "", resources: [], children: [] },
        { title: "Security+", description: "", resources: [], children: [] }
      ]},
      { title: "Advanced", description: "", resources: [], children: [
        { title: "CEH", description: "", resources: [], children: [] },
        { title: "CISA", description: "", resources: [], children: [] },
        { title: "CISM", description: "", resources: [], children: [] },
        { title: "GSEC", description: "", resources: [], children: [] },
        { title: "GPEN", description: "", resources: [], children: [] },
        { title: "GWAPT", description: "", resources: [], children: [] },
        { title: "OSCP", description: "", resources: [], children: [] },
        { title: "CREST", description: "", resources: [], children: [] },
        { title: "CISSP", description: "", resources: [], children: [] }
      ]}
    ]}
  ]
};

const ROADMAP_DATA = normalizeRoadmapNode(CUSTOM_ROADMAP_SOURCE, ["roadmap"]);
const roadmapNodeMap = {};
const roadmapLeafNodes = [];

function buildRoadmapIndexes(node, trail, parentId) {
  const nextTrail = node.id === "roadmap" ? [] : [...trail, node.title];
  const childIds = node.children.map((child) => child.id);

  roadmapNodeMap[node.id] = {
    ...node,
    trail: nextTrail,
    parentId: parentId || null,
    childIds
  };

  if (!node.children.length && node.id !== "roadmap") {
    roadmapLeafNodes.push({
      ...node,
      trail: nextTrail,
      parentId: parentId || null
    });
  }

  node.children.forEach((child) => {
    buildRoadmapIndexes(child, nextTrail, node.id);
  });
}

buildRoadmapIndexes(ROADMAP_DATA, [], null);

// ===============================
// User System
// ===============================

function getStoredSessionUsername() {
  return localStorage.getItem(STORAGE_KEYS.authSession) || "";
}

function setStoredSessionUsername(username) {
  if (!username) {
    localStorage.removeItem(STORAGE_KEYS.authSession);
    return;
  }

  localStorage.setItem(STORAGE_KEYS.authSession, username);
}

function getCurrentUsername() {
  return appState.currentUser?.username || "";
}

function ensureUsername() {
  return getCurrentUsername();
}

function readCachedProfile(username) {
  if (!username) {
    return createEmptyProfile();
  }

  try {
    const raw = localStorage.getItem(getProfileCacheKey(username));
    return normalizeProfile(raw ? JSON.parse(raw) : null);
  } catch (error) {
    return createEmptyProfile();
  }
}

function writeCachedProfile(username, profile) {
  if (!username) {
    return;
  }

  localStorage.setItem(getProfileCacheKey(username), JSON.stringify(normalizeProfile(profile)));
}

function getAccountPath(username) {
  return `accounts/${sanitizeKey(username)}`;
}

function getProfilePath(username) {
  return `profiles/${sanitizeKey(username)}`;
}

function hashPassword(password) {
  const cryptoApi = typeof window !== "undefined" ? window.crypto : null;

  if (!cryptoApi?.subtle) {
    return Promise.resolve(password);
  }

  const encoded = new TextEncoder().encode(password);

  return cryptoApi.subtle.digest("SHA-256", encoded).then((buffer) => {
    return Array.from(new Uint8Array(buffer))
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  });
}

function applyUserProfile(username, profile) {
  appState.currentUser = username ? { username } : null;
  appState.profile = normalizeProfile(profile);

  if (username) {
    writeCachedProfile(username, appState.profile);
  }
}

function persistProfile() {
  const username = getCurrentUsername();

  if (!username) {
    return;
  }

  const normalizedProfile = normalizeProfile(appState.profile);
  appState.profile = normalizedProfile;
  writeCachedProfile(username, normalizedProfile);

  if (!db) {
    return;
  }

  db.ref(getProfilePath(username))
    .update({
      ...normalizedProfile,
      username,
      updatedAt: Date.now()
    })
    .catch((error) => {
      console.warn("Profile sync failed:", error);
    });
}

function scheduleProfileSync() {
  if (appState.profileSyncTimeout) {
    clearTimeout(appState.profileSyncTimeout);
  }

  appState.profileSyncTimeout = window.setTimeout(() => {
    persistProfile();
  }, 140);
}

function setLastRoadmapNodeId(nodeId) {
  if (!nodeId || !roadmapNodeMap[nodeId] || appState.profile.lastRoadmapNodeId === nodeId) {
    return;
  }

  appState.profile.lastRoadmapNodeId = nodeId;
  initializeResumeLinks();
  scheduleProfileSync();
}

function getLastRoadmapNodeId() {
  return appState.profile.lastRoadmapNodeId || "";
}

function getResumeRoadmapUrl() {
  const nodeId = getLastRoadmapNodeId();
  return nodeId ? `roadmap.html?focus=${encodeURIComponent(nodeId)}` : "roadmap.html";
}

function updateActiveUsername() {
  const activeUsername = document.getElementById("activeUsername");

  if (activeUsername) {
    activeUsername.textContent = getCurrentUsername() || "Guest";
  }
}

function injectAccountShell() {
  const navbar = document.querySelector(".navbar");

  if (navbar && !document.getElementById("navAccount")) {
    const accountContainer = document.createElement("div");
    accountContainer.id = "navAccount";
    accountContainer.className = "nav-account";
    navbar.appendChild(accountContainer);
  }

  if (!document.getElementById("authModal")) {
    const modal = document.createElement("div");
    modal.id = "authModal";
    modal.className = "auth-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <div class="auth-modal-backdrop" data-auth-close></div>
      <div class="auth-modal-card" role="dialog" aria-modal="true" aria-labelledby="authTitle">
        <div class="auth-header">
          <div>
            <span class="eyebrow">Account Access</span>
            <h2 id="authTitle">Sign in to continue</h2>
          </div>
          <button class="auth-close" type="button" data-auth-close aria-label="Close">x</button>
        </div>
        <div class="auth-mode-switch">
          <button class="auth-mode-button is-active" type="button" data-auth-mode="signin">Sign In</button>
          <button class="auth-mode-button" type="button" data-auth-mode="signup">Create Account</button>
        </div>
        <form id="authForm" class="auth-form">
          <label class="auth-field">
            <span>Username</span>
            <input id="authUsername" name="username" type="text" autocomplete="username" minlength="3" maxlength="24" required>
          </label>
          <label class="auth-field">
            <span>Password</span>
            <input id="authPassword" name="password" type="password" autocomplete="current-password" minlength="6" required>
          </label>
          <p class="auth-help" id="authHelp">Use your account to keep roadmap progress, chat identity, and resume point synced together.</p>
          <p class="auth-message" id="authMessage" aria-live="polite"></p>
          <button class="primary-button auth-submit" id="authSubmitButton" type="submit">Sign In</button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  }
}

function setAuthMessage(message, isError) {
  const authMessage = document.getElementById("authMessage");

  if (!authMessage) {
    return;
  }

  authMessage.textContent = message || "";
  authMessage.classList.toggle("error", Boolean(isError));
}

function setAuthMode(mode) {
  const authModal = document.getElementById("authModal");
  const authTitle = document.getElementById("authTitle");
  const authPassword = document.getElementById("authPassword");
  const authSubmitButton = document.getElementById("authSubmitButton");
  const modeButtons = Array.from(document.querySelectorAll("[data-auth-mode]"));

  if (!authModal || !authTitle || !authPassword || !authSubmitButton) {
    return;
  }

  authModal.dataset.mode = mode;
  modeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.getAttribute("data-auth-mode") === mode);
  });

  authTitle.textContent = mode === "signup" ? "Create your study account" : "Sign in to continue";
  authPassword.autocomplete = mode === "signup" ? "new-password" : "current-password";
  authSubmitButton.textContent = mode === "signup" ? "Create Account" : "Sign In";
  setAuthMessage("");
}

function openAuthModal(mode = "signin", force = false) {
  const authModal = document.getElementById("authModal");

  if (!authModal) {
    return;
  }

  setAuthMode(mode);
  authModal.hidden = false;
  authModal.dataset.force = force ? "true" : "false";
  document.body.classList.add("auth-open");
}

function closeAuthModal() {
  const authModal = document.getElementById("authModal");

  if (!authModal || authModal.dataset.force === "true") {
    return;
  }

  authModal.hidden = true;
  document.body.classList.remove("auth-open");
  setAuthMessage("");
}

async function signUpAccount(username, password) {
  if (!db) {
    throw new Error("Database unavailable.");
  }

  const trimmedUsername = username.trim();
  const accountRef = db.ref(getAccountPath(trimmedUsername));
  const accountSnapshot = await accountRef.once("value");

  if (accountSnapshot.exists()) {
    throw new Error("This username is already taken.");
  }

  const passwordHash = await hashPassword(password);
  const createdAt = Date.now();

  await accountRef.set({
    username: trimmedUsername,
    passwordHash,
    createdAt,
    updatedAt: createdAt
  });

  const profile = createEmptyProfile();

  await db.ref(getProfilePath(trimmedUsername)).set({
    ...profile,
    username: trimmedUsername,
    createdAt,
    updatedAt: createdAt
  });

  setStoredSessionUsername(trimmedUsername);
  applyUserProfile(trimmedUsername, profile);
}

async function signInAccount(username, password) {
  if (!db) {
    throw new Error("Database unavailable.");
  }

  const trimmedUsername = username.trim();
  const accountSnapshot = await db.ref(getAccountPath(trimmedUsername)).once("value");

  if (!accountSnapshot.exists()) {
    throw new Error("Account not found.");
  }

  const accountData = accountSnapshot.val() || {};
  const passwordHash = await hashPassword(password);

  if (accountData.passwordHash !== passwordHash) {
    throw new Error("Incorrect password.");
  }

  const profileSnapshot = await db.ref(getProfilePath(trimmedUsername)).once("value");
  const profile = normalizeProfile(profileSnapshot.val());

  setStoredSessionUsername(trimmedUsername);
  applyUserProfile(trimmedUsername, profile);
}

async function restoreSession() {
  const storedUsername = getStoredSessionUsername().trim();

  if (!storedUsername) {
    applyUserProfile("", createEmptyProfile());
    return;
  }

  try {
    if (!db) {
      applyUserProfile(storedUsername, readCachedProfile(storedUsername));
      return;
    }

    const accountSnapshot = await db.ref(getAccountPath(storedUsername)).once("value");

    if (!accountSnapshot.exists()) {
      setStoredSessionUsername("");
      applyUserProfile("", createEmptyProfile());
      return;
    }

    const profileSnapshot = await db.ref(getProfilePath(storedUsername)).once("value");
    applyUserProfile(storedUsername, profileSnapshot.val() || readCachedProfile(storedUsername));
  } catch (error) {
    console.warn("Session restore fallback used:", error);
    applyUserProfile(storedUsername, readCachedProfile(storedUsername));
  }
}

function signOutAccount() {
  setStoredSessionUsername("");
  applyUserProfile("", createEmptyProfile());
  window.location.reload();
}

function renderAccountControls() {
  const navAccount = document.getElementById("navAccount");

  if (!navAccount) {
    return;
  }

  const currentUsername = getCurrentUsername();

  if (currentUsername) {
    navAccount.innerHTML = `
      <div class="account-badge">
        <span class="account-badge-dot"></span>
        <strong>${currentUsername}</strong>
      </div>
      <button class="secondary-button nav-account-button" id="logoutButton" type="button">Log Out</button>
    `;
    return;
  }

  navAccount.innerHTML = `
    <button class="secondary-button nav-account-button" id="signinButton" type="button">Sign In</button>
    <button class="primary-button nav-account-button" id="signupButton" type="button">Create Account</button>
  `;
}

function bindAuthUi() {
  if (appState.authUiBound) {
    return;
  }

  appState.authUiBound = true;

  document.addEventListener("click", (event) => {
    if (event.target.closest("#signinButton")) {
      openAuthModal("signin");
      return;
    }

    if (event.target.closest("#signupButton")) {
      openAuthModal("signup");
      return;
    }

    if (event.target.closest("#logoutButton")) {
      signOutAccount();
      return;
    }

    const authModeButton = event.target.closest("[data-auth-mode]");
    if (authModeButton) {
      setAuthMode(authModeButton.getAttribute("data-auth-mode"));
      return;
    }

    if (event.target.closest("[data-auth-close]")) {
      closeAuthModal();
    }
  });

  document.addEventListener("submit", async (event) => {
    const authForm = event.target.closest("#authForm");

    if (!authForm) {
      return;
    }

    event.preventDefault();

    const authModal = document.getElementById("authModal");
    const authSubmitButton = document.getElementById("authSubmitButton");
    const usernameInput = document.getElementById("authUsername");
    const passwordInput = document.getElementById("authPassword");

    if (!authModal || !authSubmitButton || !usernameInput || !passwordInput) {
      return;
    }

    const mode = authModal.dataset.mode || "signin";
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!/^[a-zA-Z0-9_-]{3,24}$/.test(username)) {
      setAuthMessage("Username must be 3-24 characters using letters, numbers, _ or -.", true);
      return;
    }

    if (password.length < 6) {
      setAuthMessage("Password must be at least 6 characters.", true);
      return;
    }

    authSubmitButton.disabled = true;
    setAuthMessage(mode === "signup" ? "Creating account..." : "Signing in...");

    try {
      if (mode === "signup") {
        await signUpAccount(username, password);
      } else {
        await signInAccount(username, password);
      }

      window.location.reload();
    } catch (error) {
      setAuthMessage(error.message || "Authentication failed.", true);
      authSubmitButton.disabled = false;
    }
  });
}

function initializeAuthUi() {
  injectAccountShell();
  renderAccountControls();
  bindAuthUi();

  if (!getCurrentUsername()) {
    openAuthModal("signin", true);
  }
}

// ===============================
// Roadmap System
// ===============================

function getRoadmapCompletionState() {
  return appState.profile.completion || {};
}

function saveRoadmapCompletionState(state) {
  appState.profile.completion = state && typeof state === "object" ? state : {};
  scheduleProfileSync();
}

function isRoadmapTaskCompleted(nodeId) {
  return Boolean(getRoadmapCompletionState()[nodeId]);
}

function setRoadmapTaskCompleted(nodeId, completed) {
  const state = getRoadmapCompletionState();

  if (completed) {
    state[nodeId] = true;
  } else {
    delete state[nodeId];
  }

  saveRoadmapCompletionState(state);
}

function getExpandedState() {
  return appState.profile.expanded || {};
}

function saveExpandedState(state) {
  appState.profile.expanded = state && typeof state === "object" ? state : {};
  scheduleProfileSync();
}

function isNodeExpanded(node) {
  const expandedState = getExpandedState();

  if (Object.prototype.hasOwnProperty.call(expandedState, node.id)) {
    return Boolean(expandedState[node.id]);
  }

  return node.id === "roadmap" || node.id.split("__").length <= 2;
}

function setNodeExpanded(nodeId, expanded) {
  const state = getExpandedState();

  if (Boolean(state[nodeId]) === Boolean(expanded)) {
    return;
  }

  state[nodeId] = expanded;
  saveExpandedState(state);
}

function getLeafTasks(node) {
  if (!node.children.length) {
    return node.id === "roadmap" ? [] : [node];
  }

  return node.children.flatMap((child) => getLeafTasks(child));
}

function getNodeProgress(node) {
  const leafTasks = getLeafTasks(node);
  const completedCount = leafTasks.filter((leafNode) => isRoadmapTaskCompleted(leafNode.id)).length;
  return {
    completedCount,
    totalCount: leafTasks.length
  };
}

function isNodeFullyCompleted(node) {
  if (!node) {
    return false;
  }

  if (!node.children.length) {
    return isRoadmapTaskCompleted(node.id);
  }

  const progress = getNodeProgress(node);
  return progress.totalCount > 0 && progress.completedCount === progress.totalCount;
}

function arePreviousSiblingsCompleted(node) {
  if (!node || !node.parentId) {
    return true;
  }

  const parentNode = roadmapNodeMap[node.parentId];

  if (!parentNode) {
    return true;
  }

  const siblingIds = parentNode.childIds || [];
  const currentIndex = siblingIds.indexOf(node.id);

  if (currentIndex <= 0) {
    return true;
  }

  return siblingIds.slice(0, currentIndex).every((siblingId) => {
    return isNodeFullyCompleted(roadmapNodeMap[siblingId]);
  });
}

function isNodeUnlocked(node) {
  if (!node || node.id === "roadmap") {
    return true;
  }

  const parentUnlocked = !node.parentId || isNodeUnlocked(roadmapNodeMap[node.parentId]);

  if (!parentUnlocked) {
    return false;
  }

  return arePreviousSiblingsCompleted(node);
}

function getRequirementHint(node) {
  if (!node || isNodeUnlocked(node)) {
    return "";
  }

  const parentNode = roadmapNodeMap[node.parentId];

  if (!parentNode) {
    return "Complete the previous requirement first.";
  }

  const siblingIds = parentNode.childIds || [];
  const currentIndex = siblingIds.indexOf(node.id);

  if (currentIndex > 0) {
    const previousNode = roadmapNodeMap[siblingIds[currentIndex - 1]];
    if (previousNode) {
      return `Requirement: complete "${previousNode.title}" first.`;
    }
  }

  return "Requirement: unlock the parent path first.";
}

function getOverallProgress() {
  const totalCount = roadmapLeafNodes.length;
  const completedCount = roadmapLeafNodes.filter((node) => isRoadmapTaskCompleted(node.id)).length;
  const percent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    completedCount,
    totalCount,
    percent
  };
}

function getRoadmapFocusIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("focus") || "";
}

function expandRoadmapPath(nodeId) {
  let currentNode = roadmapNodeMap[nodeId];

  while (currentNode?.parentId) {
    setNodeExpanded(currentNode.parentId, true);
    currentNode = roadmapNodeMap[currentNode.parentId];
  }
}

function scheduleRoadmapFocus(nodeId) {
  if (!nodeId) {
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const targetNode = document.querySelector(`[data-node-id="${nodeId}"]`);

      if (!targetNode) {
        return;
      }

      document.querySelectorAll(".tree-node.is-resume-target").forEach((nodeElement) => {
        nodeElement.classList.remove("is-resume-target");
      });

      targetNode.classList.add("is-resume-target");
      targetNode.scrollIntoView({
        block: "center",
        behavior: "smooth"
      });
    });
  });
}

function createResourcesMarkup(resources) {
  if (!resources.length) {
    return "";
  }

  return `
    <div class="node-resources">
      ${resources
        .map(
          (resource) => `
            <a class="node-resource" href="${resource.url}" target="_blank" rel="noopener noreferrer">
              <span>${resource.type || "Resource"}</span>
              <strong>${resource.title}</strong>
            </a>
          `
        )
        .join("")}
    </div>
  `;
}

function nodeMatchesSearch(node) {
  const term = appState.searchTerm.toLowerCase().trim();
  if (!term) return true;

  // Check if node title matches
  if (node.title.toLowerCase().includes(term)) return true;

  // Check if any child matches (recursive)
  if (node.children && node.children.some(child => nodeMatchesSearch(child))) return true;

  return false;
}

function renderRoadmapNode(node, depth) {
  if (node.id === "roadmap") {
    return node.children.filter(child => nodeMatchesSearch(child)).map((child) => renderRoadmapNode(child, depth)).join("");
  }

  const hasChildren = node.children.length > 0;
  const unlocked = isNodeUnlocked(node);
  const expanded = hasChildren ? unlocked && isNodeExpanded(node) : false;
  const progress = getNodeProgress(node);
  const isLeaf = !hasChildren;
  const completed = isNodeFullyCompleted(node);
  const requirementHint = getRequirementHint(node);
  const descriptionMarkup = `
    ${node.description ? `<p class="tree-node-description">${node.description}</p>` : ""}
    ${requirementHint ? `<p class="tree-node-requirement">${requirementHint}</p>` : ""}
  `;
  const progressMarkup = hasChildren
    ? `<span class="tree-node-badge">${unlocked ? `${progress.completedCount}/${progress.totalCount} tasks` : "Locked"}</span>`
    : `<label class="tree-task-check"><input type="checkbox" data-task-checkbox="${node.id}" ${completed ? "checked" : ""} ${unlocked ? "" : "disabled"}><span>${unlocked ? "Completed" : "Locked"}</span></label>`;

  // Filter children for search
  const filteredChildren = hasChildren ? node.children.filter(child => nodeMatchesSearch(child)) : [];

  return `
    <div class="tree-node depth-${Math.min(depth, 4)} ${completed ? "is-complete" : ""} ${unlocked ? "" : "is-locked"}" data-node-id="${node.id}">
      <div class="tree-node-card ${hasChildren && unlocked ? "tree-node-card-expandable" : "tree-node-card-leaf"}" ${hasChildren && unlocked ? `data-node-trigger="${node.id}"` : ""}>
        <div class="tree-node-header">
          <div class="tree-node-copy">
            <div class="tree-node-title-row">
              ${
                hasChildren
                  ? `<button class="tree-toggle" type="button" data-node-toggle="${node.id}" aria-expanded="${expanded}" ${unlocked ? "" : "disabled"}>
                      <span>${unlocked ? (expanded ? "-" : "+") : "!"}</span>
                    </button>`
                  : `<span class="tree-leaf-dot"></span>`
              }
              <h3>${node.title}</h3>
              ${hasChildren ? `<span class="tree-open-hint">${unlocked ? (expanded ? "Hide subtasks" : "Show subtasks") : "Locked by requirement"}</span>` : `<span class="tree-open-hint">${unlocked ? "Final task" : "Locked task"}</span>`}
            </div>
            ${descriptionMarkup}
          </div>
          ${progressMarkup}
        </div>
        ${createResourcesMarkup(node.resources)}
      </div>
      ${
        hasChildren && filteredChildren.length
          ? `<div class="tree-children" data-node-children="${node.id}" ${expanded ? "" : "hidden"}>
              ${filteredChildren.map((child) => renderRoadmapNode(child, depth + 1)).join("")}
            </div>`
          : ""
      }
    </div>
  `;
}

function bindRoadmapInteractions(container) {
  if (!container) {
    return;
  }

  if (container.dataset.bound === "true") {
    return;
  }

  container.dataset.bound = "true";

  function toggleNode(nodeId) {
    const childContainer = container.querySelector(`[data-node-children="${nodeId}"]`);
    const toggleButton = container.querySelector(`[data-node-toggle="${nodeId}"]`);
    const triggerCard = container.querySelector(`[data-node-trigger="${nodeId}"]`);
    const node = roadmapNodeMap[nodeId];

    if (!childContainer || !node || !isNodeUnlocked(node)) {
      return;
    }

    const willExpand = childContainer.hidden;
    childContainer.hidden = !willExpand;

    if (toggleButton) {
      toggleButton.setAttribute("aria-expanded", String(willExpand));
      const toggleText = toggleButton.querySelector("span");
      if (toggleText) {
        toggleText.textContent = willExpand ? "-" : "+";
      }
    }

    if (triggerCard) {
      const hint = triggerCard.querySelector(".tree-open-hint");
      if (hint) {
        hint.textContent = willExpand ? "Hide subtasks" : "Show subtasks";
      }
    }

    setNodeExpanded(nodeId, willExpand);
    setLastRoadmapNodeId(nodeId);
  }

  container.addEventListener("click", (event) => {
    const checkbox = event.target.closest("[data-task-checkbox]");
    if (checkbox) {
      return;
    }

    if (event.target.closest(".node-resource")) {
      return;
    }

    const toggleButton = event.target.closest("[data-node-toggle]");
    if (toggleButton) {
      event.preventDefault();
      const nodeId = toggleButton.getAttribute("data-node-toggle");
      toggleNode(nodeId);
      return;
    }

    const triggerCard = event.target.closest("[data-node-trigger]");
    if (triggerCard) {
      const nodeId = triggerCard.getAttribute("data-node-trigger");
      setLastRoadmapNodeId(nodeId);
      toggleNode(nodeId);
    }
  });

  container.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-task-checkbox]");

    if (!checkbox) {
      return;
    }

    const nodeId = checkbox.getAttribute("data-task-checkbox");
    const node = roadmapNodeMap[nodeId];

    if (!node || !isNodeUnlocked(node)) {
      checkbox.checked = false;
      return;
    }

    setRoadmapTaskCompleted(nodeId, checkbox.checked);
    setLastRoadmapNodeId(nodeId);
    renderRoadmap();
    renderProgressPage();
    renderHomeStats();
    renderSkillPage();
  });
}

function initializeBackToTop() {
  const backToTopButton = document.getElementById("backToTop");

  if (!backToTopButton) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      backToTopButton.style.display = "block";
    } else {
      backToTopButton.style.display = "none";
    }
  });

  backToTopButton.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

function initializeThemeToggle() {
  const themeToggle = document.getElementById("themeToggle");
  const body = document.body;

  if (!themeToggle) return;

  // Load saved theme
  const savedTheme = localStorage.getItem("theme") || "dark";
  if (savedTheme === "light") {
    body.classList.add("light-theme");
    themeToggle.textContent = "🌙";
  } else {
    themeToggle.textContent = "☀️";
  }

  themeToggle.addEventListener("click", () => {
    body.classList.toggle("light-theme");
    const isLight = body.classList.contains("light-theme");
    themeToggle.textContent = isLight ? "🌙" : "☀️";
    localStorage.setItem("theme", isLight ? "light" : "dark");
  });
}

// ===============================
// Skill System
// ===============================

function getNodeIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id") || "";
}

function renderSkillPage() {
  const skillTitle = document.getElementById("skillTitle");
  const skillDescription = document.getElementById("skillDescription");
  const skillCategory = document.getElementById("skillCategory");
  const skillStatusChip = document.getElementById("skillStatusChip");
  const skillPrerequisiteChip = document.getElementById("skillPrerequisiteChip");
  const resourceList = document.getElementById("resourceList");
  const completeSkillButton = document.getElementById("completeSkillButton");
  const skillMessage = document.getElementById("skillMessage");

  if (!skillTitle || !skillDescription || !resourceList || !completeSkillButton) {
    return;
  }

  const selectedNode = roadmapNodeMap[getNodeIdFromUrl()] || null;

  if (!selectedNode) {
    skillTitle.textContent = "Select a roadmap item";
    skillDescription.textContent = "Open a specific node from the roadmap to inspect its details and resources.";
    resourceList.innerHTML = `<p class="empty-state">Resources will appear here when a roadmap item is selected.</p>`;
    completeSkillButton.disabled = true;

    if (skillCategory) {
      skillCategory.textContent = "Roadmap Node";
    }

    if (skillStatusChip) {
      skillStatusChip.textContent = "Status: Waiting for selection";
    }

    if (skillPrerequisiteChip) {
      skillPrerequisiteChip.textContent = "Path: Open from roadmap";
    }

    if (skillMessage) {
      skillMessage.textContent = "This page is ready for any roadmap node that includes an id in the URL.";
    }

    return;
  }

  const nodeProgress = getNodeProgress(selectedNode);
  const isLeaf = !selectedNode.children.length;
  const unlocked = isNodeUnlocked(selectedNode);
  const completed = isLeaf ? isRoadmapTaskCompleted(selectedNode.id) : nodeProgress.completedCount === nodeProgress.totalCount;

  setLastRoadmapNodeId(selectedNode.id);

  skillTitle.textContent = selectedNode.title;
  skillDescription.textContent = selectedNode.description || "No description provided for this roadmap item.";

  if (skillCategory) {
    skillCategory.textContent = isLeaf ? "Task Detail" : "Roadmap Branch";
  }

  if (skillStatusChip) {
    skillStatusChip.textContent = `Status: ${completed ? "Completed" : unlocked ? "In Progress" : "Locked"}`;
  }

  if (skillPrerequisiteChip) {
    skillPrerequisiteChip.textContent = `Path: ${selectedNode.trail.join(" / ") || selectedNode.title}`;
  }

  resourceList.innerHTML = "";

  if (selectedNode.resources.length) {
    selectedNode.resources.forEach((resource) => {
      const resourceCard = document.createElement("article");
      resourceCard.className = "resource-card";
      resourceCard.innerHTML = `
        <span class="resource-type">${resource.type || "Resource"}</span>
        <h3>${resource.title}</h3>
        <p>${selectedNode.description || "Useful learning material for this roadmap item."}</p>
        <a class="resource-link" href="${resource.url}" target="_blank" rel="noopener noreferrer">Open Resource</a>
      `;
      resourceList.appendChild(resourceCard);
    });
  } else {
    resourceList.innerHTML = `<p class="empty-state">No direct resources listed for this roadmap item yet.</p>`;
  }

  completeSkillButton.disabled = !isLeaf || !unlocked;
  completeSkillButton.textContent = completed ? "Completed" : "Mark as Completed";
  completeSkillButton.onclick = null;

  if (!unlocked) {
    if (skillMessage) {
      skillMessage.textContent = getRequirementHint(selectedNode) || "Complete the previous requirement first.";
    }
    return;
  }

  if (!isLeaf) {
    if (skillMessage) {
      skillMessage.textContent = "Only leaf tasks can be marked as completed. Expand this branch in the roadmap to continue.";
    }
    return;
  }

  if (skillMessage) {
    skillMessage.textContent = completed ? "This task is already completed." : "Mark this task complete after finishing the learning objective.";
  }

  completeSkillButton.onclick = () => {
    setRoadmapTaskCompleted(selectedNode.id, true);
    renderRoadmap();
    renderProgressPage();
    renderHomeStats();
    renderSkillPage();
  };
}

// ===============================
// Progress System
// ===============================

function renderProgressPage() {
  const progressText = document.getElementById("progressText");
  const progressTextCard = document.getElementById("progressTextCard");
  const progressFill = document.getElementById("progressFill");
  const progressCaption = document.getElementById("progressCaption");
  const progressCaptionMini = document.getElementById("progressCaptionMini");
  const completedSkillsList = document.getElementById("completedSkillsList");
  const progress = getOverallProgress();

  if (!progressText || !progressFill || !progressCaption || !completedSkillsList) {
    return;
  }

  progressText.textContent = `${progress.percent}%`;
  if (progressTextCard) {
    progressTextCard.textContent = `${progress.percent}%`;
  }
  progressFill.style.width = `${progress.percent}%`;
  progressCaption.textContent = `${progress.completedCount} of ${progress.totalCount} tasks completed`;
  if (progressCaptionMini) {
    progressCaptionMini.textContent =
      progress.percent >= 75 ? "Strong Pace" :
      progress.percent >= 40 ? "Building Well" :
      progress.percent > 0 ? "Getting Started" :
      "Starting";
  }
  completedSkillsList.innerHTML = "";

  const completedTasks = roadmapLeafNodes.filter((node) => isRoadmapTaskCompleted(node.id));

  if (!completedTasks.length) {
    completedSkillsList.innerHTML = `<li>No tasks completed yet. Start by expanding a category in the roadmap.</li>`;
    return;
  }

  completedTasks.forEach((node) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <strong>${node.title}</strong>
      <span>${node.trail.slice(0, -1).join(" / ")}</span>
    `;
    completedSkillsList.appendChild(item);
  });
}

function renderHomeStats() {
  const homeSkillCount = document.getElementById("homeSkillCount");
  const homeCompletedCount = document.getElementById("homeCompletedCount");
  const homeProgressPercent = document.getElementById("homeProgressPercent");
  const progress = getOverallProgress();

  if (homeSkillCount) {
    homeSkillCount.textContent = String(progress.totalCount);
  }

  if (homeCompletedCount) {
    homeCompletedCount.textContent = String(progress.completedCount);
  }

  if (homeProgressPercent) {
    homeProgressPercent.textContent = `${progress.percent}%`;
  }
}

// ===============================
// Chat System
// ===============================

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "";
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getLastReadChatTimestamp() {
  return Number(appState.profile.lastReadChatTimestamp || 0);
}

function setLastReadChatTimestamp(timestamp) {
  if (!timestamp) {
    return;
  }

  appState.profile.lastReadChatTimestamp = Number(timestamp);
  scheduleProfileSync();
}

function isChatNearBottom(chatBox) {
  if (!chatBox) {
    return false;
  }

  return chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight < 120;
}

function scrollMessageToBottom(chatBox, messageElement) {
  if (!chatBox || !messageElement) {
    return;
  }

  const bottomOffset = 28;
  const chatBoxRect = chatBox.getBoundingClientRect();
  const messageRect = messageElement.getBoundingClientRect();
  const messageTop = messageRect.top - chatBoxRect.top + chatBox.scrollTop;
  const targetScrollTop =
    messageTop + messageElement.offsetHeight - chatBox.clientHeight + bottomOffset;

  chatBox.scrollTop = Math.max(targetScrollTop, 0);
}

function scrollToLatestMessage() {
  const chatBox = document.getElementById("chatBox");

  if (!chatBox) {
    return;
  }

  const messages = Array.from(chatBox.querySelectorAll(".message"));
  const lastMessage = messages[messages.length - 1];

  if (lastMessage) {
    scrollMessageToBottom(chatBox, lastMessage);
    return;
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

function scheduleInitialChatScroll() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scrollToLatestMessage();
    });
  });
}

function markVisibleMessagesAsRead() {
  const chatBox = document.getElementById("chatBox");

  if (!chatBox) {
    return;
  }

  const messages = Array.from(chatBox.querySelectorAll(".message"));

  if (!messages.length) {
    return;
  }

  messages.forEach((messageElement) => {
    messageElement.classList.remove("is-unread");
  });

  const latestTimestamp = Number(messages[messages.length - 1].dataset.timestamp || 0);
  setLastReadChatTimestamp(latestTimestamp);
}

function appendMessage(messageData, currentUsername, shouldScroll) {
  const chatBox = document.getElementById("chatBox");

  if (!chatBox || !messageData) {
    return null;
  }

  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");
  const isOwnMessage = messageData.username === currentUsername;
  const messageTimestamp = Number(messageData.timestamp || 0);
  messageDiv.classList.add(isOwnMessage ? "me" : "other");
  messageDiv.dataset.timestamp = String(messageTimestamp);

  if (!isOwnMessage && messageTimestamp > getLastReadChatTimestamp()) {
    messageDiv.classList.add("is-unread");
  }

  const name = document.createElement("div");
  name.className = "messageName";
  name.textContent = messageData.username || "Student";

  const text = document.createElement("div");
  text.className = "messageText";
  text.textContent = messageData.message || "";

  const time = document.createElement("div");
  time.className = "messageTime";
  time.textContent = formatTimestamp(messageData.timestamp);

  messageDiv.appendChild(name);
  messageDiv.appendChild(text);
  messageDiv.appendChild(time);
  chatBox.appendChild(messageDiv);

  if (shouldScroll) {
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  return messageDiv;
}

function sendMessage() {
  const messageInput = document.getElementById("message");
  const username = ensureUsername();

  if (!db || !messageInput || !username) {
    return;
  }

  const message = messageInput.value.trim();

  if (!message) {
    return;
  }

  db.ref("messages").push({
    username,
    message,
    timestamp: Date.now()
  });

  messageInput.value = "";
  messageInput.focus();
}

function initializeChat() {
  const chatBox = document.getElementById("chatBox");
  const messageInput = document.getElementById("message");
  const sendButton = document.getElementById("sendButton");
  const currentUsername = ensureUsername();

  if (!db || !chatBox || !messageInput || !sendButton) {
    return;
  }

  if (!currentUsername) {
    chatBox.innerHTML = `<p class="empty-state">Create or sign in to an account to join the study chat.</p>`;
    messageInput.disabled = true;
    sendButton.disabled = true;
    messageInput.placeholder = "Sign in to start chatting";
    return;
  }

  chatBox.innerHTML = "";

  sendButton.addEventListener("click", sendMessage);
  messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  });

  db.ref("messages").off();
  const messagesRef = db.ref("messages").limitToLast(100);
  const initialMessageKeys = new Set();

  messagesRef.once("value", (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      initialMessageKeys.add(childSnapshot.key);
      appendMessage(childSnapshot.val(), currentUsername, false);
    });

    scheduleInitialChatScroll();

    setTimeout(() => {
      scrollToLatestMessage();
      markVisibleMessagesAsRead();
    }, 80);
  });

  messagesRef.on("child_added", (snapshot) => {
    if (initialMessageKeys.has(snapshot.key)) {
      initialMessageKeys.delete(snapshot.key);
      return;
    }

    const messageData = snapshot.val();
    const isOwnMessage = messageData?.username === currentUsername;
    const shouldScroll = isChatNearBottom(chatBox) || isOwnMessage;

    appendMessage(messageData, currentUsername, shouldScroll);

    if (!isOwnMessage && document.visibilityState !== "visible") {
      showLocalChatNotification(messageData);
    }

    if (document.visibilityState === "visible") {
      markVisibleMessagesAsRead();
    }
  });

  chatBox.addEventListener("scroll", () => {
    if (isChatNearBottom(chatBox)) {
      markVisibleMessagesAsRead();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      markVisibleMessagesAsRead();
    }
  });

  window.addEventListener("beforeunload", markVisibleMessagesAsRead);
}

// ===============================
// Online Users System
// ===============================

function initializeOnlineUsers() {
  const onlineUsersContainer = document.getElementById("onlineUsers");
  const onlineUsersCount = document.getElementById("onlineUsersCount");

  if (!db || !onlineUsersContainer) {
    return;
  }

  const username = ensureUsername();

  if (!username) {
    onlineUsersContainer.innerHTML = `<p class="empty-state">Sign in to appear in the online users list.</p>`;
    if (onlineUsersCount) {
      onlineUsersCount.textContent = "0";
    }
    return;
  }

  const safeKey = username.replace(/[.#$/\[\]]/g, "_");
  const userRef = db.ref(`onlineUsers/${safeKey}`);

  userRef.set({
    username,
    activeAt: Date.now()
  });

  userRef.onDisconnect().remove();

  db.ref("onlineUsers").off();
  db.ref("onlineUsers").on("value", (snapshot) => {
    onlineUsersContainer.innerHTML = "";

    let count = 0;

    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();

      if (!data || !data.username) {
        return;
      }

      count += 1;

      const userRow = document.createElement("div");
      userRow.className = "online-user";
      userRow.innerHTML = `
        <span class="online-indicator"></span>
        <span>${data.username}</span>
      `;
      onlineUsersContainer.appendChild(userRow);
    });

    if (!count) {
      onlineUsersContainer.innerHTML = `<p class="empty-state">No online users detected right now.</p>`;
    }

    if (onlineUsersCount) {
      onlineUsersCount.textContent = String(count);
    }
  });
}

function initializeResumeLinks() {
  const resumeLinks = document.querySelectorAll("[data-resume-roadmap]");

  resumeLinks.forEach((link) => {
    link.setAttribute("href", getResumeRoadmapUrl());
  });
}

function initializeRoadmapSearch() {
  const searchInput = document.getElementById("roadmapSearch");
  const clearButton = document.getElementById("clearSearch");

  if (!searchInput) return;

  searchInput.addEventListener("input", (event) => {
    appState.searchTerm = event.target.value;
    renderRoadmap();
    clearButton.style.display = event.target.value ? "block" : "none";
  });

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      searchInput.value = "";
      appState.searchTerm = "";
      renderRoadmap();
      clearButton.style.display = "none";
      searchInput.focus();
    });
  }

  // Keyboard shortcut Ctrl+K to focus search
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "k") {
      event.preventDefault();
      searchInput.focus();
    }
  });
}

// ===============================
// App Init
// ===============================

async function initializePage() {
  await restoreSession();
  initializeAuthUi();
  initializeResumeLinks();
  initializeNotifications();
  updateActiveUsername();
  renderHomeStats();
  renderRoadmap();
  if (document.body.dataset.page === "roadmap") {
    initializeRoadmapSearch();
  }
  initializeBackToTop();
  initializeThemeToggle();
  renderSkillPage();
  renderProgressPage();
  initializeChat();
  initializeOnlineUsers();
}

document.addEventListener("DOMContentLoaded", initializePage);


