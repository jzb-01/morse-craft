import { beep } from "./utils.js";

// ============================================================
// NOTES PAGE - Personal notes with Morse playback
// ============================================================

// DOM Elements - using refactored class/id names
const browserView = document.getElementById("notes-browser");
const readerView = document.getElementById("notes-reader");

const readerTitle = document.getElementById("reader-title");
const readerContent = document.getElementById("reader-content");

const backButton = document.getElementById("reader-back-btn");

const tableBody = document.querySelector(".notes__table tbody");

const timeSlider = document.getElementById("time-slider");
const timeDisplay = document.getElementById("time-value");

const playButton = document.getElementById("play-btn");
const deleteButton = document.getElementById("delete-btn");

// Audio state
let audioContext = null;
let isPlaying = false; // Tracks if Morse playback is active
let currentNoteId = null; // Track which note is currently open

// ============================================================
// UI EVENT HANDLERS
// ============================================================

// Update time value display when slider moves
timeSlider.addEventListener("input", () => {
  timeDisplay.textContent = timeSlider.value;
});

// Load and display a note when a row is clicked
tableBody?.addEventListener("click", async (event) => {
  const row = event.target.closest(".notes__row");
  if (!row) return;

  const noteId = row.dataset.id;

  try {
    const response = await fetch(`/api/note/${noteId}`);

    if (response.status === 401) {
      alert("Please log in to view notes.");
      window.location.href = "/auth";
      return;
    }

    if (response.status === 403) {
      alert("You don't have permission to view this note.");
      return;
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const note = await response.json();

    readerTitle.textContent = note.title;
    readerContent.textContent = note.content;
    currentNoteId = note.id;
    deleteButton.dataset.id = note.id;

    // Switch to reader view
    browserView.classList.add("hidden");
    readerView.classList.remove("hidden");
  } catch (error) {
    console.error("Failed to load note:", error);
    alert("Unable to load transmission. Please try again.");
  }
});

// Delete the current note
deleteButton?.addEventListener("click", async () => {
  if (!currentNoteId) return;

  // Ask for confirmation before deleting
  const confirmDelete = confirm("Delete this note? This cannot be undone.");
  if (!confirmDelete) return;

  try {
    const response = await fetch(`/api/notedelete/${currentNoteId}`, {
      method: "DELETE",
    });

    if (response.status === 401) {
      alert("Please log in to delete notes.");
      window.location.href = "/auth";
      return;
    }

    if (response.status === 403) {
      alert("You don't have permission to delete this note.");
      return;
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    // Reload the page to refresh the notes list
    window.location.reload();
  } catch (error) {
    console.error("Failed to delete note:", error);
    alert("Unable to delete note. Please try again.");
  }
});

// Return to browser view
backButton?.addEventListener("click", () => {
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
  currentNoteId = null;
  deleteButton.dataset.id = "";
});

// Play or stop Morse code from the current note content
playButton?.addEventListener("click", async () => {
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
