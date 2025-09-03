document.addEventListener("DOMContentLoaded", () => {
  /* ---------------------- */
  /* ELEMENTS */
  /* ---------------------- */
const video = document.getElementById("polaroid-preview");
const permissionOverlay = document.getElementById("camera-permission-overlay");
const dots = document.getElementById("camera-dots");
const retryBtn = document.getElementById("retry-camera")
const overlayCloseBtn = permissionOverlay.querySelector(".close-overlay");
const previewTextOverlay = document.getElementById("preview-text-overlay");


const startBtn = document.getElementById("start");
const closeBtn = document.getElementById("close-btn");
const retakeBtn = document.getElementById("retake-btn");
const downloadBtn = document.getElementById("download-btn");
const captureContainer = document.getElementById("capture-polaroid");
const photoModal = document.getElementById("photo-modal");
const modalImage = document.getElementById("modal-image");

let dotsToRetryTimeout;

// ----------------------
// PREVIEW OVERLAY
// ----------------------
function showPreviewOverlay() {
  previewTextOverlay.style.opacity = "1";
}

function hidePreviewOverlay() {
  previewTextOverlay.style.opacity = "0";
}

// ----------------------
// MODAL DOTS → RETRY LOGIC
// ----------------------
function startDotsToRetryTimer() {
  dots.style.display = "inline-flex";
  retryBtn.classList.remove("show");

  if (dotsToRetryTimeout) clearTimeout(dotsToRetryTimeout);

  dotsToRetryTimeout = setTimeout(() => {
    dots.style.display = "none";
    retryBtn.classList.add("show");
  }, 5000);
}

// ----------------------
// CAMERA INITIALIZATION
// ----------------------
async function initCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
    video.srcObject = stream;
    await video.play();

    // Hide modal and retry/dots
    permissionOverlay.classList.add("hidden");
    dots.style.display = "none";
    retryBtn.classList.remove("show");

    // Enable capture button
    startBtn.disabled = false;

    // Make sure preview overlay is hidden
    hidePreviewOverlay();

  } catch (err) {
    console.error("Camera access denied:", err);

    // Show modal with dots animation
    permissionOverlay.classList.remove("hidden");
    startDotsToRetryTimer();

    startBtn.disabled = true;
  }
}

// ----------------------
// EVENT LISTENERS
// ----------------------
// Retry button in modal
retryBtn?.addEventListener("click", initCamera);

// Close modal manually
overlayCloseBtn?.addEventListener("click", () => {
  permissionOverlay.classList.add("hidden");
  startBtn.disabled = true;

  // Stop dots → retry timer
  if (dotsToRetryTimeout) clearTimeout(dotsToRetryTimeout);

  // Hide dots & retry
  dots.style.display = "none";
  retryBtn.classList.remove("show");

  // Show preview overlay inside camera preview
  showPreviewOverlay();
});

// Automatically request camera on page load
initCamera();


  /* ---------------------- */
  /* POLAROID CAPTURE */
  /* ---------------------- */
  startBtn?.addEventListener("click", async () => {
    // Get current countdown delay
    const delay = window.getCurrentDelay?.() || 0;
    await window.showCountdown?.(delay);

    // Capture video frame
    const canvasPhoto = document.createElement("canvas");
    canvasPhoto.width = video.videoWidth;
    canvasPhoto.height = video.videoHeight;
    const ctxPhoto = canvasPhoto.getContext("2d");
    ctxPhoto.translate(canvasPhoto.width, 0);
    ctxPhoto.scale(-1, 1);
    ctxPhoto.drawImage(video, 0, 0, canvasPhoto.width, canvasPhoto.height);

    // Show captured photo in modal
    modalImage.src = canvasPhoto.toDataURL("image/png");
    photoModal.classList.add("show");
    photoModal.classList.remove("hidden");

  });


  /* ---------------------- */
  /* POLAROID DOWNLOAD */
  /* ---------------------- */
  downloadBtn?.addEventListener("click", () => {
    if (!modalImage.src) return;
    downloadPolaroid(modalImage);
  });

  function downloadPolaroid(imgElement) {
    const scale = 2;
    const rect = captureContainer.getBoundingClientRect();
    const canvasWidth = rect.width * scale;
    const canvasHeight = rect.height * scale;

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");

    const radius = 20 * scale;

    // Clip to rounded rectangle
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(canvasWidth - radius, 0);
    ctx.quadraticCurveTo(canvasWidth, 0, canvasWidth, radius);
    ctx.lineTo(canvasWidth, canvasHeight - radius);
    ctx.quadraticCurveTo(canvasWidth, canvasHeight, canvasWidth - radius, canvasHeight);
    ctx.lineTo(radius, canvasHeight);
    ctx.quadraticCurveTo(0, canvasHeight, 0, canvasHeight - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.clip();

    // Draw background gradient
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, "#f9f9f9");
    gradient.addColorStop(1, "#eaeaea");
    ctx.fillStyle = gradient;

    const paddingX = 14 * scale;
    const paddingY = 14 * scale;
    const bottomExtra = 84 * scale;
    ctx.fillRect(paddingX, paddingY, canvasWidth - paddingX * 2, canvasHeight - bottomExtra);

    // Draw captured photo
    const img = new Image();
    img.src = imgElement.src;
    img.onload = () => {
      const previewWidth = canvasWidth - paddingX * 2;
      const previewHeight = canvasHeight - bottomExtra;
      const previewRatio = previewWidth / previewHeight;
      const imgRatio = img.width / img.height;

      let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
      if (imgRatio > previewRatio) {
        sHeight = img.height;
        sWidth = sHeight * previewRatio;
        sx = (img.width - sWidth) / 2;
      } else {
        sWidth = img.width;
        sHeight = sWidth / previewRatio;
        sy = (img.height - sHeight) / 2;
      }

      ctx.drawImage(img, sx, sy, sWidth, sHeight, paddingX, paddingY, previewWidth, previewHeight);

      // Draw logo
      const logoImg = new Image();
      logoImg.src = "../assets/pb-logo.png";
      logoImg.onload = () => {
        const logoHeight = 30 * scale;
        const logoRatio = logoImg.width / logoImg.height;
        const logoWidth = logoHeight * logoRatio;
        const x = (canvasWidth - logoWidth) / 2;
        const y = canvasHeight - 50 * scale;
        ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);

        // Trigger download
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = getPolaroidFilename();
        link.click();
      };
    };
  }

  function getPolaroidFilename() {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, "0");
    const yy = now.getFullYear().toString().slice(-2);
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const min = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    return `polaroid-${yy}${mm}${dd}-${hh}${min}${ss}.png`;
  }


  /* ---------------------- */
  /* MODAL CONTROLS */
  /* ---------------------- */
  closeBtn?.addEventListener("click", () => window.location.href = "index.html");

  retakeBtn?.addEventListener("click", () => {
    photoModal.classList.remove("show");
    photoModal.classList.add("hidden");
    modalImage.src = "";
  });

  photoModal?.addEventListener("click", (e) => {
    if (e.target === photoModal) {
      photoModal.classList.remove("show");
      photoModal.classList.add("hidden");
    }
  });
});
