document.addEventListener("DOMContentLoaded", () => {
  /* ---------------------- */
  /* NAVIGATION + MOBILE MENU */
  /* ---------------------- */
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.createElement('div');
  mobileMenu.classList.add('mobile-menu');
  mobileMenu.innerHTML = `
    <ul>
      <li><a href="index.html" class="active">Home</a></li>
      <li><a href="#about">About</a></li>
      <li><a href="#privacy">Privacy Policy</a></li>
      <li><a href="#contact">Contact</a></li>
      <li>
        <a href="https://github.com/jairusjustin" target="_blank">
          <img src="../assets/github-icon.png" alt="GitHub" style="height: 24px; width: 24px;" />
        </a>
      </li>
    </ul>
  `;
  document.body.appendChild(mobileMenu);

  hamburger?.addEventListener('click', () => {
    const expanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', !expanded);
    mobileMenu.classList.toggle('open');
  });

  /* ---------------------- */
  /* START MODAL + STYLE SELECTION */
  /* ---------------------- */
  const openModalBtn = document.getElementById("open-modal-btn");
  const modal = document.getElementById("startModal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const polaroidOption = document.getElementById("polaroid-option");
  const stripOption = document.getElementById("strip-option");

  openModalBtn?.addEventListener("click", () => modal.classList.remove("hidden"));
  closeModalBtn?.addEventListener("click", () => modal.classList.add("hidden"));

  polaroidOption?.addEventListener("click", () => {
    window.location.href = "polaroid.html";
  });
  stripOption?.addEventListener("click", () => {
    window.location.href = "capture.html";
  });

  /* ---------------------- */
  /* TIMER + COUNTDOWN LOGIC */
  /* ---------------------- */
  const timerBtn = document.getElementById("timer-btn");
  const timerText = timerBtn?.querySelector(".timer-text");
  const countdownOverlay = document.getElementById("countdown-overlay");

  const timerValues = [0, 3, 5, 10];
  let currentTimerIndex = 0;

  timerBtn?.addEventListener("click", () => {
    currentTimerIndex = (currentTimerIndex + 1) % timerValues.length;
    timerText.textContent = `${timerValues[currentTimerIndex]}s`;
  });

  function showCountdown(seconds) {
    return new Promise((resolve) => {
      if (!countdownOverlay) return resolve();

      let count = seconds;
      const tick = () => {
        if (count > 0) {
          countdownOverlay.textContent = count;
          countdownOverlay.classList.add("show");
          setTimeout(() => {
            countdownOverlay.classList.remove("show");
            count--;
            tick();
          }, 1000);
        } else {
          countdownOverlay.textContent = "";
          resolve();
        }
      };
      tick();
    });
  }

  // Expose globally
  window.showCountdown = showCountdown;
  window.getCurrentDelay = () => timerValues[currentTimerIndex];

  /* ---------------------- */
  /* CAMERA INITIALIZATION + PERMISSION */
  /* ---------------------- */
  const video = document.getElementById('polaroid-preview'); 
  const permissionOverlay = document.getElementById('camera-permission-overlay');

  async function initCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      video.srcObject = stream;
      await video.play();
      video.hidden = false;
      permissionOverlay.style.display = 'none';
    } catch (err) {
      console.error('Camera access error:', err);
      permissionOverlay.style.display = 'flex';
    }
  }

  function setupCameraPermission() {
    const allowBtn = document.getElementById('allow-camera-btn');
    allowBtn?.addEventListener('click', () => initCamera());

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' })
        .then(status => {
          if (status.state === 'granted') {
            initCamera();
          } else {
            permissionOverlay.style.display = 'flex';
          }

          status.onchange = () => {
            if (status.state === 'granted') {
              initCamera();
              permissionOverlay.style.display = 'none';
            } else {
              permissionOverlay.style.display = 'flex';
            }
          };
        })
        .catch(() => {
          permissionOverlay.style.display = 'flex';
        });
    } else {
      permissionOverlay.style.display = 'flex';
    }
  }

  setupCameraPermission();
});
