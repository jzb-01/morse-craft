import { beep } from "./utils.js";

const left = document.getElementById("left");
const right = document.getElementById("right");
const tableName = document.getElementById("table-name");
const tableBody = document.getElementById("code-table-body");

const meter = document.getElementById("time-slider");
const timeValue = document.getElementById("time-unit-value");

let audioCtx = null;
let interrupt = true;
let currentSessionId = null;

meter.addEventListener("input", () => {
  timeValue.textContent = meter.value;
});

tableBody.addEventListener("click", async (event) => {
  const row = event.target.closest("tr");
  if (!row) return;

  const morseCell = row.querySelector(".morse-cell");
  if (!morseCell) return;

  const thisSessionId = Date.now();
  currentSessionId = thisSessionId;

  if (audioCtx == null) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  const timeUnit = Number(meter.value);
  const morseChars = [...morseCell.textContent.trim()];

  for (const char of morseChars) {
    if (currentSessionId !== thisSessionId) {
      return;
    }

    if (char === ".") {
      beep(audioCtx, timeUnit * 1);
      await new Promise((resolve) => setTimeout(resolve, timeUnit * 2));
    } else if (char === "-") {
      beep(audioCtx, timeUnit * 3);
      await new Promise((resolve) => setTimeout(resolve, timeUnit * 4));
    }
  }

  if (currentSessionId === thisSessionId) {
    currentSessionId = null;
  }
});

async function getTable(table) {
  try {
    const response = await fetch(`/api/codebook/${table}`);
    if (!response.ok) {
      throw new Error("Failed to fetch table");
    }
    const tableDict = await response.json();
    return tableDict;
  } catch (error) {
    alert(error);
  }
}

function renderTableData(dictionary) {
  tableBody.innerHTML = "";

  for (const [char, morse] of Object.entries(dictionary)) {
    const rowHTML = `
          <tr>
            <td class="character-cell">${char}</td>
            <td class="morse-cell">${morse}</td>
          </tr>
        `;

    tableBody.insertAdjacentHTML("beforeend", rowHTML);
  }
}

right.addEventListener("click", async () => {
  if (tableName.textContent.trim() == "LETTERS") {
    const numbers = await getTable("numbers");
    if (numbers) {
      tableName.textContent = "NUMBERS";
      renderTableData(numbers);
    }
  } else if (tableName.textContent.trim() == "NUMBERS") {
    const symbols = await getTable("symbols");
    if (symbols) {
      tableName.textContent = "SYMBOLS";
      renderTableData(symbols);
    }
  } else if (tableName.textContent.trim() == "SYMBOLS") {
    const letters = await getTable("letters");
    if (letters) {
      tableName.textContent = "LETTERS";
      renderTableData(letters);
    }
  }
});

left.addEventListener("click", async () => {
  if (tableName.textContent.trim() == "LETTERS") {
    const symbols = await getTable("symbols");
    if (symbols) {
      tableName.textContent = "SYMBOLS";
      renderTableData(symbols);
    }
  } else if (tableName.textContent.trim() == "SYMBOLS") {
    const numbers = await getTable("numbers");
    if (numbers) {
      tableName.textContent = "NUMBERS";
      renderTableData(numbers);
    }
  } else if (tableName.textContent.trim() == "NUMBERS") {
    const letters = await getTable("letters");
    if (letters) {
      tableName.textContent = "LETTERS";
      renderTableData(letters);
    }
  }
});
