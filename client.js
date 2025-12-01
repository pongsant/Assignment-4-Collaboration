
// Piano UI + sound + WebSocket + keyboard + chords

function playNote(noteName) {
  // mp3 files "sounds"
  const file = `sounds/${noteName}.mp3`;
  const sound = new Audio(file);
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

// DOM references
const keys = document.querySelectorAll(".key");
const statusText = document.getElementById("statusText");
const activityLog = document.getElementById("activityLog");

// Activity log helper
function addActivityEntry(text, who) {
  const div = document.createElement("div");
  div.className = "activity-log-entry " + who;
  div.textContent = text;
  activityLog.appendChild(div);
  activityLog.scrollTop = activityLog.scrollHeight;
}

// Highlight keys visually
function flashKey(noteName, who) {
  const key = document.querySelector(`.key[data-note="${noteName}"]`);
  if (!key) return;

  if (who === "self") key.classList.add("self-active");
  if (who === "partner") key.classList.add("partner-active");

  setTimeout(() => {
    key.classList.remove("self-active", "partner-active");
  }, 200);
}

// WebSocket connection
const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const WS_URL = isLocal
  ? "ws://localhost:3000"
  : "wss://assignment-4-xv6l.onrender.com";

const socket = new WebSocket(WS_URL);

socket.addEventListener("open", () => {
  statusText.textContent = "Connected. Waiting for another player...";
});

socket.addEventListener("message", (event) => {
  let data;
  try {
    data = JSON.parse(event.data);
  } catch (e) {
    console.log("Invalid message from server:", event.data);
    return;
  }

  if (data.type === "playerCount") {
    if (data.count === 1) {
      statusText.textContent = "You are alone. Open another tab to test.";
    } else if (data.count === 2) {
      statusText.textContent = "Two players connected. Start playing!";
    }
  }

  if (data.type === "note") {
    playNote(data.note);
    flashKey(data.note, "partner");
    addActivityEntry(`Partner played ${data.note}`, "partner");
  }
});

socket.addEventListener("close", () => {
  statusText.textContent = "Disconnected from server.";
});

// Mouse click → play + send
keys.forEach((key) => {
  key.addEventListener("click", () => {
    const noteName = key.dataset.note;
    if (!noteName) return;

    playNote(noteName);
    flashKey(noteName, "self");
    addActivityEntry(`You played ${noteName}`, "self");

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "note", note: noteName }));
    }
  });
});

// Keyboard mapping + chords
const keyToNote = {
  a: "C",
  w: "Csharp",
  s: "D",
  e: "Dsharp",
  d: "E",
  f: "F",
  t: "Fsharp",
  g: "G",
  y: "Gsharp",
  h: "A",
  u: "Asharp",
  j: "B",
};

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  const noteName = keyToNote[key];
  if (!noteName) return;

  playNote(noteName);
  flashKey(noteName, "self");
  addActivityEntry(`You played ${noteName}`, "self");

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "note", note: noteName }));
  }
});
