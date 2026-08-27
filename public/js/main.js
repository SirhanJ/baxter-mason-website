(function () {
  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var revealsStarted = false;
  function startReveals() {
    if (revealsStarted) return;
    revealsStarted = true;

    document.querySelectorAll(".page-hero .rv").forEach(function (el) {
      el.classList.add("in");
    });

    var io = new IntersectionObserver(
      function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    var vh = window.innerHeight || document.documentElement.clientHeight;
    document.querySelectorAll(".rv").forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) {
        el.classList.add("in");
      } else {
        io.observe(el);
      }
    });
  }

  var loader = document.getElementById("siteLoader");
  var loaderDismissed = false;
  function dismissLoader() {
    if (loaderDismissed) return;
    loaderDismissed = true;
    document.documentElement.classList.add("is-ready");
    if (loader) loader.classList.add("done");
    setTimeout(startReveals, loader ? 140 : 0);
  }

  if (reduceMotion || !loader) {
    dismissLoader();
  } else {
    var minShow = 650;
    function scheduleDismiss() {
      var wait = Math.max(
        0,
        minShow - (window.performance ? performance.now() : minShow),
      );
      setTimeout(dismissLoader, wait);
    }
    if (document.readyState === "complete") {
      scheduleDismiss();
    } else {
      window.addEventListener("load", scheduleDismiss);
    }
    setTimeout(dismissLoader, 3600);
  }

  function ease(t) {
    return 1 - Math.pow(1 - t, 4);
  }
  var cio = new IntersectionObserver(
    function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target,
          to = +el.dataset.to,
          dur = 1500,
          s = null;
        function step(ts) {
          if (!s) s = ts;
          var p = Math.min((ts - s) / dur, 1);
          el.textContent = Math.round(ease(p) * to).toLocaleString();
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    },
    { threshold: 0.6 },
  );
  document.querySelectorAll(".ct").forEach(function (el) {
    cio.observe(el);
  });

  var nav = document.getElementById("nav");
  if (nav) {
    window.addEventListener(
      "scroll",
      function () {
        nav.classList.toggle("stuck", window.scrollY > 20);
      },
      { passive: true },
    );
  }

  function normalizePage(pathname) {
    var page = (pathname || "").split("/").pop();
    if (!page || page === "") return "index.html";
    page = page.split("#")[0].split("?")[0];
    if (page.indexOf(".") === -1) page += ".html";
    return page;
  }

  var currentPage = normalizePage(window.location.pathname);

  var menu = document.getElementById("menu");
  if (menu) {
    function pageFromHref(href) {
      if (!href || href.charAt(0) === "#") return "";
      try {
        return normalizePage(new URL(href, window.location.href).pathname);
      } catch (err) {
        var file = href.split("/").pop() || "index.html";
        file = file.split("#")[0].split("?")[0];
        if (file.indexOf(".") === -1) file += ".html";
        return file;
      }
    }

    function isNavLinkActive(linkPage, page) {
      if (!linkPage || !page) return false;
      if (linkPage === page) return true;
      if (linkPage === "success-stories.html" && page.indexOf("story-") === 0)
        return true;
      if (linkPage === "blog.html" && page.indexOf("blog-") === 0) return true;
      return false;
    }

    function markActiveLink(link) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");

      var parentDrop = link.closest(".nav-item.has-drop");
      if (!parentDrop) return;

      parentDrop.classList.add("is-active-section");
      var toggle = parentDrop.querySelector(".drop-toggle");
      if (toggle) {
        toggle.classList.add("is-active");
        toggle.setAttribute("aria-current", "page");
      }
    }

    menu.querySelectorAll("a[href]").forEach(function (link) {
      if (
        !isNavLinkActive(pageFromHref(link.getAttribute("href")), currentPage)
      )
        return;
      markActiveLink(link);
    });
  }

  document
    .querySelectorAll(".page-hero .breadcrumb")
    .forEach(function (breadcrumb) {
      if (breadcrumb.querySelector(".current")) return;
      var parts = breadcrumb.innerHTML.split(
        /<span class="sep">\s*\/\s*<\/span>/i,
      );
      if (!parts.length) return;
      var last = parts[parts.length - 1].trim();
      if (!last) return;
      parts[parts.length - 1] = '<span class="current">' + last + "</span>";
      breadcrumb.innerHTML = parts.join('<span class="sep">/</span>');
    });

  var b = document.getElementById("burger");
  var m = document.getElementById("menu");
  var dropItems = document.querySelectorAll(".nav-item.has-drop");
  var navBackdrop = null;
  var menuHome = m ? m.parentNode : null;
  var menuNext = m ? m.nextSibling : null;

  function ensureNavBackdrop() {
    if (navBackdrop) return navBackdrop;
    navBackdrop = document.createElement("div");
    navBackdrop.className = "nav-backdrop";
    navBackdrop.setAttribute("aria-hidden", "true");
    navBackdrop.addEventListener("click", closeMobileMenu);
    document.body.appendChild(navBackdrop);
    return navBackdrop;
  }

  function parkMobileMenu(open) {
    if (!m || !menuHome) return;
    try {
      if (open && window.innerWidth <= 980) {
        if (m.parentNode !== document.body) document.body.appendChild(m);
        return;
      }
      if (m.parentNode !== menuHome) {
        menuHome.insertBefore(m, menuNext);
      }
    } catch (err) {
      console.error("Could not reposition the mobile menu", err);
    }
  }

  function setMenuOpen(open) {
    if (!m || !b) return;
    if (open) parkMobileMenu(true);
    m.classList.toggle("open", open);
    b.classList.toggle("x", open);
    b.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("nav-open", open);
    ensureNavBackdrop().classList.toggle("is-open", open);
    if (!open) {
      closeDropdowns();
      parkMobileMenu(false);
    }
  }

  function closeMobileMenu() {
    setMenuOpen(false);
  }

  function closeDropdowns() {
    dropItems.forEach(function (item) {
      item.classList.remove("open");
      var toggle = item.querySelector(".drop-toggle");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    });
  }

  if (b && m) {
    b.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var willOpen = !m.classList.contains("open");
      if (willOpen) closeDropdowns();
      setMenuOpen(willOpen);
    });
    m.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        // Keep menu open only if it's a same-page hash; otherwise close.
        closeMobileMenu();
      });
    });
    document
      .querySelectorAll(".nav-desktop-cta, .nav-mobile-cta")
      .forEach(function (a) {
        a.addEventListener("click", function () {
          closeMobileMenu();
        });
      });
  }

  dropItems.forEach(function (item) {
    var toggle = item.querySelector(".drop-toggle");
    var menu = item.querySelector(".drop-menu");
    if (!toggle || !menu) return;

    toggle.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      var isOpen = item.classList.contains("open");
      closeDropdowns();
      if (!isOpen) {
        item.classList.add("open");
        toggle.setAttribute("aria-expanded", "true");
      }
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        closeDropdowns();
        closeMobileMenu();
      });
    });
  });

  document.addEventListener("click", function (ev) {
    var target = ev.target;
    if (m && m.contains(target)) return;
    if (b && b.contains(target)) return;
    closeDropdowns();
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") {
      closeDropdowns();
      closeMobileMenu();
    }
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 980) closeMobileMenu();
  });

  document.querySelectorAll(".faq-item").forEach(function (item) {
    var btn = item.querySelector(".faq-question");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var was = item.classList.contains("open");
      item.parentElement
        .querySelectorAll(".faq-item.open")
        .forEach(function (o) {
          o.classList.remove("open");
          var q = o.querySelector(".faq-question");
          if (q) q.setAttribute("aria-expanded", "false");
        });
      if (!was) {
        item.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  var contactForm = document.getElementById("contact-form");
  if (contactForm) {
    var VEXUR_FORM_SUBMIT_URL =
      "https://iipazmwbtctblpyszspb.supabase.co/functions/v1/form-submit";
    var VEXUR_FORM_ID = "22c0524f-a1d7-40d8-bc9f-ef5f498aa140";
    // Public anon key shipped with Vexur's embed widget (same as their contact.js)
    var VEXUR_ANON_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpcGF6bXdidGN0YmxweXN6c3BiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDEzODcsImV4cCI6MjA3MzkxNzM4N30.YQ2IaG-Uywn1zPeRnSOnY5O7WwdXT8QOAs0toHy1GUE";

    contactForm.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var first = document.getElementById("first-name");
      var last = document.getElementById("last-name");
      var email = document.getElementById("email");
      var phone = document.getElementById("phone");
      var message = document.getElementById("message");
      var success = document.getElementById("form-success");
      var errorEl = document.getElementById("form-error");
      var submitBtn = contactForm.querySelector(".contact-submit");
      if (!first || !last || !email || !phone || !message) return;
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      if (success) success.hidden = true;
      if (errorEl) errorEl.hidden = true;
      if (submitBtn) submitBtn.disabled = true;

      var fullName = (first.value.trim() + " " + last.value.trim()).trim();
      fetch(VEXUR_FORM_SUBMIT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: VEXUR_ANON_KEY,
          Authorization: "Bearer " + VEXUR_ANON_KEY,
        },
        body: JSON.stringify({
          formId: VEXUR_FORM_ID,
          fields: {
            name: fullName,
            email: email.value.trim(),
            phone: phone.value.trim(),
            message: message.value.trim(),
          },
          attribution: {
            pageUrl: window.location.href,
            referrer: document.referrer || null,
          },
        }),
      })
        .then(function (res) {
          return res
            .json()
            .catch(function () {
              return {};
            })
            .then(function (data) {
              if (!res.ok || data.success === false) {
                throw new Error(
                  data.error || data.message || "Submission failed",
                );
              }
            });
        })
        .then(function () {
          if (success) success.hidden = false;
          contactForm.reset();
          if (submitBtn) submitBtn.disabled = false;
        })
        .catch(function () {
          if (errorEl) errorEl.hidden = false;
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  document.querySelectorAll("[data-video-wrap]").forEach(function (wrap) {
    var video = wrap.querySelector("video");
    var poster = wrap.querySelector(".video-poster");
    var btn = wrap.querySelector(".video-play");
    if (!video || !btn) return;

    function revealVideo() {
      wrap.classList.add("is-playing");
      if (poster) poster.hidden = true;
      btn.hidden = true;
      video.hidden = false;
    }

    btn.addEventListener("click", function () {
      revealVideo();
      var playPromise = video.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(function () {});
      }
    });
  });

  /* ---------- Vexur calendar: open on call CTAs ---------- */
  (function initVexurBooking() {
    var AGENT = "09a089fd-72c0-412d-bb2b-0b0ab9cc4ecd";
    var BUILD = "calendar-7ca2673d";
    var RENDERER = "calendar-render-v2";
    var VERSION = "2026-07-21T01:16:39.219295+00:00";
    var LOADER_SRC = "https://embed.vexur.com.au/v1.1.10/loader.js";
    var LOADER_INTEGRITY =
      "sha384-dx3l2judEexylNgMj/LWd1UZOwIoR4gyPHKTfRUwtE/QSHhy/C1iYfOW0y4dKp62";
    var modal = null;
    var lastFocus = null;
    var loaderRequested = false;

    function ensurePreconnect() {
      if (document.querySelector('link[href="https://embed.vexur.com.au"]'))
        return;
      var link = document.createElement("link");
      link.rel = "preconnect";
      link.href = "https://embed.vexur.com.au";
      link.crossOrigin = "anonymous";
      document.head.appendChild(link);
    }

    function mountIfReady(onReady) {
      if (
        window.VexurWidgetLoader &&
        typeof window.VexurWidgetLoader.mountAll === "function"
      ) {
        window.VexurWidgetLoader.mountAll();
      }
      if (typeof onReady === "function") onReady();
    }

    function injectLoader(onReady) {
      // Official SRI first; retry without integrity if the CDN hash mismatches.
      var attempts = [
        { src: LOADER_SRC, integrity: LOADER_INTEGRITY },
        { src: LOADER_SRC, integrity: null },
      ];
      var i = 0;
      function tryNext() {
        if (window.VexurWidgetLoader) {
          mountIfReady(onReady);
          return;
        }
        if (i >= attempts.length) {
          console.error("[BaxterMason] Vexur booking widget failed to load");
          return;
        }
        var a = attempts[i++];
        var s = document.createElement("script");
        s.src = a.src;
        s.async = true;
        s.crossOrigin = "anonymous";
        if (a.integrity) s.integrity = a.integrity;
        s.onload = function () {
          mountIfReady(onReady);
        };
        s.onerror = function () {
          tryNext();
        };
        document.body.appendChild(s);
      }
      tryNext();
    }

    function ensureLoader(onReady) {
      if (window.VexurWidgetLoader) {
        if (typeof window.VexurWidgetLoader.mountAll === "function") {
          window.VexurWidgetLoader.mountAll();
        }
        if (typeof onReady === "function") onReady();
        return;
      }

      var existing = document.querySelector(
        'script[src*="embed.vexur.com.au"][src*="loader.js"]',
      );
      if (existing && !loaderRequested) {
        loaderRequested = true;
        existing.addEventListener("load", function () {
          if (
            window.VexurWidgetLoader &&
            typeof window.VexurWidgetLoader.mountAll === "function"
          ) {
            window.VexurWidgetLoader.mountAll();
          }
          if (typeof onReady === "function") onReady();
        });
        existing.addEventListener("error", function () {
          injectLoader(onReady);
        });
        return;
      }

      if (loaderRequested) {
        var wait = setInterval(function () {
          if (window.VexurWidgetLoader) {
            clearInterval(wait);
            if (typeof window.VexurWidgetLoader.mountAll === "function") {
              window.VexurWidgetLoader.mountAll();
            }
            if (typeof onReady === "function") onReady();
          }
        }, 100);
        setTimeout(function () {
          clearInterval(wait);
        }, 12000);
        return;
      }

      loaderRequested = true;
      injectLoader(onReady);
    }

    function ensureModal() {
      if (modal) return modal;
      ensurePreconnect();

      modal = document.createElement("div");
      modal.id = "vxBookModal";
      modal.className = "vx-book-modal";
      modal.setAttribute("aria-hidden", "true");
      modal.innerHTML =
        '<div class="vx-book-modal__backdrop" data-vx-close tabindex="-1"></div>' +
        '<button type="button" class="vx-book-modal__close" data-vx-close aria-label="Close booking calendar">&times;</button>' +
        '<div class="vexur-widget"' +
        ' data-widget="calendar"' +
        ' data-agent="' +
        AGENT +
        '"' +
        ' data-loader="v2"' +
        ' data-theme="light"' +
        ' data-primary-color="#e44013"' +
        ' data-show-branding="true"' +
        ' data-consent="pending"' +
        ' data-vx-no-fallback="true"' +
        ' data-vx-param-calendar-widget-build-id="' +
        BUILD +
        '"' +
        ' data-vx-param-renderer="' +
        RENDERER +
        '"' +
        ' data-vx-param-v="' +
        VERSION +
        '"' +
        "></div>" +
        '<p class="vx-book-modal__fallback">Cannot find a time that suits? Call ' +
        '<a href="tel:+61490744453">0490 744 453</a> or email ' +
        '<a href="mailto:mail@baxtermason.com.au">mail@baxtermason.com.au</a>.</p>';

      document.body.appendChild(modal);

      modal.addEventListener("click", function (ev) {
        if (
          ev.target &&
          ev.target.getAttribute &&
          ev.target.getAttribute("data-vx-close") !== null
        ) {
          closeModal();
        }
      });

      document.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape" && modal.classList.contains("is-open")) {
          closeModal();
        }
      });

      return modal;
    }

    function openModal() {
      var el = ensureModal();
      lastFocus = document.activeElement;
      el.classList.add("is-open");
      el.setAttribute("aria-hidden", "false");
      document.body.classList.add("vx-book-open");
      var closeBtn = el.querySelector(".vx-book-modal__close");
      if (closeBtn) closeBtn.focus();
      ensureLoader(function () {
        if (
          window.VexurWidgetLoader &&
          typeof window.VexurWidgetLoader.mountAll === "function"
        ) {
          window.VexurWidgetLoader.mountAll();
        }
      });
    }

    function closeModal() {
      if (!modal) return;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("vx-book-open");
      if (lastFocus && typeof lastFocus.focus === "function") {
        try {
          lastFocus.focus();
        } catch (err) {}
      }
    }

    function isBookCallLink(anchor) {
      if (!anchor || anchor.tagName !== "A") return false;
      if (anchor.classList.contains("js-book-call")) return true;

      var href = (anchor.getAttribute("href") || "").trim().toLowerCase();
      if (href.indexOf("book-a-free-discovery-call") !== -1) return true;

      var isContactHref =
        href.indexOf("contact.html") !== -1 ||
        href === "#book-call" ||
        href === "#book";
      if (!isContactHref) return false;

      if (
        anchor.classList.contains("nav-desktop-cta") ||
        anchor.classList.contains("nav-mobile-cta")
      ) {
        return true;
      }

      var text = (anchor.textContent || "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
      if (!text) return false;
      if (text === "contact" || text.indexOf("contact us") === 0) return false;
      if (text.indexOf("book") === -1) return false;
      return text.indexOf("call") !== -1 || text.indexOf("discovery") !== -1;
    }

    document.addEventListener("click", function (ev) {
      var anchor =
        ev.target && ev.target.closest ? ev.target.closest("a") : null;
      if (!isBookCallLink(anchor)) return;
      ev.preventDefault();
      openModal();
    });

    window.BaxterMasonBookCall = { open: openModal, close: closeModal };

    var warmed = false;
    function warm() {
      if (warmed) return;
      warmed = true;
      ensurePreconnect();
      ensureModal();
      ensureLoader();
    }

    // Preload + mount the calendar as early as possible so it opens instantly.
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", warm);
    } else {
      warm();
    }
  })();
  /* ---------- Vexur Google Reviews: grow the iframe to content ---------- */
  (function initVexurReviewsResize() {
    function applyHeight(iframe, height) {
      var next = Math.round(Number(height));
      if (!isFinite(next) || next < 200) return;
      iframe.style.height = next + "px";
      iframe.style.minHeight = next + "px";
    }

    window.addEventListener("message", function (event) {
      if (
        event.origin !== window.location.origin &&
        event.origin !== "https://app.vexur.com.au"
      )
        return;
      var data = event.data;
      if (!data || typeof data !== "object") return;
      var type = data.type;
      if (
        type !== "vexur:height" &&
        type !== "google-reviews-calculator-height"
      )
        return;
      var frames = document.querySelectorAll("iframe[data-vx-reviews]");
      for (var i = 0; i < frames.length; i++) {
        if (frames[i].contentWindow === event.source) {
          applyHeight(frames[i], data.height);
          break;
        }
      }
    });
  })();

  /* ---------- Google reviews: carousel + More/Less ----------
     Kept for any leftover static cards. The homepage now uses the Vexur iframe. */
  (function initReviews() {
    var CLAMP_AT = 320;

    document.querySelectorAll(".rv-card-body").forEach(function (body) {
      var p = body.querySelector("p");
      if (!p || p.textContent.trim().length <= CLAMP_AT) return;

      body.classList.add("is-clamped");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "rv-more";
      btn.textContent = "More";
      btn.setAttribute("aria-expanded", "false");
      btn.addEventListener("click", function () {
        var open = body.classList.toggle("is-clamped") === false;
        btn.textContent = open ? "Less" : "More";
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
      body.insertAdjacentElement("afterend", btn);
    });

    document.querySelectorAll("[data-rv-carousel]").forEach(function (root) {
      var slides = Array.prototype.slice.call(
        root.querySelectorAll("[data-rv-slide]"),
      );
      var dots = Array.prototype.slice.call(
        root.querySelectorAll("[data-rv-go]"),
      );
      if (slides.length < 2) return;

      var index = 0;
      var timer = null;
      var interval =
        parseInt(root.getAttribute("data-rv-interval"), 10) || 30000;
      var reduced =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      function show(next) {
        index = (next + slides.length) % slides.length;
        slides.forEach(function (s, i) {
          s.hidden = i !== index;
        });
        dots.forEach(function (d, i) {
          if (i === index) d.setAttribute("aria-current", "true");
          else d.removeAttribute("aria-current");
        });
      }

      function start() {
        if (reduced) return;
        stop();
        timer = setInterval(function () {
          show(index + 1);
        }, interval);
      }
      function stop() {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
      }

      var prev = root.querySelector("[data-rv-prev]");
      var next = root.querySelector("[data-rv-next]");
      if (prev)
        prev.addEventListener("click", function () {
          show(index - 1);
          start();
        });
      if (next)
        next.addEventListener("click", function () {
          show(index + 1);
          start();
        });
      dots.forEach(function (d, i) {
        d.addEventListener("click", function () {
          show(i);
          start();
        });
      });

      root.addEventListener("mouseenter", stop);
      root.addEventListener("mouseleave", start);
      root.addEventListener("focusin", stop);

      show(0);
      start();
    });
  })();
})();
