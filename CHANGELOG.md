# Sürüm Geçmişi — Time Echo

Bu dosya, projenin geliştirme adımlarını sürüm sürüm tutar.
Format: [Anlamsal Sürüm](https://semver.org/lang/tr/) · tarih · kısa özet.

---

## [1.6.1] — 2026-05-08
**"Deploy kit"**
### Eklendi
- `deploy.ps1` — PowerShell paketleyici. Çalıştır → `echo-game-v<sürüm>.zip` aynı dizinde oluşur.
- Sürüm numarasını `version.js`'den otomatik okur, dosya ismine bastırır.
- Sadece runtime dosyaları (10 .js + html + css + music/) paketlenir; README / CLAUDE / .git atlanır.
- `.gitignore` güncellemesi: `echo-game-v*.zip` artık commit'e karışmaz.
### Kullanım
```powershell
.\deploy.ps1
```
Çıktı zip ~2 MB (büyük kısmı `space_echo.ogg`). Hosting'in dosya yöneticisinden yükle → Extract → bitti.

---

## [1.6.0] — 2026-05-08
**"Touch"**
### Eklendi
- Mobil/tablet desteği — tüm ekranlar viewport'a göre responsive.
- Oyun ekranında **dokunmatik D-pad** (4 yön butonu) + **R / Z / N aksiyon butonları**.
- Canvas üzerinde **swipe** desteği (D-pad'e alternatif): parmağı sürükleyip bırak.
- Editör mobilde sidebar canvas altına geçer; eskiden iki sütundu.
- Üç kırılma noktası: 900px (tablet altı), 500px (telefon dikey).
### Değişti
- Title ekranı menü butonları mobilde tam genişlik.
- HUD compact mod, klavye ipucu mobilde gizli.
- `touch-action: manipulation` ile çift-tıklamada zoom engellendi.
### Notlar
- Canvas iç çözünürlüğü hâlâ 640x640; mobilde sadece görsel olarak ölçeklenir, render kalitesi korunur.

---

## [1.5.0] — 2026-05-08
**"Babel"**
### Eklendi
- `i18n.js` — TR/EN sözlüğü, `localStorage`'da kalıcı dil tercihi.
- Tüm UI metinleri iki dilde: menü, HUD, overlay'ler, editör, eğitim, hikâye logları, sürüm geçmişi.
- Seviye `name`/`intro` alanları artık `{tr, en}` objesi; helper `levelText(lvl, field)` aktif dile göre seçer.
- `STORY_DATA` iki dilli; `STORY` proxy'si dile göre canlı çözer.
- Ana menüde **DİL: TR/EN** tuşu — anlık değişim, kayıt, tüm açık ekran yenilenir.
- HTML elementleri için `data-i18n`, `data-i18n-html`, `data-i18n-placeholder` attribute desteği.
### Değişti
- Tarayıcı diline göre ilk dil otomatik belirlenir (TR varsayılan).
- Sürüm changelog girdileri (`history[].changes`) iki dilli yapı kazandı.

---

## [1.4.2] — 2026-05-08
**"Fallback routing"**
### Düzeltildi
- **Crash bug:** `audio.js` modülünün `Audio` ismi tarayıcının built-in `Audio` constructor'ını gölgeliyordu. `new Audio(src)` çağrısı `TypeError: Audio is not a constructor` veriyordu. `new window.Audio(src)` ile düzeltildi.
- **file:// üzerinde menü müziği:** Chrome `file://` URL'lerini ayrı origin kabul edip OGG yüklemesini bloke ediyor. OGG yüklenemediğinde otomatik prosedürel menü drone'una düşülür — müzik her senaryoda çalar.
### Eklendi
- İki drone varyantı: `menu` (açık/yıldız ambient, yüksek register) ve `game` (karanlık reaktör, alçak register).

---

## [1.4.1] — 2026-05-08
**"Ambient drone"**
### Değişti
- `music.js` sadeleştirildi: MIDI parser/synth çıkarıldı.
- Oyun müziği prosedürel **WebAudio drone**'a dönüştü — dosya gerekmez, fetch gerekmez, server gerekmez. `file://` üzerinden bile çalışır.
- Menü müziği `space_echo.ogg` aynen `<audio>` ile çalmaya devam eder.
### Sebep
- MIDI tarayıcılarda doğal olarak desteklenmiyor; manuel parser + `fetch` `file://` ile bloke oluyordu. "Çalsın bari" deneyimi karmaşıklaşıyordu. Prosedürel drone hep çalar.

---

## [1.4.0] — 2026-05-08
**"Derelict signal"**
### Eklendi
- `music.js` — müzik motoru: OGG (HTMLAudio loop) + minimal MIDI parser/synth (WebAudio).
- Ana menüde `music/space_echo.ogg` arka planda döner.
- Oyunda `music/derelict.mid` parse edilip 4 kanal synth ile çalınır (kanal 9 davul atılır).
- Müzik & SFX tek `M` tuşu ile birlikte susturulur.
- İlk kullanıcı etkileşiminde otomatik tetikleme (tarayıcı autoplay kısıtlamasını aşmak için).
### Notlar
- MIDI yüklemek için `fetch` gerekir; `file://` ile açılırsa CORS engeline takılabilir. O zaman `python -m http.server` ile yerel sunucu çalıştırılmalı. OGG `<audio>` elementi ile çalışır, etkilenmez.

---

## [1.3.0] — 2026-05-08
**"Bellek bankası"**
### Eklendi
- Proje belgeleri: `README.md`, `CHANGELOG.md`, `CLAUDE.md` (Claude Code memory bank).
- Oyun içi **SÜRÜM GEÇMİŞİ** ekranı (ana menüden ulaşılır).
- Ana menü ve HUD'da görünür sürüm numarası.
- `VERSION` sabit modülü (`version.js`) — tek doğru kaynak.

---

## [1.2.0] — 2026-05-08
**"Onboarding"**
### Eklendi
- 4 sayfalık başlangıç eğitimi (HAREKET → PLAKA & KAPI → YANKI → ÖRNEK).
- Ana menüde `NASIL OYNANIR?` butonu — eğitim her an tekrar açılabilir.
- Seviye 1 intro mesajı somut adımlara dönüştürüldü (① ② ③ ④).
### Değişti
- Yeni döngü akışı: intro hikâye → tutorial → seviye 1.

---

## [1.1.0] — 2026-05-08
**"Tam sistem"**
### Eklendi
- **Mekanikler:** Portal (1-9 eşli ışınlanma), Lazer (4 yön, plaka ile söndürülebilir).
- **Yankı ölümü:** Lazer yankıyı eritebilir → zincirleme paradokslar.
- **Ses motoru:** `audio.js` — WebAudio synth (hareket, plaka, kapı, lazer, portal, kazanma, ölüm).
- **Hikâye:** Intro + 8 log girdisi + outro (`story.js`).
- **6 seviye** kademeli zorluk: İLK YANKI → ÇİFT DOLAŞIK → ÜÇ EŞZAMANLI → KÖPRÜ → IŞIN → ÇÖKÜŞ.
- **Ana menü**, **seviye seçim**, **kalıcı ilerleme** (localStorage `timeEcho.progress.v1`).
- **Seviye editörü** (`editor.js`) — fırça tabanlı paint, URL hash üzerinden paylaşım (base64 JSON).
- **Ölüm/galibiyet ekranları**, OUT OF SYNC durumu, sustur/aç (`M` tuşu).
### Değişti
- `game.js` modülerleştirildi: `Screens`, `Save`, `Game`.
- Tick sırası netleştirildi: pre-snapshot → hareket → portal teleport → post-snapshot → beam hasarı.
- Render motoru: portallar dönen halkalar, lazer beam flicker, yankı ölü görselleri.

---

## [1.0.0] — 2026-05-08
**"MVP"**
### Eklendi
- Çekirdek echo motoru: `R` ile hamle dizisini yankı olarak kaydet, `Z` ile geri al, `N` ile sıfırla.
- Plaka & kapı sistemi (a/A, b/B, c/C eşleşmeli).
- 3 seviye (yankı sayısı 1 → 2 → 3 ile artan).
- Sıra-bazlı hareket (ok tuşları + WASD), grid render, tur sayacı.
- CRT scanline efekti, mor-mavi neon palet, monospace tipografi.

---

## Sürüm Numaralandırma Kuralı
- **MAJOR** — geri uyumsuz değişiklik (kayıt sistemi formatı kırıldığında, motor yeniden yazıldığında).
- **MINOR** — yeni özellik, yeni mekanik, yeni seviye paketi.
- **PATCH** — bugfix, denge ayarı, metin düzeltmesi.

## Bilinen Eksikler / Yol Haritası
- `[1.4.0]` Quantum Tile mekaniği (gözlem/süperpozisyon).
- `[1.5.0]` Kullanıcı seviye galerisi (yerel olarak kayıtlı paylaşım kodları listesi).
- `[1.6.0]` Hayalet replay — son seviyenin kazanan run'ını izleme.
- `[2.0.0]` Pixel-art tile seti (ASCII'den grafik tile'a geçiş).
