// DOM Elements
const startBtn = document.getElementById('start');
const video = document.getElementById('polaroid-preview');
const slots = [
  document.getElementById('slot-1'),
  document.getElementById('slot-2'),
  document.getElementById('slot-3')
];

let currentSlot = 0;

// Capture photo and populate slots
startBtn.addEventListener('click', () => {
  if(video.srcObject) {
    html2canvas(video).then(canvas => {
      const imgData = canvas.toDataURL('image/png');

      // Fill current slot
      const img = document.createElement('img');
      img.src = imgData;
      img.alt = "Captured Photo";

      // Mirror the image like camera preview
      img.style.transform = 'scaleX(-1)';

      // Clear existing content first
      slots[currentSlot].innerHTML = '';
      slots[currentSlot].appendChild(img);

      // Move to next slot
      currentSlot = (currentSlot + 1) % slots.length;
    });
  }
});

// Download miniature strip
const downloadStripBtn = document.getElementById('download-strip-btn');
downloadStripBtn.addEventListener('click', () => {
  html2canvas(document.getElementById('photostrip-preview')).then(canvas => {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'photo-strip.png';
    link.click();
  });
});
