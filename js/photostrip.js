document.addEventListener("DOMContentLoaded", () => {
  /* ---------------------- */
  /* ELEMENTS */
  /* ---------------------- */
  const video = document.getElementById("polaroid-preview");
  const permissionOverlay = document.getElementById("camera-permission-overlay");
  const dots = document.getElementById("camera-dots");
  const retryBtn = document.getElementById("retry-camera");
  const overlayCloseBtn = permissionOverlay.querySelector(".close-overlay");
  const previewTextOverlay = document.getElementById("preview-text-overlay");
  const startBtn = document.getElementById("start");
  const closeBtn = document.getElementById("close-btn");
  const retakeBtn = document.getElementById("retake-btn");
  const shareBtn = document.getElementById("share-btn");
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

  const photoDots = document.querySelectorAll(".photo-dot");
  let currentIndex = 0;

  // Photostrip customization
  const previewFrame = document.getElementById("photostrip-preview");
  const colorCircles = document.querySelectorAll(".color-circle");
  const colorPicker = document.getElementById("color-picker");
  const logoImg = document.querySelector(".photostrip-caption .logo");
  const defaultBorderColor = getComputedStyle(previewFrame).borderColor;

  let dotsToRetryTimeout;

  let currentRetakeSlot = null;
  let pendingRetakeSlot = null;

  /* ---------------------- */
  /* HELPER FUNCTIONS */
  /* ---------------------- */
  function isColorDark(color) {
    let r, g, b;

    if (color.startsWith("#")) {
      if (color.length === 7) {
        r = parseInt(color.slice(1, 3), 16);
        g = parseInt(color.slice(3, 5), 16);
        b = parseInt(color.slice(5, 7), 16);
      } else if (color.length === 4) {
        r = parseInt(color[1] + color[1], 16);
        g = parseInt(color[2] + color[2], 16);
        b = parseInt(color[3] + color[3], 16);
      }
    } else if (color.startsWith("rgb")) {
      const rgb = color.match(/\d+/g).map(Number);
      [r, g, b] = rgb;
    } else {
      r = g = b = 0;
    }

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  }

  function updateLogoColor(frameColor) {
    if (!logoImg) return;
    logoImg.src = isColorDark(frameColor)
      ? "assets/pb-logo-no-bg-w.png"
      : "assets/pb-logo-no-bg.png";
  }

  function showPreviewOverlay() {
    previewTextOverlay.style.opacity = "1";
  }

  function hidePreviewOverlay() {
    previewTextOverlay.style.opacity = "0";
  }

  function startDotsToRetryTimer() {
    dots.style.display = "inline-flex";
    retryBtn.classList.remove("show");

    if (dotsToRetryTimeout) clearTimeout(dotsToRetryTimeout);

    dotsToRetryTimeout = setTimeout(() => {
      dots.style.display = "none";
      retryBtn.classList.add("show");
    }, 5000);
  }

  function updatePhotoIndicator() {
    photoDots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentSlot);
    });
    currentIndex = currentSlot;
  }

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
  /* CAMERA INITIALIZATION */
  /* ---------------------- */
  async function initCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      video.srcObject = stream;
      await video.play();

      permissionOverlay.classList.add("hidden");
      dots.style.display = "none";
      retryBtn.classList.remove("show");
      startBtn.disabled = false;
      hidePreviewOverlay();
    } catch (err) {
      console.error("Camera access denied:", err);
      permissionOverlay.classList.remove("hidden");
      startDotsToRetryTimer();
      startBtn.disabled = true;
    }
  }

  /* ---------------------- */
  /* PHOTO COUNT INDICATOR */
  /* ---------------------- */
  function switchDot() {
    photoDots[currentIndex].classList.remove("active"); 
    currentIndex = (currentIndex + 1) % photoDots.length; 
    photoDots[currentIndex].classList.add("active"); 
    console.log("Current red dot:", currentIndex);
  }

  /* ---------------------- */
/* INDIVIDUAL RETAKE FUNCTIONS */
/* ---------------------- */
function showRetakeButton(slotNumber) {
  // Remove any existing retake buttons first
  hideAllRetakeButtons();
  
  // Show retake button for current slot
  const slot = document.getElementById(`slot-${slotNumber}`);
  if (slot && slot.querySelector('img')) {
    const retakeBtn = document.createElement('button');
    retakeBtn.className = 'slot-retake-mini';
    retakeBtn.dataset.slot = slotNumber;
    retakeBtn.title = 'Retake this photo';
    retakeBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i>';
    slot.appendChild(retakeBtn);
    
    retakeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showRetakeConfirmation(slotNumber);
    });
  }
  
  currentRetakeSlot = slotNumber;
}

