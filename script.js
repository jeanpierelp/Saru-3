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
const botBadge = document.querySelector(".bot-badge");
const letterShell = document.querySelector(".letter-shell");
const letterOpen = document.querySelector(".letter-open");
const quickPrompts = document.querySelectorAll("[data-local-reply]");

let conversationId = "";
let chatReady = false;
let unsubscribeChatMessages = null;
let unreadAdminMessages = 0;
let messageListenerReady = false;
const lastReplyByType = new Map();
const replyQueues = new Map();
const renderedMessages = new Set();

const waitingReplies = [
  "Ya lei tu mensaje, amor. Si tardo un poquito, igual quiero que sepas que me importa mucho leerte.",
  "Me encanto recibir eso. Dame un ratito y te respondo como mereces, bonito y con calma.",
  "Ya me llego tu mensajito. Mientras te respondo, acuerdate de algo: me haces muy feliz.",
  "Lei lo que me escribiste. Si no respondo al toque, no es falta de ganas; quiero contestarte bien.",
  "Tu mensaje ya esta conmigo. Me gusta que me escribas asi, de verdad.",
  "Ya lo vi, mi amor. Dejame pensarte bonito y responderte como se debe.",
];

const phraseReplies = [
  "Si pudiera guardar un momento para siempre, elegiria uno donde estes sonriendo conmigo.",
  "Contigo hasta lo cotidiano tiene algo que quiero cuidar.",
  "No necesito un dia perfecto si puedo terminarlo pensando en ti.",
  "Me gustas en los planes grandes y tambien en los momentos simples.",
  "Hay algo en ti que me calma, me alegra y me hace querer quedarme.",
  "Eres mi pensamiento bonito incluso cuando el dia esta pesado.",
  "Me encanta la paz que siento cuando estamos bien, cuando somos nosotros.",
  "Si esta pagina pudiera abrazarte, eso seria lo que yo quisiera que sientas.",
];

const sweetReplies = [
  "Me encantas por tu forma de ser, por tu ternura y por esa manera tuya de hacerme bien.",
  "Te amo en voz baja, en voz alta, en mis planes y en cada detalle que quiero cuidar contigo.",
  "Eres mi lugar favorito, incluso cuando no estamos haciendo nada especial.",
  "Gracias por existir en mi vida de una forma tan bonita.",
  "Tu sonrisa tiene una forma injusta de arreglarme el dia.",
  "Me haces sentir que el amor puede ser tranquilo, real y bonito.",
  "Te pienso mas de lo que digo y te amo mas de lo que esta pagina alcanza a mostrar.",
  "Me gusta que seas tu. Asi, con tus formas, tus risas, tus dias y tu manera de querer.",
];

