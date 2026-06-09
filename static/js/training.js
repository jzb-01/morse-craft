// ============================================================
// MORSE CODE TRAINING MODULE
// Generate random exercises, play Morse, evaluate accuracy
// ============================================================

import { conversionTable, alphabet, numbers, symbols } from "./data.js";
import { beep } from "./utils.js";

// ============================================================
// DOM ELEMENTS
// ============================================================

// Configuration
const lettersCheckbox = document.getElementById("letters");
const numbersCheckbox = document.getElementById("numbers");
const symbolsCheckbox = document.getElementById("symbols");
const lengthSelect = document.getElementById("exercise-length");

// Training info displays
const availableCharsElement = document.getElementById("available-characters");
const lessonElement = document.getElementById("current-lesson");
const lastResultElement = document.getElementById("last-result");

// Evaluation displays
const expectedTextElement = document.getElementById("expected-text");
const accuracyElement = document.getElementById("accuracy-value");

// User input
const userInput = document.getElementById("user-copy");

// Buttons
const startButton = document.getElementById("start-btn");
const stopButton = document.getElementById("stop-btn");
const evaluateButton = document.getElementById("evaluate-btn");

// Time control
const timeSlider = document.getElementById("time-slider");
const timeDisplay = document.getElementById("time-value");

// ============================================================
// TRAINING STATE
// ============================================================

let audioContext = null;
let isPlaying = false; // Prevents overlapping playback
let currentLesson = 1; // How many characters are being trained
let characterPool = []; // All selected characters (shuffled)
let availableChars = []; // First (lesson+1) characters from pool
let expectedText = ""; // The current exercise text

let timeUnit = Number(timeSlider.value);
timeDisplay.textContent = timeUnit;

// ============================================================
// TIME CONTROL
// ============================================================

timeSlider.addEventListener("input", (event) => {
  timeUnit = Number(event.target.value);
  timeDisplay.textContent = timeUnit;
});

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Fisher-Yates shuffle for randomizing character pools
 */
function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Sleep/pause execution for given milliseconds
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// CHARACTER POOL MANAGEMENT
// ============================================================

/**
 * Build the character pool based on selected checkboxes
 * Returns shuffled array of selected character sets
 */
function buildCharacterPool() {
  let pool = [];

  if (lettersCheckbox.checked) pool.push(...alphabet);
  if (numbersCheckbox.checked) pool.push(...numbers);
  if (symbolsCheckbox.checked) pool.push(...symbols);

  return shuffleArray(pool);
}

/**
 * Update the "Available Characters" display
 * Shows all characters in pool up to current lesson
 * The newest character appears in [brackets]
 */
function updateAvailableCharsDisplay() {
  // Available = first (currentLesson + 1) characters from pool
  availableChars = characterPool.slice(0, currentLesson + 1);

  // Format: regular characters, newest character in brackets
  const display = availableChars.map((char, index) => {
    if (currentLesson > 1 && index === availableChars.length - 1) {
      return `[${char}]`; // New character for this lesson
    }
    return char;
  });

  availableCharsElement.textContent = display.join(" ");
  lessonElement.textContent = currentLesson;
}

/**
 * Reset all training state and regenerate character pool
 * Called on page load and when character categories change
 */
function resetTraining() {
  // Stop any ongoing playback
  isPlaying = false;

  // Reset state
  currentLesson = 1;
  expectedText = "";

  // Clear UI
  userInput.value = "";
  expectedTextElement.textContent = "—";
  accuracyElement.textContent = "—";
  lastResultElement.textContent = "—";

  // Rebuild and display character pool
  characterPool = buildCharacterPool();
  updateAvailableCharsDisplay();
}

// ============================================================
// EXERCISE GENERATION
// ============================================================

/**
 * Generate a random exercise string
 * Uses available characters (up to current lesson)
 * Length determined by dropdown selector
 */
function generateExercise() {
  const length = Number(lengthSelect.value);
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * availableChars.length);
    result += availableChars[randomIndex];
  }

  return result;
}

// ============================================================
// MORSE PLAYBACK
// ============================================================

/**
 * Play the Morse code for a given text string
 * Respects stop button via isPlaying flag
 */
async function playMorse(text) {
  // Initialize audio context on first play
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  // Resume if suspended (browser autoplay policy)
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  isPlaying = true;

  for (const character of text) {
    if (!isPlaying) break;

    const morse = conversionTable[character];
    if (!morse) continue; // Skip unknown characters

    const symbols = [...morse];

    for (const symbol of symbols) {
      if (!isPlaying) break;

      if (symbol === ".") {
        beep(audioContext, timeUnit);
        await sleep(timeUnit * 2); // Dot: 1 unit sound + 1 unit pause
      } else if (symbol === "-") {
        beep(audioContext, timeUnit * 3);
        await sleep(timeUnit * 4); // Dash: 3 units sound + 1 unit pause
      }
    }

    await sleep(timeUnit * 2); // Space between letters
  }

  isPlaying = false;
}

// ============================================================
// BUTTON HANDLERS
// ============================================================

/**
 * START: Generate exercise and play it
 */
startButton.addEventListener("click", async () => {
  // Don't start if no character categories are selected
  if (
    !lettersCheckbox.checked &&
    !numbersCheckbox.checked &&
    !symbolsCheckbox.checked
  ) {
    return;
  }

  // Don't interrupt active playback
  if (isPlaying) return;

  // Clear previous evaluation
  userInput.value = "";
  expectedTextElement.textContent = "—";
  accuracyElement.textContent = "—";

  // Generate and play new exercise
  expectedText = generateExercise();
  await playMorse(expectedText);
});

/**
 * STOP: Immediately halt Morse playback
 */
stopButton.addEventListener("click", () => {
  isPlaying = false;
});

/**
 * EVALUATE: Compare user input with expected text
 * Shows accuracy and advances lesson if 90%+ correct
 */
evaluateButton.addEventListener("click", () => {
  if (expectedText.length === 0) return;

  const typed = userInput.value.trim().toUpperCase();
  const expected = expectedText.trim().toUpperCase();

  // Count matching characters position by position
  let correct = 0;
  const maxLength = Math.max(expected.length, typed.length);

  for (let i = 0; i < maxLength; i++) {
    if (expected[i] === typed[i]) {
      correct++;
    }
  }

  const accuracy = Math.round((correct / expected.length) * 100);

  // Display results
  expectedTextElement.textContent = expected;
  accuracyElement.textContent = `${accuracy}%`;
  lastResultElement.textContent = `${accuracy}%`;

  // Advance lesson if accuracy is high and there are more characters to learn
  if (accuracy >= 90 && currentLesson + 1 < characterPool.length) {
    currentLesson++;
    updateAvailableCharsDisplay();
  }
});

// ============================================================
// CATEGORY CHANGE HANDLERS
// ============================================================

// When any character category changes, reset everything
lettersCheckbox.addEventListener("change", resetTraining);
numbersCheckbox.addEventListener("change", resetTraining);
symbolsCheckbox.addEventListener("change", resetTraining);

// ============================================================
// INITIALIZATION
// ============================================================

resetTraining();
