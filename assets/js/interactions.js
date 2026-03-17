(function () {
  "use strict";

  // =========================================================================
  // 1. Custom cursor (node + trail)
  // =========================================================================
  var cursorDot = document.createElement("div");
  cursorDot.id = "cursor-dot";
  document.body.appendChild(cursorDot);

  var cursorRing = document.createElement("div");
  cursorRing.id = "cursor-ring";
  document.body.appendChild(cursorRing);

  var mouseX = -100,
    mouseY = -100;
  var ringX = -100,
    ringY = -100;

  document.addEventListener("mousemove", function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.left = mouseX + "px";
    cursorDot.style.top = mouseY + "px";
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;
    cursorRing.style.left = ringX + "px";
    cursorRing.style.top = ringY + "px";
    requestAnimationFrame(animateRing);
  }
  animateRing();

  // Grow ring on hover over interactive elements
  document.addEventListener("mouseover", function (e) {
    if (e.target.closest("a, button, .card, .nav-link, input")) {
      cursorRing.classList.add("cursor-hover");
      cursorDot.classList.add("cursor-hover");
    }
  });
  document.addEventListener("mouseout", function (e) {
    if (e.target.closest("a, button, .card, .nav-link, input")) {
      cursorRing.classList.remove("cursor-hover");
      cursorDot.classList.remove("cursor-hover");
    }
  });

  // Hide custom cursor on touch devices
  if ("ontouchstart" in window) {
    cursorDot.style.display = "none";
    cursorRing.style.display = "none";
  }

  // =========================================================================
  // 2. Scroll fade-in (IntersectionObserver)
  // =========================================================================
  var fadeEls = document.querySelectorAll(
    ".post article > h2, .post article > .social, .news, .latest-posts, .publications, .projects .col, .card"
  );
  fadeEls.forEach(function (el) {
    el.classList.add("fade-in-section");
  });

  var fadeObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          fadeObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll(".fade-in-section").forEach(function (el) {
    fadeObserver.observe(el);
  });

  // =========================================================================
  // 3. Smooth scroll
  // =========================================================================
  document.documentElement.style.scrollBehavior = "smooth";

  // =========================================================================
  // 4. Page fade transition
  // =========================================================================
  document.body.classList.add("page-loaded");

  document.addEventListener("click", function (e) {
    var link = e.target.closest("a");
    if (
      link &&
      link.href &&
      !link.target &&
      !link.href.startsWith("#") &&
      !link.href.startsWith("javascript") &&
      link.hostname === window.location.hostname &&
      !e.ctrlKey &&
      !e.metaKey
    ) {
      e.preventDefault();
      document.body.classList.add("page-exit");
      var href = link.href;
      setTimeout(function () {
        window.location.href = href;
      }, 250);
    }
  });

  // =========================================================================
  // 5. Card 3D tilt effect
  // =========================================================================
  document.querySelectorAll(".card.hoverable").forEach(function (card) {
    card.addEventListener("mousemove", function (e) {
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var centerX = rect.width / 2;
      var centerY = rect.height / 2;
      var rotateX = ((y - centerY) / centerY) * -5;
      var rotateY = ((x - centerX) / centerX) * 5;
      card.style.transform =
        "perspective(800px) rotateX(" +
        rotateX +
        "deg) rotateY(" +
        rotateY +
        "deg) scale3d(1.02, 1.02, 1.02)";
    });

    card.addEventListener("mouseleave", function () {
      card.style.transform = "perspective(800px) rotateX(0) rotateY(0) scale3d(1,1,1)";
    });
  });
})();
