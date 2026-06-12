# ISKANDER: GATES OF THE TWO-HORNED

> *Conquer the world side-scrolling left-to-right; save it by building a wall that scrolls back.*

A playable prototype of the v0.1 concept document: a 2D pixel-art side-scrolling
action-adventure where Alexander's conquest runs out of history and into myth.
March east through three acts, earn the ram horns at Siwa, and reach the Roof of
the World — where Yajuj & Majuj are de-rezzing reality itself and the only
answer is the greatest wall ever built.

Zero dependencies. All sprites, parallax, audio, and levels are generated
procedurally in plain JavaScript on a 480×270 pixel canvas.

## Run it

Open `index.html` in any modern browser, or:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Controls

| Input | Action |
|---|---|
| `A` / `D` (or arrows) | Move |
| `W` / `Space` | Jump (`S`+jump drops through platforms) |
| `Shift` | Dash |
| `J` | Sword (3-hit combo) |
| `K` | Spear (long thrust; during a dash → Sarissa Lunge) |
| `L` (hold) | Lion shield — block; the first ~8 frames are a **perfect parry** (the lion roars, staggers everything nearby) |
| `E` | Interact: build / pour / repair the Wall, mine ore, commune, rest |
| `G` | Station an Echo Garrison on a wall segment (12 Doxa) |
| `Q` | Skill tree |
| `1`–`5` | Learned active skills |

## What's implemented from the design doc

**Three acts, one scroll.** Honey-gold Hellenic dawn → desaturated steppe dusk →
near-monochrome glacier, with palette-lerped terrain, 5-layer parallax,
dithered skies, a Breach that back-lights the eastern peaks like a false dawn,
aurora that pulses with corruption proximity, and blizzard particles in front
of *and* behind the action. The Greek-key UI border mutates per act and gets
rune-bitten by corruption.

**The three-tier skill tree.** Two currencies: **Doxa** (combat) and **Mythos**
(relics/oracles).
- *Tier 1 — Mortal Conqueror:* Sarissa Lunge, Phalanx Echo, Lion's Rebuke, Besieger.
- *Tier 2 — Pharaoh's Blessing* (unlocked at the Oracle of Siwa, where the ram
  horns are visibly earned): Horns of Ammon, Solar Disc, Whisper of the Oracle,
  Anointed Stride.
- *Tier 3 — The Two-Horned Myth* (unlocked at the Wall): Iron Verse, Brass Tide,
  The Sealing Roar — and every Tier-3 cast **ages the king** (greying sprite,
  shrinking max health). Power costs legacy.

**The horde that eats the art.** Enemies render as corruption of the pixel grid —
flickering rows, palette indices that exist nowhere else (acid green / magenta).
The Numberless (8px swarm tide), Lickers of the River, armored Wall-Biters, and
Echo-Born that wear Alexander's own glitched sprite. The **Hunger Front** creeps
westward in real time, de-rezzing biomes behind a curtain of static; lingering
inside it drains you. If it reaches the forge-camp, the world ends.

**The Iron Verse — the Wall as a playable place.** Eight segments on the ledge
between two mountain faces: sortie east into corruption for Altai iron and brass
ore (and caged engineer clans), raise iron frames with `E`, then channel the
molten **Pour** — interrupted pours leave weak seams. Waves arrive on a
doom-clock and chew on your architecture; your build decisions are the level
geometry you defend. Phalanx Echo matures into permanent Echo Garrisons: the
soldier becomes the stone.

**Yajuj-Khagan, the Mouth of the East.** A four-stage finale at the gate:
the Rider (charge / spear-rain / shockwave), the Swarm Crown (only fire at the
gate braziers makes the colony commit to one shape), the False Iskander (a
palette-inverted duelist who parries you — feint, strike twice), and the
Sealing — where you stop fighting and *build*, holding the gate while molten
brass entombs him mid-lunge, forever visible in the Wall.

**Yajuj-Khagan is five full stages:** the Rider, the Swarm Crown, **the
Devouring** (a real-time chase — he erases ramparts, Echoes, and wall
segments behind you while you run west), the False Iskander, and the Sealing.

**The Final Choice.** The last gap is one sprite wide. Seal it from the west, or
step through first. Two endings, one missing pixel — and **New Game+** (`N` on
an ending) carries the king's aged sprite and learned myth forward as canon.

**Cinematics & companions.** The Siwa crowning plays as a letterboxed
in-engine cutscene; Hephaestion, Roxana of Sogdia, and the Oracle hold
camp dialogues (`E`); each of the 11 relics carries codex lore.

**Forge blueprint mode (`M`).** The whole wall as one strategic tapestry —
segment states, HP, garrisons, weak seams, the corruption front — with
fast travel to the camp and any brass-sealed beacon. Health is diegetic:
the lion shield in the HUD cracks as the king bleeds. A parry-assist
accessibility toggle (`T`) widens the parry window.

**AAA roadmap.** `docs/UE5_PRODUCTION_PLAN.md` maps every pillar of this
prototype onto a UE5.4 vertical-slice plan (Nanite/Lumen/GAS/Mass/Niagara/
MetaSounds), with the prototype as the tuned design reference.

## Tests

```sh
node test/smoke.js
```

Headless smoke test: loads the game in a stubbed DOM and simulates a full
playthrough (~10k frames) — conquest march, shrine, skill purchases, all eight
wall segments, every boss phase, both endings, and the autonomous doom-clock.
