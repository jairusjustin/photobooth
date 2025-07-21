const hamburger = document.querySelector('.hamburger');

const mobileMenu = document.createElement('div');
mobileMenu.classList.add('mobile-menu');
mobileMenu.innerHTML = `
  <ul>
    <li><a href="#" class="active">Home</a></li>
    <li><a href="#">About</a></li>
    <li><a href="#">Privacy Policy</a></li>
    <li><a href="#">Contact</a></li>
    <li>
      <a href="https://github.com/jairusjustin" target="_blank">
        <img src="../assets/github-icon.png" alt="GitHub" style="height: 24px; width: 24px;" />
      </a>
    </li>
  </ul>
`;
document.body.appendChild(mobileMenu);

hamburger.addEventListener('click', () => {
  const expanded = hamburger.getAttribute('aria-expanded') === 'true' || false;
  hamburger.setAttribute('aria-expanded', !expanded);
  mobileMenu.classList.toggle('open');
});
