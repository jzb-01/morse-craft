import { beep } from "./utils.js";

const key = document.getElementById("telegraphKey");
const output = document.getElementById("telegraphOutput");
const meter = document.getElementById("timeSlider");
const timeValue = document.getElementById("timeValue");
const playButton = document.getElementById("playButton");
const clearButton = document.getElementById("clearButton");
const noteButton = document.getElementById("saveNoteButton");
const commentButton = document.getElementById("commentButton");

let interrupt = true;

let unit = parseInt(meter.value);

timeValue.textContent = unit;

let mouseDown = false;
let spaceDown = false;
let isPressed = false;

let pressStart = 0;
let lastRelease = 0;

let audioCtx = null;
let oscillator = null;
let gainNode = null;

/* ---------- TIME UNIT ---------- */

meter.addEventListener("input", (event) => {
  unit = parseInt(event.target.value);
  timeValue.textContent = unit;
});

/* ---------- AUDIO ---------- */

function startTone() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  oscillator = audioCtx.createOscillator();
  gainNode = audioCtx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = 600;

  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
}

function stopTone() {
  if (!oscillator) return;

  gainNode.gain.cancelScheduledValues(audioCtx.currentTime);

  gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);

  gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.01);

  oscillator.stop(audioCtx.currentTime + 0.01);

  oscillator = null;
  gainNode = null;
}

/* ---------- MORSE CLASSIFICATION ---------- */

function classify(duration) {
  if (duration < unit * 1.5) {
    return ".";
  }

  return "-";
}

/* ---------- OUTPUT ---------- */

function appendSymbol(symbol) {
  output.textContent += symbol;

  output.scrollTop = output.scrollHeight;
}

/* ---------- PRESS LOGIC ---------- */

function startPress() {
  const now = performance.now();

  if (lastRelease !== 0) {
    const gap = now - lastRelease;

    // word gap
    if (gap >= unit * 7) {
      output.textContent += " / ";
    }

    // letter gap
    else if (gap >= unit * 3) {
      output.textContent += " ";
    }
  }

  isPressed = true;
  pressStart = now;

  key.classList.add("active");

  startTone();
}

function endPress() {
  isPressed = false;

  const duration = performance.now() - pressStart;

  lastRelease = performance.now();

  key.classList.remove("active");

  stopTone();

  const symbol = classify(duration);

  appendSymbol(symbol);
}

function updatePressState() {
  const shouldBePressed = mouseDown || spaceDown;

  if (shouldBePressed && !isPressed) {
    startPress();
  }

  if (!shouldBePressed && isPressed) {
    endPress();
  }
}

/* ---------- MOUSE ---------- */

key.addEventListener("mousedown", () => {
  mouseDown = true;
  updatePressState();
});

document.addEventListener("mouseup", () => {
  mouseDown = false;
  updatePressState();
});

/* ---------- KEYBOARD ---------- */

document.addEventListener("keydown", (event) => {
  if (event.code !== "Space") return;

  event.preventDefault();

  if (spaceDown) return;

  spaceDown = true;

  updatePressState();
});

document.addEventListener("keyup", (event) => {
  if (event.code !== "Space") return;

  spaceDown = false;

  updatePressState();
});

/* ---------- TOUCH ---------- */

key.addEventListener("touchstart", (event) => {
  event.preventDefault();

  mouseDown = true;

  updatePressState();
});

document.addEventListener("touchend", () => {
  mouseDown = false;

  updatePressState();
});

/* ---------- SAFETY ---------- */

window.addEventListener("blur", () => {
  mouseDown = false;
  spaceDown = false;

  if (isPressed) {
    updatePressState();
  }
});

playButton.addEventListener("click", async () => {
  if (!interrupt) {
    interrupt = true;
    playButton.textContent = "▶";
    return;
  }

  if (audioCtx == null) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  interrupt = false;
  playButton.textContent = "■";
  const timeUnit = Number(meter.value);
  const morseChars = [...output.textContent];

  for (const char of morseChars) {
    if (interrupt === true) {
      break;
    }

    if (char === ".") {
      beep(audioCtx, timeUnit * 1);
      await new Promise((resolve) => setTimeout(resolve, timeUnit * 2));
    } else if (char === "-") {
      beep(audioCtx, timeUnit * 3);
      await new Promise((resolve) => setTimeout(resolve, timeUnit * 4));
    } else if (char === " ") {
      await new Promise((resolve) => setTimeout(resolve, timeUnit * 2));
    } else if (char === "/") {
      await new Promise((resolve) => setTimeout(resolve, timeUnit * 6));
    }
  }

  interrupt = true;
  playButton.textContent = "▶";
});

clearButton.addEventListener("click", () => {
  pressStart = 0;
  lastRelease = 0;
  output.textContent = "";
});

noteButton?.addEventListener("click", async () => {
  const content = output.textContent;

  if (!content.trim()) return;

  const response = await fetch("/api/notes", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      content,
    }),
  });

  if (response.ok) {
    noteButton.textContent = "✓";

    setTimeout(() => {
      noteButton.textContent = "✎";
    }, 1000);
  }
});

commentButton?.addEventListener("click", async () => {
  const content = output.textContent;

  if (!content.trim()) return;

  const response = await fetch("/api/comment", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      content,
    }),
  });

  if (response.ok) {
    commentButton.textContent = "✓";

    setTimeout(() => {
      commentButton.textContent = "✉";
    }, 1000);
  }
});
