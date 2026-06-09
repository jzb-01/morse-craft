import { beep } from "./utils.js";

// ============================================================
// comments PAGE - Browse and read community comments
// ============================================================

// DOM Elements - using refactored class/id names
const browserView = document.getElementById("comments-browser");
const readerView = document.getElementById("comments-reader");

const readerTitle = document.getElementById("reader-title");
const readerContent = document.getElementById("reader-content");

const backButton = document.getElementById("reader-back-btn");

const tableBody = document.querySelector(".comments__table tbody");

const timeSlider = document.getElementById("time-slider");
const timeDisplay = document.getElementById("time-value");

const playButton = document.getElementById("play-btn");
const deleteButton = document.getElementById("delete-btn");

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

// Load and display a comment when a row is clicked
tableBody?.addEventListener("click", async (event) => {
  const row = event.target.closest(".comments__row");
  if (!row) return;

  const commentId = row.dataset.id;

  try {
    const response = await fetch(`/api/comments/${commentId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const comment = await response.json();

    readerTitle.textContent = `By ${comment.author}`;
    readerContent.textContent = comment.content;

    // Store comment ID for deletion
    deleteButton.dataset.id = comment.id;

    // Show delete button only if user is the author
    if (comment.can_delete) {
      deleteButton.classList.remove("hidden");
    } else {
      deleteButton.classList.add("hidden");
    }

    // Switch to reader view
    browserView.classList.add("hidden");
    readerView.classList.remove("hidden");
  } catch (error) {
    console.error("Failed to load comment:", error);
    alert("Unable to load transmission. Please try again.");
  }
});

// Delete the current comment (only visible to author)
deleteButton?.addEventListener("click", async () => {
  const commentId = deleteButton.dataset.id;
  if (!commentId) return;

  const confirmDelete = confirm("Permanently delete this transmission?");
  if (!confirmDelete) return;

  try {
    const response = await fetch(`/api/commentdelete/${commentId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Reload page to refresh the comments list
    window.location.reload();
  } catch (error) {
    console.error("Failed to delete comment:", error);
    alert("Unable to delete. Please try again.");
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

  // Clean up reader view
  readerTitle.textContent = "";
  readerContent.textContent = "";
  deleteButton.classList.add("hidden");
  deleteButton.dataset.id = "";
});

// Play or stop Morse code from the current comment content
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
