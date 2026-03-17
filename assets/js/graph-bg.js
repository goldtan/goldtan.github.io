(function () {
  var canvas = document.getElementById("graph-bg");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var nodes = [];
  var NUM_NODES = 60;
  var CONNECT_DIST = 120;
  var mouse = { x: -9999, y: -9999 };
  var raf;

  function resize() {
    var rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  function isDark() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  function initNodes() {
    nodes = [];
    for (var i = 0; i < NUM_NODES; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 1,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var dark = isDark();
    var nodeColor = dark ? "rgba(160,174,192," : "rgba(74,85,104,";
    var lineColor = dark ? "rgba(160,174,192," : "rgba(74,85,104,";

    // edges
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var dx = nodes[i].x - nodes[j].x;
        var dy = nodes[i].y - nodes[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          var alpha = (1 - dist / CONNECT_DIST) * 0.15;
          ctx.beginPath();
          ctx.strokeStyle = lineColor + alpha + ")";
          ctx.lineWidth = 0.5;
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // nodes
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = nodeColor + "0.3)";
      ctx.fill();
    }
  }

  function update() {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];

      // gentle mouse repulsion
      var dx = n.x - mouse.x;
      var dy = n.y - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100 && dist > 0) {
        var force = (100 - dist) / 100 * 0.3;
        n.vx += (dx / dist) * force;
        n.vy += (dy / dist) * force;
      }

      // damping
      n.vx *= 0.99;
      n.vy *= 0.99;

      n.x += n.vx;
      n.y += n.vy;

      // wrap around
      if (n.x < -10) n.x = canvas.width + 10;
      if (n.x > canvas.width + 10) n.x = -10;
      if (n.y < -10) n.y = canvas.height + 10;
      if (n.y > canvas.height + 10) n.y = -10;
    }
  }

  function loop() {
    update();
    draw();
    raf = requestAnimationFrame(loop);
  }

  resize();
  initNodes();
  loop();

  window.addEventListener("resize", function () {
    resize();
    initNodes();
  });

  canvas.parentElement.addEventListener("mousemove", function (e) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.parentElement.addEventListener("mouseleave", function () {
    mouse.x = -9999;
    mouse.y = -9999;
  });
})();
