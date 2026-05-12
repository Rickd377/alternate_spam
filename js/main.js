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
  });
});

const output = document.querySelector(".output");

let key1 = "arrowup" ;
let key2 = "w";
let lastPressed = null;
const heldKeys = new Set();

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

window.addEventListener("keydown", (e) => {
  const pressed = (e.key || '').toLowerCase();
  const k1 = key1.toLowerCase();
  const k2 = key2.toLowerCase();

  if (pressed !== k1 && pressed !== k2) return;

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
  updateOverflowClasses();
  updatePlaceholder();
});

window.addEventListener("keyup", (e) => {
  const key = (e.key || '').toLowerCase();
  if (heldKeys.has(key)) heldKeys.delete(key);
});