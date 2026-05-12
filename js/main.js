let mode = localStorage.getItem("mode") || "time";
let selectedOption = localStorage.getItem("selectedOption") || "5s";

const tapSound = new Audio("../assets/sfx/tap.mp3");
const keypressCorrectSound = new Audio("../assets/sfx/keypressCorrect.mp3");
const keypressWrongSound = new Audio("../assets/sfx/keypressWrong.mp3");

document.querySelectorAll("input[name='mode-option']").forEach((input) => {
  const optionValue = input.parentElement.getAttribute("data-value");
  const inputMode = input.closest("[data-mode]")?.getAttribute("data-mode");

  if (inputMode === mode && optionValue === selectedOption) {
    input.checked = true;
  }

  input.addEventListener("change", () => {
    tapSound.currentTime = 0;
    tapSound.play().catch(() => { });
    mode = input.closest("[data-mode]")?.getAttribute("data-mode");
    selectedOption = optionValue;
    localStorage.setItem("mode", mode);
    localStorage.setItem("selectedOption", selectedOption);
    input.blur();
    startSession();
  });
});

const output = document.querySelector(".output");
const nextKeyEl = document.querySelector(".next-key");
const counterEl = document.querySelector(".counter");

let key1 = "Arrowup" ;
let key2 = "W";
let lastPressed = null;
const heldKeys = new Set();
let sessionRemaining = 0;
let sessionEnded = false;
let sessionTimerId = null;
let sessionStarted = false;

function formatKeyLabel(key) {
  return key
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function updateNextKeyDisplay() {
  if (!nextKeyEl) return;

  const nextKey = lastPressed === key1.toLowerCase() ? key2 : key1;
  nextKeyEl.textContent = "Next key: " + formatKeyLabel(nextKey);
}

function getSelectedLimit() {
  const value = parseInt(selectedOption, 10);
  return Number.isFinite(value) ? value : 0;
}

function updateCounterDisplay() {
  if (!counterEl) return;

  if (mode === "infinite") {
    counterEl.textContent = "";
    return;
  }

  if (mode === "time") {
    counterEl.textContent = `${Math.max(0, Math.ceil(sessionRemaining))}s`;
    return;
  }

  counterEl.textContent = `${Math.max(0, sessionRemaining)}x`;
}

function clearEndMarker() {
  output?.querySelector(".end")?.remove();
}

function endSession() {
  if (sessionEnded) return;

  sessionEnded = true;

  if (sessionTimerId) {
    clearInterval(sessionTimerId);
    sessionTimerId = null;
  }

  updateOverflowClasses();
  updatePlaceholder();
}

function startTimeSession() {
  if (sessionTimerId || sessionEnded) return;

  const sessionEndsAt = Date.now() + sessionRemaining * 1000;

  sessionStarted = true;
  sessionTimerId = setInterval(() => {
    if (sessionEnded) return;

    const msLeft = sessionEndsAt - Date.now();

    if (msLeft <= 0) {
      sessionRemaining = 0;
      updateCounterDisplay();
      endSession();
      return;
    }

    sessionRemaining = msLeft / 1000;
    updateCounterDisplay();
  }, 250);
}

function startSession() {
  sessionEnded = false;
  sessionStarted = false;
  lastPressed = null;
  heldKeys.clear();
  clearEndMarker();
  output.querySelectorAll(".el, .end").forEach((el) => el.remove());

  if (sessionTimerId) {
    clearInterval(sessionTimerId);
    sessionTimerId = null;
  }

  if (mode === "time") {
    sessionRemaining = getSelectedLimit();
  } else if (mode === "reps") {
    sessionRemaining = getSelectedLimit();
  } else {
    sessionRemaining = Infinity;
  }

  updateCounterDisplay();
  updateNextKeyDisplay();
  updatePlaceholder();
}

function updateOverflowClasses() {
  if (!output) return;

  const horizontal = output.scrollWidth > output.clientWidth;

  output.classList.toggle("overflow", horizontal);
  output.classList.remove("at-start", "at-end", "in-between");

  if (!horizontal) return;

  if (output.scrollLeft <= 0) {
    output.classList.add("at-start");
  } else if (output.scrollLeft + output.clientWidth >= output.scrollWidth - 1) {
    output.classList.add("at-end");
  } else {
    output.classList.add("in-between");
  }
}

function updatePlaceholder() {
  if (!output) return;
  const hasItem = !!output.querySelector('.el');
  const placeholder = output.querySelector('.placeholder-text');

  if (!hasItem) {
    if (!placeholder) {
      const el = document.createElement('span');
      el.className = 'placeholder-text';
      el.innerHTML = `start spamming with <kbd>${key1}</kbd> + <kbd>${key2}</kbd> at any time...`;
      output.appendChild(el);
    }
  } else if (placeholder) {
    placeholder.remove();
  }
}

output.addEventListener("scroll", () => { updateOverflowClasses(); updatePlaceholder(); });
window.addEventListener("resize", () => { updateOverflowClasses(); updatePlaceholder(); });

updateOverflowClasses();
updatePlaceholder();
startSession();

window.addEventListener("keydown", (e) => {
  if (sessionEnded) return;

  if (e.target instanceof HTMLElement && e.target.closest("input[name='mode-option']")) {
    return;
  }

  const pressed = (e.key || '').toLowerCase();
  const k1 = key1.toLowerCase();
  const k2 = key2.toLowerCase();

  if (pressed !== k1 && pressed !== k2) return;

  if (mode === "time" && !sessionStarted) {
    startTimeSession();
  }

  if (heldKeys.has(pressed)) return;
  heldKeys.add(pressed);

  const cls = pressed === lastPressed ? 'wrong' : 'correct';
  lastPressed = pressed;
  const sound = cls === 'correct' ? keypressCorrectSound : keypressWrongSound;
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(() => {});
  }
  const el = document.createElement("div");
  el.className = `el ${cls}`;
  output.appendChild(el);
  output.scrollLeft = output.scrollWidth;

  if (mode === "reps") {
    sessionRemaining -= 1;
    updateCounterDisplay();

    if (sessionRemaining <= 0) {
      endSession();
    }
  }

  updateOverflowClasses();
  updatePlaceholder();
  updateNextKeyDisplay();
});

window.addEventListener("keyup", (e) => {
  const key = (e.key || '').toLowerCase();
  if (heldKeys.has(key)) heldKeys.delete(key);
});