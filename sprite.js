// PNG sprite engine for the player and echo characters.
// Spritesheets are 128x128 horizontal strips loaded from char/City_men_3/.
// Animation state is derived from caller-provided fields; idle is time-driven.

const Sprite = (() => {
  const FRAME_W = 128;
  const FRAME_H = 128;

  const FRAMES = {
    idle: { src: "char/City_men_3/Idle.png", count: 6,  fps: 6 },
    run:  { src: "char/City_men_3/Run.png",  count: 10, fps: 14 },
    hurt: { src: "char/City_men_3/Hurt.png", count: 3,  fps: 12 },
    dead: { src: "char/City_men_3/Dead.png", count: 5,  fps: 8 },
  };

  const images = {};
  const loaded = {};
  let initialised = false;

  function init() {
    if (initialised) return;
    initialised = true;
    for (const [key, def] of Object.entries(FRAMES)) {
      const img = new Image();
      loaded[key] = false;
      img.onload = () => { loaded[key] = true; };
      img.onerror = () => { loaded[key] = false; };
      img.src = def.src;
      images[key] = img;
    }
  }

  function pickAnim(state) {
    if (state.dead) return "dead";
    if (state.hurt) return "hurt";
    if (state.moving) return "run";
    return "idle";
  }

  function frameIndex(anim, def, state) {
    if (anim === "run") {
      const p = state.walkPhase || 0;
      return Math.floor(p * def.count) % def.count;
    }
    if (anim === "dead") {
      const p = Math.max(0, Math.min(1, state.deadProgress || 1));
      return Math.min(Math.floor(p * def.count), def.count - 1);
    }
    if (anim === "hurt") {
      const p = Math.max(0, Math.min(1, state.hurtProgress || 1));
      return Math.min(Math.floor(p * def.count), def.count - 1);
    }
    // idle
    const t = state.idleClock != null ? state.idleClock : performance.now() / 1000;
    return Math.floor(t * def.fps) % def.count;
  }

  function drawFallback(ctx, cx, cy, size, theme, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = theme === "echo" ? "#8a7dff" : "#5ad7ff";
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function draw(ctx, cx, cy, size, theme, state) {
    const alpha = state.alpha != null ? state.alpha : 1;
    const anim = pickAnim(state);
    const def = FRAMES[anim];

    if (!loaded[anim]) {
      drawFallback(ctx, cx, cy, size, theme, alpha);
      return;
    }

    const idx = frameIndex(anim, def, state);
    const sx = idx * FRAME_W;
    const dw = size;
    const dh = size;
    const dx = cx - dw / 2;
    const dy = cy - dh / 2;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = alpha;

    if (theme === "echo") {
      ctx.filter = "hue-rotate(220deg) saturate(1.6) brightness(0.85)";
    }

    if (state.facing != null && state.facing < 0) {
      ctx.translate(cx, cy);
      ctx.scale(-1, 1);
      ctx.translate(-cx, -cy);
    }

    ctx.drawImage(images[anim], sx, 0, FRAME_W, FRAME_H, dx, dy, dw, dh);
    ctx.restore();
  }

  return { init, draw, FRAMES };
})();
