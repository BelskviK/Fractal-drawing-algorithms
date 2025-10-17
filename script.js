const canvas = document.getElementById('chaosCanvas');
const ctx = canvas.getContext('2d');
const fractName = document.getElementById('fractName');
const fractDesc = document.getElementById('fractDesc');
const formulasDiv = document.getElementById('formulas');
const tabContainer = document.getElementById('tabContainer');
const logo = document.getElementById('logo');

canvas.width = 500;
canvas.height = 500;
let fractals = [];
let animationId = null;

logo.addEventListener('click', () => location.reload());

// Load JSON
fetch('fractals.json')
  .then(r => r.json())
  .then(data => {
    fractals = data.fractals;
    createTabs();
    loadFractal(fractals[0]);
  })
  .catch(err => alert("Failed to load fractals.json: " + err.message));

// Create tabs dynamically
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

// Load and draw fractal
function loadFractal(fractal) {
  try {
    cancelAnimationFrame(animationId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fractName.textContent = fractal.name;
    fractDesc.textContent = fractal.description;
    formulasDiv.innerHTML = fractal.formulas.map(f => `<code>${f}</code>`).join('');

    if (fractal.type === "chaosGame") drawChaosGame(fractal);
    else if (fractal.type === "chaosAffine") drawAffine(fractal);
    else alert("Unsupported fractal type: " + fractal.type);
  } catch (err) {
    alert("Error drawing fractal: " + err.message);
  }
}

// === Chaos Game ===
function drawChaosGame(fractal) {
  const w = canvas.width, h = canvas.height;
  const points = fractal.vertices.map(v => ({ x: v.xRatio * w, y: v.yRatio * h }));
  let p = { x: Math.random() * w, y: Math.random() * h };
  let last = -1;
  const ratio = fractal.ratio || 0.5;

  function step() {
    try {
      for (let i = 0; i < 1000; i++) {
        let idx;
        do { idx = Math.floor(Math.random() * points.length); }
        while (fractal.skipRepeat && idx === last);
        last = idx;

        const t = points[idx];
        p.x = (p.x * (1 - ratio)) + (t.x * ratio);
        p.y = (p.y * (1 - ratio)) + (t.y * ratio);

        ctx.fillStyle = '#66fcf1';
        ctx.fillRect(p.x, p.y, 1, 1);
      }
      animationId = requestAnimationFrame(step);
    } catch (err) {
      alert("Chaos drawing failed: " + err.message);
    }
  }
  step();
}

// === Chaos Affine (Fern) ===
function drawAffine(fractal) {
  const rules = fractal.affineRules;
  let x = 0, y = 0;
  function iter() {
    try {
      for (let i = 0; i < 2000; i++) {
        const r = Math.random();
        let sum = 0;
        let rule = rules.find(rule => (sum += rule.p) >= r);
        const nx = rule.a * x + rule.b * y + rule.e;
        const ny = rule.c * x + rule.d * y + rule.f;
        x = nx; y = ny;
        ctx.fillStyle = '#66fcf1';
        const px = canvas.width / 2 + x * 50;
        const py = canvas.height - y * 50;
        ctx.fillRect(px, py, 1, 1);
      }
      animationId = requestAnimationFrame(iter);
    } catch (err) {
      alert("Affine chaos failed: " + err.message);
    }
  }
  iter();
}    y: v.yRatio * height
  }));
  let p = { x: Math.random() * width, y: Math.random() * height };
  let last = -1;

  points.forEach(v => {
    ctx.fillStyle = '#45a29e';
    ctx.fillRect(v.x - 1, v.y - 1, 3, 3);
  });

  function step() {
    for (let i = 0; i < 1000; i++) {
      let idx;
      do { idx = Math.floor(Math.random() * points.length); }
      while (fractal.id === 'square' && idx === last);
      last = idx;
      const t = points[idx];
      p.x = (p.x + t.x) / 2;
      p.y = (p.y + t.y) / 2;
      ctx.fillStyle = '#66fcf1';
      ctx.fillRect(p.x, p.y, 1, 1);
    }
    animationId = requestAnimationFrame(step);
  }
  step();
}

