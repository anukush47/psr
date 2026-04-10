/* ============================================================
   PORTFOLIO — Main Script
   ============================================================ */

// ==================== LOADER ====================
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    loader.classList.add('hidden');
    // Kick off hero reveals
    document.querySelectorAll('.hero .reveal-up, .hero .reveal-left, .hero .reveal-right')
      .forEach(el => el.classList.add('revealed'));
  }, 2800);
});

// ==================== CURSOR ====================
const cursor = document.getElementById('cursor');
const follower = document.getElementById('cursorFollower');
let mx = 0, my = 0, fx = 0, fy = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.transform = `translate3d(${mx - 5}px, ${my - 5}px, 0)`;
}, { passive: true });

function animateFollower() {
  fx += (mx - fx) * 0.09;
  fy += (my - fy) * 0.09;
  follower.style.transform = `translate3d(${fx - 18}px, ${fy - 18}px, 0)`;
  requestAnimationFrame(animateFollower);
}
animateFollower();

document.querySelectorAll('a, button, .project-card, .skill-card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.transform += ' scale(2)';
    follower.style.width = '56px';
    follower.style.height = '56px';
  });
  el.addEventListener('mouseleave', () => {
    follower.style.width = '36px';
    follower.style.height = '36px';
  });
});

// ==================== NAV SCROLL ====================
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
});

// ==================== HAMBURGER ====================
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
}

// ==================== TYPEWRITER ====================
const words = [
  'medical AI systems.',
  'beautiful UIs.',
  'intelligent robots.',
  'n8n automations.',
  'deep learning models.',
  'React applications.',
  'impactful research.',
];
let wordIdx = 0, charIdx = 0, deleting = false;
const typeEl = document.getElementById('typewriter');

function typeWrite() {
  const word = words[wordIdx];
  if (!deleting) {
    typeEl.textContent = word.slice(0, ++charIdx);
    if (charIdx === word.length) {
      deleting = true;
      setTimeout(typeWrite, 1800);
      return;
    }
  } else {
    typeEl.textContent = word.slice(0, --charIdx);
    if (charIdx === 0) {
      deleting = false;
      wordIdx = (wordIdx + 1) % words.length;
    }
  }
  setTimeout(typeWrite, deleting ? 50 : 80);
}
setTimeout(typeWrite, 2500);

// ==================== PARTICLE CANVAS ====================
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d', { alpha: true });
let particles = [];
let rafId = null;
let paused = false;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas, { passive: true });

// Pause when tab is hidden — save CPU/GPU
document.addEventListener('visibilitychange', () => {
  paused = document.hidden;
  if (!paused && !rafId) rafId = requestAnimationFrame(animateParticles);
});

class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 1.5 + 0.4;
    this.vx = (Math.random() - 0.5) * 0.3;
    this.vy = (Math.random() - 0.5) * 0.3;
    this.alpha = Math.random() * 0.4 + 0.08;
    this.color = Math.random() > 0.5 ? '#7c3aed' : '#ec4899';
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
      this.reset();
    }
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.alpha;
    ctx.fill();
  }
}

// 45 particles — enough for visual density, light on the GPU
for (let i = 0; i < 45; i++) particles.push(new Particle());

const CONNECT_DIST = 95; // shorter = fewer line draws per frame

function drawConnections() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist2 = dx * dx + dy * dy; // skip sqrt until needed
      if (dist2 < CONNECT_DIST * CONNECT_DIST) {
        const dist = Math.sqrt(dist2);
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(124, 58, 237, ${(1 - dist / CONNECT_DIST) * 0.12})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
}

function animateParticles() {
  if (paused) { rafId = null; return; }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;
  drawConnections();
  particles.forEach(p => { p.update(); p.draw(); });
  ctx.globalAlpha = 1;
  rafId = requestAnimationFrame(animateParticles);
}
rafId = requestAnimationFrame(animateParticles);

// ==================== SCROLL REVEAL ====================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
  // Skip hero elements (handled by loader)
  if (!el.closest('#hero')) {
    revealObserver.observe(el);
  }
});

// ==================== SKILL BARS ====================
const skillObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.skill-fill').forEach(bar => {
        bar.style.width = bar.dataset.width + '%';
      });
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.skills-grid').forEach(el => skillObserver.observe(el));

// ==================== COUNTER ANIMATION ====================
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  let count = 0;
  const step = Math.ceil(target / 30);
  const timer = setInterval(() => {
    count += step;
    if (count >= target) { count = target; clearInterval(timer); }
    el.textContent = count;
  }, 50);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.stat-num').forEach(animateCounter);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.about-img-card').forEach(el => counterObserver.observe(el));

// ==================== PROJECT CARD GLOW ====================
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const glow = card.querySelector('.project-glow');
    glow.style.top = (y - 100) + 'px';
    glow.style.left = (x - 100) + 'px';
  });
});

// ==================== CONTACT FORM ====================
document.getElementById('contactForm').addEventListener('submit', e => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  const original = btn.innerHTML;
  btn.innerHTML = '<span>Message Sent!</span><i class="fas fa-check"></i>';
  btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
  setTimeout(() => {
    btn.innerHTML = original;
    btn.style.background = '';
    e.target.reset();
  }, 3000);
});

// ==================== SMOOTH ACTIVE NAV ====================
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 200) current = s.id;
  });
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === '#' + current);
  });
}, { passive: true });