const hundredReasons = [
  "Tu sonrisa", "Tus abrazos", "Tu forma de mirarme", "Tu paciencia", "Tu ternura",
  "Tus ocurrencias", "Tu voz", "Tu manera de cuidar", "Lo feliz que me haces",
  "Porque contigo todo se siente mas bonito", "Tu risa", "Tu forma de escuchar",
  "La paz que das", "La confianza que construyen", "Tus detalles pequenos",
  "Tus besos", "Tu sinceridad", "Tu fuerza", "Tu dulzura", "Tu mirada feliz",
  "Porque haces especial un dia simple", "Porque contigo puedo ser yo", "Porque me inspiras",
  "Porque me das motivos para sonreir", "Porque haces que extranarte tenga sentido",
  "Porque contigo me siento en casa", "Porque hasta el silencio es bonito", "Porque me encanta cuidarte",
  "Porque me encanta verte feliz", "Porque admiro tu corazon", "Porque tienes una luz unica",
  "Por nuestras fotos juntos", "Por nuestras salidas", "Por nuestros planes", "Por nuestras bromas",
  "Por nuestras conversaciones largas", "Por cada momento vivido", "Por todo lo que nos falta vivir",
  "Porque contigo quiero quedarme", "Porque tu amor me calma", "Porque tu presencia me alegra",
  "Porque eres mi persona favorita", "Porque me haces sentir afortunado", "Porque amas bonito",
  "Porque sabes hacerme reir", "Porque me entiendes", "Porque confias en mi", "Porque puedo confiar en ti",
  "Porque me gusta aprender de ti", "Porque me gusta descubrirte", "Porque el tiempo pasa rapido contigo",
  "Porque cuando te veo, todo mejora", "Porque tus abrazos arreglan mucho", "Porque tus ojos dicen mucho",
  "Porque me gusta tu energia", "Porque me gusta tu forma de ser", "Porque me siento orgulloso de ti",
  "Porque eres valiente", "Porque eres especial sin esforzarte", "Porque tienes algo que no se explica",
  "Porque me haces pensar en futuro", "Porque contigo quiero crear recuerdos", "Porque haces bonita mi rutina",
  "Porque me gusta verte sonreir", "Porque me gusta escucharte", "Porque me gusta caminar contigo",
  "Porque me gusta molestarte con amor", "Porque me gusta cuando te pones tierna",
  "Porque me gusta cuando somos nosotros sin importar nada", "Porque a tu lado todo pesa menos",
  "Porque eres mi calma", "Porque eres mi alegria", "Porque eres mi aventura", "Porque eres mi lugar seguro",
  "Porque me haces creer mas en el amor", "Porque contigo no necesito aparentar",
  "Porque me encanta tu forma de querer", "Porque me encanta nuestra historia", "Porque cada dia contigo vale la pena",
  "Porque haces que mi corazon se sienta tranquilo", "Porque imagino una vida contigo",
  "Porque eres parte de mis mejores recuerdos", "Porque me encanta estar contigo", "Porque me haces sentir elegido",
  "Porque tambien te elijo", "Porque me importas muchisimo", "Porque quiero verte cumplir tus suenos",
  "Porque quiero celebrar tus logros", "Porque quiero acompanarte en dias buenos y malos",
  "Porque amarte se siente natural", "Porque simplemente eres tu", "Porque contigo todo tiene mas sentido",
  "Porque tu presencia cambia el dia", "Porque tu amor se siente verdadero", "Porque eres bonita en formas que no caben en una foto",
  "Porque haces que quiera cuidar los detalles", "Porque contigo el futuro se ve mas lindo",
  "Porque tu nombre me alegra", "Porque eres mi pensamiento bonito", "Porque me haces bien",
];

function conversationRef() {
  return doc(db, "loveConversations", conversationId);
}

function messagesRef() {
  return collection(db, "loveConversations", conversationId, "messages");
}

