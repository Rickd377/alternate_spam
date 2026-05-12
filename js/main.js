let mode = localStorage.getItem("mode") || "time";
let selectedOption = localStorage.getItem("selectedOption") || "5s";

const tapSound = new Audio("../assets/sfx/tap.mp3");

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

output.addEventListener("scroll", updateOverflowClasses);
window.addEventListener("resize", updateOverflowClasses);

updateOverflowClasses();

window.addEventListener("keydown", () => {
  const el = document.createElement("div");
  el.className = "el correct";
  output.appendChild(el);
  updateOverflowClasses();
});

window.addEventListener("keyup", () => {

});