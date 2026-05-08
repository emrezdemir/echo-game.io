// =====================================================================
// TIME ECHO — full client-side game.
// Modules: Screens, Save, Game.
// =====================================================================

// ---------- Screens ----------
const Screens = (() => {
  function show(name) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    const el = document.getElementById("screen" + name[0].toUpperCase() + name.slice(1));
    if (el) el.classList.add("active");
    // Müzik track seçimi: oyun ekranında 'game', diğerlerinde 'menu'.
    if (typeof Music !== "undefined") {
      Music.play(name === "game" ? "game" : "menu");
    }
  }
  return { show };
})();

// ---------- Save (localStorage progress) ----------
const Save = (() => {
  const KEY = "timeEcho.progress.v1";
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || { cleared: [] }; }
    catch (e) { return { cleared: [] }; }
  }
  function save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (e) {}
  }
  function isCleared(idx) { return load().cleared.includes(idx); }
  function maxUnlocked() {
    const cleared = load().cleared;
    return cleared.length === 0 ? 0 : Math.min(LEVELS.length - 1, Math.max(...cleared) + 1);
  }
  function markCleared(idx) {
    const d = load();
    if (!d.cleared.includes(idx)) d.cleared.push(idx);
    save(d);
  }
  function reset() { save({ cleared: [] }); }
  return { load, isCleared, maxUnlocked, markCleared, reset };
})();

