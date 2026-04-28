// ── Live photo carousel ──
document.addEventListener('DOMContentLoaded', function () {
  const carousel = document.querySelector('.live-carousel')
  if (!carousel) return

  const track = carousel.querySelector('.live-carousel-track')
  const slides = Array.from(carousel.querySelectorAll('.live-carousel-slide'))
  const dotsContainer = carousel.querySelector('.carousel-dots')
  const prevBtn = carousel.querySelector('.carousel-prev')
  const nextBtn = carousel.querySelector('.carousel-next')

  let current = 0
  const total = slides.length

  // Build dots
  slides.forEach((_, i) => {
    const dot = document.createElement('span')
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '')
    dot.addEventListener('click', () => goTo(i))
    dotsContainer.appendChild(dot)
  })

  function goTo(index) {
    current = (index + total) % total
    track.style.transform = `translateX(-${current * 100}%)`
    dotsContainer.querySelectorAll('.carousel-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current)
    })
  }

  prevBtn.addEventListener('click', () => goTo(current - 1))
  nextBtn.addEventListener('click', () => goTo(current + 1))

  // Touch / swipe support
  let startX = 0
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX }, { passive: true })
  track.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) goTo(current + (diff > 0 ? 1 : -1))
  }, { passive: true })
})

// Smooth scroll for all scroll-link elements
document.addEventListener('DOMContentLoaded', function() {
  const scrollLinks = document.querySelectorAll('.scroll-link');

  scrollLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');

      // Only handle internal anchor links
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);

        if (target) {
          const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 20;

          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      }
    });
  });
});
