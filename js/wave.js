const canvas = document.querySelector(".wave-simulator");
const ctx = canvas.getContext("2d");
const dpr = window.devicePixelRatio || 1;

canvas.width = 700 * dpr;
canvas.height = 200 * dpr;
ctx.scale(dpr, dpr);

let playerPosX = 150;
let playerPosY = 100;

function drawPlayer(x, y, r) {
  ctx.strokeStyle = "red";
  ctx.lineWidth = 5;
  ctx.fillStyle = "orange"; 
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function draw() {
  drawPlayer(playerPosX, playerPosY, 15);
}

function animate() {
  draw();
  requestAnimationFrame(animate);
}

animate();