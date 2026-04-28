// ── Live photo carousel ──
document.addEventListener('DOMContentLoaded', function () {
  const carousel = document.querySelector('.live-carousel')
  if (!carousel) return

  const viewport = carousel.querySelector('.live-carousel-viewport')
  const track = carousel.querySelector('.live-carousel-track')
  const slides = Array.from(carousel.querySelectorAll('.live-carousel-slide'))
  const dotsContainer = carousel.querySelector('.carousel-dots')
  const caption = carousel.querySelector('.live-caption')
  const prevBtn = carousel.querySelector('.carousel-prev')
  const nextBtn = carousel.querySelector('.carousel-next')

  // Per-slide captions — add text here when ready
  const captions = [
    '', '', '', '', '', '', '', '', ''
  ]

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
    if (caption) caption.textContent = captions[current] || ''
  }

  prevBtn.addEventListener('click', () => goTo(current - 1))
  nextBtn.addEventListener('click', () => goTo(current + 1))

  // Touch / swipe support
  let startX = 0, startY = 0, dragging = false
  viewport.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
    dragging = true
  }, { passive: true })

  viewport.addEventListener('touchend', e => {
    if (!dragging) return
    const dx = startX - e.changedTouches[0].clientX
    const dy = startY - e.changedTouches[0].clientY
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 35) {
      goTo(current + (dx > 0 ? 1 : -1))
    }
    dragging = false
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
