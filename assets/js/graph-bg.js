(function () {
  var canvas = document.getElementById("graph-bg");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var isMobile = window.innerWidth < 768;
  var NUM = isMobile ? 30 : 80;
  var DIST = isMobile ? 120 : 160;
  var mouse = { x: -9999, y: -9999 };
  var partyMode = false;
  var partyStart = 0;
  var PARTY_DURATION = 8000;
  var bursts = [];
  var nodes = [];

  // ── Constellation shapes (relative offsets) ──────────────────────────
  var shapes = [
    { pts: [[0,-1],[-.9,.7],[.9,.7]], edges: [[0,1],[1,2],[2,0]] },
    { pts: [[-1,-.5],[-.3,.5],[.3,-.5],[1,.5]], edges: [[0,1],[1,2],[2,3]] },
    { pts: [[0,-1],[1,0],[0,1],[-1,0]], edges: [[0,1],[1,2],[2,3],[3,0]] },
    { pts: [[0,0],[-.8,-.9],[.8,-.9],[0,1]], edges: [[0,1],[0,2],[0,3]] },
    { pts: [[-1,0],[-.3,-.2],[.3,.2],[1,0]], edges: [[0,1],[1,2],[2,3]] },
    { pts: [[-1,-.5],[-.5,.5],[0,-.3],[.5,.5],[1,-.5]], edges: [[0,1],[1,2],[2,3],[3,4]] },
    { pts: [[0,-1],[0,0],[0,1],[-1,0],[1,0]], edges: [[0,1],[1,2],[1,3],[1,4]] },
    { pts: [[-1,.3],[-.5,-.4],[0,-.6],[.5,-.4],[1,.3]], edges: [[0,1],[1,2],[2,3],[3,4]] },
    { pts: [[-.8,.5],[0,-.8],[.8,.5],[0,0]], edges: [[0,1],[1,2],[0,3],[2,3]] },
    { pts: [[-1,0],[-.5,-.3],[0,0],[.3,-.2],[.7,.1],[.5,.4],[.2,.2]], edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,3]] },
  ];

  // Fixed edges from constellation grouping
  var fixedEdges = [];

  function init() {
    var w = window.innerWidth, h = window.innerHeight;
    nodes = [];
    fixedEdges = [];

    // Place constellation-shaped groups, but each node moves independently
    var numClusters = isMobile ? 5 : 12;
    var nodeIdx = 0;

    for (var i = 0; i < numClusters; i++) {
      var shape = shapes[i % shapes.length];
      var scale = 25 + Math.random() * 40;
      var cx = Math.random() * w;
      var cy = Math.random() * h;
      var rot = Math.random() * Math.PI * 2;
      var baseSpeed = (Math.random() - 0.5) * 0.2;
      var baseDir = Math.random() * Math.PI * 2;
      var baseVx = Math.cos(baseDir) * baseSpeed;
      var baseVy = Math.sin(baseDir) * baseSpeed;
      var startIdx = nodeIdx;

      shape.pts.forEach(function (p) {
        var rx = p[0] * Math.cos(rot) - p[1] * Math.sin(rot);
        var ry = p[0] * Math.sin(rot) + p[1] * Math.cos(rot);
        nodes.push({
          x: cx + rx * scale,
          y: cy + ry * scale,
          vx: baseVx + (Math.random() - 0.5) * 0.1,
          vy: baseVy + (Math.random() - 0.5) * 0.1,
          r: 1 + Math.random() * 1.8,
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.015 + Math.random() * 0.02,
        });
        nodeIdx++;
      });

      shape.edges.forEach(function (e) {
        fixedEdges.push([startIdx + e[0], startIdx + e[1]]);
      });
    }

    // Fill remaining with scattered stars
    while (nodes.length < NUM) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.02 + Math.random() * 0.03,
      });
    }
  }

  // ── Burst ────────────────────────────────────────────────────────────
  function spawnBurst(x, y) {
    var count = 12 + Math.floor(Math.random() * 6);
    for (var i = 0; i < count; i++) {
      var angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      var speed = 2 + Math.random() * 4;
      bursts.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        r: Math.random() * 2.5 + 1, life: 1,
        decay: 0.015 + Math.random() * 0.01,
        hue: partyMode ? Math.random() * 360 : 0,
      });
    }
    for (var i = 0; i < nodes.length; i++) {
      var dx = nodes[i].x - x, dy = nodes[i].y - y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200 && dist > 0) {
        var f = (200 - dist) / 200 * 3;
        nodes[i].vx += (dx / dist) * f;
        nodes[i].vy += (dy / dist) * f;
      }
    }
  }

  // ── Konami ───────────────────────────────────────────────────────────
  var konamiSeq = [38,38,40,40,37,39,37,39,66,65];
  var konamiIdx = 0;
  document.addEventListener("keydown", function (e) {
    if (e.keyCode === konamiSeq[konamiIdx]) {
      konamiIdx++;
      if (konamiIdx === konamiSeq.length) {
        konamiIdx = 0;
        partyMode = true;
        partyStart = Date.now();
        for (var i = 0; i < 5; i++) spawnBurst(Math.random() * window.innerWidth, Math.random() * window.innerHeight);
        nodes.forEach(function (n) { n.vx = (Math.random() - 0.5) * 6; n.vy = (Math.random() - 0.5) * 6; });
      }
    } else { konamiIdx = e.keyCode === konamiSeq[0] ? 1 : 0; }
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

  function frame() {
    var w = window.innerWidth, h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    var d = dark();
    var col = d ? "180,190,210" : "74,85,104";
    var now = Date.now();

    if (partyMode && now - partyStart > PARTY_DURATION) partyMode = false;
    var damping = partyMode ? 0.97 : 0.988;

    // update nodes — each moves independently
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      n.twinkle += n.twinkleSpeed;
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

    // draw fixed constellation edges (persist even as nodes drift apart)
    for (var i = 0; i < fixedEdges.length; i++) {
      var a = nodes[fixedEdges[i][0]], b = nodes[fixedEdges[i][1]];
      var edx = a.x - b.x, edy = a.y - b.y;
      var eDist = Math.sqrt(edx * edx + edy * edy);
      // fade out as they drift far apart
      var alpha = Math.max(0, 0.2 - eDist * 0.0008);
      if (alpha <= 0) continue;
      ctx.beginPath();
      if (partyMode) {
        var hue = (now * 0.1 + i * 30) % 360;
        ctx.strokeStyle = "hsla(" + hue + ",70%,60%," + (alpha + 0.1) + ")";
      } else {
        ctx.strokeStyle = "rgba(" + col + "," + alpha + ")";
      }
      ctx.lineWidth = 0.7;
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // draw proximity edges (faint, between any nearby nodes)
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var dx = nodes[i].x - nodes[j].x;
        var dy = nodes[i].y - nodes[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < DIST) {
          var a = (1 - dist / DIST) * 0.08;
          ctx.beginPath();
          if (partyMode) {
            var hue = (now * 0.1 + i * 20) % 360;
            ctx.strokeStyle = "hsla(" + hue + ",70%,60%," + (a + 0.05) + ")";
          } else {
            ctx.strokeStyle = "rgba(" + col + "," + a + ")";
          }
          ctx.lineWidth = 0.3;
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // draw nodes with twinkle
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var tw = 0.2 + Math.sin(n.twinkle) * 0.15;
      var r = n.r + Math.sin(n.twinkle) * 0.3;

      // glow
      ctx.beginPath();
      ctx.arc(n.x, n.y, r + 2, 0, Math.PI * 2);
      if (partyMode) {
        var hue = (now * 0.15 + i * 30) % 360;
        ctx.fillStyle = "hsla(" + hue + ",80%,65%,0.05)";
      } else {
        ctx.fillStyle = "rgba(" + col + ",0.03)";
      }
      ctx.fill();

      // star
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      if (partyMode) {
        ctx.fillStyle = "hsla(" + hue + ",80%,65%,0.7)";
      } else {
        ctx.fillStyle = "rgba(" + col + "," + tw + ")";
      }
      ctx.fill();
    }

    // burst particles
    for (var i = bursts.length - 1; i >= 0; i--) {
      var b = bursts[i];
      b.x += b.vx; b.y += b.vy;
      b.vx *= 0.96; b.vy *= 0.96;
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
    }

    requestAnimationFrame(frame);
  }

  resize();
  init();
  frame();

  window.addEventListener("resize", function () { resize(); init(); });
  document.addEventListener("mousemove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
  document.addEventListener("click", function (e) {
    if (e.target.closest("a, button, input, .card, .navbar, nav")) return;
    spawnBurst(e.clientX, e.clientY);
  });
})();
