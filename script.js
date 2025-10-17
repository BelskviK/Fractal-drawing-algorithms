const canvas = document.getElementById('chaosCanvas');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

// Define triangle vertices
const vertices = [
  { x: width / 2, y: 20 },        // top
    { x: 20, y: height - 20 },      // bottom-left
      { x: width - 20, y: height - 20 } // bottom-right
      ];

      // Start with a random point
      let point = {
        x: Math.random() * width,
          y: Math.random() * height
          };

          // Draw a point
          function drawPoint(x, y, color = '#66fcf1') {
            ctx.fillStyle = color;
              ctx.fillRect(x, y, 1, 1);
              }

              // Chaos game logic
              function chaosGame() {
                for (let i = 0; i < 1000; i++) {
                    const target = vertices[Math.floor(Math.random() * 3)];
                        point.x = (point.x + target.x) / 2;
                            point.y = (point.y + target.y) / 2;
                                drawPoint(point.x, point.y);
                                  }
                                    requestAnimationFrame(chaosGame);
                                    }

                                    // Draw vertices
                                    vertices.forEach(v => drawPoint(v.x, v.y, '#45a29e'));

                                    // Start animation
                                    chaosGame();