// === Barnsley Fern ===
function drawFern() {
  let x = 0, y = 0;
  function iter() {
    for (let i = 0; i < 2000; i++) {
      const r = Math.random();
      let nx, ny;
      if (r < 0.01) { nx = 0; ny = 0.16 * y; }
      else if (r < 0.86) { nx = 0.85 * x + 0.04 * y; ny = -0.04 * x + 0.85 * y + 1.6; }
      else if (r < 0.93) { nx = 0.20 * x - 0.26 * y; ny = 0.23 * x + 0.22 * y + 1.6; }
      else { nx = -0.15 * x + 0.28 * y; ny = 0.26 * x + 0.24 * y + 0.44; }
      x = nx; y = ny;
      ctx.fillStyle = '#66fcf1';
      ctx.fillRect(canvas.width/2 + x*50, canvas.height - y*50, 1, 1);
    }
    animationId = requestAnimationFrame(iter);
  }
  iter();
}

// === Koch Snowflake ===
function drawKochSnowflake(iter = 4) {
  function koch(p1, p2, n) {
    if (n === 0) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      return;
    }
    const dx = (p2.x - p1.x) / 3;
    const dy = (p2.y - p1.y) / 3;
    const a = { x: p1.x + dx, y: p1.y + dy };
    const b = { x: p1.x + 2 * dx, y: p1.y + 2 * dy };
    const angle = Math.PI / 3;
    const cx = a.x + Math.cos(angle) * dx - Math.sin(angle) * dy;
    const cy = a.y + Math.sin(angle) * dx + Math.cos(angle) * dy;
    const c = { x: cx, y: cy };
    koch(p1, a, n - 1);
    koch(a, c, n - 1);
    koch(c, b, n - 1);
    koch(b, p2, n - 1);
  }
  ctx.strokeStyle = '#66fcf1';
  const p1 = { x: 100, y: 400 }, p2 = { x: 400, y: 400 }, p3 = { x: 250, y: 400 - Math.sqrt(3)*150 };
  koch(p1, p2, iter);
  koch(p2, p3, iter);
  koch(p3, p1, iter);
}

// === Dragon Curve ===
function drawDragonCurve() {
  let points = [{x:250,y:250},{x:350,y:250}];
  ctx.strokeStyle = '#66fcf1';
  for(let i=0;i<14;i++){
    const newPts=[];
    for(let j=0;j<points.length-1;j++){
      const a=points[j],b=points[j+1];
      const mid={x:(a.x+b.x)/2+(b.y-a.y)/2,y:(a.y+b.y)/2-(b.x-a.x)/2};
      newPts.push(a,mid);
    }
    newPts.push(points[points.length-1]);
    points=newPts;
  }
  ctx.beginPath();
  for(let i=0;i<points.length-1;i++){ctx.moveTo(points[i].x,points[i].y);ctx.lineTo(points[i+1].x,points[i+1].y);}
  ctx.stroke();
}

// === Pythagoras Tree ===
function drawPythagorasTree(x=250,y=450,size=60,angle=-Math.PI/2,depth=8){
  if(depth===0)return;
  const x1=x+Math.cos(angle)*size;
  const y1=y+Math.sin(angle)*size;
  ctx.strokeStyle='#66fcf1';
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x1,y1);ctx.stroke();
  drawPythagorasTree(x1,y1,size*0.7,angle-Math.PI/6,depth-1);
  drawPythagorasTree(x1,y1,size*0.7,angle+Math.PI/6,depth-1);
}

// === Hilbert Curve (recursive) ===
function drawHilbertCurve(order=5){    }
    animationId = requestAnimationFrame(drawStep);
  }

  // Draw vertices
  points.forEach(v => {
    ctx.fillStyle = '#45a29e';
    ctx.fillRect(v.x - 1, v.y - 1, 3, 3);
  });

  drawStep();
}

// === Barnsley Fern fractal ===
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
