(function () {
  'use strict';

var DPR = Math.min(window.devicePixelRatio || 1, 2);

  // ── Helpers ──────────────────────────────────────────────────
  function resize(canvas) {
    var rect = canvas.parentElement.getBoundingClientRect();
    canvas.width  = Math.round(rect.width  * DPR);
    canvas.height = Math.round(rect.height * DPR);
    canvas.style.width  = rect.width  + 'px';
    canvas.style.height = rect.height + 'px';
  }

  // Eased 0→1 progress as section scrolls into view
  function sectionProgress(el) {
    if (!el) return 0;
    var rect = el.getBoundingClientRect();
    var vh   = window.innerHeight;
    var raw  = (vh - rect.top) / (vh + rect.height * 0.25);
    var t    = Math.max(0, Math.min(1, raw));
    // ease-in-out cubic
    return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
  }

  // Smooth scroll-fade for below-fold canvas layers.
  // Layer 2 (first visible section) is always shown immediately.
  // Layers 3 and 4 fade in as they scroll into view.
  function initScrollFades() {
    var canvases = document.querySelectorAll('.layer-canvas');
    if (!window.IntersectionObserver) {
      // No IO support — show all
      canvases.forEach(function(c) { c.style.opacity = '1'; });
      return;
    }
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          e.target.classList.add('fade-in');
        }
      });
    }, { threshold: 0.04, rootMargin: '0px 0px -4% 0px' });

    canvases.forEach(function(c, i) {
      if (i === 0) {
        // First canvas (Layer 2 — stone) is already on screen: show immediately
        c.style.opacity = '1';
      } else {
        // Below fold — arm the fade transition then let IO trigger it
        c.classList.add('fade-ready');
        obs.observe(c);
      }
    });
  }

  // Layer badge fade-in
  function initLayerLabels() {
    if (!window.IntersectionObserver) {
      document.querySelectorAll('.layer-label').forEach(function(l){l.classList.add('visible');});
      return;
    }
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e){ if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.18 });
    document.querySelectorAll('.layer-label').forEach(function(l){ obs.observe(l); });
  }

  // ══════════════════════════════════════════════════════════════
  // LAYER 2 — PHYSICAL SUBSTRATE
  // Deep mineral dark with large slow-drifting radial blobs that
  // suggest geological strata. Subtle hair-thin crack lines emerge
  // as amber veins. No noise — smooth professional gradients only.
  // ══════════════════════════════════════════════════════════════
  function initSolid() {
    var canvas = document.getElementById('canvas-solid');
    if (!canvas) return;
    var section = canvas.parentElement;
    var ctx = canvas.getContext('2d');
    var w, h, t = 0;

    // Slow-drifting blob centres (normalised 0-1)
    var blobs = [
      { x:0.18, y:0.25, vx: 0.00018, vy: 0.00012, r:0.7, h1:'rgba(55,38,18,', h2:'rgba(38,25,10,' },
      { x:0.82, y:0.72, vx:-0.00015, vy:-0.00010, r:0.65,'h1':'rgba(48,32,14,','h2':'rgba(30,18,6,' },
      { x:0.50, y:1.05, vx: 0.00010, vy:-0.00008, r:0.8, h1:'rgba(70,48,20,', h2:'rgba(45,28,8,' },
      { x:0.22, y:0.80, vx:-0.00012, vy: 0.00015, r:0.55,'h1':'rgba(42,28,12,','h2':'rgba(28,16,4,' },
    ];

    // Crack segments — fixed geometric structure for elegance
    var cracks = [];
    function buildCracks() {
      cracks = [];
      var cx = w * 0.5, cy = h * 0.45;
      var angles = [0, 0.52, 1.05, 1.7, 2.4, 3.1, 3.8, 4.6, 5.3];
      angles.forEach(function(a, i) {
        var len = (0.18 + Math.random() * 0.14) * Math.max(w, h);
        var bend = (Math.random() - 0.5) * 0.3;
        var x1 = cx + Math.cos(a) * len * 0.15;
        var y1 = cy + Math.sin(a) * len * 0.15;
        var x2 = cx + Math.cos(a + bend) * len;
        var y2 = cy + Math.sin(a + bend) * len;
        // sub-crack
        var sx = x1 + (x2-x1)*0.4 + Math.cos(a+1.4)*len*0.12;
        var sy = y1 + (y2-y1)*0.4 + Math.sin(a+1.4)*len*0.12;
        cracks.push({x1:x1,y1:y1,x2:x2,y2:y2,phase:i*0.7});
        cracks.push({x1:x1+(x2-x1)*0.4,y1:y1+(y2-y1)*0.4,x2:sx,y2:sy,phase:i*0.7+1.2});
      });
    }

    function seed() {
      resize(canvas);
      w = canvas.width; h = canvas.height;
      buildCracks();
    }

    function draw() {
      t += 0.25;
      ctx.clearRect(0, 0, w, h);

      // ── Rich dark stone base ──
      var bg = ctx.createRadialGradient(w*0.42, h*0.38, 0, w*0.42, h*0.38, Math.max(w,h)*0.9);
      bg.addColorStop(0,   '#0f0b07');
      bg.addColorStop(0.5, '#080604');
      bg.addColorStop(1,   '#030201');
      ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);

      // ── Geological strata blobs ──
      blobs.forEach(function(b) {
        b.x += b.vx; b.y += b.vy;
        if (b.x < -0.1 || b.x > 1.1) b.vx *= -1;
        if (b.y < -0.1 || b.y > 1.2) b.vy *= -1;
        var breathe = 0.85 + 0.15 * Math.sin(t * 0.003 + b.x * 6);
        var rad     = b.r * Math.max(w, h) * breathe;
        var grd = ctx.createRadialGradient(b.x*w, b.y*h, 0, b.x*w, b.y*h, rad);
        grd.addColorStop(0,   b.h1 + '0.22)');
        grd.addColorStop(0.5, b.h2 + '0.10)');
        grd.addColorStop(1,   'transparent');
        ctx.fillStyle = grd; ctx.fillRect(0,0,w,h);
      });

      // ── Amber vein network ──
      ctx.save();
      cracks.forEach(function(c) {
        var pulse = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 0.005 + c.phase));
        // Glow pass
        ctx.lineWidth   = 2.5;
        ctx.shadowBlur  = 12;
        ctx.shadowColor = 'rgba(210,160,60,0.5)';
        ctx.strokeStyle = 'rgba(180,135,45,' + (0.04 * pulse) + ')';
        ctx.beginPath(); ctx.moveTo(c.x1,c.y1); ctx.lineTo(c.x2,c.y2); ctx.stroke();
        // Sharp core
        ctx.lineWidth   = 0.6;
        ctx.shadowBlur  = 4;
        ctx.strokeStyle = 'rgba(230,185,80,' + (0.35 * pulse) + ')';
        ctx.beginPath(); ctx.moveTo(c.x1,c.y1); ctx.lineTo(c.x2,c.y2); ctx.stroke();
      });
      ctx.restore();

      // ── Heat rising from below ──
      var heat = ctx.createLinearGradient(0, h*0.6, 0, h);
      heat.addColorStop(0,   'transparent');
      heat.addColorStop(0.6, 'rgba(90,55,15,0.06)');
      heat.addColorStop(1,   'rgba(120,75,20,0.14)');
      ctx.fillStyle = heat; ctx.fillRect(0,0,w,h);

      // ── Top fade to void ──
      var topfade = ctx.createLinearGradient(0,0,0,h*0.25);
      topfade.addColorStop(0,   'rgba(0,0,0,0.85)');
      topfade.addColorStop(1,   'transparent');
      ctx.fillStyle = topfade; ctx.fillRect(0,0,w,h*0.25);

      // ── Bottom fade to void ──
      var botfade = ctx.createLinearGradient(0,h*0.75,0,h);
      botfade.addColorStop(0,   'transparent');
      botfade.addColorStop(1,   'rgba(0,0,0,0.9)');
      ctx.fillStyle = botfade; ctx.fillRect(0,h*0.75,w,h*0.25);

      requestAnimationFrame(draw);
    }

    seed(); window.addEventListener('resize', seed); draw();
  }

  // ══════════════════════════════════════════════════════════════
  // LAYER 3 — HOLOGRAPHIC FIELD
  // Slow aurora-like colour clouds in deep teal/cyan, a clean
  // perspective grid with glowing horizon, and drifting node orbs.
  // Everything is smooth radial/linear gradients — no pixellation.
  // ══════════════════════════════════════════════════════════════
  function initHolo() {
    var canvas = document.getElementById('canvas-holo');
    if (!canvas) return;
    var section = canvas.parentElement;
    var ctx = canvas.getContext('2d');
    var w, h, t = 0;

    // Aurora blobs
    var aurora = [];
    function buildAurora() {
      aurora = [];
      for (var i = 0; i < 7; i++) {
        aurora.push({
          x: Math.random(), y: 0.1 + Math.random() * 0.7,
          vx: (Math.random()-.5) * 0.00020,
          vy: (Math.random()-.5) * 0.00012,
          rx: 0.35 + Math.random() * 0.25,
          ry: 0.18 + Math.random() * 0.15,
          phase: Math.random() * Math.PI * 2,
          cyan: Math.random() > 0.4
        });
      }
    }

    function seed() {
      resize(canvas); w = canvas.width; h = canvas.height; buildAurora();
    }

    function draw() {
      t += 0.4;
      ctx.clearRect(0, 0, w, h);

      // ── Deep space base ──
      var bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0,   '#010407');
      bg.addColorStop(0.45,'#020609');
      bg.addColorStop(1,   '#010305');
      ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);

      // ── Aurora / nebula clouds ──
      aurora.forEach(function(a) {
        a.x += a.vx; a.y += a.vy;
        if (a.x<-0.15||a.x>1.15) a.vx*=-1;
        if (a.y<-0.05||a.y>1.05) a.vy*=-1;
        var breathe = 0.8 + 0.2 * Math.sin(t * 0.004 + a.phase);
        var rX = a.rx * w * breathe, rY = a.ry * h * breathe;
        var pulse = 0.5 + 0.5 * Math.sin(t * 0.006 + a.phase * 1.3);

        ctx.save();
        ctx.translate(a.x * w, a.y * h);
        ctx.scale(1, rY / rX);
        var grd = ctx.createRadialGradient(0, 0, 0, 0, 0, rX);
        if (a.cyan) {
          grd.addColorStop(0,   'rgba(0,195,215,' + (0.11 * pulse) + ')');
          grd.addColorStop(0.5, 'rgba(0,155,185,' + (0.05 * pulse) + ')');
        } else {
          grd.addColorStop(0,   'rgba(20,80,180,' + (0.08 * pulse) + ')');
          grd.addColorStop(0.5, 'rgba(10,50,130,' + (0.03 * pulse) + ')');
        }
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(0, 0, rX, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      });

      // ── Perspective grid ──
      ctx.save();
      var horizon = h * 0.40;
      ctx.lineWidth = 0.7;

      // Horizontals — exponential density toward horizon, fade at edges
      for (var i = 1; i < 24; i++) {
        var frac = Math.pow(i / 24, 2.2);
        var y    = horizon + (h - horizon) * frac;
        var fade = Math.pow(1 - frac, 1.5) * 0.28;
        ctx.strokeStyle = 'rgba(0,200,215,' + fade + ')';
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Verticals — converging at vanishing point
      var vpx = w * 0.5;
      for (var i = -14; i <= 14; i++) {
        var spread  = (i / 14) * w * 0.52;
        var ex      = vpx + spread;
        var ey      = h + 80;
        var centred = Math.pow(1 - Math.abs(i/14), 2) * 0.14;
        ctx.strokeStyle = 'rgba(0,195,215,' + centred + ')';
        ctx.beginPath(); ctx.moveTo(vpx, horizon); ctx.lineTo(ex, ey); ctx.stroke();
      }

      // Horizon glow line
      var hglow = ctx.createLinearGradient(0, horizon-2, 0, horizon+2);
      hglow.addColorStop(0, 'transparent');
      hglow.addColorStop(0.5,'rgba(0,215,225,0.35)');
      hglow.addColorStop(1, 'transparent');
      ctx.fillStyle = hglow; ctx.fillRect(0, horizon-2, w, 4);

      // Horizon wide bloom
      var hbloom = ctx.createLinearGradient(0, horizon-60, 0, horizon+60);
      hbloom.addColorStop(0, 'transparent');
      hbloom.addColorStop(0.5,'rgba(0,190,215,0.04)');
      hbloom.addColorStop(1, 'transparent');
      ctx.fillStyle = hbloom; ctx.fillRect(0, horizon-60, w, 120);
      ctx.restore();

      // ── Floating node particles ──
      aurora.forEach(function(a, i) {
        if (i >= 5) return; // use first 5 as nodes too
        var px = a.x * w, py = a.y * h;
        var pulse = 0.5 + 0.5 * Math.sin(t * 0.025 + a.phase * 2);
        var nr = 0.025 * Math.max(w,h) * (0.6 + 0.4 * pulse);
        var grd = ctx.createRadialGradient(px,py,0,px,py,nr);
        grd.addColorStop(0,   'rgba(60,225,240,' + (0.55*pulse) + ')');
        grd.addColorStop(0.4, 'rgba(0,180,210,' + (0.2*pulse) + ')');
        grd.addColorStop(1,   'transparent');
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(px, py, nr, 0, Math.PI*2); ctx.fill();
      });

      // ── Top/bottom void fades ──
      var topfade = ctx.createLinearGradient(0,0,0,h*0.22);
      topfade.addColorStop(0,'rgba(0,0,0,0.92)');
      topfade.addColorStop(1,'transparent');
      ctx.fillStyle = topfade; ctx.fillRect(0,0,w,h*0.22);

      var botfade = ctx.createLinearGradient(0,h*0.78,0,h);
      botfade.addColorStop(0,'transparent');
      botfade.addColorStop(1,'rgba(0,0,0,0.92)');
      ctx.fillStyle = botfade; ctx.fillRect(0,h*0.78,w,h*0.22);

      requestAnimationFrame(draw);
    }

    seed(); window.addEventListener('resize', seed); draw();
  }

  // ══════════════════════════════════════════════════════════════
  // LAYER 4 — SOURCE CODE
  // Three-depth matrix rain: far (dim/slow), mid, near (gold/fast).
  // Characters include numerology glyphs. Smooth column gaps,
  // proper DPR scaling, strong vignette for professional look.
  // ══════════════════════════════════════════════════════════════
  function initMatrix() {
    var canvas = document.getElementById('canvas-matrix');
    if (!canvas) return;
    var section = canvas.parentElement;
    var ctx = canvas.getContext('2d');
    var w, h, layers = [], t = 0;

    var GLYPHS = '0123456789\u03A9\u03A8\u039B\u039E\u03C6\u03C0\u2211\u0394\u221E\u221A\u2202\u24F5\u24F6\u24F7\u24F8\u24F9\u24FA\u24FB\u24FC';
    var LATIN  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    function rch(pool) { return pool[Math.floor(Math.random() * pool.length)]; }

    var LAYER_DEFS = [
      // far: dim, slow, tiny, dense
      { fsPx:11, gap:1.8, speed:0.18, maxOpa:0.14, col:[0,145,35],    leadCol:null,       pool: GLYPHS },
      // mid
      { fsPx:14, gap:2.2, speed:0.32, maxOpa:0.32, col:[0,185,48],    leadCol:null,       pool: GLYPHS + LATIN },
      // near: bright, fast, sparse, gold tinted leads
      { fsPx:16, gap:4.5, speed:0.60, maxOpa:0.80, col:[0,210,55],    leadCol:[220,185,65], pool: GLYPHS },
    ];

    function seed() {
      resize(canvas);
      w = canvas.width; h = canvas.height;
      layers = LAYER_DEFS.map(function(def) {
        var fsPx   = def.fsPx * DPR;
        var gapPx  = def.gap  * def.fsPx * DPR;
        var cols   = Math.floor(w / gapPx);
        var drops  = [];
        for (var i = 0; i < cols; i++) drops.push(-(Math.random() * (h / fsPx) * 1.2));
        return { def:def, fsPx:fsPx, gapPx:gapPx, cols:cols, drops:drops };
      });
    }

    function draw() {
      t++;

      // Trail fade — slightly more opaque than traditional for cleaner look
      ctx.fillStyle = 'rgba(0,0,0,0.055)';
      ctx.fillRect(0, 0, w, h);

      layers.forEach(function(layer) {
        var def     = layer.def;
        var baseOpa = def.maxOpa;
        ctx.font    = layer.fsPx + 'px "Courier New", monospace';

        for (var i = 0; i < layer.cols; i++) {
          var x = i * layer.gapPx;
          var y = layer.drops[i] * layer.fsPx;

          if (y > 0 && y < h + layer.fsPx) {
            // Lead character
            var isGold = def.leadCol && Math.random() > 0.15;
            if (isGold) {
              ctx.fillStyle = 'rgba(' + def.leadCol[0]+','+def.leadCol[1]+','+def.leadCol[2]+',' + (baseOpa * (0.7 + 0.3*Math.random())) + ')';
            } else if (Math.random() > 0.96) {
              ctx.fillStyle = 'rgba(255,255,255,' + (baseOpa * 0.9) + ')';
            } else {
              ctx.fillStyle = 'rgba(' + def.col[0]+','+def.col[1]+','+def.col[2]+',' + (baseOpa * (0.6 + 0.4*Math.random())) + ')';
            }
            if (y < h) ctx.fillText(rch(def.pool), x, y);

            // Trail — 4 steps with tight opacity decay
            for (var step = 1; step <= 4; step++) {
              var trailY = y - step * layer.fsPx;
              if (trailY < 0) break;
              var trailOpa = baseOpa * Math.pow(0.55, step);
              ctx.fillStyle = 'rgba(0,' + def.col[1] + ',' + def.col[2] + ',' + trailOpa + ')';
              ctx.fillText(rch('0123456789'), x, trailY);
            }
          }

          layer.drops[i] += def.speed;
          if (layer.drops[i] * layer.fsPx > h + layer.fsPx * 5 && Math.random() > 0.975) {
            layer.drops[i] = -(Math.random() * 30);
          }
        }
      });

      // Deep green fog at bottom
      var fog = ctx.createLinearGradient(0, h*0.65, 0, h);
      fog.addColorStop(0, 'transparent');
      fog.addColorStop(1, 'rgba(0,35,8,0.4)');
      ctx.fillStyle = fog; ctx.fillRect(0, h*0.65, w, h*0.35);

      // Top/bottom void
      var topfade = ctx.createLinearGradient(0,0,0,h*0.2);
      topfade.addColorStop(0,'rgba(0,0,0,0.95)');
      topfade.addColorStop(1,'transparent');
      ctx.fillStyle = topfade; ctx.fillRect(0,0,w,h*0.2);

      var botfade = ctx.createLinearGradient(0,h*0.8,0,h);
      botfade.addColorStop(0,'transparent');
      botfade.addColorStop(1,'rgba(0,0,0,0.95)');
      ctx.fillStyle = botfade; ctx.fillRect(0,h*0.8,w,h*0.2);

      // Soft radial vignette
      var vg = ctx.createRadialGradient(w*.5,h*.45,h*.18, w*.5,h*.45,h*.88);
      vg.addColorStop(0, 'transparent');
      vg.addColorStop(1, 'rgba(0,0,0,0.72)');
      ctx.fillStyle = vg; ctx.fillRect(0,0,w,h);

      requestAnimationFrame(draw);
    }

    seed(); window.addEventListener('resize', seed); draw();
  }

  // ── Boot ─────────────────────────────────────────────────────
  function bootSimulation() {
    setTimeout(function() {
      initSolid();
      initHolo();
      initMatrix();
      initScrollFades();
      initLayerLabels();
    }, 60);
  }

  // Expose so index.html's onAllLoaded() can call it after fragments are injected
  window.bootSimulation = bootSimulation;

})();