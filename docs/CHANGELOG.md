# Change log

## 1.0.4-beta — 3 November 2026: sound on phones

- Sound now starts on phones. Phones only allow sound from a finished tap, so the game now listens for the end of a tap as well as the start.
- On iPhone, the game asks for "playback" audio and keeps a silent track running. Sound then plays even with the ring/silent switch on.
- Turning sound off in Settings also stops the silent track.

## 1.0.3-beta — 3 November 2026: sound on by default

- Sound is on by default. Browsers only allow sound after the player's first tap, click or key press, so it starts then; the title screen says so until it does.
- The M shortcut no longer mutes. Sound can only be turned off in Settings → Audio, and that choice is remembered.
- Anyone muted by the old M shortcut has sound turned back on once.
- A gamepad button press also starts the sound.

## 1.0.2-beta — 3 November 2026: HEAVY and BURST buttons

- **Phone:** new HEAVY button (left of STRIKE) and BURST button (left of LIGHT). BURST appears only once Mana Burst is earned. The stick combinations still work.
- **Keyboard:** F for heavy strike and R for Mana Burst, both rebindable in Settings. The old combinations still work.
- **Gamepad:** right trigger for heavy strike, left trigger for Mana Burst.
- Heavy strike from the button works while running, without sliding.
- The keyboard keys settings page is spaced to fit the two new actions.

## 1.0.1-beta — 3 November 2026: controls on every device

- **Heavy strike with down now works.** Holding down crouched Tāne first, which blocked the strike, so "down + strike" never gave a heavy strike on keyboard, touch or gamepad. It now stands him straight into the heavy strike.
- **Ability messages name your buttons.** "Press JUMP again in mid-air" on touch, "Press B in mid-air to dash" on a gamepad, your own keys on a keyboard.
- **Controls screens list every move** for keyboard, touch and gamepad: drop through a branch, brace against the wind, growing seeds and striking moon stones and cages, the hold-to-push, Kererū Lift and Star Spear.
- The kererū is now the HUD icon for Kererū Lift.
- Touch prompts read naturally ("Hold the stick down to crouch").

## 1.0.0-beta — 3 November 2026: all three acts hand-built

Every heaven now has its own idea, and the ending carries the story home.

**Act 2, the spirit**
- **Rangi 5, The Celestial Forest: the still pool.** No creatures. Step into a still pool and the heaven turns to its reflection, where some stone exists and some does not. In the reflection Tāne sees Ranginui and Papatūānuku still together, and stops to look. Step into a pool again to return.
- **Rangi 6, The Moon Heaven: turning the moon.** Strike a moon stone to wax or wane the moon. High tide lifts floating stones to climb; low tide brings back the rocks and drops the tide wall. Whiro speaks for the first time. The Moon Keeper guards the gate.
- **Rangi 7, The Star Pathways: paths of stars.** Over the void, throw light and it leaves a path of stars that holds for a few seconds. Mana matters here. The stars die out behind Tāne as he goes.
- **Rangi 8, The Aurora Realm: riding the aurora.** Leap into an aurora ribbon and it carries you across the void; chain ribbon to ribbon. Near the end, darkness tears through the aurora and the colour drains away.

**Act 3, the ancestors**
- **Rangi 9, Whiro's Grip: the light taken.** Whiro appears and tears Tāne's light out of him, and leaves him alive. With no light bolt and almost no glow, the kererū's flicker shows the way. Deep in the dark, every bird returns the light, warmer than before. The Shadow Champion guards the gate.
- **Rangi 10, The Broken Heavens: the breaking heaven.** Cracked stone crumbles after Tāne leaves it. A long bridge gives way beneath him, and as he falls, the lower heavens show through. Light grows bridges from the debris.
- **Rangi 11, The War: the ancestors rise.** Fallen pou lie on the battlefield. Touch one and an ancestor of light rises to fight beside Tāne. At the last pou, all of them rise together.
- **Rangi 12, The Golden Summit: the escape.** No guardian: Whiro's darkness rises from below, always just under the screen's foot, and touching it is a fall. Climb branches, a vine you grow, and a storm-column of ledges to the top. The world-below view shows every heaven climbed and a green world beneath.

**The finale**
- **Toi-o-ngā-Rangi** opens with a quiet walk with no creatures, then Whiro.
- **The final push:** after Whiro falls, his darkness rises one last time. Hold to push it down, as Tāne once pushed the sky up, while beams in the colours of all twelve heavens join in him.
- **Whiro withdraws** into the dark and looks back once, alone.
- **The journey home:** after the kete and the whatu-kura, a run down through every heaven, each restored (the storm parts, the aurora is mended, the forest is green in the rain). Heavens where you found the carving show it glowing.

