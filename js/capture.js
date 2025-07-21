/* ---------------------- */
/* CAMERA & VIDEO SETUP   */
/* ---------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  const video = document.getElementById('video');
  const startBtn = document.getElementById('start');
  const countdown = document.getElementById('countdown');
  const strip = document.getElementById('strip');
  let stream = null;

  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.hidden = false;

    video.onloadedmetadata = () => {
      startBtn.hidden = false; 
    };
  } catch (err) {
    alert('Webcam access denied or unavailable: ' + err.message);
  }

  /* ---------------------- */
  /* PHOTOBOOTH INTERACTION */
  /* ---------------------- */
  function takeSnapshot() {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    // Mirror image horizontally to match CSS transform
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    ctx.drawImage(video, 0, 0);

    const img = document.createElement('img');
    img.src = canvas.toDataURL('image/png');
    img.style.maxWidth = '100px';  
    img.style.borderRadius = '8px';
    img.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
    strip.appendChild(img);
  }

  function runPhotobooth() {
    strip.innerHTML = '';  
    let photoCount = 0;

    function countdownStep(count) {
      if (count > 0) {
        countdown.textContent = count;
        setTimeout(() => countdownStep(count - 1), 1000);
      } else {
        countdown.textContent = '📸';
        takeSnapshot();
        photoCount++;
        if (photoCount < 3) {
          setTimeout(() => countdownStep(3), 1000); // Restart countdown for next photo
        } else {
          setTimeout(() => (countdown.textContent = ''), 1000); // Clear countdown after last photo
          startBtn.disabled = false; // Re-enable start button
        }
      }
    }

    startBtn.disabled = true; // Disable start while running
    countdownStep(3); // Start countdown at 3
  }

  startBtn.addEventListener('click', runPhotobooth);
});
