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
  function playOgg(src) {
    stopOgg();
    oggEl = new Audio(src);
    oggEl.loop = true;
    oggEl.volume = muted ? 0 : volume;
    oggEl.play().catch(err => console.warn("[music] ogg play failed:", err.message));
  }
  function stopOgg() {
    if (oggEl) {
      try { oggEl.pause(); oggEl.currentTime = 0; } catch (e) {}
      oggEl = null;
    }
  }

  // ---------- Procedural drone (game) ----------
  // Yavaş hareket eden 4 sesli pad + ara sıra üst kayıtta çan-bip.
  // Karanlık uzay istasyonu / reaktör hum dokusu.
  function playDrone() {
    stopDrone();
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const out = ctx.createGain();
    out.gain.value = muted ? 0 : volume * 0.55;
    out.connect(ctx.destination);

    const nodes = [];

    // Pad: A minör tabanlı open intervals (A1 / E2 / C3 / G3)
    const pad = [
      { freq: 55,    type: "sine",     gain: 0.18 },
      { freq: 82.5,  type: "triangle", gain: 0.13 },
      { freq: 130.8, type: "sine",     gain: 0.10 },
      { freq: 196,   type: "triangle", gain: 0.07 },
    ];
    pad.forEach((p, i) => {
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
      filt.frequency.value = 800 + i * 200;
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
    const scale = [330, 392, 440, 523, 587, 659];   // E A pentatoniğe yakın
    const pingTimer = setInterval(() => {
      if (muted) return;
      const f = scale[Math.floor(Math.random() * scale.length)];
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);
      osc.connect(g).connect(out);
      osc.start(t);
      osc.stop(t + 3.7);
    }, 5500 + Math.random() * 3500);

    drone = { ctx, out, nodes, pingTimer };
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
    const playing = (track === "menu" && oggEl && !oggEl.paused)
                 || (track === "game" && drone);
    if (track === currentTrack && playing) return;
    currentTrack = track;
    stopOgg();
    stopDrone();
    if (track === "menu") playOgg("music/space_echo.ogg");
    else if (track === "game") playDrone();
  }
  function stopAll() {
    currentTrack = null;
    stopOgg();
    stopDrone();
  }
  function setMuted(v) {
    muted = !!v;
    if (oggEl) oggEl.volume = muted ? 0 : volume;
    if (drone) drone.out.gain.value = muted ? 0 : volume * 0.55;
  }
  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    if (oggEl) oggEl.volume = muted ? 0 : volume;
    if (drone) drone.out.gain.value = muted ? 0 : volume * 0.55;
  }
  function getVolume() { return volume; }
  function isMuted() { return muted; }

  return { play, stopAll, setMuted, setVolume, getVolume, isMuted };
})();
