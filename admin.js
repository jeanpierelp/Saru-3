import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const loginView = document.querySelector('[data-view="login"]');
const adminView = document.querySelector('[data-view="admin"]');
const loginForm = document.querySelector(".login-form");
const emailInput = document.querySelector("#admin-email");
const passwordInput = document.querySelector("#admin-password");
const loginStatus = document.querySelector("[data-login-status]");
const logoutButton = document.querySelector(".logout-button");
const notifyButton = document.querySelector(".notify-button");
const conversationItems = document.querySelector(".conversation-items");
const emptyState = document.querySelector(".empty-state");
const messagesPanel = document.querySelector(".messages-panel");
const adminMessages = document.querySelector(".admin-messages");
const replyForm = document.querySelector(".reply-form");
const replyInput = document.querySelector("#reply-input");

let activeConversationId = "";
let unsubscribeMessages = null;
let conversationsReady = false;
const unreadByConversation = new Map();

function showLogin() {
  loginView?.classList.remove("is-hidden");
  adminView?.classList.add("is-hidden");
}

function showAdmin() {
  loginView?.classList.add("is-hidden");
  adminView?.classList.remove("is-hidden");
}

function formatDate(timestamp) {
  const date = timestamp?.toDate?.() || (timestamp ? new Date(timestamp) : null);

  if (!date) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function updateNotifyButton() {
  if (!notifyButton) {
    return;
  }

  const allowed = "Notification" in window && Notification.permission === "granted";
  notifyButton.classList.toggle("is-on", allowed);
  notifyButton.textContent = allowed ? "Avisos activos" : "Activar avisos";
}

function notifyNewMessage(text) {
  document.title = "Nuevo mensaje - TuPopotin Admin";

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Nuevo mensaje de TuPopotin", {
      body: text,
    });
  }
}

function setActiveConversation(id) {
  activeConversationId = id;
  unreadByConversation.set(id, 0);
  document.title = "TuPopotin Admin";
  emptyState?.classList.add("is-hidden");
  messagesPanel?.classList.remove("is-hidden");
  document.querySelectorAll(".conversation-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.id === id);
  });

  if (unsubscribeMessages) {
    unsubscribeMessages();
  }

  adminMessages.replaceChildren();

  const messagesQuery = query(
    collection(db, "loveConversations", id, "messages"),
    orderBy("createdAt", "asc"),
    limit(150),
  );

  unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
    adminMessages.replaceChildren();

    snapshot.forEach((messageDoc) => {
      const data = messageDoc.data();
      const message = document.createElement("div");
      const messageText = document.createElement("span");
      const messageMeta = document.createElement("small");
      message.className = `admin-message ${data.sender === "admin" ? "admin" : "visitor"}`;
      messageText.textContent = data.text;
      messageMeta.textContent = formatDate(data.createdAt || data.clientCreatedAt);
      message.append(messageText, messageMeta);
      adminMessages.appendChild(message);
    });

    adminMessages.scrollTop = adminMessages.scrollHeight;
  });
}

function listenConversations() {
  const conversationsQuery = query(
    collection(db, "loveConversations"),
    orderBy("updatedAt", "desc"),
    limit(30),
  );

  onSnapshot(conversationsQuery, (snapshot) => {
    conversationItems.replaceChildren();

    if (snapshot.empty) {
      const empty = document.createElement("p");
      empty.textContent = "Aun no hay mensajes.";
      conversationItems.appendChild(empty);
      return;
    }

    snapshot.forEach((conversationDoc) => {
      const data = conversationDoc.data();
      const unread = unreadByConversation.get(conversationDoc.id) || 0;
      const item = document.createElement("button");
      item.className = "conversation-button";
      item.type = "button";
      item.dataset.id = conversationDoc.id;
      item.innerHTML = `
        Conversacion ${unread ? `<strong>${unread}</strong>` : ""}
        <span>${data.lastMessage || "Sin mensajes"} - ${formatDate(data.updatedAt)}</span>
      `;
      item.addEventListener("click", () => setActiveConversation(conversationDoc.id));
      conversationItems.appendChild(item);
    });

    snapshot.docChanges().forEach((change) => {
      if (!conversationsReady || change.type === "removed") {
        return;
      }

      const data = change.doc.data();

      if (data.lastSender === "visitor" && change.doc.id !== activeConversationId) {
        const current = unreadByConversation.get(change.doc.id) || 0;
        unreadByConversation.set(change.doc.id, current + 1);
        notifyNewMessage(data.lastMessage || "Tienes un mensaje nuevo.");
      }
    });

    conversationsReady = true;
  });
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginStatus.textContent = "";

  try {
    await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
  } catch (error) {
    console.error(error);
    loginStatus.textContent = "No pude entrar. Revisa tu correo y contrasena.";
  }
});

logoutButton?.addEventListener("click", () => {
  signOut(auth);
});

notifyButton?.addEventListener("click", async () => {
  if (!("Notification" in window)) {
    notifyButton.textContent = "No soportado";
    return;
  }

  await Notification.requestPermission();
  updateNotifyButton();
});

replyForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = replyInput.value.trim();

  if (!text || !activeConversationId) {
    return;
  }

  replyInput.setAttribute("disabled", "true");

  try {
    await setDoc(
      doc(db, "loveConversations", activeConversationId),
      {
        lastMessage: text,
        lastSender: "admin",
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    await addDoc(collection(db, "loveConversations", activeConversationId, "messages"), {
      text,
      sender: "admin",
      createdAt: serverTimestamp(),
    });

    replyInput.value = "";
  } finally {
    replyInput.removeAttribute("disabled");
    replyInput.focus();
  }
});

replyInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.shiftKey) {
    return;
  }

  event.preventDefault();
  replyForm?.requestSubmit();
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    showAdmin();
    updateNotifyButton();
    listenConversations();
    return;
  }

  showLogin();
});
