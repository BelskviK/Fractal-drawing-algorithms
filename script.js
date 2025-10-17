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
  let currentPoint = getBetterStartPoint(vertices, w, h);
  
  let lastVertexIndex = -1;
  const ratio = fractal.ratio || 0.5; // Default to 0.5 if not specified
  
  // Draw vertex markers with improved styling
  vertices.forEach((vertex, index) => {
    ctx.fillStyle = '#45a29e';
    ctx.beginPath();
    ctx.arc(vertex.x, vertex.y, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Add vertex numbers for debugging
    ctx.fillStyle = '#66fcf1';
    ctx.font = '12px Arial';
    ctx.fillText(index + 1, vertex.x + 6, vertex.y + 4);
  });

  function iterate() {
    const iterationsPerFrame = fractal.id === 'sierpinski_carpet' ? 200 : 500;
    
    for (let i = 0; i < iterationsPerFrame; i++) {
      let vertexIndex;
      let attempts = 0;
      const maxAttempts = 100;
      
      // Apply restrictions from JSON rules with proper fallbacks
      do {
        vertexIndex = Math.floor(Math.random() * vertices.length);
        attempts++;
        
        if (attempts > maxAttempts) {
          break;
        }
        
      } while (!isValidVertexChoice(vertexIndex, lastVertexIndex, fractal, vertices.length));
      
      lastVertexIndex = vertexIndex;
      const targetVertex = vertices[vertexIndex];
      
      // Apply special transformations for certain fractals
      if (fractal.id === 'koch') {
        applyKochTransformation(currentPoint, targetVertex, vertexIndex, ratio);
      } else {
        // Standard chaos game movement
        currentPoint.x = currentPoint.x * (1 - ratio) + targetVertex.x * ratio;
        currentPoint.y = currentPoint.y * (1 - ratio) + targetVertex.y * ratio;
      }
      
      // Apply Sierpinski carpet center skipping
      if (fractal.skipCenter && isInCenterRegion(currentPoint, w, h)) {
        continue;
      }
      
      // Enhanced coloring based on fractal type and position
      const color = getPointColor(fractal, vertexIndex, vertices.length, currentPoint, w, h);
      ctx.fillStyle = color;
      ctx.fillRect(currentPoint.x, currentPoint.y, 1, 1);
    }
    
    animationId = requestAnimationFrame(iterate);
  }
  
  iterate();
}

// Helper function to validate vertex choices based on fractal rules
function isValidVertexChoice(currentIndex, lastIndex, fractal, totalVertices) {
  if (lastIndex === -1) return true;
  
  if (fractal.skipRepeat) {
    return currentIndex !== lastIndex;
  }
  
  if (fractal.skipAdjacent) {
    const diff = Math.abs(currentIndex - lastIndex);
    return diff > 1 && diff < totalVertices - 1;
  }
  
  if (fractal.skipOpposite) {
    const oppositeIndex = (lastIndex + Math.floor(totalVertices / 2)) % totalVertices;
    return currentIndex !== oppositeIndex;
  }
  
  if (fractal.skipCenter) {
    return true;
  }
  
  return true;
}

// Special transformation for Koch snowflake
function applyKochTransformation(currentPoint, targetVertex, vertexIndex, ratio) {
  const angle = (vertexIndex / 6) * Math.PI * 2;
  currentPoint.x = currentPoint.x + (targetVertex.x - currentPoint.x) * ratio;
  currentPoint.y = currentPoint.y + (targetVertex.y - currentPoint.y) * ratio;
}

// Check if point is in center region (for Sierpinski carpet)
function isInCenterRegion(point, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  const regionSize = Math.min(width, height) / 3;
  
  return (
    point.x > centerX - regionSize / 2 &&
    point.x < centerX + regionSize / 2 &&
    point.y > centerY - regionSize / 2 &&
    point.y < centerY + regionSize / 2
  );
}

// Enhanced coloring system
function getPointColor(fractal, vertexIndex, totalVertices, point, width, height) {
  const baseHue = (vertexIndex / totalVertices) * 360;
  
  switch (fractal.id) {
    case 'triangle':
      return `hsl(${baseHue}, 85%, 60%)`;
    case 'square':
      return `hsl(${140 + vertexIndex * 20}, 90%, 65%)`;
    case 'pentagon':
    case 'spiral':
      const goldenHue = (point.x / width) * 360;
      return `hsl(${goldenHue}, 80%, 60%)`;
    case 'crystal':
      return `hsl(${200 + vertexIndex * 10}, 85%, 65%)`;
    case 'hexagon':
      return `hsl(${baseHue}, 75%, 55%)`;
    case 'dragon':
      return `hsl(${30 + vertexIndex * 15}, 95%, 60%)`;
    case 'koch':
      return `hsl(${180 + vertexIndex * 5}, 70%, 70%)`;
    case 'sierpinski_carpet':
      const carpetHue = ((point.x + point.y) / (width + height)) * 360;
      return `hsl(${carpetHue}, 80%, 50%)`;
    default:
      return `hsl(${baseHue}, 80%, 60%)`;
  }
}

// Better random point generation
function getBetterStartPoint(vertices, width, height) {
  if (vertices.length >= 3) {
    const centerX = vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length;
    const centerY = vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length;
    return {
      x: centerX + (Math.random() - 0.5) * width * 0.1,
      y: centerY + (Math.random() - 0.5) * height * 0.1
    };
  }
  
  return {
    x: Math.random() * width,
    y: Math.random() * height
  };
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
      let selectedRule = rules[rules.length - 1];
      
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
