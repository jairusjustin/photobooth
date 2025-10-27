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
  const downloadBtn = document.getElementById("download-btn");
  const shareBtn = document.getElementById("share-btn");
  const captureContainer = document.getElementById("capture-polaroid");
  const photoModal = document.getElementById("photo-modal");
  const modalImage = document.getElementById("modal-image");

  // Polaroid customization
  const previewFrame = document.getElementById("polaroid-frame");
  const colorCircles = document.querySelectorAll(".color-circle");
  const colorPicker = document.getElementById("color-picker");
  const logoImg = previewFrame.querySelector(".polaroid-caption img");
  const defaultBorderColor = getComputedStyle(previewFrame).borderColor;

  // Effects elements
  const effectsModalBtn = document.getElementById("effects-modal-btn");
  const effectsOverlay = document.getElementById("effects-overlay");
  const effectOptions = document.querySelectorAll(".effect-option");

  let dotsToRetryTimeout;
  let currentEffect = 'none';

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

  function updateEffectsButton() {
    if (currentEffect !== 'none') {
      effectsModalBtn.classList.add('active-effect');
    } else {
      effectsModalBtn.classList.remove('active-effect');
    }
  }

  function applyEffectToVideoPreview() {
    // Reset filter
    video.style.filter = 'none';
    video.style.mixBlendMode = 'normal';

    switch (currentEffect) {
      case 'sunlight':
        video.style.filter = 'contrast(1.1) brightness(1.05) saturate(1.2) hue-rotate(-5deg)';
        break;
      case 'cool':
        video.style.filter = 'contrast(1.2) brightness(0.95) saturate(0.95) hue-rotate(15deg)';
        break;
      case 'vintage':
        video.style.filter = 'contrast(0.9) brightness(1.05) saturate(0.8) sepia(0.4) hue-rotate(-10deg)';
        break;
      case 'color-film':
        video.style.filter = 'contrast(1.1) brightness(1.05) saturate(1.3) hue-rotate(5deg)';
        break;
      case 'soft-film':
        video.style.filter = 'contrast(0.95) brightness(1.1) saturate(0.9) sepia(0.2) blur(0.3px)';
        break;
      case 'bnw':
        video.style.filter = 'grayscale(1) brightness(1.08) contrast(0.85) sepia(0.08) blur(0.3px)';
        break;
      case 'grunge':
        video.style.filter = 'contrast(1.6) brightness(0.8) saturate(0.7)';
        break;
      case 'low-exposure':
        video.style.filter = 'brightness(0.75) contrast(1.25) saturate(0.75) hue-rotate(-5deg)';
        break;
      case 'none':
      default:
        break;
    }

    updateEffectsButton();
  }

  function getCurrentEffectFilter() {
    switch (currentEffect) {
      case 'sunlight':
        return 'contrast(1.1) brightness(1.05) saturate(1.2) hue-rotate(-5deg)';
      case 'cool':
        return 'contrast(1.2) brightness(0.95) saturate(0.95) hue-rotate(15deg)';
      case 'vintage':
        return 'contrast(0.9) brightness(1.05) saturate(0.8) sepia(0.4) hue-rotate(-10deg)';
      case 'color-film':
        return 'contrast(1.1) brightness(1.05) saturate(1.3) hue-rotate(5deg)';
      case 'soft-film':
        return 'contrast(0.95) brightness(1.1) saturate(0.9) sepia(0.2) blur(0.3px)';
      case 'bnw':
        return 'grayscale(1) brightness(1.08) contrast(0.85) sepia(0.08) blur(0.3px)';
      case 'grunge':
        return 'contrast(1.6) brightness(0.8) saturate(0.7)';
      case 'low-exposure':
        return 'brightness(0.75) contrast(1.25) saturate(0.75) hue-rotate(-5deg)';
      case 'none':
      default:
        return 'none';
    }
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
  /* FRAME CUSTOMIZATION */
  /* ---------------------- */
  colorCircles.forEach(circle => {
    circle.addEventListener("click", () => {
      const color = circle.dataset.color;
      previewFrame.style.borderColor = color;
      colorPicker.value = color;
      updateLogoColor(color);
    });
  });

  /* ---------------------- */
  /* EVENT LISTENERS */
  /* ---------------------- */
  // Effects overlay functionality - NEW
  effectsModalBtn?.addEventListener("click", () => {
    effectsOverlay.classList.toggle("show");
  });

  // Close effects overlay when clicking outside
  effectsOverlay?.addEventListener("click", (e) => {
    if (e.target === effectsOverlay) {
      effectsOverlay.classList.remove("show");
    }
  });

  // Update effect selection
  effectOptions.forEach(option => {
    option.addEventListener("click", function() {
      // Remove active class from all options
      effectOptions.forEach(opt => opt.classList.remove("active"));
      // Add active class to clicked option
      this.classList.add("active");
      
      // Set current effect
      currentEffect = this.dataset.effect;
      
      // Apply effect to video preview
      applyEffectToVideoPreview();
      
      // Close overlay after selection
      effectsOverlay.classList.remove("show");
    });
  });

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

  startBtn?.addEventListener("click", async () => {
    if (isCapturing) return;
    isCapturing = true;

    const delay = window.getCurrentDelay?.() || 0;
    await window.showCountdown?.(delay);

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    // Mirror like preview
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    // Apply effect filter
    ctx.filter = getCurrentEffectFilter();
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = 'source-over'; // Reset blending mode for the next steps

    modalImage.src = canvas.toDataURL("image/png");
    photoModal.classList.add("show");
    photoModal.classList.remove("hidden");

    isCapturing = false;
  });

downloadBtn?.addEventListener("click", () => {
  if (!modalImage.src) return;
  const frameColor = previewFrame.style.borderColor || defaultBorderColor;
  const scale = 2;
  const rect = captureContainer.getBoundingClientRect();
  const canvasWidth = rect.width * scale;
  const canvasHeight = rect.height * scale;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");

  const radius = 20 * scale;
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

  // Frame background color
  ctx.fillStyle = frameColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Polaroid gradient
  const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  gradient.addColorStop(0, "#f9f9f9");
  gradient.addColorStop(1, "#eaeaea");
  ctx.fillStyle = gradient;

  const paddingX = 14 * scale;
  const paddingY = 14 * scale;
  const bottomExtra = 84 * scale;
  ctx.fillRect(paddingX, paddingY, canvasWidth - paddingX * 2, canvasHeight - bottomExtra);

  const img = new Image();
  img.src = modalImage.src;
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

    // Logo
    const logoImgCanvas = new Image();
    logoImgCanvas.src = isColorDark(frameColor)
      ? "assets/pb-logo-no-bg-w.png"
      : "assets/pb-logo-no-bg.png";
    logoImgCanvas.onload = () => {
      const logoHeight = 30 * scale;
      const logoRatio = logoImgCanvas.width / logoImgCanvas.height;
      const logoWidth = logoHeight * logoRatio;
      const x = (canvasWidth - logoWidth) / 2;
      const y = canvasHeight - 50 * scale;
      ctx.drawImage(logoImgCanvas, x, y, logoWidth, logoHeight);

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = getPolaroidFilename();
      link.click();
    };
  };
});


