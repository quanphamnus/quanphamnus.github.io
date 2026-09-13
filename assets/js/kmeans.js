/* k-means animation for the homepage banner.
   Kept in its own file on purpose: _layouts/default.html applies the
   `compress` layout, which collapses newlines everywhere outside <pre> --
   including inside an inline <script>. That turns every `//` comment into
   one that swallows the rest of the file. It only bites in production
   (compress_html.ignore.envs = development), so an inline version works
   locally and breaks silently once deployed. Static assets are never run
   through a layout, so this file is safe. */
(function () {
  var TAU = Math.PI * 2;
  function gauss() {                       // Box-Muller
    var u = 1 - Math.random(), v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
  }

  function build(canvas) {
    var ctx = canvas.getContext("2d");
    var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var W = 0, H = 0, dpr = 1, pad = 16, aspect = 2.7;

    // ---- state
    var pts = [], K = 4, cen = [], prev = [], trail = [], asg = [], oldAsg = [];
    var iter = 0, inertia = 0, seed = 0, dataAge = 0;
    var t0 = 0, PHASE_A = 360, PHASE_B = 640;   // recolour, then glide
    var phase = "assign", holdAt = 0, done = false, capped = false;
    var TOL_PX = 3, MAX_ITER = 10;   // sklearn's tol / max_iter, in screen pixels

    function theme() {
      var el = canvas.closest("[data-theme]");
      var dark = el ? el.getAttribute("data-theme") === "dark"
                    : document.documentElement.getAttribute("data-theme") === "dark";
      return dark
        ? { pal:["#6fa8dc","#e0837a","#6ebcae","#d7b06a","#a396c9"],
            ink:"#e8e8e8", grid:"rgba(255,255,255,.05)", read:"#517fa4",
            halo:"#1b1b1b", idle:"#5a6167", fieldA:.30 }
        : { pal:["#4a7fb5","#b3645a","#4f9a8f","#c1934a","#8878a8"],
            ink:"#282828", grid:"rgba(40,40,40,.045)", read:"#517fa4",
            halo:"#ffffff", idle:"#b9bec2", fieldA:.26 };
    }

    // ---------- data ----------
    function makeData() {
      var nb = 6 + Math.floor(Math.random() * 4);          // 6-9 true blobs
      var blobs = [], i, b, tries, cand, ok, q;
      var MINSEP = 0.22;                                   // in data units
      for (i = 0; i < nb; i++) {
        for (tries = 0; tries < 80; tries++) {
          cand = { x: 0.10 * aspect + Math.random() * 0.80 * aspect,
                   y: 0.18 + Math.random() * 0.64,
                   s: 0.036 + Math.random() * 0.034 };
          ok = true;
          for (q = 0; q < blobs.length; q++) {
            if (Math.hypot(cand.x - blobs[q].x, cand.y - blobs[q].y) < MINSEP) { ok = false; break; }
          }
          if (ok) break;
        }
        blobs.push(cand);
      }
      pts = [];
      var n = 240;
      for (i = 0; i < n; i++) {
        b = blobs[i % nb];
        pts.push({ x: b.x + gauss() * b.s * aspect * 0.42,
                   y: b.y + gauss() * b.s, a: 0, prevA: 0, mix: 1 });
      }
      // keep everything inside the frame
      for (i = 0; i < pts.length; i++) {
        pts[i].x = Math.max(0.03 * aspect, Math.min(0.97 * aspect, pts[i].x));
        pts[i].y = Math.max(0.05, Math.min(0.95, pts[i].y));
      }
      K = 4 + Math.floor(Math.random() * 2);                // k < nb on purpose
      dataAge = 0;
    }

    function seedCentroids() {
      // Bunched init: all k seeds land within a whisker of one random point.
      // Forgy (k random data points) drops centroids straight into dense
      // regions and converges in ~4 steps; starting them on top of each other
      // makes them fan out and migrate, which roughly doubles the iterations
      // and is far nicer to watch.
      var i, j, anchor = pts[Math.floor(Math.random() * pts.length)];
      cen = [];
      for (j = 0; j < K; j++) {
        cen.push({ x: anchor.x + gauss() * 0.02, y: anchor.y + gauss() * 0.02 });
      }
      prev = cen.map(function (c) { return { x: c.x, y: c.y }; });
      trail = cen.map(function (c) { return [{ x: c.x, y: c.y }]; });
      // -1 = not yet assigned, so the first step fades in from neutral grey
      for (i = 0; i < pts.length; i++) { pts[i].a = -1; pts[i].prevA = -1; pts[i].mix = 1; }
      iter = 0; done = false; capped = false; phase = "assign"; t0 = performance.now();
      seed++; dataAge++;
      assign();
    }

    function assign() {
      var changed = 0, i, j, best, bd, d, dx, dy;
      inertia = 0;
      for (i = 0; i < pts.length; i++) {
        best = 0; bd = Infinity;
        for (j = 0; j < cen.length; j++) {
          dx = pts[i].x - cen[j].x; dy = pts[i].y - cen[j].y;
          d = dx * dx + dy * dy;
          if (d < bd) { bd = d; best = j; }
        }
        pts[i].prevA = pts[i].a;
        if (pts[i].a !== best) changed++;
        pts[i].a = best; pts[i].mix = 0;
        inertia += bd;
      }
      return changed;
    }

    function update() {
      var sx = [], sy = [], n = [], i, j;
      for (j = 0; j < cen.length; j++) { sx[j] = 0; sy[j] = 0; n[j] = 0; }
      for (i = 0; i < pts.length; i++) {
        j = pts[i].a; sx[j] += pts[i].x; sy[j] += pts[i].y; n[j]++;
      }
      prev = cen.map(function (c) { return { x: c.x, y: c.y }; });
      var moved = 0, taken = [];
      for (j = 0; j < cen.length; j++) {
        if (n[j] === 0) {
          // Empty cluster: re-seed it onto the point furthest from its own
          // centroid (MATLAB calls this EmptyAction='singleton').
          // Distances are measured against prev[] - the centroids as they
          // were at the start of this update - because cen[] is being
          // rewritten by this very loop, so reading it would mix old and new
          // positions depending on j. `taken` stops two empty clusters from
          // claiming the same point and landing exactly on top of each other.
          var fi = -1, fd = -1, dx, dy, d;
          for (i = 0; i < pts.length; i++) {
            if (taken.indexOf(i) >= 0) continue;
            dx = pts[i].x - prev[pts[i].a].x; dy = pts[i].y - prev[pts[i].a].y;
            d = dx * dx + dy * dy;
            if (d > fd) { fd = d; fi = i; }
          }
          taken.push(fi);
          cen[j] = { x: pts[fi].x, y: pts[fi].y };
        } else {
          cen[j] = { x: sx[j] / n[j], y: sy[j] / n[j] };
        }
        moved = Math.max(moved, Math.hypot(cen[j].x - prev[j].x, cen[j].y - prev[j].y));
        trail[j].push({ x: cen[j].x, y: cen[j].y });
        if (trail[j].length > 14) trail[j].shift();
      }
      return moved;
    }

    // ---------- drawing ----------
    function layout() {
      var cssW = canvas.parentNode.clientWidth || 700;
      var cssH = cssW < 520 ? 175 : 235;
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
      canvas.style.height = cssH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      W = cssW; H = cssH;
      // ISOTROPIC mapping: data y in [0,1], x in [0,aspect] with aspect = W/H,
      // so one data unit is the same number of pixels on both axes. Anything
      // else and the points would appear to sit on the wrong side of a
      // Voronoi boundary.
      aspect = (W - 2 * pad) / (H - 2 * pad);
    }
    function px(x) { return pad + x * (H - 2 * pad); }
    function py(y) { return pad + y * (H - 2 * pad); }

    function hexRGB(h) {
      return [parseInt(h.substr(1,2),16), parseInt(h.substr(3,2),16), parseInt(h.substr(5,2),16)];
    }

    // Soft Voronoi territories, rendered at 1/SC resolution and scaled up with
    // smoothing. This is what makes the iteration legible: the regions visibly
    // swap before the points recolour.
    var off = document.createElement("canvas"), octx = off.getContext("2d"), SC = 8;
    function field(c, cpos) {
      var w = Math.max(1, Math.ceil(W / SC)), h = Math.max(1, Math.ceil(H / SC));
      if (off.width !== w || off.height !== h) { off.width = w; off.height = h; }
      var img = octx.createImageData(w, h), d = img.data;
      var rgb = cpos.map(function (_, j) { return hexRGB(c.pal[j % c.pal.length]); });
      var span = H - 2 * pad;
      for (var yy = 0; yy < h; yy++) {
        for (var xx = 0; xx < w; xx++) {
          var dx0 = ((xx + .5) * SC - pad) / span, dy0 = ((yy + .5) * SC - pad) / span;
          var best = 0, bd = Infinity;
          for (var j = 0; j < cpos.length; j++) {
            var dx = dx0 - cpos[j].x, dy = dy0 - cpos[j].y, dd = dx * dx + dy * dy;
            if (dd < bd) { bd = dd; best = j; }
          }
          // fade the territory out away from its centroid, otherwise the
          // whole frame fills with flat bands and reads as vertical stripes
          var fall = Math.exp(-bd / (2 * 0.32 * 0.32));
          var o = (yy * w + xx) * 4, col = rgb[best];
          d[o] = col[0]; d[o+1] = col[1]; d[o+2] = col[2];
          d[o+3] = Math.round(255 * fall);
        }
      }
      octx.putImageData(img, 0, 0);
      ctx.save();
      ctx.beginPath(); ctx.rect(pad, pad, W - 2*pad, H - 2*pad); ctx.clip();
      ctx.imageSmoothingEnabled = true;
      ctx.globalAlpha = c.fieldA;
      ctx.drawImage(off, 0, 0, w, h, 0, 0, w * SC, h * SC);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    function grid(c) {
      ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
      var stepPx = 26, x, y;
      ctx.beginPath();
      for (x = pad; x < W - pad + 1; x += stepPx) { ctx.moveTo(x, pad); ctx.lineTo(x, H - pad); }
      for (y = pad; y < H - pad + 1; y += stepPx) { ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); }
      ctx.stroke();
    }

    function mixHex(a, b, t) {                    // crude but fine for 2 hexes
      function p(h) { return [parseInt(h.substr(1,2),16), parseInt(h.substr(3,2),16), parseInt(h.substr(5,2),16)]; }
      var A = p(a), B = p(b);
      return "rgb(" + Math.round(A[0]+(B[0]-A[0])*t) + "," +
                      Math.round(A[1]+(B[1]-A[1])*t) + "," +
                      Math.round(A[2]+(B[2]-A[2])*t) + ")";
    }

    function draw(now) {
      var c = theme(), i, j, e;
      ctx.clearRect(0, 0, W, H);

      var el = now - t0;
      // Outside the glide the centroids must sit at their CURRENT position.
      // Using 0 here drew them back at prev[] for the whole assign phase,
      // so each iteration snapped backwards by its full travel distance.
      var gl = phase === "move" ? Math.min(1, el / PHASE_B) : 1;
      var ease = gl < .5 ? 2*gl*gl : 1 - Math.pow(-2*gl+2, 2)/2;
      var cm = phase === "assign" ? Math.min(1, el / PHASE_A) : 1;

      // interpolated centroid positions - field, trails and markers all use
      // these so the territories always match the markers exactly
      var cpos = cen.map(function (cc, j) {
        return { x: prev[j].x + (cc.x - prev[j].x) * ease,
                 y: prev[j].y + (cc.y - prev[j].y) * ease };
      });
      field(c, cpos);
      grid(c);

      // centroid trails - a nod to the dashed optimiser path, one per centroid
      ctx.setLineDash([3, 3]);
      for (j = 0; j < cen.length; j++) {
        if (trail[j].length < 2) continue;
        ctx.beginPath();
        for (i = 0; i < trail[j].length; i++) {
          var tx = px(trail[j][i].x), ty = py(trail[j][i].y);
          i ? ctx.lineTo(tx, ty) : ctx.moveTo(tx, ty);
        }
        ctx.strokeStyle = c.pal[j % c.pal.length];
        ctx.globalAlpha = .30; ctx.lineWidth = 1.2; ctx.stroke(); ctx.globalAlpha = 1;
      }
      ctx.setLineDash([]);

      // points, colour cross-fading on reassignment
      for (i = 0; i < pts.length; i++) {
        var p = pts[i];
        var t = Math.min(1, p.mix + cm);
        var from = p.prevA < 0 ? c.idle : c.pal[p.prevA % c.pal.length];
        var col = t >= 1 ? c.pal[p.a % c.pal.length]
                         : mixHex(from, c.pal[p.a % c.pal.length], t);
        // points that just switched cluster swell briefly, so each
        // assignment step is visible rather than a quiet colour change
        var flipped = p.prevA !== p.a;
        var r = 2.5 + (flipped ? 2.2 * (1 - t) : 0);
        ctx.beginPath();
        ctx.arc(px(p.x), py(p.y), r, 0, TAU);
        ctx.fillStyle = col; ctx.globalAlpha = flipped ? .72 + .2 * (1 - t) : .72; ctx.fill();
      }
      ctx.globalAlpha = 1;

      // centroids gliding from prev -> cen
      for (j = 0; j < cen.length; j++) {
        var cx = px(cpos[j].x), cy = py(cpos[j].y);
        ctx.beginPath(); ctx.arc(cx, cy, 7.5, 0, TAU);
        ctx.fillStyle = c.halo; ctx.globalAlpha = .85; ctx.fill(); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(cx, cy, 5.2, 0, TAU);
        ctx.strokeStyle = c.pal[j % c.pal.length]; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, 1.9, 0, TAU);
        ctx.fillStyle = c.pal[j % c.pal.length]; ctx.fill();
      }

      // readout, bottom-right - one line, in the site's UI font
      var narrow = W < 520;
      ctx.font = (narrow ? 11 : 12) + "px -apple-system, BlinkMacSystemFont, " +
                 "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
      ctx.textAlign = "right"; ctx.fillStyle = c.read;
      ctx.fillText("k = " + K + "  |  iteration " + iter +
                   (done ? (capped ? "  |  max_iter" : "  |  converged") : ""),
                   W - pad, H - 5);
    }

    function frame(now) {
      var el = now - t0;
      if (done) {
        if (now - holdAt > 2000) {         // pause on the converged result
          if (dataAge >= 3) makeData();     // new dataset every 3 seeds
          seedCentroids();
        }
      } else if (phase === "assign" && el >= PHASE_A) {
        // tol, in PIXELS: k-means' last iterations shift the centroids by
        // less than the eye can resolve. Animating them wastes a full beat on
        // a frame that looks frozen, so apply the move but skip its glide.
        var shiftPx = update() * (H - 2 * pad);
        phase = "move";
        if (shiftPx < TOL_PX) { done = true; holdAt = now; t0 = now - PHASE_B; }
        else t0 = now;
      } else if (phase === "move" && el >= PHASE_B) {
        iter++;
        var changed = assign();
        phase = "assign"; t0 = now;
        // Stopping on tol counts as converged (that is what sklearn reports);
        // hitting the iteration cap does not, so say so rather than claiming
        // a fixed point the run never reached.
        if (changed === 0) { done = true; holdAt = now; }
        else if (iter >= MAX_ITER) { done = true; capped = true; holdAt = now; }
      }
      draw(now);
      requestAnimationFrame(frame);
    }

    // The data's x-range is generated against `aspect`, so it must be rebuilt
    // whenever the container's shape changes materially. This matters on first
    // paint: the block is full page width while the script parses, and only
    // narrows to the content column once the theme's layout applies.
    var lastAspect = 0;
    function relayout() {
      layout();
      if (lastAspect && Math.abs(aspect - lastAspect) / lastAspect > 0.12) {
        makeData(); seedCentroids();
      }
      lastAspect = aspect;
    }
    relayout();
    new ResizeObserver(relayout).observe(canvas.parentNode);
    new MutationObserver(function () { draw(performance.now()); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    makeData(); seedCentroids();
    if (reduce) {
      for (var s = 0; s < 40; s++) { if (update() < 1e-4) break; if (assign() === 0) break; iter++; }
      done = true; phase = "move"; t0 = performance.now() - PHASE_B;
      draw(performance.now());
    } else requestAnimationFrame(frame);
  }

  build(document.getElementById("km-canvas"));
})();
