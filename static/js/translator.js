// ===== Imports =====
import { conversionTable, reverseTable } from "./data.js";
import { beep } from "./utils.js";

// ===================== VARIABLE DECLARATIONS =====================

const textInput = document.getElementById("textInput");
const morseInput = document.getElementById("morseInput");
const meter = document.getElementById("timeSlider");
const timeValue = document.getElementById("timeValue");
const playButton = document.getElementById("playButton");
let audioCtx = null;
let interrupt = true;

textInput.addEventListener("input", () => {
  morseInput.value = [...textInput.value]
    .map((char) => {
      if (char === "\n") return "\n";
      return conversionTable[char.toUpperCase()] ?? "#";
    })
    .join(" ")
    .replace(/ *\n */g, "\n");
});

morseInput.addEventListener("input", () => {
  textInput.value = morseInput.value
    .split("\n")
    .map((line) => {
      if (line.trim() === "") return "";

      return line
        .trim()
        .split(/\s+/)
        .map((code) => reverseTable[code] ?? "#")
        .join("");
    })
    .join("\n");
});

meter.addEventListener("input", (event) => {
  timeValue.textContent = event.target.value;
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
  const morseChars = [...morseInput.value];

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
