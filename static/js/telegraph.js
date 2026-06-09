// ============================================================
// TELEGRAPH MORSE KEY
// Virtual telegraph key with mouse/keyboard/touch support
// ============================================================

import { beep } from "./utils.js";

// ============================================================
// DOM ELEMENTS
// ============================================================

const key = document.getElementById("telegraph-key");
const output = document.getElementById("telegraph-output");
const timeSlider = document.getElementById("time-slider");
const timeDisplay = document.getElementById("time-value");
const playButton = document.getElementById("play-btn");
const clearButton = document.getElementById("clear-btn");
const saveNoteButton = document.getElementById("save-note-btn");
const commentButton = document.getElementById("comment-btn");

// ============================================================
// TELEGRAPH STATE
// ============================================================

let timeUnit = parseInt(timeSlider.value);
timeDisplay.textContent = timeUnit;

// Press state tracking
let mousePressed = false;
let spacePressed = false;
let isKeyPressed = false;

// Timing for Morse classification
let pressStartTime = 0;
let lastReleaseTime = 0;

// Audio for key tone
let audioContext = null;
let currentOscillator = null;
let currentGain = null;

// Playback state
let isPlaying = false;

// ============================================================
// TIME CONTROL
// ============================================================

timeSlider.addEventListener("input", (event) => {
  timeUnit = parseInt(event.target.value);
  timeDisplay.textContent = timeUnit;
});

// ============================================================
// TELEGRAPH KEY AUDIO (Sustained tone)
// ============================================================

/**
 * Start playing the telegraph key tone
 * Creates a 600Hz sine wave that fades in smoothly
 */
function startKeyTone() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  currentOscillator = audioContext.createOscillator();
  currentGain = audioContext.createGain();

  currentOscillator.type = "sine";
  currentOscillator.frequency.value = 600;

  // Quick fade-in to avoid click/pop
  currentGain.gain.setValueAtTime(0, audioContext.currentTime);
  currentGain.gain.linearRampToValueAtTime(
    0.1,
    audioContext.currentTime + 0.01,
  );

  currentOscillator.connect(currentGain);
  currentGain.connect(audioContext.destination);

  currentOscillator.start();
}

/**
 * Stop the telegraph key tone with a quick fade-out
 */
function stopKeyTone() {
  if (!currentOscillator) return;

  // Cancel any scheduled gain changes
  currentGain.gain.cancelScheduledValues(audioContext.currentTime);

  // Fade out smoothly to avoid click
  currentGain.gain.setValueAtTime(
    currentGain.gain.value,
    audioContext.currentTime,
  );
  currentGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.01);

  currentOscillator.stop(audioContext.currentTime + 0.01);

  currentOscillator = null;
  currentGain = null;
}

// ============================================================
// MORSE CLASSIFICATION
// ============================================================

/**
 * Classify a press duration as dot or dash
 * Dot: less than 1.5 time units
 * Dash: 1.5 time units or more
 */
function classifyPress(durationMs) {
  return durationMs < timeUnit * 1.5 ? "." : "-";
}

// ============================================================
// OUTPUT MANAGEMENT
// ============================================================

/**
 * Add a symbol (dot or dash) to the output and auto-scroll
 */
function appendSymbol(symbol) {
  output.textContent += symbol;
  output.scrollTop = output.scrollHeight;
}

/**
 * Determine and add spacing between letters/words
 * Rules:
 * - 3+ time units gap → space between letters
 * - 7+ time units gap → slash between words
 */
function handleSpacing(currentTime) {
  if (lastReleaseTime === 0) return;

  const gap = currentTime - lastReleaseTime;

  if (gap >= timeUnit * 7) {
    output.textContent += " / ";
  } else if (gap >= timeUnit * 3) {
    output.textContent += " ";
  }
}

// ============================================================
// PRESS LOGIC
// ============================================================

/**
 * Start a key press: record timing, add visual feedback, start tone
 */
function startPress() {
  const now = performance.now();

  // Add spacing between letters/words based on release gap
  handleSpacing(now);

  isKeyPressed = true;
  pressStartTime = now;

  // Visual feedback
  key.classList.add("active");

  // Audio feedback
  startKeyTone();
}

/**
 * End a key press: classify duration, append dot/dash, stop tone
 */
function endPress() {
  const duration = performance.now() - pressStartTime;
  lastReleaseTime = performance.now();

  isKeyPressed = false;

  // Remove visual feedback
  key.classList.remove("active");

  // Stop audio
  stopKeyTone();

  // Append the Morse symbol
  const symbol = classifyPress(duration);
  appendSymbol(symbol);
}

