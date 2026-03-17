(function () {
  "use strict";

  var papers = [
    { id: "interactivekg", title: "InteractiveKG", venue: "Info Vis '26", authors: ["Minchan Kim", "Yanjie Zhao", "Jaeseong Ju", "Jaeeun Seo", "Hyunwoo Park"], keywords: ["Knowledge Graph", "Visualization", "Reasoning"] },
    { id: "stgvad", title: "STGVAD", venue: "IEEE Access '25", authors: ["Jeehong Kim", "Minchan Kim", "Youngseok Hwang", "Sungho Bae", "Deuk Jae Cho", "Wonhee Lee", "Hyunwoo Park"], keywords: ["Spatio-Temporal", "GNN", "Anomaly Detection"] },
    { id: "stgrid", title: "ST Graphs Beyond Grids", venue: "NeurIPS WS '25", authors: ["Jeehong Kim", "Youngseok Hwang", "Minchan Kim", "Sungho Bae", "Hyunwoo Park"], keywords: ["Spatio-Temporal", "Benchmark", "Maritime"] },
    { id: "adaptive", title: "Adaptive Sparsified GL", venue: "AAAI WS '25", authors: ["Jeehong Kim", "Minchan Kim", "Jaeseong Ju", "Youngseok Hwang", "Wonhee Lee", "Hyunwoo Park"], keywords: ["Graph Learning", "Anomaly Detection", "Sparsification"] },
    { id: "treasure", title: "Treasure Hunting", venue: "Pre-print '24", authors: ["Minchan Kim", "Hakyeon Lee"], keywords: ["Talent Acquisition", "GitHub", "Recommendation"] },
  ];

  function dark() { return document.documentElement.getAttribute("data-theme") === "dark"; }
  function c() {
    var d = dark();
    return {
      bg: d ? "#1a202c" : "#fafafa",
      text: d ? "#e2e8f0" : "#2d3748",
      sub: d ? "#718096" : "#a0aec0",
      accent: d ? "#90cdf4" : "#3182ce",
      advisor: d ? "#9ae6b4" : "#68d391",
      node: d ? "#4a5568" : "#cbd5e0",
      edge: d ? "rgba(113,128,150," : "rgba(160,174,192,",
      cardBg: d ? "rgba(45,55,72,0.9)" : "rgba(255,255,255,0.95)",
      cardBorder: d ? "rgba(113,128,150,0.3)" : "rgba(203,213,224,0.6)",
    };
  }

  function makeCanvas(id, h) {
    var el = document.getElementById(id);
    if (!el) return null;
    var cv = document.createElement("canvas");
    var dpr = window.devicePixelRatio || 1;
    cv.style.width = "100%";
    cv.style.height = h + "px";
    el.appendChild(cv);
    function sz() {
      cv.width = el.offsetWidth * dpr;
      cv.height = h * dpr;
      cv.getContext("2d").scale(dpr, dpr);
    }
    sz();
    window.addEventListener("resize", sz);
    cv._w = function () { return el.offsetWidth; };
    cv._h = function () { return h; };
    return cv;
  }

  function trackMouse(cv) {
    var m = { x: -999, y: -999, hit: null };
    cv.addEventListener("mousemove", function (e) {
      var r = cv.getBoundingClientRect();
      m.x = e.clientX - r.left;
      m.y = e.clientY - r.top;
    });
    cv.addEventListener("mouseleave", function () { m.x = -999; m.y = -999; m.hit = null; });
    return m;
  }

  // ── Co-author Network ────────────────────────────────────────────────────
  (function () {
    var cv = makeCanvas("coauthor-graph", 380);
    if (!cv) return;
    var ctx = cv.getContext("2d");
    var mouse = trackMouse(cv);

    // build data
    var amap = {};
    papers.forEach(function (p) {
      p.authors.forEach(function (a) {
        if (!amap[a]) amap[a] = { name: a, count: 0, papers: [] };
        amap[a].count++;
        amap[a].papers.push(p.title);
      });
    });

    var names = Object.keys(amap);
    // radial layout — "Minchan Kim" center, rest on ellipse
    var me = names.indexOf("Minchan Kim");
    var others = names.filter(function (n) { return n !== "Minchan Kim"; });

    var advisors = ["Hyunwoo Park", "Hakyeon Lee"];
    var nodes = names.map(function (name) {
      var isMe = name === "Minchan Kim";
      var isAdvisor = advisors.indexOf(name) !== -1;
      var idx = others.indexOf(name);
      var angle = idx >= 0 ? (idx / others.length) * Math.PI * 2 - Math.PI / 2 : 0;
      var rx = 200, ry = 130;
      return {
        name: name, count: amap[name].count, papers: amap[name].papers, isMe: isMe, isAdvisor: isAdvisor,
        tx: isMe ? 0 : Math.cos(angle) * rx,
        ty: isMe ? 0 : Math.sin(angle) * ry,
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100,
      };
    });

    var eidx = {};
    var edges = [];
    papers.forEach(function (p) {
      for (var i = 0; i < p.authors.length; i++) {
        for (var j = i + 1; j < p.authors.length; j++) {
          var k = [p.authors[i], p.authors[j]].sort().join("|");
          if (!eidx[k]) { eidx[k] = { a: p.authors[i], b: p.authors[j], w: 0 }; edges.push(eidx[k]); }
          eidx[k].w++;
        }
      }
    });

    function nodeByName(n) { for (var i = 0; i < nodes.length; i++) if (nodes[i].name === n) return nodes[i]; return null; }

    function hittest() {
      mouse.hit = null;
      for (var i = 0; i < nodes.length; i++) {
        var dx = nodes[i].x + cv._w() / 2 - mouse.x;
        var dy = nodes[i].y + cv._h() / 2 - mouse.y;
        if (Math.sqrt(dx * dx + dy * dy) < (nodes[i].isMe ? 28 : 20)) { mouse.hit = nodes[i]; break; }
      }
      cv.style.cursor = mouse.hit ? "pointer" : "default";
    }

    function connected(n) {
      if (!mouse.hit) return false;
      for (var i = 0; i < edges.length; i++) {
        if ((edges[i].a === mouse.hit.name && edges[i].b === n.name) ||
            (edges[i].b === mouse.hit.name && edges[i].a === n.name)) return true;
      }
      return false;
    }

    function draw() {
      var w = cv._w(), h = cv._h();
      ctx.clearRect(0, 0, w, h);
      var cl = c();
      var cx = w / 2, cy = h / 2;

      // ease nodes toward target
      nodes.forEach(function (n) {
        n.x += (n.tx - n.x) * 0.06;
        n.y += (n.ty - n.y) * 0.06;
      });
      hittest();

      // edges — curved
      edges.forEach(function (e) {
        var a = nodeByName(e.a), b = nodeByName(e.b);
        if (!a || !b) return;
        var active = mouse.hit && (mouse.hit.name === e.a || mouse.hit.name === e.b);
        var alpha = active ? 0.35 : (mouse.hit ? 0.04 : 0.1 + e.w * 0.03);
        var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        var off = Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y)) * 0.12;
        ctx.beginPath();
        ctx.strokeStyle = cl.edge + alpha + ")";
        ctx.lineWidth = active ? 1.2 : 0.6;
        ctx.moveTo(cx + a.x, cy + a.y);
        ctx.quadraticCurveTo(cx + mx, cy + my - off, cx + b.x, cy + b.y);
        ctx.stroke();
      });

      // nodes
      nodes.forEach(function (n) {
        var active = n === mouse.hit || connected(n) || n.isMe || n.isAdvisor;
        var r = n.isMe ? 18 : n.isAdvisor ? 10 + n.count : 6 + n.count * 2;
        var nx = cx + n.x, ny = cy + n.y;

        if (n === mouse.hit) r += 4;

        ctx.globalAlpha = mouse.hit && !active ? 0.15 : 1;

        // glow for me / advisor nodes
        if (n.isMe || n.isAdvisor) {
          ctx.beginPath();
          ctx.arc(nx, ny, r + 6, 0, Math.PI * 2);
          ctx.fillStyle = n.isMe ? cl.accent : cl.advisor;
          ctx.globalAlpha = (mouse.hit && !active ? 0.02 : 0.06);
          ctx.fill();
        }

        ctx.globalAlpha = mouse.hit && !active ? 0.15 : 1;
        ctx.beginPath();
        ctx.arc(nx, ny, r, 0, Math.PI * 2);
        if (n.isMe) {
          ctx.fillStyle = cl.accent;
          ctx.globalAlpha = mouse.hit && !active ? 0.15 : 0.85;
        } else if (n.isAdvisor) {
          ctx.fillStyle = cl.advisor;
          ctx.globalAlpha = mouse.hit && !active ? 0.15 : 0.7;
        } else {
          ctx.fillStyle = (n === mouse.hit || connected(n)) ? cl.text : cl.node;
          ctx.globalAlpha = mouse.hit && !active ? 0.15 : 0.6;
        }
        ctx.fill();
        ctx.globalAlpha = 1;

        // label
        ctx.globalAlpha = mouse.hit && !active ? 0.1 : 0.8;
        ctx.font = (n.isMe ? "500 13px" : "400 11px") + " Inter, -apple-system, sans-serif";
        ctx.fillStyle = cl.text;
        ctx.textAlign = "center";
        ctx.fillText(n.name, nx, ny - r - 8);
        ctx.globalAlpha = 1;
      });

      // tooltip
      if (mouse.hit) {
        var nx = cx + mouse.hit.x, ny = cy + mouse.hit.y;
        var lines = mouse.hit.papers;
        ctx.font = "11px Inter, -apple-system, sans-serif";
        var maxW = 0;
        lines.forEach(function (l) { maxW = Math.max(maxW, ctx.measureText(l).width); });
        var tw = maxW + 24, th = lines.length * 18 + 14;
        var tx = Math.max(8, Math.min(nx - tw / 2, w - tw - 8));
        var ty = ny + 28;
        if (ty + th > h - 8) ty = ny - th - 28;

        ctx.fillStyle = cl.cardBg;
        ctx.strokeStyle = cl.cardBorder;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.roundRect(tx, ty, tw, th, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = cl.sub;
        ctx.textAlign = "left";
        lines.forEach(function (l, i) { ctx.fillText(l, tx + 12, ty + 18 + i * 18); });
      }

      requestAnimationFrame(draw);
    }
    draw();
  })();

  // ── Paper Network ────────────────────────────────────────────────────────
  (function () {
    var cv = makeCanvas("paper-graph", 380);
    if (!cv) return;
    var ctx = cv.getContext("2d");
    var mouse = trackMouse(cv);

    var nodes = papers.map(function (p, i) {
      var angle = (i / papers.length) * Math.PI * 2 - Math.PI / 2;
      var rx = 220, ry = 120;
      return {
        title: p.title, venue: p.venue, authors: p.authors, keywords: p.keywords,
        tx: Math.cos(angle) * rx,
        ty: Math.sin(angle) * ry,
        x: (Math.random() - 0.5) * 80,
        y: (Math.random() - 0.5) * 80,
      };
    });

    var edges = [];
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var shared = 0;
        nodes[i].authors.forEach(function (a) { if (nodes[j].authors.indexOf(a) !== -1) shared++; });
        if (shared > 0) edges.push({ a: i, b: j, w: shared });
      }
    }

    function hittest() {
      mouse.hit = null;
      var cx = cv._w() / 2, cy = cv._h() / 2;
      for (var i = 0; i < nodes.length; i++) {
        var nx = cx + nodes[i].x, ny = cy + nodes[i].y;
        if (Math.abs(mouse.x - nx) < 62 && Math.abs(mouse.y - ny) < 22) {
          mouse.hit = i; break;
        }
      }
      cv.style.cursor = mouse.hit !== null ? "pointer" : "default";
    }

    function linked(idx) {
      if (mouse.hit === null) return false;
      for (var i = 0; i < edges.length; i++) {
        if ((edges[i].a === mouse.hit && edges[i].b === idx) ||
            (edges[i].b === mouse.hit && edges[i].a === idx)) return true;
      }
      return false;
    }

    function draw() {
      var w = cv._w(), h = cv._h();
      ctx.clearRect(0, 0, w, h);
      var cl = c();
      var cx = w / 2, cy = h / 2;

      nodes.forEach(function (n) {
        n.x += (n.tx - n.x) * 0.05;
        n.y += (n.ty - n.y) * 0.05;
      });
      hittest();

      // edges — curved lines
      edges.forEach(function (e) {
        var a = nodes[e.a], b = nodes[e.b];
        var ax = cx + a.x, ay = cy + a.y;
        var bx = cx + b.x, by = cy + b.y;
        var active = mouse.hit !== null && (mouse.hit === e.a || mouse.hit === e.b);
        var alpha = active ? 0.35 : (mouse.hit !== null ? 0.03 : 0.12);
        var mx = (ax + bx) / 2, my = (ay + by) / 2;
        var off = Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by)) * 0.1;

        ctx.beginPath();
        ctx.strokeStyle = active ? cl.accent : cl.edge + alpha + ")";
        ctx.lineWidth = active ? 1.5 : 0.5;
        ctx.setLineDash(active ? [] : [3, 3]);
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo(mx, my - off, bx, by);
        ctx.stroke();
        ctx.setLineDash([]);

        if (active) {
          ctx.font = "400 9px Inter, -apple-system, sans-serif";
          ctx.fillStyle = cl.accent;
          ctx.textAlign = "center";
          ctx.fillText(e.w + " shared author" + (e.w > 1 ? "s" : ""), (ax + bx) / 2, (ay + by) / 2 - off / 2 - 4);
        }
      });

      // paper cards
      nodes.forEach(function (n, i) {
        var active = i === mouse.hit || linked(i);
        var nx = cx + n.x, ny = cy + n.y;
        var pw = 120, ph = 40;
        var isHovered = i === mouse.hit;

        ctx.globalAlpha = mouse.hit !== null && !active ? 0.12 : 1;

        // card
        ctx.fillStyle = isHovered ? cl.accent : cl.cardBg;
        ctx.strokeStyle = isHovered ? cl.accent : (linked(i) ? cl.text : cl.cardBorder);
        ctx.lineWidth = isHovered ? 1.5 : 0.5;
        ctx.beginPath();
        ctx.roundRect(nx - pw / 2, ny - ph / 2, pw, ph, 8);
        ctx.fill();
        ctx.stroke();

        // title
        ctx.font = "500 11px Inter, -apple-system, sans-serif";
        ctx.fillStyle = isHovered ? "#fff" : cl.text;
        if (dark() && isHovered) ctx.fillStyle = "#1a202c";
        ctx.textAlign = "center";
        ctx.fillText(n.title, nx, ny - 2);

        // venue
        ctx.font = "400 9px Inter, -apple-system, sans-serif";
        ctx.fillStyle = isHovered ? (dark() ? "#2d3748" : "#e2e8f0") : cl.sub;
        ctx.fillText(n.venue, nx, ny + 12);

        ctx.globalAlpha = 1;
      });

      // tooltip
      if (mouse.hit !== null) {
        var n = nodes[mouse.hit];
        var nx = cx + n.x, ny = cy + n.y;
        var lines = [
          "keywords: " + n.keywords.join(" · "),
          "authors: " + n.authors.join(", "),
        ];
        ctx.font = "11px Inter, -apple-system, sans-serif";
        var maxW = 0;
        lines.forEach(function (l) { maxW = Math.max(maxW, ctx.measureText(l).width); });
        var tw = maxW + 24, th = lines.length * 18 + 14;
        var tx = Math.max(8, Math.min(nx - tw / 2, w - tw - 8));
        var ty = ny + 32;
        if (ty + th > h - 8) ty = ny - ph / 2 - th - 8;

        ctx.fillStyle = cl.cardBg;
        ctx.strokeStyle = cl.cardBorder;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.roundRect(tx, ty, tw, th, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = cl.sub;
        ctx.textAlign = "left";
        lines.forEach(function (l, i) { ctx.fillText(l, tx + 12, ty + 18 + i * 18); });
      }

      requestAnimationFrame(draw);
    }
    draw();
  })();
})();
