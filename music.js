// Music — basit OGG playback (HTMLAudio) + minimal MIDI parser/synth (WebAudio).
// İki "track" var: 'menu' (space_echo.ogg) ve 'game' (derelict.mid).
const Music = (() => {
  let muted = false;
  let volume = 0.45;
  let currentTrack = null;
  let oggEl = null;
  let midi = null;            // {events:[{tick,...}], division, totalTicks}
  let midiCtx = null;
  let midiGain = null;
  let midiActiveNodes = [];
  let midiTimer = null;
  let midiStartedAt = 0;
  let midiLoopHandle = null;

  // ---------- OGG ----------
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

  // ---------- MIDI parser ----------
  function readVLQ(view, off) {
    let value = 0, bytes = 0;
    while (true) {
      const b = view.getUint8(off + bytes); bytes++;
      value = (value << 7) | (b & 0x7F);
      if ((b & 0x80) === 0) break;
    }
    return { value, bytes };
  }
  function readString(view, off, len) {
    let s = "";
    for (let i = 0; i < len; i++) s += String.fromCharCode(view.getUint8(off + i));
    return s;
  }
  function parseMidi(buffer) {
    const view = new DataView(buffer);
    let off = 0;
    if (readString(view, off, 4) !== "MThd") throw new Error("not a MIDI file");
    off += 4;
    /* const headerLen = view.getUint32(off); */ off += 4;
    /* const format = view.getUint16(off); */ off += 2;
    const numTracks = view.getUint16(off); off += 2;
    const division = view.getUint16(off); off += 2;

    const allEvents = [];
    for (let t = 0; t < numTracks; t++) {
      if (readString(view, off, 4) !== "MTrk") break;
      off += 4;
      const chunkLen = view.getUint32(off); off += 4;
      const trackEnd = off + chunkLen;
      let tick = 0, lastStatus = 0;
      while (off < trackEnd) {
        const dl = readVLQ(view, off); off += dl.bytes;
        tick += dl.value;
        let status = view.getUint8(off);
        if (status < 0x80) { status = lastStatus; }
        else { off++; lastStatus = status; }
        const type = status & 0xF0;
        const channel = status & 0x0F;

        if (status === 0xFF) {
          const metaType = view.getUint8(off++);
          const ml = readVLQ(view, off); off += ml.bytes;
          if (metaType === 0x51 && ml.value === 3) {
            const tempo = (view.getUint8(off) << 16) | (view.getUint8(off + 1) << 8) | view.getUint8(off + 2);
            allEvents.push({ tick, kind: "tempo", tempo });
          } else if (metaType === 0x2F) {
            // end of track
          }
          off += ml.value;
        } else if (status === 0xF0 || status === 0xF7) {
          const ml = readVLQ(view, off); off += ml.bytes;
          off += ml.value;
        } else if (type === 0xC0 || type === 0xD0) {
          const d1 = view.getUint8(off++);
          allEvents.push({ tick, kind: "program", channel, value: d1 });
        } else if (type === 0x80 || type === 0x90 || type === 0xA0 || type === 0xB0 || type === 0xE0) {
          const d1 = view.getUint8(off++);
          const d2 = view.getUint8(off++);
          if (type === 0x90 && d2 > 0) allEvents.push({ tick, kind: "noteOn", channel, note: d1, vel: d2 });
          else if (type === 0x80 || (type === 0x90 && d2 === 0)) allEvents.push({ tick, kind: "noteOff", channel, note: d1 });
          // ignore CC, aftertouch, pitch bend — keep it simple
        } else {
          // unknown — bail
          break;
        }
      }
      off = trackEnd;
    }
    allEvents.sort((a, b) => a.tick - b.tick);

    // Convert ticks → seconds (account for tempo changes)
    let usPerQ = 500000;        // default 120 BPM
    let curTick = 0, curSec = 0;
    let totalSec = 0;
    const timed = allEvents.map(e => {
      const dt = e.tick - curTick;
      curSec += dt * (usPerQ / 1e6) / division;
      curTick = e.tick;
      if (e.kind === "tempo") usPerQ = e.tempo;
      totalSec = Math.max(totalSec, curSec);
      return { ...e, time: curSec };
    });

    // Pair note-on with note-off → duration
    const notes = [];
    const open = new Map(); // key: channel|note → start info
    for (const e of timed) {
      if (e.kind === "noteOn") {
        const k = `${e.channel}|${e.note}`;
        if (open.has(k)) {
          const prev = open.get(k);
          notes.push({ ...prev, end: e.time });
        }
        open.set(k, { channel: e.channel, note: e.note, vel: e.vel, start: e.time });
      } else if (e.kind === "noteOff") {
        const k = `${e.channel}|${e.note}`;
        if (open.has(k)) {
          const prev = open.get(k);
          notes.push({ ...prev, end: e.time });
          open.delete(k);
        }
      }
    }
    // Close any dangling notes at totalSec
    for (const [, prev] of open) notes.push({ ...prev, end: Math.max(totalSec, prev.start + 0.25) });

    return { notes, totalSec };
  }

  // ---------- MIDI playback ----------
  const midiNoteToHz = (n) => 440 * Math.pow(2, (n - 69) / 12);

  // Channel → simple synth profile
  const PROFILES = [
    { type: "triangle", attack: 0.02, decay: 0.25, sustain: 0.4, release: 0.25, gain: 0.32 },
    { type: "sine",     attack: 0.04, decay: 0.30, sustain: 0.5, release: 0.30, gain: 0.30 },
    { type: "square",   attack: 0.01, decay: 0.20, sustain: 0.25, release: 0.20, gain: 0.18 },
    { type: "sawtooth", attack: 0.02, decay: 0.30, sustain: 0.35, release: 0.30, gain: 0.20 },
  ];

  function ensureMidiCtx() {
    if (!midiCtx) {
      midiCtx = new (window.AudioContext || window.webkitAudioContext)();
      midiGain = midiCtx.createGain();
      midiGain.gain.value = muted ? 0 : volume;
      midiGain.connect(midiCtx.destination);
    }
    if (midiCtx.state === "suspended") midiCtx.resume();
  }

  function scheduleMidiAt(t0) {
    const ctx = midiCtx;
    for (const n of midi.notes) {
      if (n.channel === 9) continue; // drums — skip
      const profile = PROFILES[n.channel % PROFILES.length];
      const startT = t0 + n.start;
      const dur = Math.max(0.05, n.end - n.start);
      const releaseT = startT + dur;

      const osc = ctx.createOscillator();
      osc.type = profile.type;
      osc.frequency.value = midiNoteToHz(n.note);

      const g = ctx.createGain();
      const peak = profile.gain * (n.vel / 127);
      g.gain.setValueAtTime(0, startT);
      g.gain.linearRampToValueAtTime(peak, startT + profile.attack);
      g.gain.linearRampToValueAtTime(peak * profile.sustain, startT + profile.attack + profile.decay);
      g.gain.setValueAtTime(peak * profile.sustain, releaseT);
      g.gain.exponentialRampToValueAtTime(0.0001, releaseT + profile.release);

      osc.connect(g);
      g.connect(midiGain);
      osc.start(startT);
      osc.stop(releaseT + profile.release + 0.05);
      midiActiveNodes.push(osc);
    }
  }

  async function playMidi(src) {
    stopMidi();
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(res.status + " " + res.statusText);
      const buffer = await res.arrayBuffer();
      midi = parseMidi(buffer);
    } catch (err) {
      console.warn("[music] midi load failed (file:// + fetch maybe blocked):", err.message);
      console.warn("[music] çözüm: bir mini http server çalıştır — ör. python -m http.server, sonra http://localhost:8000 adresinden aç.");
      return;
    }
    ensureMidiCtx();
    const t0 = midiCtx.currentTime + 0.1;
    midiStartedAt = t0;
    scheduleMidiAt(t0);
    // loop
    const loopMs = (midi.totalSec + 0.5) * 1000;
    midiLoopHandle = setInterval(() => {
      if (!midi) return;
      const next = midiCtx.currentTime + 0.05;
      scheduleMidiAt(next);
    }, loopMs);
  }

  function stopMidi() {
    if (midiLoopHandle) { clearInterval(midiLoopHandle); midiLoopHandle = null; }
    if (midiActiveNodes.length) {
      for (const n of midiActiveNodes) {
        try { n.stop(); n.disconnect(); } catch (e) {}
      }
      midiActiveNodes = [];
    }
    midi = null;
  }

  // ---------- Public ----------
  function play(track) {
    // Aynı track + zaten çalıyor → es geç. Aksi halde yeniden başlat.
    const playing = (track === "menu" && oggEl && !oggEl.paused)
                 || (track === "game" && midi && midiActiveNodes.length > 0);
    if (track === currentTrack && playing) return;
    currentTrack = track;
    stopOgg();
    stopMidi();
    if (track === "menu") playOgg("music/space_echo.ogg");
    else if (track === "game") playMidi("music/derelict.mid");
  }
  function stopAll() {
    currentTrack = null;
    stopOgg();
    stopMidi();
  }
  function setMuted(v) {
    muted = !!v;
    if (oggEl) oggEl.volume = muted ? 0 : volume;
    if (midiGain) midiGain.gain.value = muted ? 0 : volume;
  }
  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    if (oggEl) oggEl.volume = muted ? 0 : volume;
    if (midiGain) midiGain.gain.value = muted ? 0 : volume;
  }
  function getVolume() { return volume; }
  function isMuted() { return muted; }

  return { play, stopAll, setMuted, setVolume, getVolume, isMuted };
})();
