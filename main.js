/* =====================================================
 * Akhilesh Vishwakarma — Portfolio interactions
 * jQuery + Bootstrap 5
 * ===================================================== */

(function ($) {
  "use strict";

  const data = window.PORTFOLIO_DATA;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // Enable reveal-on-scroll only when JS is alive (CSS keeps content visible by default)
  if (!prefersReducedMotion) document.documentElement.classList.add("js-reveal-ready");


  // --------- Helpers ---------
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[c]);
  }
  function pad(n) { return String(n).padStart(2, "0"); }

  // --------- Footer year ---------
  $("#copyYear").text(new Date().getFullYear());

  // --------- Preloader ---------
  function runPreloader() {
    const $pre = $("#preloader");
    const skip =
      sessionStorage.getItem("preloader_seen") === "1" ||
      prefersReducedMotion ||
      /[?&]nopre(?:=|$|&)/.test(window.location.search) ||
      window.location.hash;
    if (skip) {
      $pre.addClass("is-done");
      setTimeout(() => $pre.remove(), 100);
      return;
    }
    document.body.style.overflow = "hidden";
    const lines = [
      "> Initializing portfolio...",
      "> Loading creative modules...",
      "> Compiling experiences...",
      "> Ready.",
    ];
    const $list = $("#preloaderLines");
    lines.forEach((l, i) => {
      $list.append(
        `<li class="${i === lines.length - 1 ? "final" : ""}">${escapeHtml(l)}</li>`
      );
    });
    const $items = $list.find("li");
    const $bar = $("#preloaderBar");
    const $pct = $("#preloaderPct");
    const start = performance.now();
    const duration = 900;
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      $bar.css("width", p * 100 + "%");
      $pct.text(Math.round(p * 100));
      const li = Math.min(lines.length - 1, Math.floor(p * lines.length));
      $items.each(function (i) {
        if (i <= li) $(this).addClass("shown");
      });
      if (p < 1) requestAnimationFrame(tick);
      else {
        setTimeout(() => {
          $pre.addClass("is-done");
          document.body.style.overflow = "";
          sessionStorage.setItem("preloader_seen", "1");
          setTimeout(() => $pre.remove(), 500);
        }, 120);
      }
    }
    requestAnimationFrame(tick);
  }
  runPreloader();

  // --------- Scroll progress + nav state ---------
  const $nav = $("#siteNav");
  const $progress = $("#scrollProgress");
  function updateScroll() {
    const sy = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docH > 0 ? Math.min(100, (sy / docH) * 100) : 0;
    $progress.css("width", pct + "%");
    $nav.toggleClass("is-scrolled", sy > 30);
    $("#backToTop").prop("hidden", sy < 600);
  }
  $(window).on("scroll", updateScroll);
  updateScroll();

  // --------- Spotlight follower ---------
  const spotlightEl = document.getElementById("spotlight");
  if (spotlightEl && window.matchMedia("(min-width: 992px) and (hover: hover) and (pointer: fine)").matches) {
    let tx = -1000, ty = -1000, cx = -1000, cy = -1000, raf = null;
    document.addEventListener("mousemove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(animate);
    });
    function animate() {
      cx += (tx - cx) * 0.15;
      cy += (ty - cy) * 0.15;
      spotlightEl.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
      if (Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5) {
        raf = requestAnimationFrame(animate);
      } else {
        raf = null;
      }
    }
  }

  // --------- Mobile menu ---------
  const $menu = $("#mobileMenu");
  const $toggle = $("#navToggle");
  function setMenu(open) {
    $menu.toggleClass("open", open).attr("aria-hidden", String(!open));
    $toggle.attr("aria-expanded", String(open))
      .find("i").attr("class", open ? "bi bi-x-lg" : "bi bi-list");
    document.body.style.overflow = open ? "hidden" : "";
  }
  $toggle.on("click", () => setMenu(!$menu.hasClass("open")));
  $menu.on("click", "a", () => setMenu(false));
  $(document).on("keydown", (e) => {
    if (e.key === "Escape" && $menu.hasClass("open")) setMenu(false);
  });

  // --------- Smooth-scroll active nav ---------
  $(".nav-links a, .mobile-link").on("click", function (e) {
    const href = $(this).attr("href");
    if (href && href.startsWith("#")) {
      const $target = $(href);
      if ($target.length) {
        e.preventDefault();
        const top = $target.offset().top - 70;
        window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
      }
    }
  });

  // --------- Scroll spy: highlight nav link ---------
  const navSections = ["about", "education", "experience", "services", "work", "contact"];
  function updateActiveNav() {
    const sy = window.scrollY + 120;
    let active = null;
    for (const id of navSections) {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= sy) active = id;
    }
    $(".nav-links a").removeClass("active");
    if (active) $(`.nav-links a[href="#${active}"]`).addClass("active");
  }
  $(window).on("scroll", updateActiveNav);

  // --------- Reveal on scroll (IntersectionObserver) ---------
  let revealIO = null;
  function observeReveal(el) {
    if (!revealIO) { el.classList.add("is-visible"); return; }
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.95 && r.bottom > 0) el.classList.add("is-visible");
    else revealIO.observe(el);
  }
  function revealIfInView(el) {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.95 && r.bottom > 0) {
      el.classList.add("is-visible");
      return true;
    }
    return false;
  }
  if ("IntersectionObserver" in window) {
    revealIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      if (!revealIfInView(el)) revealIO.observe(el);
    });
  } else {
    document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-visible"));
  }
  // Watchdog: force-reveal anything still hidden after 1.5s (defensive)
  setTimeout(() => {
    document
      .querySelectorAll("[data-reveal]:not(.is-visible)")
      .forEach((el) => {
        if (!revealIfInView(el)) {
          // schedule reveal on next scroll/resize as a final fallback
          revealIO && revealIO.observe(el);
        }
      });
  }, 1500);
  // Final hard fallback — after 6s anything still hidden becomes visible
  setTimeout(() => {
    document
      .querySelectorAll("[data-reveal]:not(.is-visible)")
      .forEach((el) => el.classList.add("is-visible"));
  }, 6000);

  // --------- Counters ---------
  function animateCounter(el) {
    const target = parseInt(el.getAttribute("data-counter"), 10) || 0;
    const suffix = el.getAttribute("data-suffix") || "";
    const duration = 1800;
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ("IntersectionObserver" in window) {
    const co = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animateCounter(e.target);
            co.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    document.querySelectorAll("[data-counter]").forEach((el) => co.observe(el));
  }

  // --------- Hero rotator (typewriter) ---------
  function rotator() {
    const el = document.getElementById("rotatorText");
    if (!el || !data.rotatorWords || data.rotatorWords.length === 0) return;
    let wi = 0, ci = 0, deleting = false;
    function step() {
      const word = data.rotatorWords[wi];
      el.textContent = word.substring(0, ci);
      let delay = deleting ? 50 : 110;
      if (!deleting && ci === word.length) {
        delay = 1600;
        deleting = true;
      } else if (deleting && ci === 0) {
        deleting = false;
        wi = (wi + 1) % data.rotatorWords.length;
        delay = 350;
      } else {
        ci += deleting ? -1 : 1;
      }
      setTimeout(step, delay);
    }
    step();
  }
  rotator();

  // --------- Render: services ---------
  (function renderServices() {
    const $grid = $("#servicesGrid");
    const html = data.services.map((s) => `
      <div class="col-12 col-md-6 col-lg-4 services__cell" data-reveal>
        <a class="svc-card" href="#contact" data-service="${escapeHtml(s.title)}" aria-label="Discuss ${escapeHtml(s.title)} with Akhilesh">
          <span class="icon-tile" aria-hidden="true"><i class="bi ${escapeHtml(s.icon)}"></i></span>
          <h3 class="svc-card__title">${escapeHtml(s.title)}</h3>
          <p class="svc-card__desc">${escapeHtml(s.description)}</p>
          <div class="tag-row">
            ${s.tags.map((t) => `<span class="tag-pill">${escapeHtml(t)}</span>`).join("")}
          </div>
          <span class="svc-card__arrow" aria-hidden="true"><i class="bi bi-arrow-up-right"></i></span>
        </a>
      </div>
    `).join("");
    $grid.html(html);

    $grid.on("click", ".svc-card", function () {
      const title = $(this).data("service");
      if (title) {
        const $sub = $("#cSubject");
        if (!$sub.val()) $sub.val("Interested in: " + title);
      }
    });
  })();

  // --------- Render: education ---------
  (function renderEducation() {
    const html = data.education.map((it) => `
      <div class="col-12 col-md-6 col-lg-4" data-reveal>
        <article class="edu-card">
          <div class="edu-card__head">
            <span class="icon-tile" aria-hidden="true"><i class="bi ${escapeHtml(it.icon)}"></i></span>
            <span class="edu-card__year">${escapeHtml(it.year)}</span>
          </div>
          <h3 class="edu-card__title">${escapeHtml(it.degree)}</h3>
          <div class="edu-card__school">${escapeHtml(it.school)}</div>
          <p class="edu-card__detail">${escapeHtml(it.detail)}</p>
          <div class="tag-row">
            ${it.tags.map((t) => `<span class="tag-pill">#${escapeHtml(t.toLowerCase().replace(/\s+/g, "_"))}</span>`).join("")}
          </div>
        </article>
      </div>
    `).join("");
    $("#educationGrid").html(html);
  })();

  // --------- Render: experience + toolkit ---------
  (function renderExperience() {
    const exp = data.experience.map((it) => `
      <div class="exp-item" data-reveal>
        <div><div class="exp-year">${escapeHtml(it.year)}</div></div>
        <div>
          <h3 class="exp-role">${escapeHtml(it.role)}</h3>
          <div class="exp-company">${escapeHtml(it.company)}</div>
          <p class="exp-desc">${escapeHtml(it.description)}</p>
        </div>
      </div>
    `).join("");
    $("#experienceList").html(exp);

    const tools = Object.entries(data.toolkit).map(([cat, list]) => `
      <div class="toolkit-cat" data-reveal>
        <div class="toolkit-cat__heading">${escapeHtml(cat)}</div>
        <div class="toolkit-tags">
          ${list.map((t) => `<span class="toolkit-tag">${escapeHtml(t)}</span>`).join("")}
        </div>
      </div>
    `).join("");
    $("#toolkit").html(tools);
  })();

  // --------- Render: work / projects ---------
  const PAGE = 4;
  let visible = PAGE;
  function renderWork() {
    const items = data.projects;
    const slice = items.slice(0, visible);
    const html = slice.map((p, i) => `
      <div class="col-12 col-md-6" data-reveal>
        <button type="button" class="proj-card" data-index="${i}" aria-label="View details about ${escapeHtml(p.title)}">
          <div class="proj-card__media">
            <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)} preview" loading="lazy" decoding="async" />
            <div class="proj-card__overlay">
              <span class="proj-card__cta">View Case Study <i class="bi bi-arrow-up-right"></i></span>
            </div>
            <span class="proj-card__tag">${escapeHtml(p.tag)}</span>
            <span class="proj-card__num">${pad(i + 1)}</span>
          </div>
          <div class="proj-card__id">// project_${pad(i + 1)}</div>
          <h3 class="proj-card__title">${escapeHtml(p.title)}</h3>
          <p class="proj-card__desc">${escapeHtml(p.description)}</p>
          <div class="proj-card__stack">
            ${p.stack.map((s) => `<span class="stack-pill">&lt;${escapeHtml(s)} /&gt;</span>`).join("")}
          </div>
        </button>
      </div>
    `).join("");
    $("#workGrid").html(html);
    // Re-observe newly added reveal elements via shared observer
    $("#workGrid [data-reveal]").each(function () { observeReveal(this); });

    if (visible >= items.length) {
      $("#workMoreWrap").prop("hidden", true);
    } else {
      $("#workMoreWrap").prop("hidden", false);
      $("#workCount").text(`Showing ${visible} of ${items.length}`);
    }
  }
  renderWork();
  $("#workLoadMore").on("click", function () {
    visible = Math.min(visible + 2, data.projects.length);
    renderWork();
  });

  // --------- Project modal ---------
  const projectModal = new bootstrap.Modal(document.getElementById("projectModal"));
  $(document).on("click", ".proj-card", function () {
    const idx = parseInt($(this).data("index"), 10);
    const p = data.projects[idx];
    if (!p) return;
    $("#pmImage").attr("src", p.image).attr("alt", p.title + " preview");
    $("#pmTag").text(p.tag);
    $("#projectModalTitle").text(p.title);
    $("#pmDesc").text(p.description);
    $("#pmStack").html(
      p.stack.map((s) => `<span class="stack-pill">&lt;${escapeHtml(s)} /&gt;</span>`).join("")
    );
    projectModal.show();
  });

  // --------- Testimonials slider ---------
  (function testimonials() {
    const items = data.testimonials;
    if (!items || items.length === 0) return;
    let idx = 0;
    const $content = $("#tContent");
    const $counter = $("#tCounter");
    const $dots = $("#tDots");

    items.forEach((_, i) => {
      $dots.append(
        `<button type="button" class="t-dot ${i === 0 ? "active" : ""}" data-i="${i}" aria-label="Show testimonial ${i + 1}"></button>`
      );
    });

    function render() {
      const t = items[idx];
      $content.html(`
        <p class="testimonials__quote">${escapeHtml(t.quote)}</p>
        <div class="testimonials__author">
          <div class="testimonials__avatar">${escapeHtml(t.name.split(" ").map(n => n[0]).join(""))}</div>
          <div>
            <div class="testimonials__name">${escapeHtml(t.name)}</div>
            <div class="testimonials__role">${escapeHtml(t.role)}</div>
          </div>
        </div>
      `);
      $counter.text(`${pad(idx + 1)} / ${pad(items.length)}`);
      $dots.find(".t-dot").removeClass("active");
      $dots.find(`.t-dot[data-i="${idx}"]`).addClass("active");
    }
    render();

    function next() { idx = (idx + 1) % items.length; render(); }
    function prev() { idx = (idx - 1 + items.length) % items.length; render(); }

    $("#tNext").on("click", next);
    $("#tPrev").on("click", prev);
    $dots.on("click", ".t-dot", function () {
      idx = parseInt($(this).data("i"), 10);
      render();
      restartAuto();
    });

    let auto = setInterval(next, 6500);
    function restartAuto() {
      clearInterval(auto);
      auto = setInterval(next, 6500);
    }
  })();

  // --------- Contact form (mailto) ---------
  (function contactForm() {
    const $form = $("#contactForm");
    const toastEl = document.getElementById("liveToast");
    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    const $toastBody = $("#toastBody");
    emailjs.init("CCCuu4jKeOPedUXV-");

    $form.on("submit", function (e) {
      e.preventDefault();
      const form = this;
      if (!form.checkValidity()) {
        e.stopPropagation();
        $form.addClass("was-validated");
        return;
      }
      $toastBody.text("Sending your message...");
      toast.show();
      emailjs.sendForm('service_tj5r0r3', 'template_v1553tf', this)
        .then(function () {
          console.log('SUCCESS!');
          $toastBody.text("Message sent successfully!");
          toast.show();
          $form.removeClass("was-validated")[0].reset();
        }, function (error) {
          console.log('FAILED...', error);
          $toastBody.text("Oops! Something went wrong.");
          toast.show();
        });
    });
  })();
  // --------- Back to top ---------
  $("#backToTop").on("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });

  // --------- Hero parallax (subtle) ---------
  if (!prefersReducedMotion && window.innerWidth >= 992) {
    $(window).on("scroll", function () {
      const sy = Math.min(window.scrollY, 800);
      $(".hero__shape--circle, .hero__dotgrid").css(
        "transform",
        `translateY(${sy * -0.15}px)`
      );
      $(".hero__shape--dot, .hero__shape--small-dot").css(
        "transform",
        `translateY(${sy * 0.18}px)`
      );
      $(".hero__shape--square, .hero__shape--ring").css(
        "transform",
        `translateY(${sy * -0.25}px)`
      );
    });
  }
})(jQuery);
