function updateCountdown() {
  const now = new Date();
  const newYear = new Date('2025-01-01T00:00:00');
  const diff = newYear - now;

  if (diff <= 0) {
    document.getElementById('countdown').textContent = 'Happy New Year 2025!';
    setTimeout(() => {
      window.location.href = 'happy.html';
    }, 3000);
    return;
  }

  const hours = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
  const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
  const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');

  document.getElementById('countdown').textContent = `Time remaining: ${hours}:${minutes}:${seconds}`;
}

updateCountdown();
setInterval(updateCountdown, 1000); 