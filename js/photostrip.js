document.addEventListener("DOMContentLoaded", () => {
  /* ---------------------- */
  /* ELEMENTS */
  /* ---------------------- */
  const video = document.getElementById("polaroid-preview");
  const permissionOverlay = document.getElementById("camera-permission-overlay");
  const allowBtn = document.getElementById("allow-camera-btn");
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

  /* ---------------------- */
  /* CAMERA INITIALIZATION */
  /* ---------------------- */
  async function initCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false
      });
      video.srcObject = stream;
      await video.play();
      permissionOverlay.classList.add("hidden");
    } catch (err) {
      console.error("Camera access denied:", err);
      permissionOverlay.classList.remove("hidden");
    }
  }

  allowBtn?.addEventListener("click", () => initCamera());
  initCamera();

  /* ---------------------- */
  /* PHOTOSTRIP CAPTURE */
  /* ---------------------- */
startBtn.addEventListener("click", () => {
  if (currentSlot >= slots.length) return;

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");

  // Mirror the image
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imgData = canvas.toDataURL("image/png");

  // Populate page preview slot
  const img = new Image();
  img.src = imgData;
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "cover";
  img.style.objectPosition = "center";
  slots[currentSlot].innerHTML = "";
  slots[currentSlot].appendChild(img);

  // Also save the captured data for modal population
  slots[currentSlot].dataset.imgData = imgData;

  currentSlot++;

  if (currentSlot === slots.length) {
    setTimeout(() => {
      // Show modal template
      photoModal.classList.remove("hidden");
      photoModal.classList.add("show");

      // Populate modal slots from saved data
      slots.forEach((slot, index) => {
        const data = slot.dataset.imgData;
        if (data) {
          const modalImg = new Image();
          modalImg.src = data;
          modalImg.style.width = "100%";
          modalImg.style.height = "100%";
          modalImg.style.objectFit = "cover";
          modalImg.style.objectPosition = "center";

          const modalSlot = document.getElementById(`modal-slot-${index + 1}`);
          modalSlot.innerHTML = ""; // clear old image
          modalSlot.appendChild(modalImg);
        }
      });
    }, 500);
  }
});

/* ---------------------- */
/* DOWNLOAD PHOTOSTRIP */
/* ---------------------- */
downloadBtn?.addEventListener("click", () => {
  const photostrip = document.getElementById("photostrip-preview");
  if (!photostrip) return;

  const canvas = document.createElement("canvas");
  const width = 140;
  const height = 475;
  const border = 8;
  const radius = 10; // matches border-radius in CSS
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Draw rounded white background
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(width - radius, 0);
  ctx.quadraticCurveTo(width, 0, width, radius);
  ctx.lineTo(width, height - radius);
  ctx.quadraticCurveTo(width, height, width - radius, height);
  ctx.lineTo(radius, height);
  ctx.quadraticCurveTo(0, height, 0, height - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  // Clip to rounded rectangle for images
  ctx.save();
  ctx.clip();

  // Draw each slot image
  const slots = photostrip.querySelectorAll(".strip-slot");
  const slotGap = 4;
  slots.forEach((slot, index) => {
    const img = slot.querySelector("img");
    if (!img) return;

    const slotWidth = width;
    const slotHeight = 150;
    const slotY = index * (slotHeight + slotGap);

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const slotRatio = slotWidth / slotHeight;
    let sWidth, sHeight, sx, sy;

    if (imgRatio > slotRatio) {
      sHeight = img.naturalHeight;
      sWidth = sHeight * slotRatio;
      sx = (img.naturalWidth - sWidth) / 2;
      sy = 0;
    } else {
      sWidth = img.naturalWidth;
      sHeight = sWidth / slotRatio;
      sx = 0;
      sy = (img.naturalHeight - sHeight) / 2;
    }

    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, slotY, slotWidth, slotHeight);
  });

  ctx.restore(); // remove clip

  // Draw border around canvas
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = border;
  ctx.beginPath();
  ctx.moveTo(radius, border/2);
  ctx.lineTo(width - radius, border/2);
  ctx.quadraticCurveTo(width - border/2, border/2, width - border/2, radius);
  ctx.lineTo(width - border/2, height - radius);
  ctx.quadraticCurveTo(width - border/2, height - border/2, width - radius, height - border/2);
  ctx.lineTo(radius, height - border/2);
  ctx.quadraticCurveTo(border/2, height - border/2, border/2, height - radius);
  ctx.lineTo(border/2, radius);
  ctx.quadraticCurveTo(border/2, border/2, radius, border/2);
  ctx.closePath();
  ctx.stroke();

  // Draw logo
  const logo = photostrip.querySelector(".photostrip-caption .logo");
  if (logo) {
    const logoImg = new Image();
    logoImg.src = logo.src;
    logoImg.onload = () => {
      const logoHeight = 15;
      const logoRatio = logoImg.width / logoImg.height;
      const logoWidth = logoHeight * logoRatio;
      const x = (canvas.width - logoWidth) / 2;
      const y = canvas.height - logoHeight - 2;
      ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);

      // Trigger download
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `photostrip-${Date.now()}.png`;
      link.click();
    };
  }
});





  /* ---------------------- */
  /* MODAL CONTROLS */
  /* ---------------------- */
  closeBtn?.addEventListener("click", () => window.location.href = "index.html");

  retakeBtn?.addEventListener("click", () => {
    // Hide modal
    photoModal.classList.remove("show");
    photoModal.classList.add("hidden");

    // Clear the main photostrip slots
    slots.forEach(slot => slot.innerHTML = "");

    // Reset current slot counter
    currentSlot = 0;
  });

  photoModal?.addEventListener("click", (e) => {
    if (e.target === photoModal) {
      photoModal.classList.remove("show");
      photoModal.classList.add("hidden");

      // Clear modal slots but keep template
      modalSlots.forEach(slot => slot.innerHTML = "");
    }
  });
});
