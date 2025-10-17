const canvas = document.getElementById('chaosCanvas');
const ctx = canvas.getContext('2d');
const infoContainer = document.getElementById('infoContainer');
const fractName = document.getElementById('fractName');
const fractDesc = document.getElementById('fractDesc');
const formulasDiv = document.getElementById('formulas');
const tabContainer = document.getElementById('tabContainer');

let fractals = [];
let currentFractal = null;
let animationId;

// Load JSON file
fetch('fractals.json')
  .then(res => res.json())
  .then(data => {
    fractals = data.fractals;
    createTabs();
    loadFractal(fractals[0]);
  });

// Create scrollable tabs
function createTabs() {
  fractals.forEach(fractal => {
    const tab = document.createElement('div');
    tab.textContent = fractal.name;
    tab.classList.add('tab');
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadFractal(fractal);
    });
    tabContainer.appendChild(tab);
  });
  tabContainer.firstChild.classList.add('active');
}

// Load fractal info + draw
function loadFractal(fractal) {
  cancelAnimationFrame(animationId);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  currentFractal = fractal;

  fractName.textContent = fractal.name;
  fractDesc.textContent = fractal.description;
  formulasDiv.innerHTML = fractal.formulas
    .map(f => `<code>${f}</code>`)
    .join('<br>');

  if (fractal.id === 'fern') drawFern();
  else drawChaosGame(fractal);
}

// === CHAOS GAME (triangle/square) ===
function drawChaosGame(fractal) {
  const { vertices } = fractal;
  const width = canvas.width;
  const height = canvas.height;

  const points = vertices.map(v => ({
    x: v.xRatio * width,
    y: v.yRatio * height
  }));

  let p = { x: Math.random() * width, y: Math.random() * height };

  function drawStep() {
    for (let i = 0; i < 1000; i++) {
      const target = points[Math.floor(Math.random() * points.length)];
      p.x = (p.x + target.x) / 2;
      p.y = (p.y + target.y) / 2;
      ctx.fillStyle = '#66fcf1';
      ctx.fillRect(p.x, p.y, 1, 1);
    }
    animationId = requestAnimationFrame(drawStep);
  }

  points.forEach(v => {
    ctx.fillStyle = '#45a29e';
    ctx.fillRect(v.x, v.y, 2, 2);
  });

  drawStep();
}

// === BARNSLEY FERN ===
function drawFern() {
  let x = 0, y = 0;

  function iterate() {
    for (let i = 0; i < 2000; i++) {
      const r = Math.random();
      let nextX, nextY;

      if (r < 0.01) {
        nextX = 0;
        nextY = 0.16 * y;
      } else if (r < 0.86) {
        nextX = 0.85 * x + 0.04 * y;
        nextY = -0.04 * x + 0.85 * y + 1.6;
      } else if (r < 0.93) {
        nextX = 0.20 * x - 0.26 * y;
        nextY = 0.23 * x + 0.22 * y + 1.6;
      } else {
        nextX = -0.15 * x + 0.28 * y;
        nextY = 0.26 * x + 0.24 * y + 0.44;
      }

      x = nextX;
      y = nextY;
      const px = canvas.width / 2 + x * 50;
      const py = canvas.height - y * 50;
      ctx.fillStyle = '#66fcf1';
      ctx.fillRect(px, py, 1, 1);
    }
    animationId = requestAnimationFrame(iterate);
  }

  iterate();
}
