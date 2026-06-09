// ============================================================
// MORSE CODE TRANSLATOR
// Text ↔ Morse conversion with audio playback
// ============================================================

import { conversionTable, reverseTable } from "./data.js";
import { beep } from "./utils.js";

// ============================================================
// DOM ELEMENTS
// ============================================================

const textInput = document.getElementById("text-input");
const morseInput = document.getElementById("morse-input");
const timeSlider = document.getElementById("time-slider");
const timeDisplay = document.getElementById("time-value");
const playButton = document.getElementById("play-btn");

// Audio state
let audioContext = null;
let isPlaying = false; // Tracks if Morse playback is active

// ============================================================
// TRANSLATION HANDLERS
// ============================================================

/**
 * Convert text to Morse code
 * Rules:
 * - Each character becomes its Morse code
 * - Spaces between letters become single spaces
 * - Newlines are preserved
 * - Unknown characters become "#"
 */
textInput.addEventListener("input", () => {
  const text = textInput.value;

  morseInput.value = [...text]
    .map((char) => {
      // Preserve newlines
      if (char === "\n") return "\n";

      // Convert to uppercase and look up Morse code
      const morse = conversionTable[char.toUpperCase()];
      return morse ?? "#";
    })
    .join(" ") // Space between letters
    .replace(/ *\n */g, "\n"); // Clean up spacing around newlines
});

/**
 * Convert Morse code to text
 * Rules:
 * - Spaces separate individual Morse codes (letters)
 * - Slashes (/) separate words
 * - Newlines are preserved
 * - Unknown codes become "#"
 */
morseInput.addEventListener("input", () => {
  const morse = morseInput.value;

  textInput.value = morse
    .split("\n") // Split into lines
    .map((line) => {
      // Skip empty lines
      if (line.trim() === "") return "";

      // Split by spaces (handles multiple spaces gracefully)
      return line
        .trim()
        .split(/\s+/)
        .map((code) => reverseTable[code] ?? "#")
        .join("");
    })
    .join("\n");
});

// ============================================================
// TIME CONTROL
// ============================================================

// Update display when slider moves
timeSlider.addEventListener("input", (event) => {
  timeDisplay.textContent = event.target.value;
});

// ============================================================
// MORSE AUDIO PLAYBACK
// ============================================================

playButton.addEventListener("click", async () => {
  // Stop playback if currently playing
  if (isPlaying) {
    isPlaying = false;
    playButton.textContent = "▶";
    return;
  }

  // Get Morse code from the Morse input field
  const morseText = morseInput.value;

  // Don't play empty Morse
  if (!morseText.trim()) {
    return;
  }

  // Initialize audio context on first play
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  // Browsers require user gesture to start audio
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  isPlaying = true;
  playButton.textContent = "■";

  const timeUnit = Number(timeSlider.value);
  const morseSequence = [...morseText];

  // Play each symbol in the Morse string
  for (const symbol of morseSequence) {
    if (!isPlaying) break; // User stopped playback

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
    // Ignore newlines and other characters
  }

  // Playback finished or was stopped
  isPlaying = false;
  playButton.textContent = "▶";
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Sleep/pause execution for given milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Resolves after ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
