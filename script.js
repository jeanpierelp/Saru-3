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
  signInAnonymously,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const button = document.querySelector(".bot-jump");
const loveStartDate = new Date(2026, 0, 16, 0, 0, 0);
const timeParts = {
  days: document.querySelector('[data-time="days"]'),
  hours: document.querySelector('[data-time="hours"]'),
  minutes: document.querySelector('[data-time="minutes"]'),
  seconds: document.querySelector('[data-time="seconds"]'),
};
const chatMessages = document.querySelector(".chat-messages");
const chatForm = document.querySelector(".chat-form");
const chatInput = document.querySelector("#chat-input");
const chatbot = document.querySelector(".chatbot");
const closeChat = document.querySelector(".chat-close");
const chatBackdrop = document.querySelector(".chat-backdrop");
const letterShell = document.querySelector(".letter-shell");
const letterOpen = document.querySelector(".letter-open");
const quickPrompts = document.querySelectorAll("[data-prompt]");

let conversationId = "";
let chatReady = false;
const renderedMessages = new Set();

const botReplies = [
  "Tu sonrisa es una de mis formas favoritas de sentir que todo esta bien.",
  "Gracias por existir justo en mi vida y hacer que mis dias tengan mas luz.",
  "Contigo hasta los dias comunes tienen algo que celebrar.",
  "Eres mi lugar favorito, incluso cuando estamos haciendo cualquier cosa.",
  "Me encantas por tu forma de ser, por tu ternura y por esa paz que me das.",
  "No necesito un dia perfecto si puedo terminarlo hablando contigo.",
  "Te amo por lo que eres, por lo que somos y por todo lo que aun vamos a vivir.",
  "Cada foto contigo me recuerda que tengo algo precioso que cuidar.",
];

const hundredReasons = [
  "Tu sonrisa",
  "Tus abrazos",
  "Tu forma de mirarme",
  "Tu paciencia",
  "Tu ternura",
  "Tus ocurrencias",
  "Tu voz",
  "Tu manera de cuidarme",
  "Lo feliz que me haces",
  "Porque contigo todo se siente mas bonito",
  "Tu risa",
  "Tu forma de abrazarme cuando mas lo necesito",
  "Tu manera de estar presente",
  "La paz que me das",
  "La confianza que hemos construido",
  "Tus detalles pequenos",
  "Tus besos",
  "Tu forma de hacerme sentir amado",
  "Lo bonita que eres por dentro",
  "Lo hermosa que eres por fuera",
  "Tu forma de bromear conmigo",
  "Tus mensajes",
  "La manera en que me escuchas",
  "Tu sinceridad",
  "Tu fuerza",
  "Tu dulzura",
  "Tu forma de caminar a mi lado",
  "Lo bien que se siente pasar tiempo contigo",
  "Tu mirada cuando estas feliz",
  "Tu manera de convertir un dia simple en algo especial",
  "Porque contigo puedo ser yo",
  "Porque me inspiras a ser mejor",
  "Porque me das motivos para sonreir",
  "Porque haces que extranarte tenga sentido",
  "Porque me haces sentir en casa",
  "Porque contigo hasta el silencio es bonito",
  "Porque me encanta cuidarte",
  "Porque me encanta verte feliz",
  "Porque admiro tu corazon",
  "Porque tienes una luz unica",
  "Por nuestras fotos",
  "Por nuestras salidas",
  "Por nuestros planes",
  "Por nuestras bromas",
  "Por nuestras conversaciones largas",
  "Por cada momento que hemos vivido",
  "Por todo lo que todavia nos falta vivir",
  "Porque contigo quiero quedarme",
  "Porque tu amor me calma",
  "Porque tu presencia me alegra",
  "Porque eres mi persona favorita",
  "Porque me haces sentir afortunado",
  "Porque tienes una forma preciosa de amar",
  "Porque sabes hacerme reir",
  "Porque me entiendes",
  "Porque confias en mi",
  "Porque puedo confiar en ti",
  "Porque me gusta aprender de ti",
  "Porque me gusta descubrirte cada dia",
  "Porque haces que el tiempo pase rapido",
  "Porque cuando te veo, todo mejora",
  "Porque tus abrazos arreglan muchas cosas",
  "Porque tus ojos dicen mucho",
  "Porque me gusta tu energia",
  "Porque me gusta tu forma de ser",
  "Porque me siento orgulloso de ti",
  "Porque eres valiente",
  "Porque eres especial sin esforzarte",
  "Porque tienes algo que no se explica",
  "Porque me haces pensar en futuro",
  "Porque contigo quiero hacer recuerdos",
  "Porque haces bonita mi rutina",
  "Porque me gusta verte sonreir",
  "Porque me gusta escucharte",
  "Porque me gusta caminar contigo",
  "Porque me gusta molestarte con amor",
  "Porque me gusta cuando te pones tierna",
  "Porque me gusta cuando somos nosotros sin importar nada",
  "Porque a tu lado todo pesa menos",
  "Porque eres mi calma",
  "Porque eres mi alegria",
  "Porque eres mi aventura",
  "Porque eres mi lugar seguro",
  "Porque me haces creer mas en el amor",
  "Porque contigo no necesito aparentar",
  "Porque me encanta tu forma de querer",
  "Porque me encanta nuestra historia",
  "Porque cada dia contigo vale la pena",
  "Porque haces que mi corazon se sienta tranquilo",
  "Porque me gusta imaginar una vida contigo",
  "Porque eres parte de mis mejores recuerdos",
  "Porque me encanta cuando estamos juntos",
  "Porque me haces sentir elegido",
  "Porque te elijo tambien",
  "Porque me importas muchisimo",
  "Porque quiero verte cumplir tus suenos",
  "Porque quiero celebrar tus logros",
  "Porque quiero acompanarte en dias buenos y malos",
  "Porque amarte se siente natural",
  "Porque simplemente eres tu",
];

