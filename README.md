# TIME ECHO

> Terk edilmiş bir uzay istasyonunda mahsur kalmış bir mühendisin, kendi geçmiş kopyalarıyla işbirliği yaparak bulmacaları çözdüğü sıra-bazlı, tarayıcıda çalışan, atmosferik bir bulmaca oyunu.

```
◆  sen
◇  yankın (geçmişteki sen)
✦  hedef (reaktör çıkışı)
○  basınç plakası
▤  kapı
◉  portal
►  lazer
```

---

## Çalıştırma

Build aracı yok. `index.html`'i tarayıcıda aç — bitti.

```
Game Project/None/
  index.html        ← buradan başla
  style.css
  audio.js          # WebAudio synth (sesler)
  story.js          # hikâye girdileri
  version.js        # sürüm sabiti
  levels.js         # seviye verileri
  editor.js         # seviye editörü
  game.js           # ana oyun motoru
```

Önerilen tarayıcılar: Chrome, Edge, Firefox, Safari. WebAudio ve Canvas2D yeterli.

---

## Çekirdek Mekanik

Her seviye bir grid üzerinde sıra-bazlı oynanır. Her hamle bir "tick"tir.

1. **Hareket et.** Ok tuşları / WASD. Her hamle sayaç bir azaltır.
2. **`R` tuşuna bas.** O ana kadar yaptığın hamle dizisi bir **yankı** (echo) olarak kaydedilir; sen başlangıç noktasına ışınlanırsın, sayaç sıfırlanır.
3. **Sıradaki run'da** yankı(lar)ın aynı hamleleri AYNEN tekrar eder. Sen yeni hamleler yaparsın.
4. **Plaka basılı tutma:** Bir varlık (sen veya yankı) plakanın üzerindeyken eşleşen kapı açıktır. Yankıların bunun için var.
5. **Hedefe ulaş.**

`R` kaydet · `Z` son yankıyı sil · `N` tüm yankıları sil ve seviyeyi sıfırla · `M` ses · `Esc` menüye dön.

---

## Mekanik Listesi

| Sembol | İsim | Davranış |
|---|---|---|
| `#` | Duvar | Geçilemez. |
| `P` | Başlangıç | Oyuncu ve tüm yankılar buradan başlar. |
| `G` | Hedef | Oyuncu burayı ele geçirirse seviye biter. |
| `a-z` | Plaka | Üzerinde varlık varsa eşleşen kapı açıktır. |
| `A-Z` | Kapı | Eşleşen plaka aktifken geçilebilir; aksi halde duvar. |
| `1-9` | Portal | Aynı rakamdaki iki portal birbirine ışınlar (her tick sonu). |
| `▶ ◀ ▲ ▼` | Lazer yayıcı | Sürekli ışın yayar; varlığı eritir, yankıyı yok eder. Plakaya bağlanırsa plaka aktifken söner. |

---

## Tasarım Notları

- **Yankı motoru:** Her yankı bir hamle dizisidir. Replay sırasında: hamle bloklanırsa yankı yerinde kalır ama hamleyi tüketir (deterministik tüketim). Yankı kaydı uzun veya kısa olabilir — bittiğinde son pozisyonda durur.
- **Tick sırası:** ① pre-snapshot → ② oyuncu+yankı hareket (pre-snapshot kapı durumu kullanılarak) → ③ portal teleport → ④ post-snapshot → ⑤ lazer beam hesaplama → ⑥ hasar (eriyenler ölür) → ⑦ hedef kontrolü.
- **Yankı ölümü:** Lazer yankıyı eritirse yankı `dead` olur, plakası varsa o plaka düşer — diğer yankıları ve oyuncuyu da etkileyebilir. Zincirleme paradoks.
- **Ölümlü oyuncu, ölümsüz yankı:** Yankılar ölmez — kayıttır. Lazer "şu run'da" yankıyı yok eder ama bir sonraki run'da yankı yine vardır. Sadece sen kalıcı ölürsün (run reset olana kadar).

---

## Editör

Ana menüden **EDİTÖR** → fırça seç → grid'i boyala → **TEST** ile dene → **PAYLAŞ** ile URL kopyala.

Paylaşım URL'si seviyeyi base64'lü JSON olarak `#l=...` hash'inde taşır. Sunucu gerekmez.

```
örnek: index.html#l=eyJuIjoiUEFZTEFTSU0iLCJpIjoidGVzdCIsIm0iOjEwLC4uLn0
```

---

## İlerleme & Kayıt

- localStorage anahtarı: `timeEcho.progress.v1`
- Yapı: `{ cleared: number[] }` — tamamlanan seviye indeksleri.
- Kilit mantığı: `max(cleared) + 1`'e kadar açık.
- Sıfırlamak için tarayıcı dev tools → Application → Local Storage → key sil.

---

## Klavye Kontrolleri

| Tuş | Eylem |
|---|---|
| ↑ ↓ ← → | Hareket |
| W A S D | Hareket (alternatif) |
| R | Yankı kaydet, başa dön |
| Z | Son yankıyı sil |
| N | Tüm yankıları sil, seviyeyi sıfırla |
| M | Sesi aç/kapa |
| Esc | Ana menüye dön |
| Enter | Overlay'de devam |

Editörde: sol-tık yerleştir, sağ-tık sil, sürükle ile boya.

---

## Hosting'e Dağıtım

```powershell
.\deploy.ps1
```

Aynı dizinde `echo-game-v<sürüm>.zip` oluşur. Hosting kontrol panelinden:
1. `public_html` (veya web kökü) klasörüne zip'i yükle
2. Dosya yöneticisinden **Extract** et
3. `index.html` site kökünde olmalı (alt klasör değil)

Zip ~2 MB; sadece runtime dosyaları (10 .js + html + css + music/). Belge dosyaları (README, CLAUDE.md, CHANGELOG) ve `.git/` paketten hariç.

## Sürüm

Bkz. [CHANGELOG.md](CHANGELOG.md).

## Geliştirici Notu

Bkz. [CLAUDE.md](CLAUDE.md) — projeye dönen geliştiricinin (veya AI asistanın) hızla bağlam kurması için.
