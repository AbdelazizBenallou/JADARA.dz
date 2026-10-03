// Testimonial Carousel Slider
  (function initTestimonials() {
    const slides = document.querySelectorAll('.testimonial-slide');
    const dots = document.querySelectorAll('.dot-indicator');
    const prevBtn = document.getElementById('prev-test');
    const nextBtn = document.getElementById('next-test');
    if (!slides.length) return;

    let currentIndex = 0;
    slides.forEach((slide, i) => {
      if (slide.classList.contains('opacity-100')) currentIndex = i;
    });

    function showSlide(index, dir) {
      const step = dir || (index > currentIndex ? 1 : -1);
      slides.forEach((slide, i) => {
        slide.classList.add('pg-slide');
        if (i === index) {
          slide.classList.remove('opacity-0', 'pointer-events-none', 'absolute', 'inset-0');
          slide.classList.add('opacity-100');
          slide.style.transform = 'none';
        } else {
          slide.classList.add('opacity-0', 'pointer-events-none', 'absolute', 'inset-0');
          slide.classList.remove('opacity-100');
          slide.style.transform = 'translate3d(' + (i > index ? 1 : -1) * step * 26 + 'px, 0, 0)';
        }
      });

      dots.forEach((dot, i) => {
        dot.classList.add('pg-dot');
        if (i === index) {
          dot.classList.add('bg-primary', 'is-on');
          dot.classList.remove('bg-outline-variant');
        } else {
          dot.classList.remove('bg-primary', 'is-on');
          dot.classList.add('bg-outline-variant');
        }
      });
      currentIndex = index;
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const from = currentIndex;
        currentIndex = (currentIndex + 1) % slides.length;
        showSlide(currentIndex, currentIndex >= from ? 1 : -1);
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const from = currentIndex;
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        showSlide(currentIndex, currentIndex <= from ? -1 : 1);
      });
    }
  })();
