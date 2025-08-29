document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const video = document.getElementById('polaroid-preview'); 
  const permissionOverlay = document.getElementById('camera-permission-overlay');
  const timerBtn = document.getElementById('timer-btn');
  const timerText = timerBtn?.querySelector('.timer-text');
  const countdownOverlay = document.getElementById('countdown-overlay');
  const startBtn = document.getElementById('start');
  const photoModal = document.getElementById('photo-modal');
  const modalImage = document.getElementById('modal-image'); 
  const captureContainer = document.getElementById('capture-polaroid'); 

  const timerValues = [0, 3, 5, 10];
  let currentTimerIndex = 0;

  // Timer toggle
  timerBtn?.addEventListener('click', () => {
    currentTimerIndex = (currentTimerIndex + 1) % timerValues.length;
    timerText.textContent = `${timerValues[currentTimerIndex]}s`;
  });

  // Countdown display
  function showCountdown(seconds) {
    return new Promise(resolve => {
      let count = seconds;
      const tick = () => {
        if (count > 0) {
          countdownOverlay.textContent = count;
          countdownOverlay.classList.add('show');
          setTimeout(() => {
            countdownOverlay.classList.remove('show');
            count--;
            tick();
          }, 1000);
        } else {
          countdownOverlay.textContent = '';
          resolve();
        }
      };
      tick();
    });
  }

  // Camera setup
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
        // Initialize if already granted
        if (status.state === 'granted') {
          initCamera();
        } else {
          permissionOverlay.style.display = 'flex';
        }

        // Listen for permission changes
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

// Capture photo
startBtn?.addEventListener('click', async () => {
  const delay = timerValues[currentTimerIndex];
  await showCountdown(delay);

  // Capture video frame
  const canvasPhoto = document.createElement('canvas');
  canvasPhoto.width = video.videoWidth;
  canvasPhoto.height = video.videoHeight;
  const ctxPhoto = canvasPhoto.getContext('2d');
  ctxPhoto.translate(canvasPhoto.width, 0);
  ctxPhoto.scale(-1, 1);
  ctxPhoto.drawImage(video, 0, 0, canvasPhoto.width, canvasPhoto.height);

  // Show captured photo in modal
  modalImage.src = canvasPhoto.toDataURL('image/png'); 
  photoModal.classList.add('show');
  photoModal.classList.remove('hidden');

  // Download captured photo with polaroid frame
  const downloadBtn = document.getElementById('download-btn');
  downloadBtn.onclick = () => {
    const canvas = document.createElement('canvas');
    const rect = captureContainer.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext('2d');

    // Polaroid background & gradient
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#f9f9f9');
    gradient.addColorStop(1, '#eaeaea');
    ctx.fillStyle = gradient;
    ctx.fillRect(14, 14, canvas.width - 28, canvas.height - 84);

    // Draw captured photo cropped to match preview
    const img = new Image();
    img.src = canvasPhoto.toDataURL('image/png');
    img.onload = () => {
      const previewRatio = (canvas.width - 28) / (canvas.height - 84);
      const imgRatio = img.width / img.height;

      let sx, sy, sWidth, sHeight;

      if (imgRatio > previewRatio) {
        sHeight = img.height;
        sWidth = sHeight * previewRatio;
        sx = (img.width - sWidth) / 2;
        sy = 0;
      } else {
        sWidth = img.width;
        sHeight = sWidth / previewRatio;
        sx = 0;
        sy = (img.height - sHeight) / 2;
      }

      ctx.drawImage(img, sx, sy, sWidth, sHeight, 14, 14, canvas.width - 28, canvas.height - 84);

      // Draw logo in the bottom white space
      const logoImg = new Image();
      logoImg.src = '../assets/pb-logo.png'; // path to your logo
      logoImg.onload = () => {
        const logoHeight = 30; // same as modal
        const logoRatio = logoImg.width / logoImg.height;
        const logoWidth = logoHeight * logoRatio;
        const x = (canvas.width - logoWidth) / 2;
        const y = canvas.height - 50; // adjust to appear inside bottom white border

        ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);

        // Trigger download
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `polaroid-${Date.now()}.png`;
        link.click();
      };
    };
  };
});


  // Modal controls
  const closeBtn = document.getElementById('close-btn');
  closeBtn?.addEventListener('click', () => {
    window.location.href = 'index.html'; // redirect to home
  });

  const retakeBtn = document.getElementById('retake-btn');
  retakeBtn?.addEventListener('click', () => {
    // Close modal and reset
    photoModal.classList.remove('show');
    photoModal.classList.add('hidden');
    // Optionally, reset captured image
    modalImage.src = '';
  });

  photoModal?.addEventListener('click', e => {
    if (e.target === photoModal) {
      photoModal.classList.remove('show');
      photoModal.classList.add('hidden');
    }
  });

  

  // Utilities
  window.showCountdown = showCountdown;
  window.getCurrentDelay = () => timerValues[currentTimerIndex];
});
