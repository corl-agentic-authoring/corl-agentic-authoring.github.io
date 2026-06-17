/* Agentic Authoring interactions: animated sim-grid background,
   nav state, and scroll-reveal. Vanilla JS, no dependencies. */

(function () {
  "use strict";

  /* ---------- Nav scrolled state ---------- */
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 20);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Scroll reveal ---------- */
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reveals = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    // stagger siblings within each grid for a nicer cascade
    reveals.forEach((el) => {
      const sibs = Array.from(el.parentElement.children).filter((c) =>
        c.classList.contains("reveal")
      );
      el.style.transitionDelay = Math.min(sibs.indexOf(el), 6) * 70 + "ms";
      io.observe(el);
    });
  }

  /* ---------- Animated background: drifting particle network + grid ---------- */
  const canvas = document.getElementById("bg-canvas");
  if (!canvas || reduce) return;
  const ctx = canvas.getContext("2d");

  let w, h, dpr, particles;
  const COUNT = () => Math.min(90, Math.floor((w * h) / 18000));
  const LINK_DIST = 130;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles();
  }

  // deterministic-ish spread without Math.random dependency concerns
  function initParticles() {
    const n = COUNT();
    particles = [];
    for (let i = 0; i < n; i++) {
      const a = (i * 2.39996) % (Math.PI * 2); // golden-angle scatter
      const r = ((i * 53) % 100) / 100;
      particles.push({
        x: ((Math.sin(a) * 0.5 + 0.5) * w + i * 37) % w,
        y: ((Math.cos(a) * 0.5 + 0.5) * h + i * 71) % h,
        vx: (Math.cos(a) * 0.18) * (0.4 + r),
        vy: (Math.sin(a) * 0.18) * (0.4 + r),
      });
    }
  }

  const mouse = { x: -9999, y: -9999 };
  window.addEventListener(
    "mousemove",
    (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    },
    { passive: true }
  );
  window.addEventListener("mouseleave", () => {
    mouse.x = mouse.y = -9999;
  });

  function tick() {
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x += w; else if (p.x > w) p.x -= w;
      if (p.y < 0) p.y += h; else if (p.y > h) p.y -= h;

      // links
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK_DIST * LINK_DIST) {
          const o = (1 - Math.sqrt(d2) / LINK_DIST) * 0.5;
          ctx.strokeStyle = "rgba(120,150,255," + o.toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }

      // mouse glow link
      const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
      const md2 = mdx * mdx + mdy * mdy;
      if (md2 < 200 * 200) {
        const o = (1 - Math.sqrt(md2) / 200) * 0.6;
        ctx.strokeStyle = "rgba(52,227,255," + o.toFixed(3) + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }

      // node
      ctx.fillStyle = "rgba(180,200,255,0.7)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(tick);
})();
