import { conversionTable, alphabet, numbers, symbols } from "./data.js";
import { beep } from "./utils.js";

/* ---------- ELEMENTS ---------- */

const lettersBox = document.getElementById("letters");
const numbersBox = document.getElementById("numbers");
const symbolsBox = document.getElementById("symbols");

const lengthSelect = document.getElementById("exerciseLength");

const availableCharactersElement = document.getElementById(
  "availableCharacters",
);

const lessonElement = document.getElementById("currentLesson");

const lastResultElement = document.getElementById("lastResult");

const expectedTextElement = document.getElementById("expectedText");

const accuracyElement = document.getElementById("accuracyValue");

const userCopy = document.getElementById("userCopy");

const startButton = document.getElementById("startButton");

const stopButton = document.getElementById("stopButton");

const evaluateButton = document.getElementById("evaluateButton");

const meter = document.getElementById("timeSlider");

const timeValue = document.getElementById("timeValue");

/* ---------- AUDIO ---------- */

let audioCtx = null;
let interrupt = true;

/* ---------- TRAINING STATE ---------- */

let lesson = 1;

let characterPool = [];

let availableCharacters = [];

let expectedText = "";

/* ---------- TIME UNIT ---------- */

let unit = Number(meter.value);

timeValue.textContent = unit;

meter.addEventListener("input", (event) => {
  unit = Number(event.target.value);

  timeValue.textContent = unit;
});

/* ---------- UTILITIES ---------- */

function shuffle(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ---------- POOL CREATION ---------- */

function buildPool() {
  let pool = [];

  if (lettersBox.checked) {
    pool.push(...alphabet);
  }

  if (numbersBox.checked) {
    pool.push(...numbers);
  }

  if (symbolsBox.checked) {
    pool.push(...symbols);
  }

  return shuffle(pool);
}

/* ---------- LESSON MANAGEMENT ---------- */

function updateAvailableCharactersDisplay() {
  availableCharacters = characterPool.slice(0, lesson + 1);

  const display = availableCharacters.map((character, index) => {
    if (lesson > 1 && index === availableCharacters.length - 1) {
      return `[${character}]`;
    }

    return character;
  });

  availableCharactersElement.textContent = display.join(" ");

  lessonElement.textContent = lesson;
}

function resetTraining() {
  interrupt = true;

  lesson = 1;

  expectedText = "";

  userCopy.value = "";

  expectedTextElement.textContent = "—";

  accuracyElement.textContent = "—";

  lastResultElement.textContent = "—";

  characterPool = buildPool();

  updateAvailableCharactersDisplay();
}

/* ---------- EXERCISE GENERATION ---------- */

function generateExercise() {
  const length = Number(lengthSelect.value);

  let result = "";

  for (let i = 0; i < length; i++) {
    const randomCharacter =
      availableCharacters[
        Math.floor(Math.random() * availableCharacters.length)
      ];

    result += randomCharacter;
  }

  return result;
}

/* ---------- MORSE PLAYBACK ---------- */

async function playExercise(text) {
  if (audioCtx == null) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  interrupt = false;

  for (const character of text) {
    if (interrupt) {
      break;
    }

    const morse = conversionTable[character];

    if (!morse) {
      continue;
    }

    const symbols = [...morse];

    for (const symbol of symbols) {
      if (interrupt) {
        break;
      }

      if (symbol === ".") {
        beep(audioCtx, unit * 1);

        await sleep(unit * 2);
      } else if (symbol === "-") {
        beep(audioCtx, unit * 3);

        await sleep(unit * 4);
      }
    }

    await sleep(unit * 2);
  }

  interrupt = true;
}

/* ---------- START ---------- */

startButton.addEventListener("click", async () => {
  if (!lettersBox.checked && !numbersBox.checked && !symbolsBox.checked) {
    return;
  }

  if (!interrupt) {
    return;
  }

  userCopy.value = "";
  expectedTextElement.textContent = "—";
  accuracyElement.textContent = "—";

  expectedText = generateExercise();

  await playExercise(expectedText);
});

/* ---------- STOP ---------- */

stopButton.addEventListener("click", () => {
  interrupt = true;
});

/* ---------- EVALUATION ---------- */

evaluateButton.addEventListener("click", () => {
  if (expectedText.length === 0) {
    return;
  }

  const typed = userCopy.value.trim().toUpperCase();

  const expected = expectedText.trim().toUpperCase();

  let correct = 0;

  const length = Math.max(expected.length, typed.length);

  for (let i = 0; i < length; i++) {
    if (expected[i] === typed[i]) {
      correct++;
    }
  }

  const accuracy = Math.round((correct / expected.length) * 100);

  expectedTextElement.textContent = expected;

  accuracyElement.textContent = `${accuracy}%`;

  lastResultElement.textContent = `${accuracy}%`;

  if (accuracy >= 90 && lesson + 1 < characterPool.length) {
    lesson++;

    updateAvailableCharactersDisplay();
  }
});

/* ---------- CATEGORY CHANGES ---------- */

lettersBox.addEventListener("change", resetTraining);

numbersBox.addEventListener("change", resetTraining);

symbolsBox.addEventListener("change", resetTraining);

/* ---------- INITIALIZATION ---------- */

resetTraining();
