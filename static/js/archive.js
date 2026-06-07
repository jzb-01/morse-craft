import { conversionTable } from "./data.js";
import { beep } from "./utils.js";

const browserView = document.getElementById("archivesBrowser");
const readerView = document.getElementById("archiveReader");

const readerTitle = document.getElementById("readerTitle");
const readerContent = document.getElementById("readerContent");

const backButton = document.getElementById("readerBackButton");

const tableBody = document.querySelector(".archives-table tbody");

const meter = document.getElementById("timeSlider");
const timeValue = document.getElementById("timeValue");

const playButton = document.getElementById("playButton");

let audioCtx = null;
let interrupt = true;

// --------------------------------------------------
// TIME UNIT DISPLAY
// --------------------------------------------------

meter.addEventListener("input", () => {
  timeValue.textContent = meter.value;
});

// --------------------------------------------------
// OPEN ARCHIVE
// --------------------------------------------------

tableBody.addEventListener("click", async (event) => {
  const row = event.target.closest(".archive-row");

  if (!row) {
    return;
  }

  const archiveId = row.dataset.id;

  try {
    const response = await fetch(`/api/archive/${archiveId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch archive");
    }

    const archive = await response.json();

    readerTitle.textContent = archive.title;
    readerContent.textContent = archive.content;

    browserView.classList.add("hidden");
    readerView.classList.remove("hidden");
  } catch (error) {
    console.error(error);

    alert("Unable to load archive.");
  }
});

// --------------------------------------------------
// BACK BUTTON
// --------------------------------------------------

backButton.addEventListener("click", () => {
  readerView.classList.add("hidden");
  browserView.classList.remove("hidden");

  readerTitle.textContent = "";
  readerContent.textContent = "";
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
  const morseChars = [...readerContent.textContent];

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
