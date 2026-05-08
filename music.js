// Music — basit. İki track:
//   'menu' → music/space_echo.ogg  (HTMLAudio, döngülü)
//   'game' → prosedürel ambient drone (WebAudio, dosya yok)
//
// MIDI yok, fetch yok, server yok. file:// üzerinden bile direkt çalışır.

const Music = (() => {
  let muted = false;
  let volume = 0.45;
  let currentTrack = null;
  let oggEl = null;
  let drone = null;

  // ---------- OGG (menu) ----------
  // window.Audio kullanıyoruz; bizim global Audio (audio.js) modülü ismi gölgeler.
  function playOgg(src, onFail) {
    stopOgg();
    oggEl = new window.Audio(src);
    oggEl.loop = true;
    oggEl.volume = muted ? 0 : volume;
    let triggeredFail = false;
    const fail = (why) => {
      if (triggeredFail) return;
      triggeredFail = true;
      console.warn("[music] ogg yüklenemedi (" + why + ") — prosedürel müziğe geçiliyor.");
      stopOgg();
      onFail && onFail();
    };
    oggEl.addEventListener("error", () => fail("error event"));
    // file:// kısıtlamasında bazen sessiz başarısız olur — kısa bir grace period sonra dene
    setTimeout(() => {
      if (oggEl && oggEl.networkState === 3 /* NETWORK_NO_SOURCE */) fail("network no source");
    }, 800);
    oggEl.play().catch(err => fail(err.message || "play() rejected"));
  }
  function stopOgg() {
    if (oggEl) {
      try { oggEl.pause(); oggEl.currentTime = 0; } catch (e) {}
      oggEl = null;
    }
  }

  // ---------- Procedural drone ----------
  // Yavaş hareket eden 4 sesli pad + ara sıra üst kayıtta çan-bip.
  // variant: 'game' (karanlık reaktör), 'menu' (daha açık/yıldız ambient).
  const DRONE_VARIANTS = {
    game: {
      pad: [
        { freq: 55,    type: "sine",     gain: 0.18, filter: 800 },
        { freq: 82.5,  type: "triangle", gain: 0.13, filter: 1000 },
        { freq: 130.8, type: "sine",     gain: 0.10, filter: 1200 },
        { freq: 196,   type: "triangle", gain: 0.07, filter: 1400 },
      ],
      pingScale: [330, 392, 440, 523, 587, 659],
      pingMin: 5500, pingMax: 9000, pingGain: 0.05,
      masterMul: 0.55,
    },
    menu: {
      pad: [
        { freq: 110,   type: "sine",     gain: 0.13, filter: 1200 },
        { freq: 165,   type: "triangle", gain: 0.10, filter: 1500 },
        { freq: 220,   type: "sine",     gain: 0.08, filter: 1800 },
        { freq: 330,   type: "triangle", gain: 0.05, filter: 2200 },
      ],
      pingScale: [440, 523, 659, 784, 880, 1047],
      pingMin: 3500, pingMax: 6500, pingGain: 0.04,
      masterMul: 0.45,
    },
  };

  function playDrone(variant = "game") {
    stopDrone();
    const cfg = DRONE_VARIANTS[variant] || DRONE_VARIANTS.game;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const out = ctx.createGain();
    out.gain.value = muted ? 0 : volume * cfg.masterMul;
    out.connect(ctx.destination);

    const nodes = [];

    cfg.pad.forEach((p, i) => {
      const osc = ctx.createOscillator();
      osc.type = p.type;
      osc.frequency.value = p.freq;

      // Yavaş LFO — frekansı hafif salla, "nefes alıyor" hissi
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.04 + i * 0.025;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.4 + i * 0.15;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      // Yumuşak filtre
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = p.filter;
      filt.Q.value = 0.7;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(p.gain, ctx.currentTime + 4);

      osc.connect(filt).connect(g).connect(out);
      osc.start();
      lfo.start();
      nodes.push(osc, lfo);
    });

    // Ara sıra üst register'da çan-pingleri
    const pingDelay = cfg.pingMin + Math.random() * (cfg.pingMax - cfg.pingMin);
    const pingTimer = setInterval(() => {
      if (muted) return;
      const f = cfg.pingScale[Math.floor(Math.random() * cfg.pingScale.length)];
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(cfg.pingGain, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);
      osc.connect(g).connect(out);
      osc.start(t);
      osc.stop(t + 3.7);
    }, pingDelay);

    drone = { ctx, out, nodes, pingTimer, variant, masterMul: cfg.masterMul };
  }

  function stopDrone() {
    if (!drone) return;
    clearInterval(drone.pingTimer);
    try {
      drone.nodes.forEach(n => { try { n.stop(); } catch (e) {} });
      drone.ctx.close();
    } catch (e) {}
    drone = null;
  }

  // ---------- Public ----------
  function play(track) {
    const playing = (track === "menu" && (oggEl && !oggEl.paused || (drone && drone.variant === "menu")))
                 || (track === "game" && drone && drone.variant === "game");
    if (track === currentTrack && playing) return;
    currentTrack = track;
    stopOgg();
    stopDrone();
    if (track === "menu") {
      // Önce OGG'yi dene; başarısız olursa prosedürel menü drone'una düş.
      playOgg("music/space_echo.ogg", () => playDrone("menu"));
    } else if (track === "game") {
      playDrone("game");
    }
  }
  function stopAll() {
    currentTrack = null;
    stopOgg();
    stopDrone();
  }
  function setMuted(v) {
    muted = !!v;
    if (oggEl) oggEl.volume = muted ? 0 : volume;
    if (drone) drone.out.gain.value = muted ? 0 : volume * drone.masterMul;
  }
  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    if (oggEl) oggEl.volume = muted ? 0 : volume;
    if (drone) drone.out.gain.value = muted ? 0 : volume * drone.masterMul;
  }
  function getVolume() { return volume; }
  function isMuted() { return muted; }

  return { play, stopAll, setMuted, setVolume, getVolume, isMuted };
})();