/**
 * Update press state based on mouse/keyboard/touch input
 * Called whenever input state changes
 */
function updatePressState() {
  const shouldBePressed = mousePressed || spacePressed;

  if (shouldBePressed && !isKeyPressed) {
    startPress();
  } else if (!shouldBePressed && isKeyPressed) {
    endPress();
  }
}

// ============================================================
// INPUT HANDLERS (Mouse, Keyboard, Touch)
// ============================================================

// ----- Mouse -----
key.addEventListener("mousedown", () => {
  mousePressed = true;
  updatePressState();
});

document.addEventListener("mouseup", () => {
  mousePressed = false;
  updatePressState();
});

// ----- Keyboard (Spacebar) -----
document.addEventListener("keydown", (event) => {
  if (event.code !== "Space") return;

  event.preventDefault(); // Prevent page scrolling

  if (spacePressed) return; // Prevent repeat triggers
  spacePressed = true;
  updatePressState();
});

document.addEventListener("keyup", (event) => {
  if (event.code !== "Space") return;

  spacePressed = false;
  updatePressState();
});

// ----- Touch (Mobile) -----
key.addEventListener("touchstart", (event) => {
  event.preventDefault(); // Prevent page zoom/scroll
  mousePressed = true;
  updatePressState();
});

document.addEventListener("touchend", () => {
  mousePressed = false;
  updatePressState();
});

// ----- Safety: Release if window loses focus -----
window.addEventListener("blur", () => {
  mousePressed = false;
  spacePressed = false;

  if (isKeyPressed) {
    updatePressState();
  }
});

// ============================================================
// PLAYBACK BUTTON
// ============================================================

playButton.addEventListener("click", async () => {
  // Stop playback if currently playing
  if (isPlaying) {
    isPlaying = false;
    playButton.textContent = "▶";
    return;
  }

  const morseText = output.textContent;
  if (!morseText.trim()) return;

  // Initialize audio context if needed
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  // Resume if suspended (browser autoplay policy)
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  isPlaying = true;
  playButton.textContent = "■";

  const morseSequence = [...morseText];

  for (const symbol of morseSequence) {
    if (!isPlaying) break;

    if (symbol === ".") {
      beep(audioContext, timeUnit);
      await sleep(timeUnit * 2); // Dot: 1 unit sound + 1 unit pause
    } else if (symbol === "-") {
      beep(audioContext, timeUnit * 3);
      await sleep(timeUnit * 4); // Dash: 3 units sound + 1 unit pause
    } else if (symbol === " ") {
      await sleep(timeUnit * 2); // Space between letters
    } else if (symbol === "/") {
      await sleep(timeUnit * 6); // Slash between words
    }
  }

  isPlaying = false;
  playButton.textContent = "▶";
});

// ============================================================
// CLEAR BUTTON
// ============================================================

clearButton.addEventListener("click", () => {
  // Reset timing state
  pressStartTime = 0;
  lastReleaseTime = 0;
  output.textContent = "";
});

// ============================================================
// SAVE NOTE BUTTON (Only visible when logged in)
// ============================================================

saveNoteButton?.addEventListener("click", async () => {
  const content = output.textContent.trim();
  if (!content) return;

  try {
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (response.ok) {
      // Temporary success indicator
      const originalText = saveNoteButton.textContent;
      saveNoteButton.textContent = "✓";
      setTimeout(() => {
        saveNoteButton.textContent = originalText;
      }, 1000);
    } else if (response.status === 401) {
      alert("Please log in to save notes.");
    } else {
      alert("Failed to save note.");
    }
  } catch (error) {
    console.error("Save note error:", error);
    alert("Could not save note. Please try again.");
  }
});

// ============================================================
// POST TO comments BUTTON (Only visible when logged in)
// ============================================================

commentButton?.addEventListener("click", async () => {
  const content = output.textContent.trim();
  if (!content) return;

  try {
    const response = await fetch("/api/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (response.ok) {
      // Temporary success indicator
      const originalText = commentButton.textContent;
      commentButton.textContent = "✓";
      setTimeout(() => {
        commentButton.textContent = originalText;
      }, 1000);
    } else if (response.status === 401) {
      alert("Please log in to post to comments.");
    } else {
      alert("Failed to post comment.");
    }
  } catch (error) {
    console.error("Post comment error:", error);
    alert("Could not post to comments. Please try again.");
  }
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Sleep/pause execution for given milliseconds
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
