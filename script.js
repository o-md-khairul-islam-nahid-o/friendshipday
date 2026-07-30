/* ==========================================================================
   FOR MY KONA BURI - INTERACTIVE LOGIC & AUDIO SYNTHESIZER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Init Canvas Particles
  initParticleCanvas();

  // Audio System (Web Audio API Synth)
  const audioSynth = new AmbientAudioSynth();

  // DOM Elements
  const entranceScreen = document.getElementById('entrance-screen');
  const enterBtn = document.getElementById('enter-btn');
  const appContent = document.getElementById('app-content');
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const audioBtnText = document.getElementById('audio-btn-text');

  // Entrance Unlock Handler
  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      // Play ascending chime sound
      audioSynth.playUnlockChime();

      // Launch celebration fireworks
      triggerFireworks();

      // Fade out entrance screen & show app content
      entranceScreen.classList.add('hidden');
      appContent.classList.remove('hidden-app');

      // Start ambient synth melody
      setTimeout(() => {
        audioSynth.startAmbientMelody();
        audioToggleBtn.classList.add('playing');
        audioBtnText.textContent = 'Pause Melody';
      }, 800);
    });
  }

  // Audio Toggle Button
  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      const isPlaying = audioSynth.toggleMelody();
      if (isPlaying) {
        audioToggleBtn.classList.add('playing');
        audioBtnText.textContent = 'Pause Melody';
      } else {
        audioToggleBtn.classList.remove('playing');
        audioBtnText.textContent = 'Play Melody';
      }
    });
  }

  // Flip cards touch & click handler
  const flipCards = document.querySelectorAll('.flip-card');
  flipCards.forEach((card) => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      card.classList.toggle('flipped');
    });
  });

  // Modal Backdrop Click Listeners
  const lightboxModal = document.getElementById('lightbox-modal');
  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) {
        closeLightbox();
      }
    });
  }

  const moodModal = document.getElementById('mood-modal');
  if (moodModal) {
    moodModal.addEventListener('click', (e) => {
      if (e.target === moodModal) {
        closeMoodModal();
      }
    });
  }

  // Keyboard escape listener for modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
      closeMoodModal();
    }
  });
});

/* ==========================================================================
   CANVAS STAR & HEART PARTICLE SYSTEM
   ========================================================================== */
function initParticleCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const particleCount = Math.min(Math.floor(window.innerWidth / 15), 70);

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 2.5 + 1;
      this.speedY = -(Math.random() * 0.4 + 0.1);
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.7 + 0.2;
      this.pulseSpeed = Math.random() * 0.02 + 0.005;
      // 70% light blue stars, 30% crimson pink hearts
      this.isHeart = Math.random() < 0.25;
      this.color = this.isHeart 
        ? `rgba(255, 42, 95, ${this.opacity})` 
        : `rgba(125, 211, 252, ${this.opacity})`;
    }

    update() {
      this.y += this.speedY;
      this.x += this.speedX;

      this.opacity += Math.sin(Date.now() * this.pulseSpeed) * 0.008;

      if (this.y < -10 || this.x < -10 || this.x > width + 10) {
        this.y = height + 10;
        this.x = Math.random() * width;
      }
    }

    draw() {
      ctx.save();
      ctx.fillStyle = this.color;
      ctx.shadowBlur = this.isHeart ? 10 : 8;
      ctx.shadowColor = this.isHeart ? '#ff2a5f' : '#38bdf8';

      if (this.isHeart) {
        drawHeart(ctx, this.x, this.y, this.size * 2);
      } else {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawHeart(context, x, y, size) {
    context.beginPath();
    const topCurveHeight = size * 0.3;
    context.moveTo(x, y + topCurveHeight);
    context.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
    context.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + size, x, y + size);
    context.bezierCurveTo(x, y + size, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
    context.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
    context.closePath();
    context.fill();
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }

  animate();
}

/* ==========================================================================
   WEB AUDIO API - AMBIENT MELODY & CHIME SYNTHESIZER
   ========================================================================== */
class AmbientAudioSynth {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.melodyTimer = null;
    this.notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25]; // C4 to E5 pentatonic
  }

  initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playUnlockChime() {
    this.initCtx();
    const now = this.ctx.currentTime;
    const freqs = [392.00, 523.25, 659.25, 783.99, 1046.50]; // G4, C5, E5, G5, C6

    freqs.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.1);

      gain.gain.setValueAtTime(0.01, now + index * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.25, now + index * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + index * 0.1);
      osc.stop(now + index * 0.1 + 1.3);
    });
  }

  startAmbientMelody() {
    this.initCtx();
    if (this.isPlaying) return;
    this.isPlaying = true;

    let step = 0;
    const playNote = () => {
      if (!this.isPlaying) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Pick soft harmonious note
      const note = this.notes[step % this.notes.length];
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 3.2);

      step = (step + Math.floor(Math.random() * 3) + 1) % this.notes.length;
      this.melodyTimer = setTimeout(playNote, 1800 + Math.random() * 1200);
    };

    playNote();
  }

  stopAmbientMelody() {
    this.isPlaying = false;
    if (this.melodyTimer) {
      clearTimeout(this.melodyTimer);
      this.melodyTimer = null;
    }
  }

  toggleMelody() {
    if (this.isPlaying) {
      this.stopAmbientMelody();
      return false;
    } else {
      this.startAmbientMelody();
      return true;
    }
  }
}

