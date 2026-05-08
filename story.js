// Seviyeler arasında oyuncuya gösterilen log girdileri.
// Ana karakter: Mühendis V. Aren — terk edilmiş Kepler-7b araştırma istasyonu.

const STORY = {
  intro: {
    title: "// SİSTEM YENİDEN BAŞLATILDI",
    lines: [
      "TARİH: 2387.04.11 / KEPLER-7b YÖRÜNGE İSTASYONU",
      "",
      "Soğuk uyku kapsülünden kaç saat sonra uyandım, bilmiyorum.",
      "İstasyon sessiz. Ekipten kimse yok. Sadece ben.",
      "",
      "Reaktör çekirdeğine ulaşırsam çıkış yapabilirim.",
      "Ama koridorlar arasında bir şey... yanlış.",
      "Hareketlerim kayıt altına alınıyor — ve geri çağrıldığında",
      "geçmişteki ben yeniden yürüyor. Yankı gibi.",
      "",
      "Hayatta kalmanın tek yolu, kendimle işbirliği yapmak.",
    ],
  },

  // İlk seviyeden önce gösterilen 4 sayfalık tutorial.
  tutorial: [
    {
      title: "EĞİTİM 1/4 · HAREKET",
      lines: [
        "OK TUŞLARI veya WASD ile hareket edersin.",
        "",
        "Ekrandaki ◆ sembolü sensin.",
        "Altın ✦ sembolü hedefin (reaktör çıkışı).",
        "",
        "Her hamle sağ üstteki HAMLE sayacını bir azaltır.",
        "Sayaç sıfırlandığında hamlelerini boşa harcamış olursun.",
        "",
        "› AMAÇ: ◆ sembolünü ✦ hedefine ulaştırmak.",
      ],
    },
    {
      title: "EĞİTİM 2/4 · PLAKA & KAPI",
      lines: [
        "Bazı yollarda ▤ sembollü KAPI'lar var. Kapalıyken geçemezsin.",
        "Her kapının (A,B,C...) bir eşi olan PLAKA'sı vardır (a,b,c...).",
        "",
        "BİR VARLIK plakanın üzerinde durduğu sürece kapı AÇIK kalır.",
        "Plaka boşsa kapı tekrar kapanır.",
        "",
        "Sorun: Sen aynı anda hem plakada DURAMAZSIN hem de",
        "kapıdan GEÇEMEZSİN. İki yerde olamazsın...",
        "",
        "› ÇÖZÜM: kendi yankını kullan. Sıradaki sayfa.",
      ],
    },
    {
      title: "EĞİTİM 3/4 · YANKI KAYDETMEK",
      lines: [
        "Yaptığın her hareket bir bant gibi kaydediliyor.",
        "İstediğin zaman [R] tuşuna bas:",
        "",
        "  1. O ana kadar yaptığın hamleler bir YANKI olur (◇)",
        "  2. Sen başlangıç noktasına geri ışınlanırsın",
        "  3. Hamle sayacın sıfırlanır",
        "  4. Yankı, kaydettiğin hamleleri AYNEN tekrarlar",
        "",
        "Artık iki kişisin: sen + yankın. Yankı plakaya basabilir,",
        "sen başka bir şey yapabilirsin. [Z] son yankıyı silmek için.",
      ],
    },
    {
      title: "EĞİTİM 4/4 · ÖRNEK",
      lines: [
        "İlk seviyenin tipik çözümü:",
        "",
        "  ① ◆ → plakaya (◯) yürü.   Hamle: → → ↓",
        "  ② [R] bas.   Yankın artık plakaya yürüyor olacak.",
        "  ③ Yankı plakada → kapı açılır.",
        "  ④ Sen başka bir yoldan ✦ hedefe yürü.",
        "",
        "İPUCU: Hamleleri planla. Yankı senin geçmişin —",
        "neyi yaptırdıysan onu yapacak, daha fazlasını değil.",
        "",
        "› BAŞLAYALIM. İyi şanslar, mühendis.",
      ],
    },
  ],

  // index = level idx; gösterilen log seviye TAMAMLANDIKTAN sonra çıkar
  afterLevel: [
    {
      title: "LOG-001 / İLK YANKI",
      lines: [
        "İşe yaradı. Plakaya benzer bir alan basılı kalmalıydı —",
        "ben başka yerdeyken. Çözüm: kendi kopyamı orada bırakmak.",
        "",
        "Onu izledim. Aynı adımları attı. Beni hiç fark etmedi.",
        "Bu... yankı mıyım, ben miyim, yoksa o mu?",
      ],
    },
    {
      title: "LOG-002 / İKİZLER",
      lines: [
        "İki yankı, iki kapı. Hiçbiri benim değil; hepsi benim.",
        "Aynı anda üç yerdeydim — sadece biri 'şimdi' idi.",
        "",
        "Reaktör loglarına göre bu olay 'temporal echo cascade'",
        "olarak adlandırılmış. 2384'te bir test patladı.",
        "Bu istasyon o zamandan beri çoğullaşıyormuş.",
      ],
    },
    {
      title: "LOG-003 / BAĞLANTI",
      lines: [
        "Üçüncü plaka aktive olduğunda, duvarın arkasından",
        "bir uğultu duydum. Sanki yankılarım orada hâlâ yürüyor —",
        "ben gittikten sonra.",
        "",
        "Belki gitmiyorum. Belki sadece dikkatimi çekenler",
        "şu anki bedenimde topluyor.",
      ],
    },
    {
      title: "LOG-004 / KÖPRÜ",
      lines: [
        "İstasyonun bu bölümünde uzay-zaman tutmuyor.",
        "Bir hücreden çıkıyorum, çift olan diğer hücreden çıkıyorum.",
        "Bohm-Aharonov kapıları. Teori 2381'de kâğıt üstündeydi.",
        "",
        "Aynı yankı, iki yerden çıktı. Hangisi önceydi?",
        "Soruyu unutuyorum. Cevap aynı.",
      ],
    },
    {
      title: "LOG-005 / IŞIN",
      lines: [
        "Reaktör koridorlarında savunma lazerleri hâlâ aktif.",
        "Bir yankımı kaybettim — beam onu aldı, eridi.",
        "",
        "Sonraki çalıştırmada o yankı yine vardı. Tabii ki.",
        "Yankılar ölmez. Sadece ben ölürüm. Bunu unutmamalıyım.",
      ],
    },
    {
      title: "LOG-006 / KESİŞİM",
      lines: [
        "Plaka bir lazeri kapatıyor. Diğeri bir kapıyı açıyor.",
        "Üçüncüsü hangi gerçeklikte olduğumu seçiyor sanki.",
        "",
        "Reaktöre çok yaklaştım. Sıcaklık artıyor.",
        "Soğutucular çevrimdışı. Birisi onları kapattı.",
        "Belki gelecekteki ben.",
      ],
    },
    {
      title: "LOG-007 / PARADOKS",
      lines: [
        "Bir yankımın diğer bir yankımı plaka aracılığıyla",
        "kurtardığını izledim. Ben hiçbir şey yapmadım — sadece",
        "iki geçmişteki ben birbirini sırtladı.",
        "",
        "Belki ben gereksizim. Belki yankılar zaten çıkıyor",
        "ve benim rolüm sadece kayıt cihazı olmak.",
      ],
    },
    {
      title: "LOG-008 / ÇÖKÜŞ",
      lines: [
        "Reaktör çekirdeğindeyim. Uyandıktan sonra kaç döngü",
        "geçtiğini bilmiyorum. Kaç ben olduğumu bilmiyorum.",
        "",
        "Ama çıkış prosedürünü hatırlıyorum: tüm yankıları",
        "stabilize et, tekilliği kapat, kapsüle dön.",
        "",
        "Eğer geri uyanırsam — geri uyanırsak — bu logları",
        "okuyacağız. Bir sonraki ben için yazıyorum.",
        "",
        "Ya da bu logları zaten ben okudum.",
      ],
    },
  ],

  outro: {
    title: "// STABILIZED",
    lines: [
      "Tekillik kapandı. İstasyon sessiz.",
      "Kepler-7b'nin yörüngesinde, kapsülde uyanıyorum.",
      "",
      "Uyandıktan sonra kaç saat geçtiğini bilmiyorum.",
      "İstasyon sessiz. Ekipten kimse yok. Sadece ben.",
      "",
      "...",
      "",
      "Bu logu daha önce yazmıştım.",
    ],
  },
};
