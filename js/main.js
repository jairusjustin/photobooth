document.addEventListener("DOMContentLoaded", () => {
  /* NAVIGATION + MOBILE MENU (unchanged) */
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.createElement('div');
  mobileMenu.classList.add('mobile-menu');
  mobileMenu.innerHTML = `
    <ul>
      <li><a href="index.html" class="active">Home</a></li>
      <li><a href="about.html">About</a></li>
      <li><a href="privacy.html">Privacy Policy</a></li>
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

  /* START MODAL + STYLE SELECTION (navigate only) */
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
    window.location.href = "photostrip.html";
  });

  /* TIMER + COUNTDOWN (if you use it on index, keep; otherwise you can remove) */
  const timerBtn = document.getElementById("timer-btn");
  const timerText = timerBtn?.querySelector(".timer-text");
  const countdownOverlay = document.getElementById("countdown-overlay");

  const timerValues = [0, 3, 5, 10];
  let currentTimerIndex = 0;

  timerBtn?.addEventListener("click", () => {
    currentTimerIndex = (currentTimerIndex + 1) % timerValues.length;
    if (timerText) timerText.textContent = `${timerValues[currentTimerIndex]}s`;
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

  window.showCountdown = showCountdown;
  window.getCurrentDelay = () => timerValues[currentTimerIndex];

});
