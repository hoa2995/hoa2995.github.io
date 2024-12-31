const canvas = document.getElementById('fireworks');
const ctx = canvas.getContext('2d');
const launchSound = document.getElementById('launch');
const explosionSound = document.getElementById('explosion');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const launchSounds = [
    document.getElementById('launch1'),
    document.getElementById('launch2'),
    document.getElementById('launch3'),
    document.getElementById('launch4'),
    document.getElementById('launch5')
];

function getRandomSound() {
    return launchSounds[Math.floor(Math.random() * launchSounds.length)];
}

function playSound(audio) {
    const sound = audio.cloneNode();
    sound.volume = 0.3;
    sound.play();
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

class Firework {
    constructor() {
        this.reset();
        this.trail = [];
        this.type = Math.floor(Math.random() * 5);
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height;
        this.targetY = canvas.height * 0.15 + (Math.random() * canvas.height * 0.3);
        this.speed = Math.random() * 5 + 8;
        this.particles = [];
        this.trail = [];
        this.exploded = false;
        this.hue = Math.random() * 360;
        this.type = Math.floor(Math.random() * 5);
    }

    update() {
        if (!this.exploded) {
            this.trail.push({ x: this.x, y: this.y, alpha: 1 });
            if (this.trail.length > 5) this.trail.shift();
            
            if (this.y === canvas.height) {
                playSound(getRandomSound());
            }
            this.y -= this.speed;
            
            this.x += Math.random() * 2 - 1;
            
            if (this.y <= this.targetY) {
                this.explode();
            }
        }
        
        this.trail.forEach(dot => dot.alpha -= 0.1);
        this.trail = this.trail.filter(dot => dot.alpha > 0);
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }

        if (this.exploded && this.particles.length === 0) {
            this.reset();
        }
    }

    explode() {
        this.exploded = true;
        playSound(getRandomSound());
        
        switch(this.type) {
            case 0:
                this.createCircleExplosion();
                break;
            case 1:
                this.createHeartExplosion();
                break;
            case 2:
                this.createSpiralExplosion();
                break;
            case 3:
                this.createRingExplosion();
                break;
            case 4:
                this.createStarExplosion();
                break;
        }
    }

    createCircleExplosion() {
        const particleCount = Math.random() * 100 + 200;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i * Math.PI * 2) / particleCount;
            this.particles.push(new Particle(this.x, this.y, this.hue, angle));
        }
    }

    createHeartExplosion() {
        const particleCount = 200;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i * Math.PI * 2) / particleCount;
            const heartRadius = Math.sin(angle) * Math.sqrt(Math.abs(Math.cos(angle)));
            const velocityX = heartRadius * Math.cos(angle) * 6;
            const velocityY = heartRadius * Math.sin(angle) * 6;
            this.particles.push(new Particle(this.x, this.y, this.hue, angle, velocityX, velocityY));
        }
    }

    createSpiralExplosion() {
        const arms = 6;
        const particlesPerArm = 50;
        for (let arm = 0; arm < arms; arm++) {
            for (let i = 0; i < particlesPerArm; i++) {
                const angle = (arm * Math.PI * 2) / arms + (i * 0.1);
                const velocity = 1 + i * 0.1;
                this.particles.push(new Particle(this.x, this.y, this.hue, angle, Math.cos(angle) * velocity, Math.sin(angle) * velocity));
            }
        }
    }

    createRingExplosion() {
        const rings = 4;
        for (let ring = 0; ring < rings; ring++) {
            const particleCount = 100;
            const velocity = 2 + ring * 2;
            for (let i = 0; i < particleCount; i++) {
                const angle = (i * Math.PI * 2) / particleCount;
                this.particles.push(new Particle(this.x, this.y, this.hue, angle, Math.cos(angle) * velocity, Math.sin(angle) * velocity));
            }
        }
    }

    createStarExplosion() {
        const points = 5;
        const particlesPerPoint = 50;
        for (let point = 0; point < points; point++) {
            for (let i = 0; i < particlesPerPoint; i++) {
                const angle = (point * Math.PI * 2) / points;
                const velocity = 3 + Math.random() * 3;
                const spread = Math.random() * 0.3 - 0.15;
                this.particles.push(new Particle(this.x, this.y, this.hue, angle + spread, Math.cos(angle) * velocity, Math.sin(angle) * velocity));
            }
        }
    }

    draw() {
        if (!this.exploded) {
            this.trail.forEach(dot => {
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 220, 180, ${dot.alpha})`;
                ctx.fill();
            });
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${this.hue}, 100%, 70%)`;
            ctx.fill();
        }
        
        for (const particle of this.particles) {
            particle.draw();
        }
    }
}

