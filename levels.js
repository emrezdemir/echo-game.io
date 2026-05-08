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
// level.lasers = [{x,y,plate}] → o yayıcı 'plate' aktifken söner.

const LEVELS = [
  {
    name: "İLK YANKI",
    intro: "① Plakaya (◯ a) yürü.  ② [R] tuşuna bas — yankın oluşur.  ③ Sen başa dönersin, yankı plakaya yürür → A kapısı açılır.  ④ Sen ✦ hedefe geç.",
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
    name: "ÇİFT DOLAŞIK",
    intro: "İki plaka, iki kapı. Üç zaman çizgisi gerek.",
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
    name: "ÜÇ EŞZAMANLI",
    intro: "Üç plaka aynı anda aktif olmalı. Sen artı iki yankı.",
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
    name: "KÖPRÜ",
    intro: "Eşli portallar. Aynı rakam birbirine bağlı.",
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
    name: "IŞIN",
    intro: "Lazer ölümcül. Plaka aktifken yayıcı kapanır.",
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
    name: "ÇÖKÜŞ",
    intro: "Reaktör çekirdeği. Lazer + portal + iki plaka. Son adım.",
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