shareBtn?.addEventListener("click", () => {
  if (!modalImage.src) return;
  const frameColor = previewFrame.style.borderColor || defaultBorderColor;
  const scale = 2;
  const rect = captureContainer.getBoundingClientRect();
  const canvasWidth = rect.width * scale;
  const canvasHeight = rect.height * scale;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");

  const radius = 20 * scale;
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

  // Frame background color
  ctx.fillStyle = frameColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Polaroid gradient
  const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  gradient.addColorStop(0, "#f9f9f9");
  gradient.addColorStop(1, "#eaeaea");
  ctx.fillStyle = gradient;

  const paddingX = 14 * scale;
  const paddingY = 14 * scale;
  const bottomExtra = 84 * scale;
  ctx.fillRect(paddingX, paddingY, canvasWidth - paddingX * 2, canvasHeight - bottomExtra);

  const img = new Image();
  img.src = modalImage.src;
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

    // Logo
    const logoImgCanvas = new Image();
    logoImgCanvas.src = isColorDark(frameColor)
      ? "assets/pb-logo-no-bg-w.png"
      : "assets/pb-logo-no-bg.png";
    logoImgCanvas.onload = () => {
      const logoHeight = 30 * scale;
      const logoRatio = logoImgCanvas.width / logoImgCanvas.height;
      const logoWidth = logoHeight * logoRatio;
      const x = (canvasWidth - logoWidth) / 2;
      const y = canvasHeight - 50 * scale;
      ctx.drawImage(logoImgCanvas, x, y, logoWidth, logoHeight);

      // Share logic
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], getPolaroidFilename(), { type: "image/png" });

        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({
              title: "My Photobooth Shot",
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
  };
});
  /* ---------------------- */
  /* MODAL CONTROLS */
  /* ---------------------- */
  function resetModal() {
    modalImage.src = "";
    previewFrame.style.borderColor = defaultBorderColor;
    updateLogoColor(defaultBorderColor);
  }

  function resetEffects() {
    currentEffect = 'none';
    applyEffectToVideoPreview();
    
    // Reset effect options UI
    effectOptions.forEach(option => {
      option.classList.remove('active');
      if (option.dataset.effect === 'none') {
        option.classList.add('active');
      }
    });
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
    resetEffects(); 
    window.resetTimer();
  });

  photoModal?.addEventListener("click", (e) => {
    if (e.target === photoModal) {
      photoModal.classList.remove("show");
      photoModal.classList.add("hidden");
      resetModal();
    }
  }); 

  initCamera();
});