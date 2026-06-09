import { beep } from "./utils.js";

// ============================================================
// ARCHIVE PAGE - Browse and read classified transmissions
// ============================================================

// DOM Elements - using refactored class/id names
const browserView = document.getElementById("archive-browser");
const readerView = document.getElementById("archive-reader");

const readerTitle = document.getElementById("reader-title");
const readerContent = document.getElementById("reader-content");

const backButton = document.getElementById("reader-back-btn");

const tableBody = document.querySelector(".archive__table tbody");

const timeSlider = document.getElementById("time-slider");
const timeDisplay = document.getElementById("time-value");

const playButton = document.getElementById("play-btn");

// Audio state
let audioContext = null;
let isPlaying = false; // Tracks if Morse playback is active

// ============================================================
// UI EVENT HANDLERS
// ============================================================

// Update time value display when slider moves
timeSlider.addEventListener("input", () => {
  timeDisplay.textContent = timeSlider.value;
});

// Load and display an archive when a row is clicked
tableBody.addEventListener("click", async (event) => {
  const row = event.target.closest(".archive__row");
  if (!row) return;

  const archiveId = row.dataset.id;

  try {
    const response = await fetch(`/api/archive/${archiveId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const archive = await response.json();

    readerTitle.textContent = archive.title;
    readerContent.textContent = archive.content;

    // Switch to reader view
    browserView.classList.add("hidden");
    readerView.classList.remove("hidden");
  } catch (error) {
    console.error("Failed to load archive:", error);
    alert("Unable to load transmission. Please try again.");
  }
});

// Return to browser view
backButton.addEventListener("click", () => {
  // Stop any ongoing playback before leaving
  if (isPlaying) {
    isPlaying = false;
    playButton.textContent = "▶";
  }

  readerView.classList.add("hidden");
  browserView.classList.remove("hidden");

  // Clear reader content
  readerTitle.textContent = "";
  readerContent.textContent = "";
});

// Play or stop Morse code from the current archive content
playButton.addEventListener("click", async () => {
  // Stop playback if currently playing
  if (isPlaying) {
    isPlaying = false;
    playButton.textContent = "▶";
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
  const morseText = readerContent.textContent;

  // Play each character in the Morse string
  for (const symbol of morseText) {
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
  }

  // Playback finished or was stopped
  isPlaying = false;
  playButton.textContent = "▶";
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
