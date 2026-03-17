(function () {
  var canvas = document.getElementById("graph-bg");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var nodes = [];
  var isMobile = window.innerWidth < 768;
  var NUM = isMobile ? 30 : 80;
  var DIST = isMobile ? 120 : 160;
  var mouse = { x: -9999, y: -9999 };
  var partyMode = false;
  var partyStart = 0;
  var PARTY_DURATION = 8000;

  // ── Burst particles ──────────────────────────────────────────────────
  var bursts = [];

  function spawnBurst(x, y) {
    var count = 12 + Math.floor(Math.random() * 6);
    for (var i = 0; i < count; i++) {
      var angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      var speed = 2 + Math.random() * 4;
      bursts.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: Math.random() * 2.5 + 1,
        life: 1,
        decay: 0.015 + Math.random() * 0.01,
        hue: partyMode ? Math.random() * 360 : 0,
      });
    }
    // also push nearby nodes away
    for (var i = 0; i < nodes.length; i++) {
      var dx = nodes[i].x - x, dy = nodes[i].y - y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200 && dist > 0) {
        var force = (200 - dist) / 200 * 3;
        nodes[i].vx += (dx / dist) * force;
        nodes[i].vy += (dy / dist) * force;
      }
    }
  }

  // ── Konami code ──────────────────────────────────────────────────────
  var konamiSeq = [38,38,40,40,37,39,37,39,66,65];
  var konamiIdx = 0;

  document.addEventListener("keydown", function (e) {
    if (e.keyCode === konamiSeq[konamiIdx]) {
      konamiIdx++;
      if (konamiIdx === konamiSeq.length) {
        konamiIdx = 0;
        partyMode = true;
        partyStart = Date.now();
        // burst everywhere
        for (var i = 0; i < 5; i++) {
          spawnBurst(
            Math.random() * window.innerWidth,
            Math.random() * window.innerHeight
          );
        }
        // speed up all nodes
        for (var i = 0; i < nodes.length; i++) {
          nodes[i].vx = (Math.random() - 0.5) * 6;
          nodes[i].vy = (Math.random() - 0.5) * 6;
        }
      }
    } else {
      konamiIdx = e.keyCode === konamiSeq[0] ? 1 : 0;
    }
  });

  // ── Core ─────────────────────────────────────────────────────────────
  function resize() {
    var dpr = window.devicePixelRatio || 1;
    var w = window.innerWidth, h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function dark() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  function init() {
    var w = window.innerWidth, h = window.innerHeight;
    nodes = [];
    for (var i = 0; i < NUM; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 1,
      });
    }
  }

  function frame() {
    var w = window.innerWidth, h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    var d = dark();
    var col = d ? "160,174,192" : "74,85,104";

    // check party timeout
    if (partyMode && Date.now() - partyStart > PARTY_DURATION) {
      partyMode = false;
    }

    var damping = partyMode ? 0.97 : 0.988;

    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var dx = n.x - mouse.x, dy = n.y - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120 && dist > 0) {
        n.vx += dx / dist * 0.06;
        n.vy += dy / dist * 0.06;
      }
      n.vx *= damping;
      n.vy *= damping;
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < -20) n.x = w + 20;
      if (n.x > w + 20) n.x = -20;
      if (n.y < -20) n.y = h + 20;
      if (n.y > h + 20) n.y = -20;
    }

    // edges
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var dx = nodes[i].x - nodes[j].x;
        var dy = nodes[i].y - nodes[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < DIST) {
          var a = (1 - dist / DIST) * 0.18;
          var mx = (nodes[i].x + nodes[j].x) / 2;
          var my = (nodes[i].y + nodes[j].y) / 2 - dist * 0.06;
          ctx.beginPath();
          if (partyMode) {
            var hue = (Date.now() * 0.1 + i * 20) % 360;
            ctx.strokeStyle = "hsla(" + hue + ",70%,60%," + (a + 0.1) + ")";
          } else {
            ctx.strokeStyle = "rgba(" + col + "," + a + ")";
          }
          ctx.lineWidth = 0.6;
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.quadraticCurveTo(mx, my, nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // nodes
    for (var i = 0; i < nodes.length; i++) {
      ctx.beginPath();
      ctx.arc(nodes[i].x, nodes[i].y, nodes[i].r, 0, Math.PI * 2);
      if (partyMode) {
        var hue = (Date.now() * 0.15 + i * 30) % 360;
        ctx.fillStyle = "hsla(" + hue + ",80%,65%,0.6)";
      } else {
        ctx.fillStyle = "rgba(" + col + ",0.3)";
      }
      ctx.fill();
    }

    // burst particles
    for (var i = bursts.length - 1; i >= 0; i--) {
      var b = bursts[i];
      b.x += b.vx;
      b.y += b.vy;
      b.vx *= 0.96;
      b.vy *= 0.96;
      b.life -= b.decay;
      if (b.life <= 0) { bursts.splice(i, 1); continue; }

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * b.life, 0, Math.PI * 2);
      if (partyMode || b.hue) {
        ctx.fillStyle = "hsla(" + b.hue + ",80%,65%," + (b.life * 0.7) + ")";
      } else {
        ctx.fillStyle = "rgba(" + col + "," + (b.life * 0.5) + ")";
      }
      ctx.fill();

      // connect burst particles to nearby nodes
      for (var j = 0; j < nodes.length; j++) {
        var dx = b.x - nodes[j].x, dy = b.y - nodes[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) {
          ctx.beginPath();
          ctx.strokeStyle = "rgba(" + col + "," + (b.life * 0.1) + ")";
          ctx.lineWidth = 0.3;
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(frame);
  }

  resize();
  init();
  frame();

  window.addEventListener("resize", function () { resize(); init(); });
  document.addEventListener("mousemove", function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  // Click to burst
  document.addEventListener("click", function (e) {
    // don't burst when clicking interactive elements
    if (e.target.closest("a, button, input, .card, .navbar, nav")) return;
    spawnBurst(e.clientX, e.clientY);
  });
})();