function hideAllRetakeButtons() {
  const allRetakeButtons = document.querySelectorAll('.slot-retake-mini');
  allRetakeButtons.forEach(btn => btn.remove());
  currentRetakeSlot = null;
}

function showRetakeConfirmation(slotNumber) {
  pendingRetakeSlot = slotNumber;
  document.getElementById('retake-confirm-overlay').classList.remove('hidden');
}

function retakePhoto(slotNumber) {
  const slot = document.getElementById(`slot-${slotNumber}`);
  const modalSlot = document.getElementById(`modal-slot-${slotNumber}`);
  
  // Clear the slot
  slot.innerHTML = '';
  modalSlot.innerHTML = '';
  
  // Remove all retake buttons
  hideAllRetakeButtons();
  
  // Update current slot to allow retaking this position
  currentSlot = slotNumber - 1;
  
  // Update photo indicator
  updatePhotoIndicator();
  
  // Re-enable capture button
  startBtn.disabled = false;
  
  // Show retake button for the previous photo (if it exists)
  if (slotNumber > 1) {
    const previousSlot = document.getElementById(`slot-${slotNumber - 1}`);
    if (previousSlot.querySelector('img')) {
      showRetakeButton(slotNumber - 1);
    }
  }
  
  console.log(`Retook photo #${slotNumber}. Current slot: ${currentSlot}`);
}

  /* ---------------------- */
  /* FRAME CUSTOMIZATION */
  /* ---------------------- */
  colorCircles.forEach(circle => {
    circle.addEventListener("click", () => {
      const color = circle.dataset.color;

      // Main preview
      previewFrame.style.borderColor = color; 
      previewFrame.style.backgroundColor = color;
      updateLogoColor(color);

      // Modal preview
      const modalPhotostrip = document.getElementById("photo-modal")?.querySelector("#photostrip-preview");
      if (modalPhotostrip) {
        modalPhotostrip.style.borderColor = color;
        modalPhotostrip.style.backgroundColor = color;
        const modalLogo = modalPhotostrip.querySelector(".photostrip-caption .logo");
        if (modalLogo) {
          modalLogo.src = isColorDark(color)
            ? "assets/pb-logo-no-bg-w.png"
            : "assets/pb-logo-no-bg.png";
        }
      }

      // Sync color picker
      colorPicker.value = color; 
    });
  });

  /* ---------------------- */
  /* EVENT LISTENERS */
  /* ---------------------- */
  retryBtn?.addEventListener("click", initCamera);
  overlayCloseBtn?.addEventListener("click", () => {
    permissionOverlay.classList.add("hidden");
    startBtn.disabled = true;
    if (dotsToRetryTimeout) clearTimeout(dotsToRetryTimeout);
    dots.style.display = "none";
    retryBtn.classList.remove("show");
    showPreviewOverlay();
  });

let isCapturing = false;

