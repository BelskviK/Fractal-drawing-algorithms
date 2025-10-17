const canvas = document.getElementById('chaosCanvas');
const ctx = canvas.getContext('2d');
const speedBtn = document.getElementById('speedBtn');
const width = canvas.width;
const height = canvas.height;

let speedLevel = 1; // range 0–10
let intervalId;

// Define triangle vertices
const vertices = [
  { x: width / 2, y: 20 },        // top
  { x: 20, y: height - 20 },      // bottom-left
  { x: width - 20, y: height - 20 } // bottom-right
];

// Start with a random point
let point = randomPoint();

function randomPoint() {
  return { x: Math.random() * width, y: Math.random() * height };
}

function drawPoint(x, y, color = '#66fcf1') {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function drawVertices() {
  vertices.forEach(v => drawPoint(v.x, v.y, '#45a29e'));
}

function resetCanvas() {
  ctx.clearRect(0, 0, width, height);
  drawVertices();
  point = randomPoint();
}

function chaosGameStep() {
  for (let i = 0; i < 500; i++) {
    const target = vertices[Math.floor(Math.random() * 3)];
    point.x = (point.x + target.x) / 2;
    point.y = (point.y + target.y) / 2;
    drawPoint(point.x, point.y);
  }
}

function startChaosGame() {
  clearInterval(intervalId);

  const delay = speedLevel * 1000; // 0–10 sec delay
  if (delay === 0) {
    // Fast mode (continuous)
    function loop() {
      chaosGameStep();
      requestAnimationFrame(loop);
    }
    loop();
  } else {
    intervalId = setInterval(chaosGameStep, delay);
  }
}

speedBtn.addEventListener('click', () => {
  speedLevel = (speedLevel + 1) % 11; // loop 0–10
  speedBtn.textContent = `Speed: ${speedLevel}x`;
  resetCanvas();
  startChaosGame();
});

// Initial draw
drawVertices();
startChaosGame();                                    vertices.forEach(v => drawPoint(v.x, v.y, '#45a29e'));

                                    // Start animation
                                    chaosGame();
