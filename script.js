const canvas = document.getElementById('chaosCanvas');
const ctx = canvas.getContext('2d');
const fractName = document.getElementById('fractName');
const fractDesc = document.getElementById('fractDesc');
const formulasDiv = document.getElementById('formulas');
const tabContainer = document.getElementById('tabContainer');

// Global variables
let fractals = [];
let animationId = null;
let currentFractal = null;

// Set canvas size
function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  
  // Redraw current fractal if canvas resizes
  if (currentFractal) {
    loadFractal(currentFractal);
  }
}

// Initialize app
async function init() {
  try {
    // Load fractal data from JSON
    const response = await fetch('fractals.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    fractals = data.fractals;
    
    // Set up event listeners
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Create UI
    createTabs();
    loadFractal(fractals[0]);
    
  } catch (error) {
    console.error('Failed to load fractals:', error);
    alert('Failed to load fractal data. Please make sure fractals.json is available.');
  }
}

// Create tabs dynamically from JSON data
function createTabs() {
  tabContainer.innerHTML = ''; // Clear existing tabs
  
  fractals.forEach(fractal => {
    const tab = document.createElement('div');
    tab.textContent = fractal.name;
    tab.classList.add('tab');
    tab.setAttribute('data-fractal-id', fractal.id);
    
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadFractal(fractal);
    });
    
    tabContainer.appendChild(tab);
  });
  
  // Activate first tab
  if (tabContainer.firstChild) {
    tabContainer.firstChild.classList.add('active');
  }
}

// Load and draw fractal based on JSON rules
function loadFractal(fractal) {
  try {
    // Stop any running animation
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update info panel
    fractName.textContent = fractal.name;
    fractDesc.textContent = fractal.description;
    formulasDiv.innerHTML = fractal.formulas.map(f => `<code>${f}</code>`).join('');
    
    currentFractal = fractal;
    
    // Route to appropriate drawing function based on type from JSON
    switch (fractal.type) {
      case "chaosGame":
        drawChaosGame(fractal);
        break;
      case "chaosAffine":
        drawAffineChaos(fractal);
        break;
      default:
        throw new Error(`Unknown fractal type: ${fractal.type}`);
    }
    
  } catch (error) {
    console.error('Error loading fractal:', error);
    alert(`Error drawing ${fractal.name}: ${error.message}`);
  }
}

// Generic Chaos Game drawer - uses rules from JSON
function drawChaosGame(fractal) {
  const w = canvas.width, h = canvas.height;
  
  // Convert ratio coordinates to pixel coordinates
  const vertices = fractal.vertices.map(v => ({
    x: v.xRatio * w,
    y: v.yRatio * h
  }));
  
  // Initial random point
  let currentPoint = { 
    x: Math.random() * w, 
    y: Math.random() * h 
  };
  
  let lastVertexIndex = -1;
  const ratio = fractal.ratio || 0.5; // Default to 0.5 if not specified
  
  // Draw vertex markers
  vertices.forEach(vertex => {
    ctx.fillStyle = '#45a29e';
    ctx.fillRect(vertex.x - 2, vertex.y - 2, 4, 4);
  });

  function iterate() {
    const iterationsPerFrame = 500; // Performance tuning
    
    for (let i = 0; i < iterationsPerFrame; i++) {
      let vertexIndex;
      
      // Apply restrictions from JSON rules
      if (fractal.skipRepeat) {
        // Cannot choose same vertex twice in a row
        do {
          vertexIndex = Math.floor(Math.random() * vertices.length);
        } while (vertexIndex === lastVertexIndex);
      } else if (fractal.skipAdjacent) {
        // Cannot choose adjacent vertices (for crystal growth)
        do {
          vertexIndex = Math.floor(Math.random() * vertices.length);
        } while (
          Math.abs(vertexIndex - lastVertexIndex) <= 1 || 
          Math.abs(vertexIndex - lastVertexIndex) >= vertices.length - 1
        );
      } else {
        // No restrictions - random choice
        vertexIndex = Math.floor(Math.random() * vertices.length);
      }
      
      lastVertexIndex = vertexIndex;
      const targetVertex = vertices[vertexIndex];
      
      // Move toward target vertex using ratio from JSON
      currentPoint.x = currentPoint.x * (1 - ratio) + targetVertex.x * ratio;
      currentPoint.y = currentPoint.y * (1 - ratio) + targetVertex.y * ratio;
      
      // Color based on vertex for visual variety
      const hue = (vertexIndex / vertices.length) * 360;
      ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
      ctx.fillRect(currentPoint.x, currentPoint.y, 1, 1);
    }
    
    animationId = requestAnimationFrame(iterate);
  }
  
  iterate();
}

// Generic Affine Chaos drawer - uses rules from JSON
function drawAffineChaos(fractal) {
  const rules = fractal.affineRules;
  let x = 0, y = 0;
  let colorCycle = 0;
  
  // Validate rules have probabilities that sum to ~1
  const totalProbability = rules.reduce((sum, rule) => sum + rule.p, 0);
  if (Math.abs(totalProbability - 1) > 0.01) {
    console.warn(`Probabilities sum to ${totalProbability}, expected ~1`);
  }

  function iterate() {
    const iterationsPerFrame = 1000;
    
    for (let i = 0; i < iterationsPerFrame; i++) {
      const randomValue = Math.random();
      let probabilitySum = 0;
      let selectedRule = rules[rules.length - 1]; // Default to last rule
      
      // Select rule based on probability from JSON
      for (const rule of rules) {
        probabilitySum += rule.p;
        if (randomValue <= probabilitySum) {
          selectedRule = rule;
          break;
        }
      }
      
      // Apply affine transformation from JSON rules
      const newX = selectedRule.a * x + selectedRule.b * y + selectedRule.e;
      const newY = selectedRule.c * x + selectedRule.d * y + selectedRule.f;
      
      x = newX;
      y = newY;
      
      // Convert to canvas coordinates
      const pixelX = canvas.width / 2 + x * canvas.height / 10;
      const pixelY = canvas.height - y * canvas.height / 10;
      
      // Animate colors for visual appeal
      colorCycle = (colorCycle + 0.05) % 360;
      ctx.fillStyle = `hsl(${colorCycle}, 85%, 60%)`;
      ctx.fillRect(pixelX, pixelY, 1, 1);
    }
    
    animationId = requestAnimationFrame(iterate);
  }
  
  iterate();
}

// Utility function to stop all animations
function stopAnimations() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

// Clean up on page unload
window.addEventListener('beforeunload', stopAnimations);

// Start the application
init();
