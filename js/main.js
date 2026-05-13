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
const outputWrapper = document.querySelector(".output-wrapper");
const nextKeyEl = document.querySelector(".next-key");
const counterEl = document.querySelector(".counter");

let key1 = localStorage.getItem("key1") || "arrowup";
let key2 = localStorage.getItem("key2") || "w";
let lastPressed = null;
const heldKeys = new Set();
let sessionRemaining = 0;
let sessionEnded = false;
let sessionTimerId = null;
let sessionStarted = false;
let rebindingKey = null;

function normalizeKeyValue(key) {
  if (key === ' ') return 'space';
  return (key || '').toLowerCase();
}

function formatKeyLabel(key) {
  return normalizeKeyValue(key).replace(/-/g, " ");
}

function restoreRebindingLabel(bindingKey) {
  const buttonId = bindingKey === 'key1' ? '#kbd1' : '#kbd2';
  const button = document.querySelector(buttonId);
  if (!button) return;

  const currentKey = bindingKey === 'key1' ? key1 : key2;
  button.textContent = formatKeyLabel(currentKey);
}

function startRebinding(bindingKey, button) {
  if (rebindingKey && rebindingKey !== bindingKey) {
    restoreRebindingLabel(rebindingKey);
  }

  rebindingKey = bindingKey;
  button.textContent = '...';
}

function updateNextKeyDisplay() {
  if (!nextKeyEl) return;

  const nextKey = lastPressed === normalizeKeyValue(key1) ? key2 : key1;
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

function endSession() {
  if (sessionEnded) return;

  sessionEnded = true;

  if (sessionTimerId) {
    clearInterval(sessionTimerId);
    sessionTimerId = null;
  }

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
      el.innerHTML = `start spamming with <button id="kbd1">${formatKeyLabel(key1)}</button> + <button id="kbd2">${formatKeyLabel(key2)}</button> at any time...`;
      output.appendChild(el);
      
      el.querySelector('#kbd1')?.addEventListener('click', (e) => {
        if (e.detail === 0) return;
        e.preventDefault();
        tapSound.currentTime = 0;
        tapSound.play().catch(() => { });
        if (e.target instanceof HTMLElement) {
          startRebinding('key1', e.target);
        }
      });
      el.querySelector('#kbd2')?.addEventListener('click', (e) => {
        if (e.detail === 0) return;
        e.preventDefault();
        tapSound.currentTime = 0;
        tapSound.play().catch(() => { });
        if (e.target instanceof HTMLElement) {
          startRebinding('key2', e.target);
        }
      });
    }
  } else if (placeholder) {
    placeholder.remove();
    rebindingKey = null;
  }
}

output.addEventListener("scroll", () => { updateOverflowClasses(); updatePlaceholder(); });
window.addEventListener("resize", () => { updateOverflowClasses(); updatePlaceholder(); });

updateOverflowClasses();
updatePlaceholder();
startSession();

window.addEventListener("keydown", (e) => {
  if (rebindingKey) {
    const newKey = normalizeKeyValue(e.key);
    const buttonId = rebindingKey === 'key1' ? '#kbd1' : '#kbd2';
    const button = document.querySelector(buttonId);
    e.preventDefault();
    e.stopPropagation();
    
    if (rebindingKey === 'key1') {
      key1 = newKey;
      localStorage.setItem('key1', key1);
    } else if (rebindingKey === 'key2') {
      key2 = newKey;
      localStorage.setItem('key2', key2);
    }
    
    if (button) {
      button.textContent = formatKeyLabel(newKey);
    }

    updateNextKeyDisplay();

    keypressCorrectSound.currentTime = 0;
    keypressCorrectSound.play().catch(() => { });

    rebindingKey = null;
    return;
  }

  if (sessionEnded) return;

  if (e.target instanceof HTMLElement && e.target.closest("input[name='mode-option']")) {
    return;
  }

  const pressed = normalizeKeyValue(e.key);
  const k1 = normalizeKeyValue(key1);
  const k2 = normalizeKeyValue(key2);

  if (pressed !== k1 && pressed !== k2) return;

  e.preventDefault();

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
  const key = normalizeKeyValue(e.key);
  if (heldKeys.has(key)) heldKeys.delete(key);
});

document.addEventListener("click", (e) => {
  if (!rebindingKey) return;

  const buttonId = rebindingKey === 'key1' ? '#kbd1' : '#kbd2';
  const button = document.querySelector(buttonId);
  if (button && e.target instanceof Node && button.contains(e.target)) return;

  restoreRebindingLabel(rebindingKey);
  rebindingKey = null;
});