async function saveMessage(text, sender) {
  const clientId =
    crypto.randomUUID?.() || `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const clientCreatedAt = new Date().toISOString();

  await setDoc(
    conversationRef(),
    {
      lastMessage: text,
      lastSender: sender,
      visitorUid: conversationId,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      clientCreatedAt,
    },
    { merge: true },
  );

  const messageDoc = await addDoc(messagesRef(), {
    clientId,
    clientCreatedAt,
    text,
    sender,
    createdAt: serverTimestamp(),
  });

  return { id: messageDoc.id, clientId, clientCreatedAt };
}

function openChat() {
  document.body.classList.add("chat-open");
  chatbot?.classList.add("is-open");
  chatBackdrop?.classList.add("is-open");
  chatbot?.setAttribute("aria-hidden", "false");
  unreadAdminMessages = 0;
  updateBotBadge();
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

function updateBotBadge() {
  if (!botBadge) {
    return;
  }

  if (unreadAdminMessages <= 0) {
    botBadge.hidden = true;
    botBadge.textContent = "0";
    return;
  }

  botBadge.hidden = false;
  botBadge.textContent = unreadAdminMessages > 9 ? "9+" : String(unreadAdminMessages);
}

function removeTemporaryBotMessages() {
  document.querySelectorAll("[data-temporary-bot='true']").forEach((message) => {
    const row = message.closest(".message-row");
    renderedMessages.delete(message.dataset.messageId || "");
    row?.remove();
    message.remove();
  });
}

function pickReply(type, replies) {
  if (replies.length === 1) {
    return replies[0];
  }

  let queue = replyQueues.get(type);

  if (!queue || queue.length === 0) {
    const lastReply = lastReplyByType.get(type);
    queue = shuffle(replies).filter((reply) => reply !== lastReply);

    if (queue.length === 0) {
      queue = shuffle(replies);
    }

    replyQueues.set(type, queue);
  }

  const selected = queue.shift();
  lastReplyByType.set(type, selected);
  return selected;
}

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function formatMessageTime(value) {
  const date = value?.toDate?.() || (value ? new Date(value) : new Date());

  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function addMessage(
  text,
  type,
  id = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
  meta = {},
) {
  if (!chatMessages || renderedMessages.has(id)) {
    return;
  }

  renderedMessages.add(id);

  const message = document.createElement("div");
  message.className = `message ${type}`;
  message.dataset.messageId = id;

  if (meta.temporary) {
    message.dataset.temporaryBot = "true";
  }

  const messageText = document.createElement("span");
  const messageMeta = document.createElement("small");
  messageText.className = "message-text";
  messageMeta.className = "message-meta";
  messageText.textContent = text;
  messageMeta.textContent = `${formatMessageTime(meta.createdAt || meta.clientCreatedAt)}${
    type === "user" ? "  ✓" : ""
  }`;
  message.append(messageText, messageMeta);

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

  chatInput?.setAttribute("disabled", "true");

  try {
    await saveMessage(cleanText, "visitor");
    window.setTimeout(() => {
      addMessage(getAutoReply(cleanText), "bot", `temp-${Date.now()}`, { temporary: true });
    }, 350);
  } catch (error) {
    console.error(error);
    addMessage("No pude guardar el mensaje. Revisa tu conexion e intenta otra vez.", "bot");
  } finally {
    chatInput?.removeAttribute("disabled");
    chatInput?.focus();
  }
}

function getAutoReply(text) {
  const normalized = text.toLowerCase();

  if (normalized.includes("100 razones")) {
    return getHundredReasons();
  }

  if (normalized.includes("frase") || normalized.includes("bonita")) {
    return pickReply("phrase", phraseReplies);
  }

  return pickReply("waiting", waitingReplies);
}

function getHundredReasons() {
  const intros = [
    "100 razones por las que te amo:",
    "Hoy te dejo estas 100 razones para recordarte lo mucho que te amo:",
    "Si necesitas acordarte de cuanto te amo, aqui van 100 razones:",
    "No me alcanzan las palabras, pero empiezo con estas 100 razones:",
  ];

  return `${pickReply("reasonsIntro", intros)}\n${shuffle(hundredReasons)
    .map((reason, index) => `${index + 1}. ${reason}`)
    .join("\n")}`;
}

function listenForAdminReplies() {
  if (unsubscribeChatMessages) {
    unsubscribeChatMessages();
  }

  const messagesQuery = query(messagesRef(), orderBy("createdAt", "asc"), limit(100));

  unsubscribeChatMessages = onSnapshot(messagesQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type !== "added") {
        return;
      }

      const data = change.doc.data();

      if (data.sender === "admin") {
        removeTemporaryBotMessages();

        if (messageListenerReady && !document.body.classList.contains("chat-open")) {
          unreadAdminMessages += 1;
          updateBotBadge();
        }
      }

      addMessage(data.text, data.sender === "admin" ? "bot" : "user", change.doc.id, data);
    });

    messageListenerReady = true;
  });
}

async function initChatConnection() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      conversationId = user.uid;
      chatReady = true;
      listenForAdminReplies();
      return;
    }

    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error(error);
      addMessage(
        "El chat real necesita que Firebase tenga activado el acceso anonimo. Avisale a mi persona favorita para terminar de conectarlo.",
        "bot",
      );
    }
  });
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
    const replyType = promptButton.dataset.localReply || "";

    if (replyType === "reasons") {
      addMessage(getHundredReasons(), "bot");
      return;
    }

    if (replyType === "phrase") {
      addMessage(pickReply("phrase", phraseReplies), "bot");
      return;
    }

    addMessage(pickReply("sweet", sweetReplies), "bot");
  });
});

updateLoveCounter();
setInterval(updateLoveCounter, 1000);
initChatConnection();
