# Bəyəni Hədəfi – Panda

Studio Browser Source (HTTPS):
https://oyuncuculubu-dot.github.io/qala-test/tiktok/beyenihedef/

Ölçü: **1280 × 720** (1024 × 576 də olar — widget özü miqyaslanır). Fon şəffafdır.

Qoşulma: `ws://127.0.0.1:4000/ws` (SSE `/events` ehtiyat). Başqa host üçün `?host=127.0.0.1:4000` və ya `?server=` / `?studio=` / `?port=`.

## Parametrlər
| param | default | izah |
|---|---|---|
| `goal` | 10000 | başlanğıc hədəf |
| `step` | = goal | hədəf dolanda nə qədər artsın |
| `autostep` | 1 | `0` — hədəf avtomatik artmasın |
| `demo` | 0 | `1` — demo rejimi (serverə qoşulmur) |
| `bg` | 0 | `1` — tünd önizləmə fonu (Studio-da istifadə etmə) |
| `host` / `server` / `studio` / `port` | 127.0.0.1:4000 | yerli TikFinity AZ ünvanı |

Nümunə: `https://oyuncuculubu-dot.github.io/qala-test/tiktok/beyenihedef/?goal=5000&step=5000`
