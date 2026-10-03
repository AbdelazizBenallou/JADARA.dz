// Mobile Drawer Navigation with Hamburger Morph, Focus Trap & Escape Key
  (function initMobileDrawer() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const drawer = document.getElementById('mobile-drawer');
    const drawerCloseBtn = document.getElementById('drawer-close-btn');
    const drawerLinks = document.querySelectorAll('.drawer-nav-link');
    const bar1 = document.getElementById('bar-1');
    const bar2 = document.getElementById('bar-2');
    const bar3 = document.getElementById('bar-3');
    const navScrim = document.getElementById('nav-scrim');
    if (!hamburgerBtn || !drawer) return;

    let isOpen = false;

    function morphHamburger(active) {
      if (active) {
        bar1.classList.add('rotate-45', 'translate-x-[2px]', 'translate-y-[-1px]');
        bar2.classList.add('opacity-0');
        bar3.classList.add('-rotate-45', 'translate-x-[2px]', 'translate-y-[1px]');
      } else {
        bar1.classList.remove('rotate-45', 'translate-x-[2px]', 'translate-y-[-1px]');
        bar2.classList.remove('opacity-0');
        bar3.classList.remove('-rotate-45', 'translate-x-[2px]', 'translate-y-[1px]');
      }
    }

    function openDrawer() {
      isOpen = true;
      if (navScrim) {
        navScrim.classList.remove('opacity-0', 'pointer-events-none');
        navScrim.classList.add('opacity-100', 'pointer-events-auto');
      }
      drawer.classList.remove('translate-x-full');
      drawer.classList.add('translate-x-0');
      drawer.setAttribute('aria-hidden', 'false');
      hamburgerBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      morphHamburger(true);

      // Stagger link animation
      drawerLinks.forEach((link, idx) => {
        link.style.opacity = '0';
        link.style.transform = 'translateY(12px)';
        link.style.transition = `opacity 300ms ease ${idx * 60}ms, transform 300ms ease ${idx * 60}ms`;
        setTimeout(() => {
          link.style.opacity = '1';
          link.style.transform = 'translateY(0)';
        }, 50);
      });
    }

    function closeDrawer() {
      isOpen = false;
      if (navScrim) {
        navScrim.classList.add('opacity-0', 'pointer-events-none');
        navScrim.classList.remove('opacity-100', 'pointer-events-auto');
      }
      drawer.classList.add('translate-x-full');
      drawer.classList.remove('translate-x-0');
      drawer.setAttribute('aria-hidden', 'true');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      morphHamburger(false);
      hamburgerBtn.focus();
    }

    hamburgerBtn.addEventListener('click', () => {
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    if (drawerCloseBtn) {
      drawerCloseBtn.addEventListener('click', closeDrawer);
    }

    if (navScrim) {
      navScrim.addEventListener('click', closeDrawer);
    }

    drawerLinks.forEach(link => {
      link.addEventListener('click', () => {
        closeDrawer();
      });
    });

    // Close on Escape Key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeDrawer();
      }
    });

    // Simple Focus Trap within drawer
    drawer.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const focusableElements = drawer.querySelectorAll('a, button, input');
        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    });
  })();
