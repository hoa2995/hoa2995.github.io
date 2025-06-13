// Snowfall effect
document.addEventListener("DOMContentLoaded", function() {
  // Generate snowflakes for the snowfall-container
  const snowfallContainer = document.getElementById("snowfall-container");
  const snowflakeCount = 70; // Number of snowflakes
  
  // Create snowflakes
  for (let i = 0; i < snowflakeCount; i++) {
    createSnowflake();
  }
  
  // Function to create a single snowflake
  function createSnowflake() {
    const snowflake = document.createElement("div");
    snowflake.className = "snowflake";
    snowflake.innerHTML = "❄"; // Unicode snowflake character
    
    // Random snowflake properties
    const size = Math.random() * 15 + 10; // Larger size
    const startPositionX = Math.random() * window.innerWidth;
    const duration = Math.random() * 15 + 8; // Slower falling for better effect
    const delay = Math.random() * 5;
    
    // Apply styles
    snowflake.style.fontSize = `${size}px`;
    snowflake.style.left = `${startPositionX}px`;
    snowflake.style.top = `-20px`;
    snowflake.style.animationName = "snowfall";
    snowflake.style.animationDuration = `${duration}s`;
    snowflake.style.animationDelay = `${delay}s`;
    snowflake.style.animationIterationCount = "infinite";
    snowflake.style.animationTimingFunction = "linear";
    
    // Add to container
    snowfallContainer.appendChild(snowflake);
  }
  
  // Also animate the SVG snowflakes in the snowflake-container
  const svgSnowflakes = document.querySelectorAll('.snowflake-container .snowflake');
  svgSnowflakes.forEach((snowflake, index) => {
    const size = Math.random() * 15 + 10;
    const startPositionX = Math.random() * window.innerWidth;
    const duration = Math.random() * 15 + 8;
    const delay = Math.random() * 5;
    
    snowflake.style.width = `${size}px`;
    snowflake.style.height = `${size}px`;
    snowflake.style.left = `${startPositionX}px`;
    snowflake.style.top = `-20px`;
    snowflake.style.animationDuration = `${duration}s`;
    snowflake.style.animationDelay = `${delay}s`;
  });
});
