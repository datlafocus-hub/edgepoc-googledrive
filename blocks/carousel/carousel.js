/**
 * Updates indicator and button state for the visible slide.
 * @param {Element} block The carousel block element
 * @param {number} index The visible slide index
 */
function setActiveSlide(block, index) {
  block.dataset.activeSlide = index;
  block.querySelectorAll('.carousel-slide').forEach((slide, i) => {
    slide.setAttribute('aria-hidden', i !== index);
    slide.querySelectorAll('a, button, input, select, textarea').forEach((el) => {
      if (i === index) el.removeAttribute('tabindex');
      else el.tabIndex = -1;
    });
  });
  block.querySelectorAll('.carousel-indicators button').forEach((button, i) => {
    if (i === index) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  });
}

/**
 * Scrolls a slide into view, wrapping at either end.
 * @param {Element} block The carousel block element
 * @param {number} index The slide index to show
 */
function showSlide(block, index) {
  const slides = block.querySelectorAll('.carousel-slide');
  const target = (index + slides.length) % slides.length;
  const track = block.querySelector('.carousel-slides');
  track.scrollTo({ left: slides[target].offsetLeft - track.offsetLeft, behavior: 'smooth' });
  setActiveSlide(block, target);
}

/**
 * Turns each row (image | text) into a scroll-snap slide.
 * @param {Element} block The carousel block element
 */
export default function decorate(block) {
  const track = document.createElement('ul');
  track.className = 'carousel-slides';

  [...block.children].forEach((row) => {
    const slide = document.createElement('li');
    slide.className = 'carousel-slide';
    [...row.children].forEach((cell) => {
      if (!cell.textContent.trim() && !cell.querySelector('picture')) return;
      cell.className = cell.children.length === 1 && cell.querySelector('picture')
        ? 'carousel-slide-image'
        : 'carousel-slide-content';
      slide.append(cell);
    });
    if (slide.children.length) track.append(slide);
  });

  const slides = [...track.children];
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.replaceChildren(track);
  if (slides.length < 2) return;

  slides.forEach((slide, i) => {
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${i + 1} of ${slides.length}`);
  });

  const nav = document.createElement('div');
  nav.className = 'carousel-navigation';
  nav.innerHTML = `
    <button type="button" class="carousel-prev" aria-label="Previous slide"></button>
    <button type="button" class="carousel-next" aria-label="Next slide"></button>`;
  nav.querySelector('.carousel-prev').addEventListener('click', () => {
    showSlide(block, Number(block.dataset.activeSlide) - 1);
  });
  nav.querySelector('.carousel-next').addEventListener('click', () => {
    showSlide(block, Number(block.dataset.activeSlide) + 1);
  });

  const indicators = document.createElement('ol');
  indicators.className = 'carousel-indicators';
  slides.forEach((slide, i) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Show slide ${i + 1}`);
    button.addEventListener('click', () => showSlide(block, i));
    li.append(button);
    indicators.append(li);
  });

  block.append(nav, indicators);
  setActiveSlide(block, 0);

  // keep indicators in sync when users swipe or scroll the track directly
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActiveSlide(block, slides.indexOf(entry.target));
    });
  }, { root: track, threshold: 0.6 });
  slides.forEach((slide) => observer.observe(slide));
}
