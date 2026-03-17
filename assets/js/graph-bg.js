(function () {
  var canvas = document.getElementById("graph-bg");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var nodes = [];
  var NUM = 80;
  var DIST = 160;
  var mouse = { x: -9999, y: -9999 };

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

    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var dx = n.x - mouse.x, dy = n.y - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120 && dist > 0) {
        n.vx += dx / dist * 0.06;
        n.vy += dy / dist * 0.06;
      }
      n.vx *= 0.988;
      n.vy *= 0.988;
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
          ctx.strokeStyle = "rgba(" + col + "," + a + ")";
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
      ctx.fillStyle = "rgba(" + col + ",0.3)";
      ctx.fill();
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
})();
