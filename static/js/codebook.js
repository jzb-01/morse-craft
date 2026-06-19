import { beep } from "./utils.js";

// ============================================================
// MORSE CODE PLAYER FOR CODEBOOK PAGE
// ============================================================

// DOM Elements - using refactored class names from HTML
const leftBtn = document.getElementById("prev-btn");
const rightBtn = document.getElementById("next-btn");
const tableTitle = document.getElementById("table-title");
const tableBody = document.getElementById("codebook-body");

const timeSlider = document.getElementById("time-slider");
const timeDisplay = document.getElementById("time-value");

// Audio state
let audioContext = null;
let activePlaybackId = null; // Tracks current playback to prevent interruptions

// ============================================================
// UI EVENT HANDLERS
// ============================================================

// Update time value display when slider moves
timeSlider.addEventListener("input", () => {
  timeDisplay.textContent = timeSlider.value;
});

// Play Morse code when user clicks any table row
tableBody.addEventListener("click", async (event) => {
  const row = event.target.closest(".codebook__row");
  if (!row) return;

  // Get Morse code from the second cell (morse column)
  const morseCell = row.querySelector(".codebook__morse");
  if (!morseCell) return;

  const playbackId = Date.now();
  activePlaybackId = playbackId;

  // Initialize audio context on first user interaction
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  // Browsers require user gesture to start audio
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  const timeUnit = Number(timeSlider.value);
  const morseSequence = [...morseCell.textContent.trim()];

  // Play each dot/dash with proper timing
  for (const symbol of morseSequence) {
    // Stop if a new playback was triggered
    if (activePlaybackId !== playbackId) return;

    if (symbol === ".") {
      beep(audioContext, timeUnit);
      await sleep(timeUnit * 2); // Dot: 1 unit sound + 1 unit silence
    } else if (symbol === "-") {
      beep(audioContext, timeUnit * 3);
      await sleep(timeUnit * 4); // Dash: 3 units sound + 1 unit silence
    }
  }

  // Clear playback ID when finished
  if (activePlaybackId === playbackId) {
    activePlaybackId = null;
  }
});

// ============================================================
// TABLE NAVIGATION (Letters → Numbers → Symbols)
// ============================================================

rightBtn.addEventListener("click", async () => {
  const current = tableTitle.textContent.trim();

  if (current === "LETTERS") {
    await loadAndRender("numbers", "NUMBERS");
  } else if (current === "NUMBERS") {
    await loadAndRender("symbols", "SYMBOLS");
  } else if (current === "SYMBOLS") {
    await loadAndRender("letters", "LETTERS");
  }
});

leftBtn.addEventListener("click", async () => {
  const current = tableTitle.textContent.trim();

  if (current === "LETTERS") {
    await loadAndRender("symbols", "SYMBOLS");
  } else if (current === "SYMBOLS") {
    await loadAndRender("numbers", "NUMBERS");
  } else if (current === "NUMBERS") {
    await loadAndRender("letters", "LETTERS");
  }
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function fetchCodebook(section) {
  try {
    const response = await fetch(`/api/codebook/${section}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch codebook:", error);
    alert("Could not load that section. Please try again.");
    return null;
  }
}

function renderTable(dictionary) {
  tableBody.innerHTML = "";

  for (const [character, morse] of Object.entries(dictionary)) {
    const row = document.createElement("tr");
    row.className = "codebook__row";
    row.setAttribute("data-char", character);
    row.setAttribute("data-morse", morse);

    row.innerHTML = `
      <td class="codebook__char">${character}</td>
      <td class="codebook__morse">${morse}</td>
    `;

    tableBody.appendChild(row);
  }
}

async function loadAndRender(section, displayName) {
  const data = await fetchCodebook(section);
  if (data) {
    tableTitle.textContent = displayName;
    renderTable(data);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
