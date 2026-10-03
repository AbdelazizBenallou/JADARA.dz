// Contact Form Validation, Animation & In-place Confirmation State
  (function initContactForm() {
    const form = document.getElementById('contact-form');
    const formContainer = document.getElementById('contact-form-container');
    const successState = document.getElementById('contact-success-state');
    const resetBtn = document.getElementById('reset-contact-form-btn');
    if (!form) return;

    // Email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function validateField(field) {
      const wrapper = field.closest('.field-wrapper');
      if (!wrapper) return true;
      const errorEl = wrapper.querySelector('.field-error');
      const errorMsgEl = wrapper.querySelector('.error-msg');
      const val = field.value.trim();
      let isValid = true;
      let errorText = "This field is required.";

      if (field.required && !val) {
        isValid = false;
      } else if (field.type === 'email' && val && !emailRegex.test(val)) {
        isValid = false;
        errorText = "Please enter a valid email address.";
      }

      if (!isValid) {
        if (errorMsgEl) errorMsgEl.innerText = errorText;
        if (errorEl) errorEl.classList.remove('hidden');
        field.classList.add('border-error');
        field.classList.remove('border-[#DDD8E5]', 'focus:border-[#4d1b65]');
      } else {
        if (errorEl) errorEl.classList.add('hidden');
        field.classList.remove('border-error');
        field.classList.add('border-[#DDD8E5]', 'focus:border-[#4d1b65]');
      }

      return isValid;
    }

    form.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('input', () => {
        validateField(input);
      });
      input.addEventListener('blur', () => {
        validateField(input);
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let allValid = true;
      const inputs = form.querySelectorAll('input[required], textarea[required]');
      inputs.forEach(input => {
        if (!validateField(input)) {
          allValid = false;
        }
      });

      if (allValid) {
        const sendBtn = document.getElementById('contact-submit-btn');
        if (sendBtn) sendBtn.classList.add('is-sending');
        window.setTimeout(() => {
          if (sendBtn) sendBtn.classList.remove('is-sending');
          form.classList.add('hidden');
          successState.classList.remove('hidden');
          successState.classList.add('flex');
        }, 620);
      }
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        form.reset();
        successState.classList.add('hidden');
        successState.classList.remove('flex');
        form.classList.remove('hidden');
        const sendBtn = document.getElementById('contact-submit-btn');
        if (sendBtn) sendBtn.classList.remove('is-sending');
      });
    }
  })();