/* ==========================================================================
   LIGHTBOX MODAL LOGIC
   ========================================================================== */
function openLightbox(imgSrc, title, story) {
  const modal = document.getElementById('lightbox-modal');
  const modalImg = document.getElementById('lightbox-img');
  const modalTitle = document.getElementById('lightbox-title');
  const modalStory = document.getElementById('lightbox-story');

  if (modal && modalImg && modalTitle && modalStory) {
    modalImg.src = imgSrc;
    modalTitle.textContent = title;
    modalStory.textContent = story;
    modal.classList.add('active');
  }
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

/* ==========================================================================
   OPEN WHEN MOOD MODAL LOGIC
   ========================================================================== */
const moodMessages = {
  stressed: {
    title: "When You Feel Stressed",
    icon: "fa-cloud-rain",
    message: "My most adorable Kona Buri, close your eyes for a moment. Take a deep, gentle breath... and exhale. Whatever is causing you stress right now is only temporary. You don't have to carry the weight of the world on your shoulders all at once. Step by step, we will solve everything. Nahid is right here holding your hand, always."
  },
  doubt: {
    title: "When You Doubt Yourself",
    icon: "fa-brain-circuit",
    message: "My adorable Kona Buri, listen to me very carefully: You are extraordinarily smart, competent, brilliant, and resilient. Self-doubt is just a passing shadow. Look at how far you've come and how many challenges you have conquered! Nahid believes in your potential 1000%, and I know you are going to achieve great things."
  },
  success: {
    title: "When You Achieve Something Big",
    icon: "fa-trophy",
    message: "YES!! I knew you could do it! 🥳 You worked so hard for this, my most adorable Kona Buri, and seeing you succeed makes my heart burst with pride. You deserve every single blessing, victory, and happiness coming your way. Treat yourself today, my champion Kona Buri!"
  },
  lonely: {
    title: "When You Miss Me",
    icon: "fa-hand-holding-heart",
    message: "Whenever you feel a bit lonely, place your hand over your heart. Can you feel that steady beat? That is our connection. No matter the distance or busy days, Nahid's thoughts, love, and warmth are surrounding you every second of the day."
  },
  smile: {
    title: "When You Need A Smile",
    icon: "fa-face-smile-beam",
    message: "Quick reminder: You possess the most contagious, gorgeous smile in the entire universe! 💖 Did you know that every time you smile, Nahid's world becomes 100x brighter? Keep smiling, my most adorable Kona Buri, because you are deeply loved beyond words."
  }
};

function openMoodModal(moodType) {
  const data = moodMessages[moodType];
  if (!data) return;

  const modal = document.getElementById('mood-modal');
  const titleEl = document.getElementById('mood-modal-title');
  const iconEl = document.getElementById('mood-modal-icon');
  const messageEl = document.getElementById('mood-modal-message');

  if (modal && titleEl && iconEl && messageEl) {
    titleEl.textContent = data.title;
    iconEl.className = `fa-solid ${data.icon} mood-modal-icon`;
    messageEl.textContent = data.message;
    modal.classList.add('active');
  }

  // Trigger floating heart effect
  triggerFireworks();
}

function closeMoodModal() {
  const modal = document.getElementById('mood-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

/* ==========================================================================
   FIREWORKS / HEART SHOWER CANNON
   ========================================================================== */
function triggerFireworks() {
  const container = document.body;
  const heartCount = 35;

  for (let i = 0; i < heartCount; i++) {
    const heart = document.createElement('div');
    heart.className = 'floating-heart-particle';

    const isCyan = Math.random() > 0.5;
    const color = isCyan ? '#38bdf8' : '#ff2a5f';
    const icon = isCyan ? 'fa-star' : 'fa-heart';

    heart.innerHTML = `<i class="fa-solid ${icon}"></i>`;
    heart.style.position = 'fixed';
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.top = Math.random() * 50 + 40 + 'vh';
    heart.style.fontSize = (Math.random() * 20 + 14) + 'px';
    heart.style.color = color;
    heart.style.textShadow = `0 0 15px ${color}`;
    heart.style.pointerEvents = 'none';
    heart.style.zIndex = '99999';
    heart.style.transition = 'transform 2s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 2s ease';

    container.appendChild(heart);

    // Trigger animation frame
    requestAnimationFrame(() => {
      const translateY = -(Math.random() * 250 + 150);
      const translateX = (Math.random() - 0.5) * 180;
      heart.style.transform = `translate(${translateX}px, ${translateY}px) scale(${Math.random() * 0.8 + 0.8}) rotate(${(Math.random() - 0.5) * 60}deg)`;
      heart.style.opacity = '0';
    });

    // Cleanup
    setTimeout(() => {
      if (heart && heart.parentNode) {
        heart.parentNode.removeChild(heart);
      }
    }, 2000);
  }
}
