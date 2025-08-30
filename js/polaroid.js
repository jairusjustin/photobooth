document.addEventListener("DOMContentLoaded", () => {
  /* ---------------------- */
  /* ELEMENTS */
  /* ---------------------- */
  const startBtn = document.getElementById("start");
  const video = document.getElementById("polaroid-preview");
  const photoModal = document.getElementById("photo-modal");
  const modalImage = document.getElementById("modal-image");
  const captureContainer = document.getElementById("capture-polaroid");
  const closeBtn = document.getElementById("close-btn");
  const retakeBtn = document.getElementById("retake-btn");
  const downloadBtn = document.getElementById("download-btn");

  /* ---------------------- */
  /* POLAROID CAPTURE + MODAL + DOWNLOAD */
  /* ---------------------- */
  startBtn?.addEventListener("click", async () => {
    // Wait for the global countdown
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

    // Download logic
    downloadBtn.onclick = () => {
      const canvas = document.createElement("canvas");
      const rect = captureContainer.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext("2d");

      // Polaroid background & gradient
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#f9f9f9");
      gradient.addColorStop(1, "#eaeaea");
      ctx.fillStyle = gradient;
      ctx.fillRect(14, 14, canvas.width - 28, canvas.height - 84);

      const img = new Image();
      img.src = canvasPhoto.toDataURL("image/png");
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
          sy = 0;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 14, 14, canvas.width - 28, canvas.height - 84);

        const logoImg = new Image();
        logoImg.src = "../assets/pb-logo.png";
        logoImg.onload = () => {
          const logoHeight = 30;
          const logoRatio = logoImg.width / logoImg.height;
          const logoWidth = logoHeight * logoRatio;
          const x = (canvas.width - logoWidth) / 2;
          const y = canvas.height - 50;
          ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);

          const link = document.createElement("a");
          link.href = canvas.toDataURL("image/png");
          link.download = `polaroid-${Date.now()}.png`;
          link.click();
        };
      };
    };
  });

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
