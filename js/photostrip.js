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

  const slots = [
    document.getElementById("slot-1"),
    document.getElementById("slot-2"),
    document.getElementById("slot-3")
  ];
  const modalSlots = [
    document.getElementById("modal-slot-1"),
    document.getElementById("modal-slot-2"),
    document.getElementById("modal-slot-3")
  ];

  const photoModal = document.getElementById("photo-modal");
  let currentSlot = 0;

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
  /* PHOTOSTRIP CAPTURE */
  /* ---------------------- */
  startBtn.addEventListener("click", async () => {
    if (currentSlot >= slots.length) return;

    // Get current countdown delay
    const delay = window.getCurrentDelay?.() || 0;
    await window.showCountdown?.(delay);

    // Capture video frame to canvas
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    // Mirror the image
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imgData = canvas.toDataURL("image/png");

    // Show preview in current slot
    const img = new Image();
    img.src = imgData;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.objectPosition = "center";

    slots[currentSlot].innerHTML = "";
    slots[currentSlot].appendChild(img);

    // Save captured data for modal
    slots[currentSlot].dataset.imgData = imgData;
    currentSlot++;

    // If all slots filled, show modal
    if (currentSlot === slots.length) {
      setTimeout(() => {
        photoModal.classList.remove("hidden");
        photoModal.classList.add("show");

        slots.forEach((slot, index) => {
          const data = slot.dataset.imgData;
          if (!data) return;

          const modalImg = new Image();
          modalImg.src = data;
          modalImg.style.width = "100%";
          modalImg.style.height = "100%";
          modalImg.style.objectFit = "cover";
          modalImg.style.objectPosition = "center";

          const modalSlot = document.getElementById(`modal-slot-${index + 1}`);
          modalSlot.innerHTML = "";
          modalSlot.appendChild(modalImg);
        });
      }, 500);
    }
    // --- Fix: remove button focus so it stops showing red ---
    startBtn.blur();
  });

  /* ---------------------- */
  /* PHOTOSTRIP DOWNLOAD */
  /* ---------------------- */
  downloadBtn?.addEventListener("click", () => {
    const photostrip = document.getElementById("photostrip-preview");
    if (!photostrip) return;

    // Scale and dimension settings
    const scale = 4.2;
    const photoWidth = 140 * scale;
    const photoHeight = 475 * scale;
    const borderTop = 8 * scale;
    const borderSides = 8 * scale;
    const borderBottom = 16 * scale;
    const radius = 10 * scale;
    const slotHeight = 150 * scale;
    const slotGap = 4 * scale;
    const canvasWidth = photoWidth + borderSides * 2;
    const canvasHeight = photoHeight + borderTop + borderBottom;

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");

    // Draw rounded white background
    ctx.fillStyle = "#fff";
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
    ctx.fill();

    // Clip for photo slots
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(radius, borderTop);
    ctx.lineTo(canvasWidth - radius, borderTop);
    ctx.quadraticCurveTo(canvasWidth - borderSides, borderTop, canvasWidth - borderSides, radius + borderTop);
    ctx.lineTo(canvasWidth - borderSides, canvasHeight - borderBottom - radius);
    ctx.quadraticCurveTo(canvasWidth - borderSides, canvasHeight - borderBottom, canvasWidth - radius, canvasHeight - borderBottom);
    ctx.lineTo(radius, canvasHeight - borderBottom);
    ctx.quadraticCurveTo(borderSides, canvasHeight - borderBottom, borderSides, canvasHeight - borderBottom - radius);
    ctx.lineTo(borderSides, radius + borderTop);
    ctx.quadraticCurveTo(borderSides, borderTop, radius, borderTop);
    ctx.closePath();
    ctx.clip();

    // Draw each photo slot
    const slots = photostrip.querySelectorAll(".strip-slot");
    slots.forEach((slot, index) => {
      const img = slot.querySelector("img");
      if (!img) return;

      const slotY = borderTop + index * (slotHeight + slotGap);
      const slotRatio = photoWidth / slotHeight;
      const imgRatio = img.naturalWidth / img.naturalHeight;

      let sx = 0, sy = 0, sWidth = img.naturalWidth, sHeight = img.naturalHeight;

      if (imgRatio > slotRatio) {
        sHeight = img.naturalHeight;
        sWidth = sHeight * slotRatio;
        sx = (img.naturalWidth - sWidth) / 2;
      } else {
        sWidth = img.naturalWidth;
        sHeight = sWidth / slotRatio;
        sy = (img.naturalHeight - sHeight) / 2;
      }

      ctx.drawImage(img, sx, sy, sWidth, sHeight, borderSides, slotY, photoWidth, slotHeight);
    });
    ctx.restore();

    // Draw border
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = borderSides;
    ctx.beginPath();
    ctx.moveTo(radius, borderTop / 2);
    ctx.lineTo(canvasWidth - radius, borderTop / 2);
    ctx.quadraticCurveTo(canvasWidth - borderSides / 2, borderTop / 2, canvasWidth - borderSides / 2, radius + borderTop / 2);
    ctx.lineTo(canvasWidth - borderSides / 2, canvasHeight - radius);
    ctx.quadraticCurveTo(canvasWidth - borderSides / 2, canvasHeight - borderBottom / 2, canvasWidth - radius, canvasHeight - borderBottom / 2);
    ctx.lineTo(radius, canvasHeight - borderBottom / 2);
    ctx.quadraticCurveTo(borderSides / 2, canvasHeight - borderBottom / 2, borderSides / 2, canvasHeight - radius);
    ctx.lineTo(borderSides / 2, radius + borderTop / 2);
    ctx.quadraticCurveTo(borderSides / 2, borderTop / 2, radius, borderTop / 2);
    ctx.closePath();
    ctx.stroke();

    // Draw logo
    const logo = photostrip.querySelector(".photostrip-caption .logo");
    if (logo) {
      const logoImg = new Image();
      logoImg.src = logo.src;
      logoImg.onload = () => {
        const logoHeight = 15 * scale;
        const logoRatio = logoImg.width / logoImg.height;
        const logoWidth = logoHeight * logoRatio;
        const x = (canvasWidth - logoWidth) / 2;
        const y = canvasHeight - borderBottom + (borderBottom - logoHeight) / 2 - 8 * scale;
        ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);

        // Trigger download
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = getPhotostripFilename();
        link.click();
      };
    }
  });

  function getPhotostripFilename() {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, "0");
    const yy = now.getFullYear().toString().slice(-2);
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const min = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    return `photostrip-${yy}${mm}${dd}-${hh}${min}${ss}.png`;
  }

  /* ---------------------- */
  /* MODAL CONTROLS */
  /* ---------------------- */
  closeBtn?.addEventListener("click", () => window.location.href = "index.html");

  retakeBtn?.addEventListener("click", () => {
    photoModal.classList.remove("show");
    photoModal.classList.add("hidden");
    slots.forEach(slot => slot.innerHTML = "");
    currentSlot = 0;
  });

  photoModal?.addEventListener("click", (e) => {
    if (e.target === photoModal) {
      photoModal.classList.remove("show");
      photoModal.classList.add("hidden");
      modalSlots.forEach(slot => slot.innerHTML = "");
    }
  });
});