**Other changes**
- The Gatekeeper fight is removed from Rangi 12.
- Tall stone walls in the new set pieces can no longer be wall-jumped.
- New tests in `tests/mechanics.js` check each heaven's idea directly; `tests/bot.js` traverses all 13 heavens with puzzles pre-solved.
- `docs/CULTURAL_REVIEW.md` lists all the new story text with questions for the reviewer.

## 0.9.0 — 3 November 2026: Act 1 hand-built (Rangi 1–4)

Every heaven in Act 1 is now laid out by hand around one idea, instead of assembled from random pieces.

- **Rangi 1, The Primal Forest: light makes life grow.** Throw light at a seed (or strike it) and it grows: a vine to climb, or a fern bridge across thorns. The forest ahead is grey and asleep, and colour wakes as Tāne passes. A light rain falls: Ranginui's grief. Teaching sections, the carved gate and a carving on a high ledge reached by growing a vine.
- **Rangi 2, The Living Canopy: a climb up one giant tree.** Branches, a hollow trunk with a vine, a hidden greenstone relic. Halfway up, a kererū is caught in thorns: strike the cage to free it and the gate opens. It is dark under the canopy; at the top Tāne breaks into open sky, and the kererū he freed waits there and lifts him: the double jump (now called Kererū Lift, given here instead of at the end of Rangi 1).
- **Rangi 3, The Cloud Kingdom: Ngārara stalks the clouds.** A vast shape swims behind the cloud islands, and three times the guardian rises behind the path, before the fight at the end. Whiro's watching shape stays.
- **Rangi 4, The Realm of Storms: Tāwhirimātea's storm.** Gusts come in a rhythm and push Tāne back; hold down to brace, or shelter behind rock. Lightning marks a spot near Tāne, then strikes it; it breaks cracked stone, so the way through the stone wall is to wait beside it and step away. The heaven ends with a climb up a storm column.
- Sealed gates now say "carved stone" instead of "glyph stone", and the kererū's cage explains itself.
- The world-below view after each heaven draws its hills and forest in the right colours.

## 0.8.0 — 3 November 2026: first pass of the twelve heavens redesign

- **The separation is played, not watched.** In the opening, hold jump (or press and hold on touch) to push Ranginui away. The push builds in pulses, the screen and controller shake, and letting go lets the dark close again. A new scene follows: Ranginui's grief falling as rain.
- **The kererū.** Once Tāne gains the double jump, a kererū follows him, perches on his taiaha when he stands still, and flies under his feet on every double jump.
- **Whiro is present before the end.** In Rangi 3 a dark shape watches from behind the clouds and slips away as Tāne nears. In Rangi 6 Whiro speaks for the first time.
- **The world below changes.** After each heaven, the end screen shows Papatūānuku changing because of the climb: first shoots, birds, rain, rivers, forest, tides, stars, seasons, the long night and its dawn, mountains, people's fires, daylight.
- **No lives, no score, no stars.** Falling returns Tāne to the last pou, always. After four falls in a heaven the game points to Assist mode. The HUD shows the heaven's name instead of a score.
- **New journey starts straight away.** Difficulty stays in Settings.
- **Six enemies, each with a job:** wētā, lizard, bird, cave horror, heavenly beast, shadow warrior. Mosquitoes, spiders, stalkers, spirits and shielded guards are gone.
- **Game feel:** Tāne falls faster than he rises, hangs briefly at the top of a held jump, drifts less in the air, recovers from wall jumps sooner, can roll out of the end of an attack, lands harder after long falls, and the hurt shake is gentler. Climbing off the top of a vine is more reliable.
- **Shorter chapter cards** with no tips. Carved stones restore health instead of lives.

## 0.7.0 — 3 November 2026: art direction fixes

- **Tāne stands out.** A red feather cloak with a black and white tāniko hem replaces the speckled brown one. A warm light now edges his top and a pāua-blue light his back, and his pounamu is larger.
- **Creatures of darkness read on dark heavens.** The stalker, spirit, spider, shadow warrior, cave horror, corrupted creatures, the Champion and Whiro now have a violet rim light.
- **Moon Keeper.** The forehead cross is gone, and the toothy mouth is now a carved line.
- **Toi-o-ngā-Rangi.** Domes and minarets are replaced with wharenui and pou silhouettes, and the pillars with carved pou.
- **Ground tiles.** Random speckles are replaced with soil layers and stones.
- **Glyph stone item.** A koru on a river stone replaces the question mark.
- Store screenshots retaken.

