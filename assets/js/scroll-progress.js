(function () {
  const indicator = document.getElementById('scroll-indicator');
  if (!indicator) return;
  let queued = false;
  function paint() {
    queued = false;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = height > 0 ? Math.min(Math.max(window.pageYOffset / height, 0), 1) : 0;
    indicator.style.transform = 'scaleX(' + progress.toFixed(4) + ')';
  }
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(paint);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  paint();
})();