class Particle {
    constructor(x, y, hue, angle, velocityX, velocityY) {
        this.x = x;
        this.y = y;
        this.angle = angle || Math.random() * Math.PI * 2;
        this.speed = Math.random() * 6 + 2;
        this.friction = 0.98;
        this.gravity = 0.2;
        this.alpha = 1;
        this.decay = Math.random() * 0.01 + 0.005;
        this.hue = hue + Math.random() * 30 - 15;
        this.brightness = Math.random() * 30 + 70;
        this.velocityX = velocityX || Math.cos(this.angle) * this.speed;
        this.velocityY = velocityY || Math.sin(this.angle) * this.speed;
        this.size = Math.random() * 2 + 1;
    }

    update() {
        this.velocityX *= this.friction;
        this.velocityY *= this.friction;
        this.velocityY += this.gravity;
        
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.alpha -= this.decay;
        
        this.brightness = Math.max(50, this.brightness - Math.random() * 2);
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
        ctx.fill();
    }
}

const fireworks = Array(15).fill().map(() => new Firework());

function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (Math.random() < 0.15) {
        fireworks.push(new Firework());
    }

    if (fireworks.length > 20) {
        fireworks.splice(0, 1);
    }

    for (const firework of fireworks) {
        firework.update();
        firework.draw();
    }

    requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

function playInitialFireworks() {
    setTimeout(() => playSound(getRandomSound()), 0);
    setTimeout(() => playSound(getRandomSound()), 200);
    setTimeout(() => playSound(getRandomSound()), 400);
}

window.addEventListener('load', playInitialFireworks);

document.addEventListener('click', () => {
    playSound(getRandomSound());
});

const wishes = [
    "Chúc bạn năm mới an khang thịnh vượng, phát tài phát lộc!",
    "Năm mới vạn sự như ý, tỉ sự hanh thông!",
    "Chúc năm mới sức khỏe dồi dào, công việc hanh thông, tiền vào như nước!",
    "Năm mới phát tài phát lộc, vạn sự cát tường!",
    "Chúc mừng năm mới bình an, sức khỏe, hạnh phúc!"
];

function showRandomWish() {
    const wishText = document.getElementById('wishText');
    const randomWish = wishes[Math.floor(Math.random() * wishes.length)];
    wishText.textContent = randomWish;
    wishText.style.display = 'block';
    
    // Bắn thêm pháo hoa
    for(let i = 0; i < 5; i++) {
        setTimeout(() => {
            fireworks.push(new Firework());
            playSound(getRandomSound());
        }, i * 200);
    }

    // Ẩn lời chúc sau 3 giây
    setTimeout(() => {
        wishText.style.display = 'none';
    }, 3000);
}

// Hiển thị lời chúc đầu tiên sau 2 giây khi trang web tải xong
setTimeout(() => {
    showRandomWish();
    // Sau đó cứ mỗi 5 giây hiển thị một lời chúc mới
    setInterval(showRandomWish, 5000);
}, 2000);

// Vẫn giữ sự kiện click để ẩn lời chúc
document.getElementById('wishText').addEventListener('click', function() {
    this.style.display = 'none';
});
