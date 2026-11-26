# GameCamp Altyazı vidjeti (tiktok/altyazi)
TikTok LIVE Studio / OBS-də brauzer mənbəyi (1920×1080) kimi istifadə olunur.

Vidjet GameCamp serverinə (127.0.0.1:4000) iki yolla qoşulur:
- `/ws`
- `/api/subs/events` (SSE)

Hər sətir yalnız bir dəfə göstərilir.

| Parametr | Dəyər | Default |
|---|---|---|
| style | kino · gamecamp · vertikal | kino |
| size | şrift px (1080p) | 48 |
| pos | bottom · middle · top | bottom |
| orig | 0 = orijinal sətri gizlət | 1 |
| delay | ms, yayım gecikməsinə uyğunlaşdırmaq üçün | 0 |
| hold | ms, sətir ekranda qalma müddəti | 6000 |
| host | yerli server (127.0.0.1:4000) və ya HTTPS tunel (https://….trycloudflare.com) — :4000 yalnız http üçün | GitHub Pages-də: https://widget.gamecamplive.com (daimi), başqa yerdə 127.0.0.1:4000 |
| demo | 1 = nümunə altyazılar | – |
| test | 1 = bir sınaq sətri | – |
| bg | 1 = boz fon (yoxlama üçün) | – |
| sse | 0 = SSE-ni söndür | 1 |

API: `window.GCSubtitles.push({type:'subtitle',id,orig,az,lang,final:true})`
