// Scroll-link + active highlight
const links = document.querySelectorAll('.scroll-link');
const sections = [...links].map(link => document.querySelector(link.getAttribute('href')));

// Smooth scroll + activate link
function activateLink() {
  const scrollPos = window.scrollY || window.pageYOffset;

  sections.forEach((section, index) => {
    if (
      section.offsetTop <= scrollPos + 120 &&
      section.offsetTop + section.offsetHeight > scrollPos + 120
    ) {
      links.forEach(link => link.classList.remove('active'));
      links[index].classList.add('active');
      sections[index].classList.add('hover-highlight');
    } else {
      sections[index].classList.remove('hover-highlight');
    }
  });
}

window.addEventListener('scroll', activateLink);
activateLink();

// Fade-in sections
const infoSections = document.querySelectorAll('.info-section');

function revealSections() {
  const windowBottom = window.innerHeight + window.scrollY;
  infoSections.forEach(section => {
    if (windowBottom > section.offsetTop + 100) {
      section.classList.add('visible');
    }
  });
}

window.addEventListener('scroll', revealSections);
revealSections();

// Click link scroll + highlight
links.forEach((link, index) => {
  link.addEventListener('click', () => {
    links.forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    sections.forEach(sec => sec.classList.remove('hover-highlight'));
    sections[index].classList.add('hover-highlight');
  });
});
