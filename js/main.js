/* Persistent settings */
let mode = localStorage.getItem("mode") || "time";
let selectedOption = localStorage.getItem("selectedOption") || "5s";

const tapSound = new Audio("../assets/sfx/tap.mp3");
const keypressCorrectSound = new Audio("../assets/sfx/keypressCorrect.mp3");
const keypressWrongSound = new Audio("../assets/sfx/keypressWrong.mp3");
const endingSound = new Audio("../assets/sfx/end.mp3");

const output = document.querySelector(".output");
const outputWrapper = document.querySelector(".output-wrapper");
const nextKeyEl = document.querySelector(".next-key");
const counterEl = document.querySelector(".counter");

/* Runtime state */
let key1 = localStorage.getItem("key1") || "arrowup";
let key2 = localStorage.getItem("key2") || "w";
let lastPressed = null;
const heldKeys = new Set();
let sessionRemaining = 0;
let sessionEnded = false;
let sessionTimerId = null;
let sessionStarted = false;
let rebindingKey = null;
let sessionLimit = 0;

/* Helpers */
function normalizeKeyValue(key) {
  if (key === " ") return "space";
  return (key || "").toLowerCase();
}

function formatKeyLabel(key) {
  return normalizeKeyValue(key).replace(/-/g, " ");
}

function getBindingButton(bindingKey) {
  return document.querySelector(bindingKey === "key1" ? "#kbd1" : "#kbd2");
}

function getBoundKey(bindingKey) {
  return bindingKey === "key1" ? key1 : key2;
}

function restoreRebindingLabel(bindingKey) {
  const button = getBindingButton(bindingKey);
  if (!button) return;

  button.textContent = formatKeyLabel(getBoundKey(bindingKey));
}

function startRebinding(bindingKey, button) {
  if (rebindingKey && rebindingKey !== bindingKey) {
    restoreRebindingLabel(rebindingKey);
  }

  rebindingKey = bindingKey;
  button.textContent = "...";
}

function cancelRebinding() {
  if (!rebindingKey) return;

  restoreRebindingLabel(rebindingKey);
  rebindingKey = null;
}

function updateNextKeyDisplay() {
  if (!nextKeyEl) return;

  if (sessionEnded || lastPressed === null) {
    nextKeyEl.textContent = "";
    return;
  }

  const nextKey = lastPressed === normalizeKeyValue(key1) ? key2 : key1;
  nextKeyEl.textContent = "next key: " + formatKeyLabel(nextKey);
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

  const remaining = Math.max(0, sessionRemaining);
  const total = sessionLimit || getSelectedLimit();
  const completed = total - remaining;
  counterEl.textContent = `${completed}/${total}`;
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

  const hasItem = !!output.querySelector(".el");
  const placeholder = output.querySelector(".placeholder-text");

  if (!hasItem) {
    if (!placeholder) {
      const el = document.createElement("span");
      el.className = "placeholder-text";
      el.innerHTML = `start spamming with <button id="kbd1">${formatKeyLabel(key1)}</button> + <button id="kbd2">${formatKeyLabel(key2)}</button> at any time...`;
      output.appendChild(el);

      el.querySelector("#kbd1")?.addEventListener("click", (e) => {
        e.preventDefault();
        if (rebindingKey === "key1") return;
        tapSound.currentTime = 0;
        tapSound.play().catch(() => { });
        if (e.target instanceof HTMLElement) {
          startRebinding("key1", e.target);
        }
      });

      el.querySelector("#kbd2")?.addEventListener("click", (e) => {
        e.preventDefault();
        if (rebindingKey === "key2") return;
        tapSound.currentTime = 0;
        tapSound.play().catch(() => { });
        if (e.target instanceof HTMLElement) {
          startRebinding("key2", e.target);
        }
      });
    }
  } else if (placeholder) {
    placeholder.remove();
    rebindingKey = null;
  }
}

function endSession() {
  if (sessionEnded) return;

  sessionEnded = true;

  if (sessionTimerId) {
    clearInterval(sessionTimerId);
    sessionTimerId = null;
  }

  endingSound.currentTime = 0;
  endingSound.play().catch(() => { });

  const end = document.createElement("div");
  end.className = "end";
  end.innerHTML = `<span>round over. to play again, click the button bellow</span>`;
  outputWrapper.appendChild(end);
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
  outputWrapper?.querySelector(".end")?.remove();
  output.querySelectorAll(".el, .end").forEach((el) => el.remove());

  if (sessionTimerId) {
    clearInterval(sessionTimerId);
    sessionTimerId = null;
  }

  if (mode === "time") {
    sessionRemaining = getSelectedLimit();
  } else if (mode === "reps") {
    sessionRemaining = getSelectedLimit();
    sessionLimit = sessionRemaining;
  } else {
    sessionRemaining = Infinity;
  }

  updateCounterDisplay();
  updateNextKeyDisplay();
  updatePlaceholder();
}

function handleRebindingKeydown(event) {
  const newKey = normalizeKeyValue(event.key);
  const button = getBindingButton(rebindingKey);

  event.preventDefault();
  event.stopPropagation();

  const otherKey = rebindingKey === "key1" ? key2 : key1;
  if (newKey === normalizeKeyValue(otherKey)) {
    if (button) {
      button.textContent = formatKeyLabel(getBoundKey(rebindingKey));
    }
    rebindingKey = null;
    return;
  }

  if (rebindingKey === "key1") {
    key1 = newKey;
    localStorage.setItem("key1", key1);
  } else if (rebindingKey === "key2") {
    key2 = newKey;
    localStorage.setItem("key2", key2);
  }

  if (button) {
    button.textContent = formatKeyLabel(newKey);
  }

  updateNextKeyDisplay();

  keypressCorrectSound.currentTime = 0;
  keypressCorrectSound.play().catch(() => { });

  rebindingKey = null;
}

function handleGameplayKeydown(event) {
  if (sessionEnded) return;

  if (event.target instanceof HTMLElement && event.target.closest("input[name='mode-option']")) {
    return;
  }

  const pressed = normalizeKeyValue(event.key);
  const k1 = normalizeKeyValue(key1);
  const k2 = normalizeKeyValue(key2);

  if (pressed !== k1 && pressed !== k2) return;

  event.preventDefault();

  if (mode === "time" && !sessionStarted) {
    startTimeSession();
  }

  if (heldKeys.has(pressed)) return;
  heldKeys.add(pressed);

  const cls = pressed === lastPressed ? "wrong" : "correct";
  lastPressed = pressed;

  const sound = cls === "correct" ? keypressCorrectSound : keypressWrongSound;
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(() => { });
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
}

/* Mode selection wiring */
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

/* UI refresh */
output.addEventListener("scroll", () => {
  updateOverflowClasses();
  updatePlaceholder();
});

window.addEventListener("resize", () => {
  updateOverflowClasses();
  updatePlaceholder();
});

updateOverflowClasses();
updatePlaceholder();
startSession();

/* Input handling */
window.addEventListener("keydown", (event) => {
  if (rebindingKey) {
    handleRebindingKeydown(event);
    return;
  }

  handleGameplayKeydown(event);
});

window.addEventListener("keyup", (event) => {
  const key = normalizeKeyValue(event.key);
  if (heldKeys.has(key)) heldKeys.delete(key);
});

document.addEventListener("click", (event) => {
  if (!rebindingKey) return;

  const button = getBindingButton(rebindingKey);
  if (button && event.target instanceof Node && button.contains(event.target)) return;

  cancelRebinding();
});