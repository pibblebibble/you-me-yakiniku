/* ============================================
   Jon & Viv: We Ball
   Interactions & motion
   ============================================ */

(function () {
  'use strict';

  /* ---------- Scroll reveal ---------- */
  function setupScrollReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || !els.length) {
      els.forEach(function (el) { el.classList.add('in-view'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Confetti burst (thank-you page) ---------- */
  function setupConfetti() {
    var host = document.querySelector('[data-confetti]');
    if (!host) return;
    var colours = ['#224da5', '#4d75c7', '#1a3d85', '#eaf0fb', '#FFFFFF'];
    var pieces = 36;

    // Deterministic pseudo-random
    function rand(seed) {
      var x = Math.sin(seed * 9301 + 49297) * 233280;
      return x - Math.floor(x);
    }

    for (var i = 0; i < pieces; i++) {
      var angle = (i / pieces) * Math.PI * 2 + rand(i) * 0.4;
      var distance = 200 + rand(i + 7) * 220;
      var x = Math.cos(angle) * distance;
      var y = Math.sin(angle) * distance * 0.85;
      var rot = (rand(i + 11) - 0.5) * 1080;
      var colour = colours[i % colours.length];
      var width = 8 + Math.floor(rand(i + 3) * 6);
      var height = 12 + Math.floor(rand(i + 5) * 10);
      var delay = Math.floor(rand(i + 13) * 800);
      var piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.setProperty('--x', x.toFixed(1) + 'px');
      piece.style.setProperty('--y', y.toFixed(1) + 'px');
      piece.style.setProperty('--r', rot.toFixed(0) + 'deg');
      piece.style.setProperty('--d', delay + 'ms');
      piece.style.background = colour;
      piece.style.width = width + 'px';
      piece.style.height = height + 'px';
      host.appendChild(piece);
    }
  }

  /* ---------- RSVP form ---------- */
  function setupRsvpForm() {
    var form = document.querySelector('[data-rsvp-form]');
    if (!form) return;
    var statusEl = form.querySelector('[data-form-status]');

    function setError(name, msg) {
      var wrap = form.querySelector('[data-field="' + name + '"]');
      var msgEl = form.querySelector('[data-error-for="' + name + '"]');
      if (wrap) wrap.classList.add('has-error');
      if (msgEl) msgEl.textContent = msg;
    }
    function clearError(name) {
      var wrap = form.querySelector('[data-field="' + name + '"]');
      var msgEl = form.querySelector('[data-error-for="' + name + '"]');
      if (wrap) wrap.classList.remove('has-error');
      if (msgEl) msgEl.textContent = '';
    }
    function clearAllErrors() {
      form.querySelectorAll('[data-field]').forEach(function (el) {
        el.classList.remove('has-error');
      });
      form.querySelectorAll('[data-error-for]').forEach(function (el) {
        el.textContent = '';
      });
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.className = 'form-status';
      }
    }

    // Attendance sync — toggles visibility of attending-only fields
    var attendanceRadios = form.querySelectorAll('input[name="attendance"]');
    function syncAttendance() {
      var picked = form.querySelector('input[name="attendance"]:checked');
      if (!picked) return;
      form.setAttribute('data-attendance', picked.value.indexOf('No') === 0 ? 'no' : 'yes');
    }
    attendanceRadios.forEach(function (r) { r.addEventListener('change', syncAttendance); });
    syncAttendance();

    // Plus-one sync — opens the name field when "Yes" picked
    var plusOneRadios = form.querySelectorAll('input[name="plus_one"]');
    var plusOneNameWrap = form.querySelector('[data-conditional="plus-one-name"]');
    function syncPlusOne() {
      var picked = form.querySelector('input[name="plus_one"]:checked');
      if (!picked || !plusOneNameWrap) return;
      if (picked.value === 'Yes') {
        plusOneNameWrap.classList.add('is-open');
      } else {
        plusOneNameWrap.classList.remove('is-open');
      }
    }
    plusOneRadios.forEach(function (r) { r.addEventListener('change', syncPlusOne); });
    syncPlusOne();

    // Clear errors on input
    form.querySelectorAll('input, textarea').forEach(function (input) {
      input.addEventListener('input', function () {
        var wrap = input.closest('[data-field]');
        if (!wrap) return;
        var name = wrap.getAttribute('data-field');
        var msgEl = form.querySelector('[data-error-for="' + name + '"]');
        if (msgEl && msgEl.textContent) clearError(name);
      });
      input.addEventListener('change', function () {
        var wrap = input.closest('[data-field]');
        if (!wrap) return;
        var name = wrap.getAttribute('data-field');
        var msgEl = form.querySelector('[data-error-for="' + name + '"]');
        if (msgEl && msgEl.textContent) clearError(name);
      });
    });

    function validate() {
      clearAllErrors();
      var errors = [];
      var attending = form.querySelector('input[name="attendance"]:checked');
      var isAttending = attending && attending.value.indexOf('Yes') === 0;

      // Name
      var first = (form.querySelector('[name="first_name"]').value || '').trim();
      var last  = (form.querySelector('[name="last_name"]').value || '').trim();
      if (first.length < 1 || last.length < 1) {
        errors.push({field: 'full_name', msg: 'Please give us both your first and last name.'});
      }

      // Attendance
      if (!attending) {
        errors.push({field: 'attendance', msg: 'Let us know if you can make it.'});
      }

      // Email always required
      var email = (form.querySelector('[name="email"]').value || '').trim();
      var emailOK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailOK) {
        errors.push({field: 'email', msg: 'A valid email, please.'});
      }

      // Phone always required (people might decline but we want to reach them)
      var phoneRaw = (form.querySelector('[name="phone"]').value || '').trim();
      var phoneClean = phoneRaw.replace(/[\s\-()]/g, '');
      var phoneOK = /^\+?[1-9]\d{6,14}$/.test(phoneClean);
      if (!phoneOK) {
        errors.push({field: 'phone', msg: 'Looks off — please give us a reachable number.'});
      }

      // If attending: Side, Participation, Plus One all required
      if (isAttending) {
        if (!form.querySelector('input[name="side"]:checked')) {
          errors.push({field: 'side', msg: "Bride or Groom's side?"});
        }
        if (!form.querySelector('input[name="participation"]:checked')) {
          errors.push({field: 'participation', msg: 'Reception, dinner, or both?'});
        }
        if (!form.querySelector('input[name="plus_one"]:checked')) {
          errors.push({field: 'plus_one', msg: 'Bringing a plus one?'});
        }
      }

      return errors;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');

      var errs = validate();
      if (errs.length) {
        errs.forEach(function (er) { setError(er.field, er.msg); });
        if (statusEl) {
          statusEl.textContent = 'A few bits need a look.';
          statusEl.className = 'form-status is-error';
        }
        var first = form.querySelector('.has-error');
        if (first) first.scrollIntoView({behavior: 'smooth', block: 'center'});
        return;
      }

      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      if (statusEl) { statusEl.textContent = ''; statusEl.className = 'form-status is-info'; }

      var endpoint = form.getAttribute('action') || '';
      var isReal = endpoint.indexOf('formspree.io/f/') !== -1
                   && endpoint.indexOf('REPLACE_WITH_YOUR') === -1;

      if (!isReal) {
        // Preview mode — skip the network call
        setTimeout(function () { window.location.href = 'thank-you.html'; }, 500);
        return;
      }

      var data = new FormData(form);
      fetch(endpoint, {
        method: 'POST',
        body: data,
        headers: {'Accept': 'application/json'}
      })
        .then(function (res) {
          if (res.ok) {
            window.location.href = 'thank-you.html';
            return;
          }
          return res.json().then(function (body) {
            throw new Error((body && body.error) || 'Submission failed');
          });
        })
        .catch(function (err) {
          if (btn) { btn.disabled = false; btn.textContent = 'Send RSVP'; }
          if (statusEl) {
            statusEl.textContent = "That didn't go through — please try again.";
            statusEl.className = 'form-status is-error';
          }
          console.warn('RSVP error:', err);
        });
    });
  }

  /* ---------- Runaway cat ----------
     Desktop (hover-capable): cat translates AWAY from the cursor when the
     pointer gets within a threshold, smoothly returning when it leaves.
     Touch (no hover): each tap toggles the cat right ↔ left of its base.
     Either way, a startled tooltip ("?!?", "!!!", "🥺", "nooo") pops above
     the cat while it's running.
  */
  function setupRunawayCat() {
    var cat = document.querySelector('[data-cat-runaway]');
    if (!cat) return;

    var prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    var STARTLES = ['?!?', '!!!', '🥺', 'nooo', '😾', 'meow?!', 'STOPPP', '>:(', '😿', 'help', 'rude'];
    var tooltipEl = cat.querySelector('[data-cat-tooltip]');
    var rotateTimer = null;

    function pickStartle() {
      // Avoid picking the same text twice in a row — feels more alive
      var current = tooltipEl ? tooltipEl.textContent : '';
      var pick;
      do { pick = STARTLES[Math.floor(Math.random() * STARTLES.length)]; }
      while (pick === current && STARTLES.length > 1);
      return pick;
    }
    function startle() {
      if (tooltipEl) tooltipEl.textContent = pickStartle();
      cat.classList.add('is-startled');
      // Keep rotating the text while user keeps the cat startled
      clearInterval(rotateTimer);
      rotateTimer = setInterval(function () {
        if (tooltipEl) tooltipEl.textContent = pickStartle();
      }, 1100);
    }
    function calm() {
      cat.classList.remove('is-startled');
      clearInterval(rotateTimer);
    }

    var hasFineHover = matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (hasFineHover) {
      var THRESHOLD = 180;
      // Tighter caps so the cat stays inside its panel (never disappears behind
      // the adjacent Location panel).
      var MAX_X = 70;
      var MAX_Y = 50;
      var ticking = false;
      var lastX = 0, lastY = 0;
      var wasStartled = false;
      var calmTimer = null;

      function update() {
        ticking = false;
        var rect = cat.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = lastX - cx;
        var dy = lastY - cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < THRESHOLD) {
          var strength = (THRESHOLD - dist) / THRESHOLD;
          var ax = -dx * strength * 0.85;
          var ay = -dy * strength * 0.85;
          if (ax >  MAX_X) ax =  MAX_X;
          if (ax < -MAX_X) ax = -MAX_X;
          if (ay >  MAX_Y) ay =  MAX_Y;
          if (ay < -MAX_Y) ay = -MAX_Y;
          cat.style.transform = 'translate(' + ax.toFixed(0) + 'px, ' + ay.toFixed(0) + 'px)';
          // Only re-pick a tooltip when transitioning from calm → startled
          if (!wasStartled) {
            startle();
            wasStartled = true;
          }
          clearTimeout(calmTimer);
        } else {
          cat.style.transform = '';
          if (wasStartled) {
            clearTimeout(calmTimer);
            calmTimer = setTimeout(function () {
              calm();
              wasStartled = false;
            }, 400);
          }
        }
      }

      document.addEventListener('mousemove', function (e) {
        lastX = e.clientX;
        lastY = e.clientY;
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      }, { passive: true });

      document.addEventListener('mouseleave', function () {
        cat.style.transform = '';
        calm();
        wasStartled = false;
      });

    } else {
      // Touch: shorter scoot so the cat stays inside the panel on narrow phones.
      var step = 0;
      var TAP_DIST = 55;  // px each side
      cat.addEventListener('click', function (e) {
        e.stopPropagation();
        if (step === 0) step = 1;
        else step = -step;
        cat.style.transform = 'translateX(' + (step * TAP_DIST) + 'px)';
        startle();
      });
      document.addEventListener('click', function (e) {
        if (e.target === cat || cat.contains(e.target)) return;
        if (step !== 0) {
          step = 0;
          cat.style.transform = '';
          calm();
        }
      });
    }
  }

  /* ---------- Boot ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    setupScrollReveal();
    setupConfetti();
    setupRsvpForm();
    setupRunawayCat();
  }
})();