startBtn.addEventListener("click", async () => {
  if (currentSlot >= slots.length) return;
  if (isCapturing) return; 

  isCapturing = true; 

  const delay = window.getCurrentDelay?.() || 0;
  await window.showCountdown?.(delay); 

  // --- Capture logic ---
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");

  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imgData = canvas.toDataURL("image/png");
  const img = new Image();
  img.src = imgData;
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "cover";
  img.style.objectPosition = "center";

  slots[currentSlot].innerHTML = "";
  slots[currentSlot].appendChild(img);
  slots[currentSlot].dataset.imgData = imgData;

  // Show retake button for this photo (hide previous one) 
  showRetakeButton(currentSlot + 1);

  currentSlot++;
  
  switchDot();

  if (currentSlot === slots.length) {
    hideAllRetakeButtons();
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
        modalSlots[index].innerHTML = "";
        modalSlots[index].appendChild(modalImg);
      });
    }, 500);
  }

  startBtn.blur();

  isCapturing = false; 
});

  downloadBtn?.addEventListener("click", () => {
    const photostrip = document.getElementById("photostrip-preview");
    if (!photostrip) return;

    // Use current colors for border and background
    const frameColor = previewFrame.style.borderColor || defaultBorderColor;
    const bgColor = previewFrame.style.backgroundColor || "#fff";

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

    // Draw background (respect color)
    ctx.fillStyle = bgColor;
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

    // Draw border (use frameColor)
    ctx.strokeStyle = frameColor;
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

    // Draw logo with automatic light/dark switch
    const logo = photostrip.querySelector(".photostrip-caption .logo");
    if (logo) {
      const logoImg = new Image();
      logoImg.src = isColorDark(frameColor)
        ? "assets/pb-logo-no-bg-w.png"
        : "assets/pb-logo-no-bg.png";
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

  shareBtn?.addEventListener("click", () => {
    const photostrip = document.getElementById("photostrip-preview");
    if (!photostrip) return;

    const frameColor = previewFrame.style.borderColor || defaultBorderColor;
    const bgColor = previewFrame.style.backgroundColor || "#fff";

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

    // Draw background
    ctx.fillStyle = bgColor;
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
    ctx.strokeStyle = frameColor;
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

    const logo = photostrip.querySelector(".photostrip-caption .logo");
    if (logo) {
        const logoImg = new Image();
        logoImg.src = isColorDark(frameColor)
            ? "assets/pb-logo-no-bg-w.png"
            : "assets/pb-logo-no-bg.png";
        logoImg.onload = () => {
            const logoHeight = 15 * scale;
            const logoRatio = logoImg.width / logoImg.height;
            const logoWidth = logoHeight * logoRatio;
            const x = (canvasWidth - logoWidth) / 2;
            const y = canvasHeight - borderBottom + (borderBottom - logoHeight) / 2 - 8 * scale;
            ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);

            // Share instead of download
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const file = new File([blob], getPhotostripFilename(), { type: "image/png" });

                if (navigator.share && navigator.canShare?.({ files: [file] })) {
                    try {
                        await navigator.share({
                            title: "My Photostrip",
                            text: "Snapped this with Photobooth ✨",
                            files: [file],
                        });
                    } catch (err) {
                        console.log("Share cancelled:", err);
                    }
                } else {
                    alert("Sharing not supported in this browser. Try downloading instead.");
                }
            }, "image/png");
        };
      }
  });

  /* ---------------------- */
  /* MODAL CONTROLS */
  /* ---------------------- */
  function resetModal() {
    slots.forEach(slot => slot.innerHTML = "");
    modalSlots.forEach(slot => slot.innerHTML = "");
    currentSlot = 0;

    window.resetTimer?.();
    updatePhotoIndicator();
    hideAllRetakeButtons();

    previewFrame.style.borderColor = defaultBorderColor;
    previewFrame.style.backgroundColor = "#fff";
    updateLogoColor(defaultBorderColor);

    const modalPhotostrip = document.getElementById("photo-modal")?.querySelector("#photostrip-preview");
    if (modalPhotostrip) {
      modalPhotostrip.style.borderColor = defaultBorderColor;
      modalPhotostrip.style.backgroundColor = "#fff";
      const modalLogo = modalPhotostrip.querySelector(".photostrip-caption .logo");
      if (modalLogo) {
        modalLogo.src = isColorDark(defaultBorderColor)
          ? "assets/pb-logo-no-bg-w.png"
          : "assets/pb-logo-no-bg.png";
      }
    }

    if (colorPicker) {
      const rgb = defaultBorderColor.match(/\d+/g);
      if (rgb) {
        const [r, g, b] = rgb.map(Number);
        colorPicker.value = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      } else {
        colorPicker.value = "#ffffff";
      }
    }
    
  }

  closeBtn?.addEventListener("click", () => {
    photoModal.classList.remove("show");
    photoModal.classList.add("hidden");
    resetModal();
  });

  retakeBtn?.addEventListener("click", () => {
    photoModal.classList.remove("show");
    photoModal.classList.add("hidden");
    resetModal();
  });

  photoModal?.addEventListener("click", (e) => {
    if (e.target === photoModal) {
      photoModal.classList.remove("show");
      photoModal.classList.add("hidden");
      resetModal();
    }
  });

  document.getElementById('retake-confirm-ok')?.addEventListener('click', () => {
    if (pendingRetakeSlot !== null) {
      retakePhoto(pendingRetakeSlot);
      pendingRetakeSlot = null;
    }
    document.getElementById('retake-confirm-overlay').classList.add('hidden');
  });

  document.getElementById('retake-confirm-cancel')?.addEventListener('click', () => {
    pendingRetakeSlot = null;
    document.getElementById('retake-confirm-overlay').classList.add('hidden');
  });

  document.querySelector('#retake-confirm-overlay .close-overlay')?.addEventListener('click', () => {
    pendingRetakeSlot = null;
    document.getElementById('retake-confirm-overlay').classList.add('hidden');
  });

  document.getElementById('retake-confirm-overlay')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('retake-confirm-overlay')) {
      pendingRetakeSlot = null;
      e.target.classList.add('hidden');
    }
  });

  // Automatically request camera on page load
  initCamera();
});

