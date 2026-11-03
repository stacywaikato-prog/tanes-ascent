# Tāne's Ascent: Ngā Kete o te Wānanga

A 2D action platformer in the browser. Tāne climbs the twelve heavens to bring the three kete and two whatu-kura to the people, while his brother Whiro sends the creatures of darkness against him.

By Stacy. Code, pixel art and sound generated with Claude from Stacy's brief.

## Play it on your computer

1. Unzip this folder.
2. Open `index.html` in Chrome, Edge, Firefox or Safari.

No install and no server are needed. Progress saves in the browser at every carved pou.

## Put it on itch.io

1. Zip the **contents** of this folder (so `index.html` sits at the top of the zip, not inside a subfolder).
2. On itch.io: **Create new project**. Set **Kind of project** to **HTML**.
3. Upload the zip and tick **This file will be played in the browser**.
4. Set the viewport to **1152 × 720**, and tick **Mobile friendly** and **Fullscreen button**.
5. Copy the page text from `docs/STORE_PAGE.md`, and add the images from `screenshots/`.
6. Keep the page **Draft** or **Restricted** until the cultural review in `docs/CULTURAL_REVIEW.md` is back.

## Back it up on GitHub

1. Sign in at github.com and click **New repository**. Name it `tanes-ascent`. Make it **Private** for now.
2. On the new repository's page, click **uploading an existing file**.
3. Drag in every file and folder from this folder, then click **Commit changes**.

Each time you change the game, upload the changed files again. GitHub keeps every version.

## What's in this folder

| Path | What it is |
| --- | --- |
| `index.html` | The game page |
| `core.js` | Input, key rebinding, difficulty, timers, sprite tools |
| `audio.js` | Music, sound effects, ambience and mixing |
| `sprites.js` | Tāne, creatures, bosses, items and icons, all drawn by code |
| `biomes.js` | The thirteen heavens: skies, parallax, tiles, weather, lighting |
| `world.js` | Levels, tutorial, glyph-gate set pieces, movement, combat, enemies |
| `bosses.js` | The four guardians and Whiro |
| `story.js` | Cutscenes, chapter cards, lore and credits |
| `main.js` | Menus, HUD, settings, saving, summary screens, playtest log |
| `fonts/` | Oswald and IBM Plex fonts (SIL Open Font License) |
| `docs/` | Cultural review pack, test matrix, store page text, change log |
| `screenshots/` | Store images |
| `tests/` | Automated browser tests |

## Run the automated tests

You need Node.js 18 or later and Google Chrome.

```
cd tests
npm install
npm test
```

Set `CHROME_PATH` if Chrome is not at `/usr/bin/google-chrome` (on Windows, for example: `set CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe`).

The tests load every heaven, run a bot through each one, solve every glyph gate, fight every boss to its end, and check saves, key rebinding, text size and the crash screen.

## Playtesting

Ask each tester to play, then open **Settings → Saves and playtest → Playtest report → Copy report**, and send you the text. It lists deaths per heaven (with where and how), clear times, stars and any errors. Nothing is sent anywhere automatically.

## A note on the story

Tellings, names and the number of heavens differ between iwi. This game follows a common outline and claims no single authority. Have the text reviewed by someone who holds these kōrero before release. See `docs/CULTURAL_REVIEW.md`.
