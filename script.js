
const DATABASE_URL =
  "https://wellsensors-default-rtdb.europe-west1.firebasedatabase.app";

const latestURL = DATABASE_URL + "/wellMonitoring.json";
const historyURL = DATABASE_URL + "/wellMonitoring/history.json";

const MAX_DISPLAYED_RECORDS = 100;

const waterLevelElement = document.getElementById("waterLevel");
const voltageElement = document.getElementById("voltage");
const currentElement = document.getElementById("current");
const motorElement = document.getElementById("motorStatus");
const alertElement = document.getElementById("alert");
const timestampElement = document.getElementById("timestamp");
const connectionElement = document.getElementById("connection");
const historyTable = document.getElementById("historyTable");
const waterBar = document.getElementById("waterBar");

function showNumber(value) {
  const number = Number(value);
  return value !== null &&
         value !== undefined &&
         Number.isFinite(number)
    ? number.toFixed(2)
    : "--";
}

function showTime(timestamp) {
  if (timestamp === null ||
      timestamp === undefined ||
      !Number.isFinite(Number(timestamp))) {
    return "--";
  }

  return new Date(Number(timestamp)).toLocaleString();
}

function addCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value;
  row.appendChild(cell);
}

async function loadLatest() {
  const response = await fetch(latestURL + "?t=" + Date.now());

  if (!response.ok) {
    throw new Error("Could not read latest Firebase data");
  }

  const data = await response.json();

  if (!data) {
    throw new Error("No latest reading found");
  }

  waterLevelElement.textContent = showNumber(data.waterLevel);
  voltageElement.textContent = showNumber(data.voltage);
  currentElement.textContent = showNumber(data.current);

  const level = Number(data.waterLevel);

  waterBar.style.width =
    Number.isFinite(level)
      ? Math.max(0, Math.min(100, level)) + "%"
      : "0%";

  motorElement.textContent = data.motorStatus || "--";
  motorElement.className =
    data.motorStatus === "ON" ? "motor-on" : "motor-off";

  alertElement.textContent = data.alert || "No alert data";
  alertElement.className =
    data.waterLow === true ? "low-alert" : "normal-alert";

  timestampElement.textContent = showTime(data.timestamp);
}

async function loadHistory() {
  const response = await fetch(historyURL + "?t=" + Date.now());

  if (!response.ok) {
    throw new Error("Could not read Firebase history");
  }

  const data = await response.json();
  historyTable.replaceChildren();

  if (!data || typeof data !== "object") {
    const row = historyTable.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 6;
    cell.textContent = "No previous readings available.";
    return;
  }

  const records = Object.entries(data)
    .map(([key, reading]) => ({
      key,
      ...(reading || {})
    }))
    .sort((a, b) =>
      Number(b.timestamp || 0) - Number(a.timestamp || 0)
    )
    .slice(0, MAX_DISPLAYED_RECORDS);

  if (records.length === 0) {
    const row = historyTable.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 6;
    cell.textContent = "No previous readings available.";
    return;
  }

  for (const record of records) {
    const row = historyTable.insertRow();

    addCell(row, showTime(record.timestamp));
    addCell(row, showNumber(record.waterLevel));
    addCell(row, showNumber(record.voltage));
    addCell(row, showNumber(record.current));
    addCell(row, record.motorStatus || "--");
    addCell(row, record.alert || "--");
  }
}

async function refreshWebsite() {
  try {
    await Promise.all([loadLatest(), loadHistory()]);
    connectionElement.textContent = "Connected to Firebase";
  } catch (error) {
    connectionElement.textContent = "Firebase connection error";
    console.error(error);
  }
}

refreshWebsite();
setInterval(refreshWebsite, 1000);