const keywordReplies = [
  {
    words: ["100 razones", "cien razones", "razones por las que"],
    reply: () =>
      `100 razones por las que te amo:\n${hundredReasons
        .map((reason, index) => `${index + 1}. ${reason}`)
        .join("\n")}`,
  },
  {
    words: ["triste", "mal", "extrano", "pelea"],
    reply:
      "Cuando el dia se ponga dificil, recuerden esto: ustedes ya tienen muchos momentos bonitos ganandole al ruido.",
  },
  {
    words: ["te amo", "amor", "amo", "quiero"],
    reply:
      "Te amo en voz baja, en voz alta, en mis planes y en cada detalle que quiero cuidar contigo.",
  },
  {
    words: ["foto", "recuerdo", "playa", "salida"],
    reply:
      "Ese recuerdo merece quedarse aqui: una foto, una risa y esa sensacion de que todo vale mas cuando estan juntos.",
  },
  {
    words: ["bonita", "hermosa", "linda", "preciosa"],
    reply:
      "Hermosa se queda corto: tienes luz, ternura y una forma unica de hacerme feliz.",
  },
];

function conversationRef() {
  return doc(db, "loveConversations", conversationId);
}

function messagesRef() {
  return collection(db, "loveConversations", conversationId, "messages");
}

async function saveMessage(text, sender) {
  await setDoc(
    conversationRef(),
    {
      lastMessage: text,
      lastSender: sender,
      visitorUid: conversationId,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );

  await addDoc(messagesRef(), {
    text,
    sender,
    createdAt: serverTimestamp(),
  });
}

function openChat() {
  document.body.classList.add("chat-open");
  chatbot?.classList.add("is-open");
  chatBackdrop?.classList.add("is-open");
  chatbot?.setAttribute("aria-hidden", "false");
  window.setTimeout(() => chatInput?.focus(), 260);
}

function closeChatPanel() {
  document.body.classList.remove("chat-open");
  chatbot?.classList.remove("is-open");
  chatBackdrop?.classList.remove("is-open");
  chatbot?.setAttribute("aria-hidden", "true");
}

button?.addEventListener("click", openChat);
closeChat?.addEventListener("click", closeChatPanel);
chatBackdrop?.addEventListener("click", closeChatPanel);
letterOpen?.addEventListener("click", () => {
  letterShell?.classList.add("is-open");
  document.querySelector(".letter-inner")?.setAttribute("aria-hidden", "false");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeChatPanel();
  }
});