## 0.6.1 — 2 November 2026

- **Rangi 2 wall fixed.** The tall wall that needs Light Wings was 6 tiles high and only cleared with a near-perfect double jump. It is now 5 tiles and clears with the second jump pressed any time from the rise to well after the peak. A carved sign beside it explains the double jump.
- **Sealed gates explain themselves.** Near a closed glyph gate the game shows "Sealed gate" and an arrow over each glyph stone still to wake.

## 0.6.0 — 2 November 2026: audit fixes

Every recommendation from the release audit, with what was done.

### Critical

| Audit item | Status | What changed |
| --- | --- | --- |
| No repo or backup | Done here, finish on GitHub | This folder is the complete project. README explains the GitHub upload. |
| No cultural review | Ready for a reviewer | `docs/CULTURAL_REVIEW.md` lists every line of story text with questions to ask. The review itself needs a person. |
| Zero human playtests | Ready for testers | Built-in playtest log and copyable report; `docs/TEST_MATRIX.md` for devices and five full playthroughs. |
| No release build or hosting | Done | This folder runs as-is from `index.html` and uploads to itch.io as a zip. Store text and screenshots included. |

### High

| Audit item | Status | What changed |
| --- | --- | --- |
| Template levels, no set pieces or puzzles | Partly done | Each of Rangi 1–12 now has one hand-authored glyph-gate set piece: strike or shoot glyph stones to open a sealed gate. Some use vines, tunnels, spike pits, reflecting pools or a cave horror ambush. The rest of each heaven is still assembled from templates. |
| Art below the brief | Not done | Needs a pixel artist. New art this pass: glyph stones, sealed gates, carved signs, two new creatures, foreground foliage, water reflections. |
| No tutorial | Done | Rangi 1 now opens with six teaching sections and carved signs: walk, jump, ledge grab, vine, strike, roll, slide and light. Signs show the right key, button or touch control. |
| Unbalanced, one difficulty | Done (needs playtest data) | Assist, Normal and Hard, chosen when starting a journey and changeable in Settings. The first guardian has 20% less health. |
| Untested on real devices | Ready for testers | See `docs/TEST_MATRIX.md`. |
| Timers ignore pause | Fixed | All gameplay timers run on the game clock. Tested: a timer set before pausing does not fire until play resumes. |
| Silent crashes | Fixed | Repeated errors open a "Something went wrong" screen with Reload from the last checkpoint and Quit to title. Errors are written to the playtest report. |

### Medium

| Audit item | Status | What changed |
| --- | --- | --- |
| Abilities gate almost nothing | Partly done | Five set pieces (Rangi 2, 3, 4, 5 and 9) hide a greenstone relic reachable only with Light Wings. Rangi 4 and 10 need Light Wings or Celestial Dash to cross. |
| Missing heavenly beasts, cave horrors, glyphs | Done | Cave horror (drops from ceilings, hunts in bursts) in Rangi 4, 6 and 9. Heavenly beast (telegraphs, charges, then stands dazed and open to critical hits) in Rangi 8, 10, 11 and 12. Ancient glyphs: one per set piece; every fourth restores a life. |
| Water reflections, real shadows | Reflections done | Shallow reflecting pools in Rangi 1, 5 and 6. Real shadows not added. |
| Saves only in browser storage | Done | Export and import a save file from Settings → Saves and playtest. |
| Accessibility | Done | Key rebinding, three text sizes, reduced motion and flashing, separate screen-shake toggle, Assist mode. |
| Synthesised taonga pūoro | Not done | Needs recordings from practitioners. Flagged in the cultural review questions. |
| Fonts loaded from Google | Fixed | Fonts are bundled in `fonts/`, including the Latin Extended set for macrons. |
| No automated tests in the project | Done | `tests/` holds the browser tests. |

### Low

| Audit item | Status | What changed |
| --- | --- | --- |
| Mostly still cutscenes | Not done | Needs animation work; best done alongside the art upgrade. |
| No crash reporting | Done locally | Errors go to the playtest report. No online reporting. |
| Foreground blobs | Fixed | Replaced with fern, vine, cloud and rock silhouettes per heaven. |
| Score has no purpose | Fixed | End-of-heaven summary: time, foes, falls, secrets, up to three stars and a star bonus. Best stars are saved per heaven. |

### Bugs found and fixed during this pass

- **Ledge grabbing never worked.** A missing starting value made the check always fail. Fixed and tested.
- **The new gates could be climbed by wall-jumping up their face.** Gate stone is now too smooth to cling to.
- Lightning, boss and power flashes now respect Reduced motion.