// ---------- Game ----------
const Game = (() => {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const movesEl = document.getElementById("movesLeft");
  const echoEl = document.getElementById("echoCount");
  const levelNumEl = document.getElementById("levelNum");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayBody = document.getElementById("overlayBody");
  const overlayBtn = document.getElementById("overlayBtn");
  const overlayBtn2 = document.getElementById("overlayBtn2");

  const COLORS = {
    bgCell: "#0d1020",
    grid: "#1a1f3a",
    wall: "#2a2f55",
    wallEdge: "#3d4480",
    plate: "#4a3d8a",
    plateOn: "#8a7dff",
    doorClosed: "#3a2855",
    doorOpen: "#1a3a55",
    goal: "#ffd97d",
    goalGlow: "rgba(255,217,125,0.5)",
    player: "#5ad7ff",
    playerGlow: "rgba(90,215,255,0.6)",
    echo: "#8a7dff",
    echoGlow: "rgba(138,125,255,0.4)",
    echoDead: "#3a3550",
    portal: "#7dffb6",
    portalGlow: "rgba(125,255,182,0.5)",
    laserEmit: "#ff7da8",
    laserBeam: "rgba(255,125,168,0.85)",
    laserOff: "#4a3050",
  };

  // ---------- Level parsing ----------
  function parseLevel(def) {
    const grid = def.grid;
    const h = grid.length;
    const w = Math.max(...grid.map(r => r.length));
    const walls = new Set();
    const plates = new Map();
    const doors = new Map();
    const portals = new Map();   // id ('1'..'9') -> [{x,y}, {x,y}]
    const emitters = [];         // {x,y,dir,plate?}
    let start = null;
    let goal = null;

    const dirOf = { ">": [1, 0], "<": [-1, 0], "^": [0, -1], "v": [0, 1] };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const c = grid[y][x];
        if (c === "#") walls.add(`${x},${y}`);
        else if (c === "P") start = { x, y };
        else if (c === "G") goal = { x, y };
        else if (c >= "a" && c <= "z") plates.set(c, { x, y });
        else if (c >= "A" && c <= "Z") doors.set(c, { x, y });
        else if (c >= "1" && c <= "9") {
          if (!portals.has(c)) portals.set(c, []);
          portals.get(c).push({ x, y });
        } else if (dirOf[c]) {
          emitters.push({ x, y, dir: dirOf[c] });
        }
      }
    }
    // Apply level.lasers (plate associations)
    if (def.lasers) {
      def.lasers.forEach(l => {
        const e = emitters.find(em => em.x === l.x && em.y === l.y);
        if (e) e.plate = l.plate;
      });
    }
    return { def, w, h, walls, plates, doors, portals, emitters, start, goal };
  }

  // ---------- State ----------
  let level = null;
  let levelIdx = 0;
  let isCustom = false;
  let customLevel = null;
  let player = null;
  let movesLeft = 0;
  let currentMoves = [];
  let echoes = [];                  // [{moves: [{dx,dy},...]}]
  let echoState = [];               // per-echo: {pos:{x,y}, dead:false}
  let turn = 0;
  let won = false;
  let busy = false;
  let beams = [];                   // current beam cells (post-tick), for render

  function activeEntities() {
    const list = [];
    if (player) list.push({ ...player, kind: "player", alive: !player.dead });
    echoState.forEach((e, i) => list.push({ ...e.pos, kind: "echo", idx: i, alive: !e.dead }));
    return list;
  }

  function liveEntities() { return activeEntities().filter(e => e.alive); }

  function resetRun() {
    player = { ...level.start, dead: false };
    movesLeft = level.def.moves;
    currentMoves = [];
    echoState = echoes.map(() => ({ pos: { ...level.start }, dead: false }));
    turn = 0;
    won = false;
    busy = false;
    hideOverlay();
    computeBeams();
    updateHUD();
  }

  function loadLevel(idx) {
    isCustom = false;
    customLevel = null;
    levelIdx = ((idx % LEVELS.length) + LEVELS.length) % LEVELS.length;
    level = parseLevel(LEVELS[levelIdx]);
    echoes = [];
    levelNumEl.textContent = String(levelIdx + 1);
    Screens.show("game");
    resetRun();
    showIntro();
  }

  function playCustom(def) {
    isCustom = true;
    customLevel = def;
    level = parseLevel(def);
    echoes = [];
    levelNumEl.textContent = I18n.t("ed.customLabel");
    Screens.show("game");
    resetRun();
    showIntro();
  }

  // ---------- Door / Laser state ----------
  function isPlateActive(plateId, entities) {
    const plate = level.plates.get(plateId);
    if (!plate) return false;
    return entities.some(e => e.alive && e.x === plate.x && e.y === plate.y);
  }

  function isDoorOpen(doorId, entities) {
    return isPlateActive(doorId.toLowerCase(), entities);
  }

  function isLaserOn(emitter, entities) {
    if (!emitter.plate) return true;
    return !isPlateActive(emitter.plate, entities);
  }

  function computeBeamsFromEntities(entities) {
    const cells = new Set();
    const beamList = [];
    for (const e of level.emitters) {
      if (!isLaserOn(e, entities)) continue;
      let x = e.x + e.dir[0], y = e.y + e.dir[1];
      while (x >= 0 && y >= 0 && x < level.w && y < level.h) {
        if (level.walls.has(`${x},${y}`)) break;
        // Closed doors block beam
        let blockedByDoor = false;
        for (const [doorId, pos] of level.doors) {
          if (pos.x === x && pos.y === y && !isDoorOpen(doorId, entities)) {
            blockedByDoor = true;
            break;
          }
        }
        if (blockedByDoor) break;
        cells.add(`${x},${y}`);
        beamList.push({ x, y });
        x += e.dir[0];
        y += e.dir[1];
      }
    }
    return { cells, list: beamList };
  }

  function computeBeams() {
    const result = computeBeamsFromEntities(liveEntities());
    beams = result.list;
    return result;
  }

  function isBlocked(x, y, entities) {
    if (x < 0 || y < 0 || x >= level.w || y >= level.h) return true;
    if (level.walls.has(`${x},${y}`)) return true;
    for (const [doorId, pos] of level.doors) {
      if (pos.x === x && pos.y === y && !isDoorOpen(doorId, entities)) return true;
    }
    // Emitters are solid
    for (const e of level.emitters) {
      if (e.x === x && e.y === y) return true;
    }
    return false;
  }

  function portalPair(x, y) {
    for (const [id, pair] of level.portals) {
      const i = pair.findIndex(p => p.x === x && p.y === y);
      if (i !== -1 && pair.length === 2) return pair[1 - i];
    }
    return null;
  }

  // ---------- Tick ----------
  function tick(dx, dy) {
    if (busy || won || movesLeft <= 0) return;
    if (player.dead) return;

    const preEntities = liveEntities();

    // 1. Move player (try)
    const px = player.x + dx;
    const py = player.y + dy;
    let moved = false;
    if (!isBlocked(px, py, preEntities)) {
      player.x = px;
      player.y = py;
      moved = true;
    }
    currentMoves.push({ dx, dy });
    if (moved) Audio.move(); else Audio.bump();

    // 2. Move echoes
    echoState.forEach((es, i) => {
      if (es.dead) return;
      const mv = echoes[i].moves[turn];
      if (!mv) return;
      const nx = es.pos.x + mv.dx;
      const ny = es.pos.y + mv.dy;
      if (!isBlocked(nx, ny, preEntities)) {
        es.pos = { x: nx, y: ny };
      }
    });

    // 3. Resolve teleports (player + echoes)
    const teleEntity = (e) => {
      const target = portalPair(e.x !== undefined ? e.x : e.pos.x, e.y !== undefined ? e.y : e.pos.y);
      return target;
    };
    const pTarget = portalPair(player.x, player.y);
    if (pTarget) {
      player.x = pTarget.x;
      player.y = pTarget.y;
      Audio.teleport();
    }
    echoState.forEach(es => {
      if (es.dead) return;
      const t = portalPair(es.pos.x, es.pos.y);
      if (t) es.pos = { x: t.x, y: t.y };
    });

    turn++;
    movesLeft--;

    // 4. Compute post-tick door/plate state -> compute beams -> damage
    const postEntities = liveEntities();
    const beamData = computeBeamsFromEntities(postEntities);
    let zapped = false;

    if (beamData.cells.has(`${player.x},${player.y}`)) {
      player.dead = true;
      zapped = true;
    }
    echoState.forEach(es => {
      if (es.dead) return;
      if (beamData.cells.has(`${es.pos.x},${es.pos.y}`)) {
        es.dead = true;
        zapped = true;
      }
    });

    if (zapped) Audio.laser();

    // 5. Plate-on sound (best effort: detect any plate that became active)
    // (Skip — too noisy; plate state inferred visually.)

    // Re-compute beams for next render
    beams = computeBeamsFromEntities(liveEntities()).list;

    if (player.dead) {
      Audio.death();
      updateHUD();
      setTimeout(() => showAnnihilated(), 250);
      return;
    }

    // 6. Goal check
    if (player.x === level.goal.x && player.y === level.goal.y) {
      won = true;
      Audio.win();
      updateHUD();
      setTimeout(() => showWin(), 250);
      return;
    }

    if (movesLeft <= 0) {
      updateHUD();
      setTimeout(() => showOutOfSync(), 200);
      return;
    }

    updateHUD();
  }

  // ---------- Echo control ----------
  function recordEcho() {
    if (busy || won) return;
    if (currentMoves.length === 0) {
      flash(I18n.t("flash.noMoves"));
      return;
    }
    echoes.push({ moves: currentMoves.slice() });
    Audio.record();
    resetRun();
  }
  function undoEcho() {
    if (busy) return;
    if (echoes.length === 0) {
      flash(I18n.t("flash.noEcho"));
      return;
    }
    echoes.pop();
    Audio.undo();
    resetRun();
  }
  function fullReset() {
    echoes = [];
    Audio.undo();
    resetRun();
  }

  // ---------- Overlay ----------
  function showOverlay({ title, body, btnText, action, secondText, secondAction, fail }) {
    busy = true;
    overlayTitle.textContent = title;
    overlayBody.textContent = body;
    overlayBtn.textContent = btnText;
    overlay.querySelector(".overlay-card").classList.toggle("fail", !!fail);
    overlay.classList.remove("hidden");
    overlayBtn.onclick = () => {
      Audio.click();
      busy = false;
      hideOverlay();
      action && action();
    };
    if (secondText) {
      overlayBtn2.textContent = secondText;
      overlayBtn2.style.display = "";
      overlayBtn2.onclick = () => {
        Audio.click();
        busy = false;
        hideOverlay();
        secondAction && secondAction();
      };
    } else {
      overlayBtn2.style.display = "none";
    }
  }
  function hideOverlay() {
    overlay.classList.add("hidden");
    busy = false;
  }
  function showIntro() {
    showOverlay({
      title: levelText(level.def, "name"),
      body: levelText(level.def, "intro"),
      btnText: I18n.t("ov.start"),
      action: () => {},
      secondText: I18n.t("ov.menu"),
      secondAction: () => Screens.show("title"),
    });
  }
  function showWin() {
    if (!isCustom) Save.markCleared(levelIdx);
    if (isCustom) {
      showOverlay({
        title: I18n.t("ov.stabilized"),
        body: I18n.t("ov.custom.win"),
        btnText: I18n.t("ov.toEditor"),
        action: () => Screens.show("editor"),
      });
      return;
    }
    const isLast = levelIdx === LEVELS.length - 1;
    showOverlay({
      title: I18n.t("ov.stabilized"),
      body: isLast ? I18n.t("ov.stabilized.last") : I18n.t("ov.stabilized.body"),
      btnText: isLast ? I18n.t("ov.outro") : I18n.t("ov.continue"),
      action: () => {
        if (isLast) showStory(STORY.outro, () => Screens.show("title"));
        else showStory(STORY.afterLevel[levelIdx], () => loadLevel(levelIdx + 1));
      },
      secondText: I18n.t("ov.menu"),
      secondAction: () => Screens.show("title"),
    });
  }
  function showAnnihilated() {
    showOverlay({
      title: I18n.t("ov.annihilated"),
      body: I18n.t("ov.annihilated.body"),
      btnText: I18n.t("ov.retry"),
      action: () => resetRun(),
      secondText: I18n.t("ov.clearEchoes"),
      secondAction: () => fullReset(),
      fail: true,
    });
  }
  function showOutOfSync() {
    showOverlay({
      title: I18n.t("ov.outOfSync"),
      body: I18n.t("ov.outOfSync.body"),
      btnText: I18n.t("ov.newEcho"),
      action: () => recordEcho(),
      secondText: I18n.t("ov.reset"),
      secondAction: () => fullReset(),
      fail: true,
    });
  }

  function flash(text) {
    const orig = document.querySelector(".hud .title").textContent;
    document.querySelector(".hud .title").textContent = "// " + text;
    setTimeout(() => {
      document.querySelector(".hud .title").textContent = orig;
    }, 700);
  }

  function updateHUD() {
    movesEl.textContent = String(movesLeft);
    echoEl.textContent = String(echoes.length);
  }

  // ---------- Render ----------
  function render() {
    if (!level) return;
    const W = canvas.width;
    const H = canvas.height;
    const cell = Math.min(W / level.w, H / level.h);
    const ox = (W - cell * level.w) / 2;
    const oy = (H - cell * level.h) / 2;

    ctx.fillStyle = "#07080d";
    ctx.fillRect(0, 0, W, H);

    // Cells
    for (let y = 0; y < level.h; y++) {
      for (let x = 0; x < level.w; x++) {
        const cx = ox + x * cell;
        const cy = oy + y * cell;
        if (level.walls.has(`${x},${y}`)) {
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(cx, cy, cell, cell);
          ctx.strokeStyle = COLORS.wallEdge;
          ctx.lineWidth = 1;
          ctx.strokeRect(cx + 0.5, cy + 0.5, cell - 1, cell - 1);
        } else {
          ctx.fillStyle = COLORS.bgCell;
          ctx.fillRect(cx, cy, cell, cell);
          ctx.strokeStyle = COLORS.grid;
          ctx.lineWidth = 1;
          ctx.strokeRect(cx + 0.5, cy + 0.5, cell - 1, cell - 1);
        }
      }
    }

    const entities = liveEntities();

    // Plates
    for (const [id, pos] of level.plates) {
      const cx = ox + pos.x * cell;
      const cy = oy + pos.y * cell;
      const active = isPlateActive(id, entities);
      ctx.fillStyle = active ? COLORS.plateOn : COLORS.plate;
      const pad = cell * 0.18;
      ctx.beginPath();
      ctx.arc(cx + cell / 2, cy + cell / 2, cell / 2 - pad, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = active ? "#fff" : COLORS.wallEdge;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = `${Math.floor(cell * 0.3)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = active ? "#fff" : "#9aa6c8";
      ctx.fillText(id, cx + cell / 2, cy + cell / 2 + 1);
    }

    // Portals
    const t = performance.now() / 400;
    for (const [id, pair] of level.portals) {
      pair.forEach((pos, i) => {
        const cx = ox + pos.x * cell + cell / 2;
        const cy = oy + pos.y * cell + cell / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t + i * Math.PI);
        ctx.shadowColor = COLORS.portalGlow;
        ctx.shadowBlur = 12;
        ctx.strokeStyle = COLORS.portal;
        ctx.lineWidth = 2;
        for (let r = cell * 0.18; r < cell * 0.42; r += cell * 0.08) {
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 1.5);
          ctx.stroke();
        }
        ctx.restore();
        ctx.shadowBlur = 0;
        ctx.fillStyle = COLORS.portal;
        ctx.font = `${Math.floor(cell * 0.3)}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(id, cx, cy + 1);
      });
    }

    // Doors
    for (const [id, pos] of level.doors) {
      const cx = ox + pos.x * cell;
      const cy = oy + pos.y * cell;
      const open = isDoorOpen(id, entities);
      if (open) {
        ctx.fillStyle = COLORS.doorOpen;
        ctx.fillRect(cx + cell * 0.1, cy + cell * 0.1, cell * 0.8, cell * 0.8);
        ctx.strokeStyle = "#5ad7ff";
        ctx.lineWidth = 1;
        ctx.strokeRect(cx + cell * 0.1 + 0.5, cy + cell * 0.1 + 0.5, cell * 0.8 - 1, cell * 0.8 - 1);
      } else {
        ctx.fillStyle = COLORS.doorClosed;
        ctx.fillRect(cx, cy, cell, cell);
        ctx.strokeStyle = "#6a4d9a";
        ctx.lineWidth = 2;
        for (let i = 1; i < 4; i++) {
          const yy = cy + (cell * i) / 4;
          ctx.beginPath();
          ctx.moveTo(cx + cell * 0.1, yy);
          ctx.lineTo(cx + cell * 0.9, yy);
          ctx.stroke();
        }
      }
      ctx.fillStyle = open ? "#9aa6c8" : "#c9b6ff";
      ctx.font = `${Math.floor(cell * 0.28)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(id, cx + cell / 2, cy + cell / 2 + 1);
    }

    // Lasers — emitters and beams
    for (const e of level.emitters) {
      const cx = ox + e.x * cell;
      const cy = oy + e.y * cell;
      const on = isLaserOn(e, entities);
      ctx.fillStyle = on ? COLORS.laserEmit : COLORS.laserOff;
      ctx.fillRect(cx + cell * 0.15, cy + cell * 0.15, cell * 0.7, cell * 0.7);
      ctx.fillStyle = "#fff";
      ctx.font = `${Math.floor(cell * 0.5)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let arrow = "?";
      if (e.dir[0] === 1) arrow = "▶";
      else if (e.dir[0] === -1) arrow = "◀";
      else if (e.dir[1] === 1) arrow = "▼";
      else if (e.dir[1] === -1) arrow = "▲";
      ctx.fillStyle = on ? "#fff" : "#888";
      ctx.fillText(arrow, cx + cell / 2, cy + cell / 2 + 1);
    }
    // Beam cells
    ctx.fillStyle = COLORS.laserBeam;
    const flicker = 0.7 + 0.3 * Math.sin(performance.now() / 60);
    ctx.globalAlpha = flicker;
    for (const b of beams) {
      const cx = ox + b.x * cell;
      const cy = oy + b.y * cell;
      ctx.fillRect(cx + cell * 0.35, cy + cell * 0.35, cell * 0.3, cell * 0.3);
      // streak
      ctx.fillRect(cx + cell * 0.05, cy + cell * 0.45, cell * 0.9, cell * 0.1);
    }
    ctx.globalAlpha = 1;

    // Goal
    {
      const cx = ox + level.goal.x * cell;
      const cy = oy + level.goal.y * cell;
      const tt = performance.now() / 600;
      const r = cell * (0.30 + 0.04 * Math.sin(tt));
      ctx.shadowColor = COLORS.goalGlow;
      ctx.shadowBlur = 14;
      ctx.fillStyle = COLORS.goal;
      drawStar(cx + cell / 2, cy + cell / 2, 4, r, r * 0.5);
      ctx.shadowBlur = 0;
    }

    // Echoes
    echoState.forEach((es, i) => {
      const cx = ox + es.pos.x * cell;
      const cy = oy + es.pos.y * cell;
      if (es.dead) {
        ctx.fillStyle = COLORS.echoDead;
        ctx.globalAlpha = 0.5;
        drawDiamond(cx + cell / 2, cy + cell / 2, cell * 0.28);
        ctx.globalAlpha = 1;
        return;
      }
      ctx.shadowColor = COLORS.echoGlow;
      ctx.shadowBlur = 12;
      ctx.fillStyle = COLORS.echo;
      ctx.globalAlpha = 0.55;
      drawDiamond(cx + cell / 2, cy + cell / 2, cell * 0.32);
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.strokeStyle = COLORS.echo;
      ctx.lineWidth = 1.2;
      drawDiamondStroke(cx + cell / 2, cy + cell / 2, cell * 0.32);
    });

    // Player
    if (player && !player.dead) {
      const cx = ox + player.x * cell;
      const cy = oy + player.y * cell;
      ctx.shadowColor = COLORS.playerGlow;
      ctx.shadowBlur = 16;
      ctx.fillStyle = COLORS.player;
      drawDiamond(cx + cell / 2, cy + cell / 2, cell * 0.36);
      ctx.shadowBlur = 0;
    } else if (player && player.dead) {
      const cx = ox + player.x * cell;
      const cy = oy + player.y * cell;
      ctx.fillStyle = "#5a2a2a";
      ctx.globalAlpha = 0.6;
      drawDiamond(cx + cell / 2, cy + cell / 2, cell * 0.32);
      ctx.globalAlpha = 1;
    }
  }

  function drawDiamond(cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
    ctx.fill();
  }
  function drawDiamondStroke(cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
    ctx.stroke();
  }
  function drawStar(cx, cy, points, outer, inner) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (Math.PI / points) * i - Math.PI / 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  // ---------- Input ----------
  const KEYS = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
    W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0],
  };

  function isGameScreenActive() {
    return document.getElementById("screenGame").classList.contains("active");
  }

  window.addEventListener("keydown", (e) => {
    if (!isGameScreenActive()) return;
    if (e.key === "r" || e.key === "R") { e.preventDefault(); recordEcho(); return; }
    if (e.key === "z" || e.key === "Z") { e.preventDefault(); undoEcho(); return; }
    if (e.key === "n" || e.key === "N") { e.preventDefault(); fullReset(); return; }
    if (e.key === "m" || e.key === "M") { e.preventDefault(); toggleMute(); return; }
    if (e.key === "Escape") { e.preventDefault(); Screens.show("title"); return; }
    if (e.key === "Enter" && !overlay.classList.contains("hidden")) {
      e.preventDefault(); overlayBtn.click(); return;
    }
    const dir = KEYS[e.key];
    if (dir) { e.preventDefault(); tick(dir[0], dir[1]); }
  });

  // ---------- Touch input (mobil) ----------
  const TOUCH_DIRS = {
    up:    [0, -1],
    down:  [0, 1],
    left:  [-1, 0],
    right: [1, 0],
  };
  function bindTouchControls() {
    document.querySelectorAll("[data-touch]").forEach(btn => {
      const act = btn.dataset.touch;
      const fire = (e) => {
        e.preventDefault();
        if (TOUCH_DIRS[act]) tick(TOUCH_DIRS[act][0], TOUCH_DIRS[act][1]);
        else if (act === "r") recordEcho();
        else if (act === "z") undoEcho();
        else if (act === "n") fullReset();
      };
      // pointerdown her iki platform için yeterli
      btn.addEventListener("pointerdown", fire);
    });

    // Canvas üzerinde swipe ile hareket
    let sx = 0, sy = 0, swiping = false;
    const SWIPE = 24;
    canvas.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      sx = t.clientX; sy = t.clientY; swiping = true;
    }, { passive: true });
    canvas.addEventListener("touchend", (e) => {
      if (!swiping) return;
      swiping = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      if (Math.abs(dx) < SWIPE && Math.abs(dy) < SWIPE) return;
      if (Math.abs(dx) > Math.abs(dy)) tick(dx > 0 ? 1 : -1, 0);
      else tick(0, dy > 0 ? 1 : -1);
    });
    // Fareyle de swipe'a izin ver (tablet/dokunmatik laptop)
    canvas.addEventListener("touchmove", (e) => {
      if (swiping) e.preventDefault();
    }, { passive: false });
  }

  function toggleMute() {
    const m = !Audio.isMuted();
    Audio.setMuted(m);
    if (typeof Music !== "undefined") Music.setMuted(m);
    updateMuteLabel();
    flash(I18n.t(m ? "flash.muted" : "flash.unmuted"));
  }
  function updateMuteLabel() {
    const btn = document.getElementById("btnMute");
    if (btn) btn.textContent = I18n.t(Audio.isMuted() ? "menu.sound.off" : "menu.sound.on");
  }
  function toggleLang() {
    I18n.toggle();
    updateMuteLabel();
    // Aktif overlay'ı tazele
    if (level && document.getElementById("screenGame").classList.contains("active") && busy) {
      // tek satır intro overlay'ı yeniden çizmek için
      hideOverlay();
      showIntro();
    }
    // Seviye numarası etiketi
    if (level) {
      levelNumEl.textContent = isCustom ? I18n.t("ed.customLabel") : String(levelIdx + 1);
    }
    // Listeleri yeniden kur
    if (document.getElementById("screenSelect").classList.contains("active")) buildLevelList();
    if (document.getElementById("screenVersion").classList.contains("active")) buildVersionList();
    flash(I18n.t("flash.lang"));
  }

  // ---------- Animation loop ----------
  function loop() {
    if (isGameScreenActive()) render();
    if (document.getElementById("screenEditor").classList.contains("active")) Editor.render();
    requestAnimationFrame(loop);
  }

  // ---------- Story ----------
  function showStory(entry, after) {
    if (!entry) { after && after(); return; }
    document.getElementById("storyTitle").textContent = entry.title;
    document.getElementById("storyBody").textContent = entry.lines.join("\n");
    Screens.show("story");
    document.getElementById("storyContinue").onclick = () => {
      Audio.click();
      after && after();
    };
  }

  function playTutorialThen(done) {
    const pages = STORY.tutorial || [];
    let i = 0;
    const next = () => {
      if (i >= pages.length) { done && done(); return; }
      showStory(pages[i++], next);
    };
    next();
  }

  // ---------- Boot / Menu ----------
  function buildVersionList() {
    const list = document.getElementById("versionList");
    list.innerHTML = "";
    VERSION.history.forEach((entry, i) => {
      const block = document.createElement("div");
      block.className = "version-block" + (i === 0 ? " current" : "");
      const lang = I18n.get();
      const changes = (entry.changes && entry.changes[lang]) || entry.changes.tr || entry.changes;
      const items = (Array.isArray(changes) ? changes : []).map(c => `<li>${escapeHtml(c)}</li>`).join("");
      block.innerHTML = `
        <div class="vh">
          <span class="vnum">v${entry.v}${i === 0 ? I18n.t("ver.current") : ""}</span>
          <span class="vmeta">${entry.date}</span>
        </div>
        <div class="vcode">"${escapeHtml(entry.codename)}"</div>
        <ul>${items}</ul>
      `;
      list.appendChild(block);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function buildLevelList() {
    const list = document.getElementById("levelList");
    list.innerHTML = "";
    const unlocked = Save.maxUnlocked();
    LEVELS.forEach((lv, i) => {
      const card = document.createElement("button");
      card.className = "level-card";
      if (Save.isCleared(i)) card.classList.add("cleared");
      if (i > unlocked) card.classList.add("locked");
      const numLine = I18n.t("select.levelLine", String(i + 1).padStart(2, "0"), lv.moves);
      card.innerHTML = `<span class="num">${escapeHtml(numLine)}</span><span class="lname">${escapeHtml(levelText(lv, "name"))}</span>`;
      card.onclick = () => {
        if (i > unlocked) { Audio.bump(); return; }
        Audio.click();
        loadLevel(i);
      };
      list.appendChild(card);
    });
  }

  function bindMenu() {
    document.querySelectorAll('[data-act]').forEach(btn => {
      const act = btn.dataset.act;
      btn.addEventListener("click", () => {
        Audio.click();
        if (act === "start") {
          showStory(STORY.intro, () => playTutorialThen(() => loadLevel(0)));
        } else if (act === "tutorial") {
          playTutorialThen(() => loadLevel(0));
        } else if (act === "select") {
          buildLevelList();
          Screens.show("select");
        } else if (act === "editor") {
          Editor.open();
          Screens.show("editor");
        } else if (act === "version") {
          buildVersionList();
          Screens.show("version");
        } else if (act === "mute") {
          toggleMute();
        } else if (act === "lang") {
          toggleLang();
        } else if (act === "title") {
          Screens.show("title");
        } else if (act === "menu") {
          Screens.show("title");
        }
      });
    });
  }

  // ---------- URL hash share import ----------
  function tryHashImport() {
    const m = location.hash.match(/l=([A-Za-z0-9+/=_-]+)/);
    if (!m) return false;
    const lvl = Editor.decodeLevel(m[1]);
    if (lvl) {
      Screens.show("game");
      playCustom(lvl);
      return true;
    }
    return false;
  }

  // ---------- Init ----------
  function applyVersionLabels() {
    const v = `v${VERSION.number}`;
    const titleEl = document.getElementById("titleVersion");
    if (titleEl) titleEl.textContent = `${v} · ${VERSION.codename} · ${VERSION.build} build`;
    const hudEl = document.getElementById("hudVersion");
    if (hudEl) hudEl.textContent = v;
  }

  function init() {
    I18n.apply();
    applyVersionLabels();
    updateMuteLabel();
    bindMenu();
    bindTouchControls();
    loop();
    if (!tryHashImport()) {
      Screens.show("title");
    }
    // Tarayıcı müziği ilk kullanıcı etkileşiminden önce başlatmaz —
    // ilk tıklamada/tuşta mevcut track'i yeniden tetikle.
    const kickstart = () => {
      if (typeof Music !== "undefined") {
        const inGame = document.getElementById("screenGame").classList.contains("active");
        Music.play(inGame ? "game" : "menu");
      }
      window.removeEventListener("pointerdown", kickstart);
      window.removeEventListener("keydown", kickstart);
    };
    window.addEventListener("pointerdown", kickstart);
    window.addEventListener("keydown", kickstart);
  }

  return { loadLevel, playCustom, render, init };
})();

window.addEventListener("DOMContentLoaded", () => Game.init());