function updateLoveCounter() {
  const difference = Math.max(0, Date.now() - loveStartDate.getTime());
  const totalSeconds = Math.floor(difference / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (!timeParts.days || !timeParts.hours || !timeParts.minutes || !timeParts.seconds) {
    return;
  }

  timeParts.days.textContent = days.toLocaleString("es-PE");
  timeParts.hours.textContent = String(hours).padStart(2, "0");
  timeParts.minutes.textContent = String(minutes).padStart(2, "0");
  timeParts.seconds.textContent = String(seconds).padStart(2, "0");
}

function addMessage(text, type, id = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`) {
  if (!chatMessages || renderedMessages.has(id)) {
    return;
  }

  renderedMessages.add(id);

  const message = document.createElement("div");
  message.className = `message ${type}`;
  message.textContent = text;

  if (type === "bot") {
    const row = document.createElement("div");
    const avatar = document.createElement("img");
    row.className = "message-row bot-row";
    avatar.className = "message-avatar";
    avatar.src = "assets/memory-mirror-smile.jpeg";
    avatar.alt = "";
    row.append(avatar, message);
    chatMessages.appendChild(row);
  } else {
    chatMessages.appendChild(message);
  }

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getBotReply(text) {
  const normalized = text.toLowerCase();
  const match = keywordReplies.find((item) => item.words.some((word) => normalized.includes(word)));

  if (match) {
    return typeof match.reply === "function" ? match.reply() : match.reply;
  }

  const index = Math.floor(Math.random() * botReplies.length);
  return botReplies[index];
}

async function sendToBot(text) {
  const cleanText = text.trim();

  if (!chatReady) {
    addMessage("Estoy conectando el chat. Intenta otra vez en unos segundos.", "bot");
    return;
  }

  if (!cleanText) {
    addMessage("Escribeme algo y yo lo guardo con corazoncito.", "bot");
    return;
  }

  addMessage(cleanText, "user", `local-${Date.now()}`);
  chatInput?.setAttribute("disabled", "true");

  try {
    await saveMessage(cleanText, "visitor");

    window.setTimeout(() => {
      addMessage(getBotReply(cleanText), "bot");
      addMessage("Tambien se lo deje guardado para que pueda responderte aqui mismo.", "bot");
    }, 450);
  } catch (error) {
    console.error(error);
    addMessage("No pude guardar el mensaje. Revisa tu conexion e intenta otra vez.", "bot");
  } finally {
    chatInput?.removeAttribute("disabled");
    chatInput?.focus();
  }
}

function listenForAdminReplies() {
  const messagesQuery = query(messagesRef(), orderBy("createdAt", "asc"), limit(100));

  onSnapshot(messagesQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type !== "added") {
        return;
      }

      const data = change.doc.data();

      if (data.sender === "admin") {
        addMessage(data.text, "bot", change.doc.id);
      }
    });
  });
}

async function initChatConnection() {
  try {
    const credentials = await signInAnonymously(auth);
    conversationId = credentials.user.uid;
    chatReady = true;
    listenForAdminReplies();
  } catch (error) {
    console.error(error);
    addMessage(
      "El chat real necesita que Firebase tenga activado el acceso anonimo. Avisale a mi persona favorita para terminar de conectarlo.",
      "bot",
    );
  }
}

if (chatForm && chatInput) {
  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendToBot(chatInput.value);
    chatInput.value = "";
  });
}

quickPrompts.forEach((promptButton) => {
  promptButton.addEventListener("click", () => {
    sendToBot(promptButton.dataset.prompt || "");
  });
});

updateLoveCounter();
setInterval(updateLoveCounter, 1000);
initChatConnection();
