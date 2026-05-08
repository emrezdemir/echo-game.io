// Hücre kodları:
//   .  boş zemin
//   #  duvar
//   P  oyuncu başlangıç
//   G  hedef
//   a-z plaka
//   A-Z kapı   (plaka 'a' aktifken kapı 'A' açılır)
//   1-9 portal (aynı rakamlı iki portal birbirine ışınlar)
//   ^v<>  lazer yayıcı
//
// İsim ve intro alanları iki dilli: { tr: "...", en: "..." }
// game.js içindeki levelText() helper'ı mevcut dile göre seçer.

const LEVELS = [
  {
    name:  { tr: "İLK YANKI",       en: "FIRST ECHO" },
    intro: {
      tr: "① Plakaya (◯ a) yürü.  ② [R] tuşuna bas — yankın oluşur.  ③ Sen başa dönersin, yankı plakaya yürür → A kapısı açılır.  ④ Sen ✦ hedefe geç.",
      en: "① Walk to the plate (◯ a).  ② Press [R] — your echo is born.  ③ You teleport back, the echo walks to the plate → door A opens.  ④ You walk to the ✦ goal.",
    },
    moves: 10,
    grid: [
      "#######",
      "#P....#",
      "#..a..#",
      "###A###",
      "#G....#",
      "#######",
    ],
  },

  {
    name:  { tr: "ÇİFT DOLAŞIK",    en: "TWIN ENTANGLED" },
    intro: { tr: "İki plaka, iki kapı. Üç zaman çizgisi gerek.",
             en: "Two plates, two doors. You need three timelines." },
    moves: 18,
    grid: [
      "##########",
      "#P.a..b..#",
      "#........#",
      "####A#####",
      "#........#",
      "#####B####",
      "#........#",
      "#.......G#",
      "##########",
    ],
  },

  {
    name:  { tr: "ÜÇ EŞZAMANLI",    en: "THREE SIMULTANEOUS" },
    intro: { tr: "Üç plaka aynı anda aktif olmalı. Sen artı iki yankı.",
             en: "Three plates active simultaneously. You plus two echoes." },
    moves: 24,
    grid: [
      "###########",
      "#P..a..b..#",
      "#.........#",
      "#####A#####",
      "#....c....#",
      "#####B#####",
      "#.........#",
      "#####C#####",
      "#........G#",
      "###########",
    ],
  },

  {
    name:  { tr: "KÖPRÜ",           en: "BRIDGE" },
    intro: { tr: "Eşli portallar. Aynı rakam birbirine bağlı.",
             en: "Paired portals. Same digit links them." },
    moves: 16,
    grid: [
      "#########",
      "#P......#",
      "##.####1#",
      "#..a....#",
      "#########",
      "#2....AG#",
      "#########",
    ],
  },

  {
    name:  { tr: "IŞIN",            en: "BEAM" },
    intro: { tr: "Lazer ölümcül. Plaka aktifken yayıcı kapanır.",
             en: "The laser is lethal. Holding the plate disables the emitter." },
    moves: 16,
    grid: [
      "#########",
      "#P......#",
      "##.######",
      "#a......#",
      "##.######",
      "#>.....G#",
      "#########",
    ],
    lasers: [{ x: 1, y: 5, plate: "a" }],
  },

  {
    name:  { tr: "ÇÖKÜŞ",           en: "COLLAPSE" },
    intro: { tr: "Reaktör çekirdeği. Lazer + portal + iki plaka. Son adım.",
             en: "The reactor core. Laser + portal + two plates. Final step." },
    moves: 32,
    grid: [
      "###########",
      "#P.......1#",
      "##.########",
      "#a.......b#",
      "##.########",
      "#>.........",
      "##.########",
      "#2......AG#",
      "###########",
    ].map(s => s.padEnd(11, "#").slice(0, 11)),
    lasers: [{ x: 1, y: 5, plate: "a" }],
  },
];

// Helper: belirli bir seviye/saha için aktif dildeki metni getir.
function levelText(lvl, field) {
  const v = lvl && lvl[field];
  if (typeof v === "string") return v;
  if (v && typeof v === "object") return v[I18n.get()] || v.tr || "";
  return "";
}
