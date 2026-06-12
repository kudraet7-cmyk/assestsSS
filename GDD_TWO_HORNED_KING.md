# THE TWO-HORNED KING
### *Iskander and the Gates of the World*
**Game Design Document — Concept Summary v1.0**

> *Genre:* 2D Arcade Action-Adventure / Open-World Side-Scroller (Metroidvania × Sandbox Survival × Macro-Strategy)
> *Visual Baseline:* Pixel-art character sheet "image.png" — Greek Hero (Front/Back views, Helmet & Shield detail panels)
> *Tone:* Dark-fantasy historical epic. Bronze-and-blood mythology that curdles into apocalyptic cosmic horror.

---

## 0. HIGH CONCEPT

You are young **Alexander — Iskander Dhul-Qarnayn, the Two-Horned One**. Your conquest begins as history and ends as scripture. What starts as a fast, crunchy arcade side-scroller about phalanx warfare across Greece and Egypt slowly inverts: the deeper east you march, the less human the world becomes, until conquest itself becomes meaningless and the only victory left is a **wall** — the colossal Iron Gates that must hold back **Gog and Magog** until the end of days.

**The emotional arc of the game:** *Taking the world → Knowing the world → Saving the world by giving it up.*

**Three design pillars:**

1. **The Spear, the Shield, the Horns** — Combat is fast, readable, 60fps arcade action. Every mechanic flows from three icons on the reference sheet: the *dory* spear (reach & commitment), the *lion shield* (parry & retaliation), the *horned helmet* (myth & transformation).
2. **The Map Is the Story** — A single seamless side-scrolling world ~40km of in-game terrain wide. No loading screens between Macedonia and the Himalayas. Geography *is* narrative progression; biome transitions are act breaks.
3. **From Sword to Stone** — The endgame pivots the verb set from *destroy* to *build*. The Wall mechanic isn't a minigame bolted on; it's the inversion of everything the player learned. The siege tactics you used to break cities are now used against you, and you finally understand the people you conquered.

---

## 1. PROTAGONIST: VISUAL & THEMATIC BASELINE

Derived directly from the reference sheet (`image.png`):

| Element | Reference Detail | Gameplay/Narrative Meaning |
|---|---|---|
| **Golden Horned Helmet** | Twin ram horns curling from a gilded Phrygian-Corinthian helm (see HELMET detail panel) | The literal "Two Horns" of the Dhul-Qarnayn mythos. Visually evolves across the 3 skill tiers (§3). At Tier 3 the horns *ignite* with a faint divine glow during Myth-state. |
| **Lion-Embossed Shield** | Round bronze aspis, snarling lion boss, Greek-key ring engraving (see SHIELD detail panel) | Core defensive verb. The lion face is an *active* element — it animates (roars, flashes) on Perfect Parries. Heraclean lineage callback: Alexander claimed descent from Heracles via the Argead line. |
| **Banded Bronze Cuirass & Pteruges** | Segmented muscle-armor with layered leather strips, ornate belt | Armor visibly degrades and is re-forged with regional materials (Egyptian electrum, Indus wootz steel, Altai meteoric iron) — armor sets as Metroidvania keys. |
| **Tan Campaign Cloak** | Full back-view cape, weathered hem | Physics-animated cape used for readability in parallax-heavy scenes; later becomes the *glider* traversal upgrade ("Wings of the West Wind"). |
| **Dory Spear** | Two-handed thrusting spear, leaf blade, bronze sauroter butt-spike | Long-reach primary. The butt-spike is a real moveset element (downward pogo-stab, the classic arcade verticality tool). |
| **Bronze Sphere Pendant** (hanging from belt, front view) | Small orb on a cord | The **"Orb of Aristotle"** — Alexander's tutor's gift. In-game: the map/lore device. Holding it slows time briefly and reveals hidden mythological geometry in the level (Metroidvania secret-detection). |
| **Pixel Style** | Chunky 32–48px character scale, warm saturated palette, painterly dithered backgrounds, ruined classical architecture in background haze | Defines global art direction: "**Heroic Bronze**" palette in Act I that we will systematically corrupt (§2). |

**Character fantasy:** Not a grizzled veteran — a *young* king, fast and arrogant, animated with forward-leaning, aggressive idle poses. His sprite work should always look like he's about to lunge.

---

## 2. VISUAL & BIOME DESIGN — THE LONG SCROLL EAST

The world is one continuous horizontal strip with vertical Metroidvania stacks (catacombs below, peaks above) at key nodes. The art direction tells the story through a **palette pilgrimage**: warm → gold → strange → cold → void.

### Global techniques

- **5-layer parallax standard** (7 layers in setpiece zones): (1) Sky/celestial, (2) Far landmark silhouette, (3) Mid terrain, (4) Gameplay plane, (5) Foreground occluders. Layer 2 always contains the *next* act's landmark, microscopically small — the player can literally see the Himalayas from Egypt on a clear day. The destination is always visible. This is the single most important art rule in the game.
- **Dynamic time-of-day** via palette-swap LUTs (authentic to arcade pixel-art tradition rather than modern dynamic lighting), with hand-keyed "golden minute" moments at act transitions.
- **Weather as dithering:** sandstorms, monsoon, and blizzards are rendered as animated dither fields that physically reduce parallax layer visibility — weather literally eats the world's depth.

### ACT I — The Hellenic & Egyptian Dawn
*Macedonia → Greece → Anatolia → Levant → Egypt*

- **Palette: "Heroic Bronze."** Terracotta, olive, Aegean turquoise, marble white, gold leaf. High saturation, hard black outlines — confident, classical, *legible*. This is the reference image's palette and it should feel like a Saturday-morning arcade cabinet.
- **Lighting:** Hard Mediterranean noon sun with short sharp sprite shadows. Egypt introduces the game's first lighting motif: **monumental shadow** — the Pyramids and colossi cast multi-screen-length shadows that function as gameplay (heat/stamina drain in sun, stealth and cool in shade).
- **Parallax identity:** Layer 2 = Olympus, then Pharos lighthouse, then the pyramids. Layer 1 skies are clean gradients with painterly clouds. Foreground: broken columns, olive branches, papyrus reeds.
- **Architecture:** The ruined classical structures from the reference image's background become *intact* in flashback shrines — a quiet visual promise that everything golden will become a ruin.
- **Signature vista:** The Siwa Oasis oracle sequence — the only night-interior in Act I, lit solely by the glow of Alexander's own horns reflected in black water. First hint he is not merely a man.

### ACT II — The Eastern Marches
*Mesopotamia → Persia → Indus Valley → the Steppe → Zhetysu (Seven Rivers)*

- **Palette: "Gold to Strange."** Persia is lapis-and-gold opulence; the Indus is monsoon emerald and river-silver; then the steppe *desaturates everything* — endless grass-sea in muted sage and bone-white sky. The Seven Rivers region reintroduces color as **seven distinct ribbon-hues of water** cutting the grey-green steppe, each river a different biome corridor.
- **Lighting:** The sun gets *lower*. Act II is the act of long horizontal light — dawns and dusks stretch across the whole steppe, with grass-blade sprites backlit and rim-lit. Monsoon sections in the Indus go fully diffuse: no shadows at all, rain-sheets on every parallax layer, lightning as the only hard light (and a combat mechanic — flashes reveal cloaked anomaly enemies).
- **The Tone Shift, rendered visually:** Mythological anomalies begin as *background-layer wrongness*. Layer 2 mountains that have one frame of animation where they breathe. Bird flocks on layer 3 flying in geometric patterns. The parallax itself becomes unreliable — in corrupted zones, layers scroll at *wrong speeds*, an intentional violation of the player's learned visual grammar that produces deep unease without a single monster on screen.
- **Signature vista:** Crossing the Jaxartes at night — the aurora appears for the first time (the player thinks it's beautiful; it is actually the glow of Gog and Magog's burning lands over the curve of the world).

### ACT III — The Roof of the World
*Altai Mountains → Tianshan → the Himalayan Breach*

- **Palette: "Iron and Void."** Near-monochrome — slate, frost-blue, bone — with exactly two accent colors: **Alexander's gold** (now the brightest thing in the world; his sprite is the warm pixel cluster on every screen) and **Horde-red**, the ember color of Gog and Magog, which bleeds in through cracks in glaciers and the wound-like Breach on the horizon.
- **Lighting:** Sub-arctic. Long blue ambient occlusion, blizzard dither-storms at 3 intensities, and **firelight as life** — campfires, forge-lines and wall-braziers are gameplay-critical warmth sources and the only saturated light. Aurora storms ripple across layer 1 in 64-color cycling, the most technically lavish effect in the game, reserved for the end of the world.
- **Verticality:** Act III rotates the game's axis. Where Acts I–II scrolled *east*, Act III predominantly scrolls *up* — climbing the Altai into the Himalayas, the world map turning from a horizontal line into a tower. The final region, the Breach, scrolls *down*: into the pass between two mountains "between which the sun does not rise," where the Wall must be built.
- **Signature vista:** First sight of the Horde — not as enemies, but as **geography**: a layer-2 mountain range the player slowly realizes is *moving*, an ocean of bodies from horizon to horizon. The single most expensive parallax setpiece in production.

---

## 3. COMBAT & SKILL TREE — FROM CONQUEROR TO MYTH

### Core combat verbs (available from minute one)

- **Dory Spear:** long-reach thrust combos, charged **Phalanx Lunge** (dash-through pierce), aerial **Sauroter Slam** (butt-spike pogo — the vertical traversal/combat hybrid).
- **Kopis Sword:** short-range, fast, the "in-your-face" stance; swap between spear/sword mid-combo (stance-dance is the skill ceiling).
- **Lion Shield:** hold to block (chip damage), tap to **Parry**. A frame-perfect parry triggers the **LION'S ROAR** — the embossed lion animates and roars, staggering all nearby enemies and refunding stamina. The parry window is generous at Tier 1 and *the whole game* at high-level play.
- **Stamina-driven, not cooldown-driven.** Arcade purity: everything reads in 2 frames of anticipation.

### The Three Tiers

Skill points come from three distinct currencies, reinforcing each act's theme: **Glory** (combat feats), **Wisdom** (relics & oracle shrines), and **Sacrifice** (Act III — permanently giving up earlier powers; see Tier 3).

---

#### TIER 1 — MORTAL CONQUEROR *(Act I)*
*"He was the best soldier in the world. That was all he was."*

Pure martial skill. Grounded, historical, crunchy. Helmet appearance: polished bronze, horns small and ornamental.

| Branch | Sample Skills |
|---|---|
| **Sarissa Doctrine** (Spear) | *Pike Wall* (counter-thrust on parry), *Gaugamela Drive* (charge that gains damage per enemy pierced), *Sauroter Mastery* (pogo-bounces refund a mid-air dash) |
| **Lion's Pride** (Shield) | *Roar Radius+*, *Shield Bash* combo-starter, *Aegis Sprint* (block while running — phalanx fantasy) |
| **King of Men** (Leadership) | Summonable **Hetairoi companion cavalry** as screen-clearing assist-strikes; rescued/recruited NPC soldiers grant passive war-banner buffs at camps |

---

#### TIER 2 — PHARAOH'S BLESSING *(unlocked at the Oracle of Siwa, grows through Act II)*
*"The priests named him Son of Amun. He began to believe them."*

Divine-kingship powers — solar, golden, miraculous, drawn from Egyptian and Persian sacred kingship. Helmet appearance: gilded, horns lengthen and gain the ram's curl of Amun (matching the reference art's full curl). Combat gains light-element effects.

| Branch | Sample Skills |
|---|---|
| **Eye of Ra** (Offense) | *Solar Lance* — charged spear throw that becomes a beam of noon-light; *Khopesh Echo* — sword swings leave golden after-images that strike again |
| **Ka of the King** (Mysticism) | *Second Soul* — leave a golden statue-double in place, swap positions (puzzle + combat repositioning, the act's Metroidvania key); *Orb of Aristotle* upgrades — slow-time radius, reveal hidden architecture |
| **Bread and Flood** (Dominion) | Blessing of the Nile: standing water heals; conquered/allied city-shrines project buff auras across whole map regions — the first taste of *macro*-scale power, foreshadowing the Wall game |

---

#### TIER 3 — THE TWO-HORNED MYTH *(Act III)*
*"He stopped being a man the day he saw what was coming. Men cannot fight the end of the world. Myths can."*

The Dhul-Qarnayn apotheosis — and the game's cruelest design idea: **Tier 3 skills are bought with Sacrifice. Each one requires permanently sealing a Tier 1 or Tier 2 skill into the Wall.** Alexander literally builds his humanity and his godhood into the masonry. By the finale, the player has personally chosen what kind of legend remains. Helmet appearance: the horns now glow with slow-cycling palette fire; in Myth-state the sprite gains a 1px aurora outline.

| Branch | Sample Skills |
|---|---|
| **The Horns of the World** | *Gore of Ages* — a horned charge that shatters Horde siege-beasts and terrain alike; *Two-Horned Stance* — face two directions at once, attacks mirror behind you (mechanical embodiment of the epithet) |
| **Voice of the Covenant** | The Lion's Roar evolves into a word of binding: parries now *chain-stun* entire waves and briefly *enslave* lesser Yajuj to fight for you — the conqueror's final irony |
| **The Sealed King** | *Iron Communion* — meld into Wall segments to repair them with your own health; *Until the Appointed Day* — the ultimate: a once-per-boss-phase invulnerable Myth-state where the screen drops to monochrome except Alexander's gold (the Act III palette rule, weaponized) |

---

## 4. THE GOG AND MAGOG THREAT (YAJUJ & MAJUJ)

### Design philosophy
They are not an army. They are **erosion with teeth** — a biological flood. Classical and Qur'anic/Syriac sources describe them as innumerable, swarming, "swooping down from every height," drinking rivers dry. So in pixel-art terms: **they are a fluid simulation wearing bodies.** Individually trivial, collectively terrain-altering. Where every other enemy in the game respects the platforming grid, the Horde *flows over it* — filling pits, pouring up walls, forming ramps and towers out of themselves.

### Visual language
- **Palette violation:** the Horde uses colors from *outside* the game's established LUTs — ember-red and bruise-violet that never appear in any biome. They look wrong on every screen, by design.
- **Silhouette:** hunched, long-armed, small-skulled humanoids with **flat bronze-age faces and tiny pinprick ember eyes** — no whites, no readable expression. 16px tall (half of Alexander) so that 60+ fit on screen.
- **Animation:** deliberately *too fast* — 2-frame run cycles at high framerate, insectile, skittering. Their bodies dither at the edges like the blizzard effect: the Horde and the weather share a visual grammar. *The storm and the swarm are the same thing.*

### Enemy roster (escalation)
1. **Yajuj Skitterlings** — the flood itself. Die in one hit; never stop coming while a **Maw** (spawn-fissure) is open.
2. **Ear-Cloaked Stalkers** — drawn from the medieval legend that some of them wrap themselves in their own enormous ears: they *sleep wrapped*, looking like boulders on layer 4, and unfurl when passed. Their ears deafen — they mute the game's audio in a radius, killing the player's parry-timing audio cues.
3. **River-Drinkers** — bloated siege-units that drain water hazards (changing the level layout!) and spit it back as scalding geysers.
4. **Tower-Knots** — Skitterlings that braid into 3-screen-tall siege columns to climb the Wall; must be cut at structural "knot" weak points (arcade pattern-boss logic in regular encounters).
5. **The Sons of Majuj** — rare elite duelists, the only Horde that fights with *honor* and *weapons looted from your dead soldiers* — Greek spears, Persian shields. The Horde wearing your own history back at you.

---

### BOSS FIGHT: **WARLORD QARASH, THE MOUNTAIN-THAT-WALKS**
*Multi-stage arcade setpiece — climax of Act III, fought ON and AROUND the half-built Wall.*

Qarash is the Horde's warlord-organism: a colossal Majuj patriarch, six stories of fused bodies, wearing a **mocking parody of Alexander's own armor** beaten out of ten thousand looted shields — including a crude, lion-faced shield-graft on one shoulder. He has horns. *Iron* horns. He is what the legend of the Two-Horned King becomes if the Horde writes it.

**PHASE 1 — "The Avalanche" (horizontal arcade run).**
Qarash charges along the valley floor parallel to the player as both sprint across the unfinished Wall's scaffolding. Classic arcade auto-scroller: leap gaps as his fists demolish the scaffold behind you, parry the debris he hurls (Perfect Parries return debris into his face — the only damage source this phase). His health bar is replaced by a **distance bar** — survive to the First Bastion.

**PHASE 2 — "The Climb" (vertical boss tower).**
Qarash grips the Wall and begins to climb it; the screen scrolls up. He IS the level: you fight on his arms and back, pogo-ing with the Sauroter Slam from shoulder-plate to horn while Tower-Knots form along his spine. Destroy the four **armor-grafts** (each a mini pattern-puzzle; the lion-shield graft *parries you back*). Each graft destroyed triggers a collapse-and-regrab — a brutal falling section through blizzard dither.

**PHASE 3 — "The Two-Horned Duel" (mythic mirror match).**
Stripped of armor, Qarash shrinks — compressing into a dense, Alexander-sized duelist on a single flat arena atop the Wall's gate-lintel, aurora raging on layer 1. He now uses **your moveset**: spear lunges, shield parries, even a corrupted Roar. Every Tier 1 skill the player sacrificed to the Wall (§3) is a move Qarash *cannot* copy — the player's permanent losses become literal openings in the final duel. Beat him with what only you still are.

**PHASE 4 — "The Maw" (finisher / playable cutscene).**
Qarash, broken, unravels back into ten thousand Skitterlings that try to pour through the unfinished gate-gap beneath you. The fight's last 60 seconds become the Wall mechanic itself at panic speed: slam the final gate-segment levers, pour the molten brass (see §5), and seal him mid-scream into the metal. **The boss's death animation is the Wall's completion animation.** Qarash's iron horns remain embedded in the gate's face forever — the Gates of Alexander wear the enemy's crown.

---

## 5. THE WALL-BUILDING MECHANIC — "THE COVENANT OF IRON AND BRASS"

### The blend: macro-strategy you walk through

The legend itself is the design key: Dhul-Qarnayn built the barrier from **iron blocks** smelted between two mountains, then sealed with **molten brass (qitr) poured over the top**. We turn that recipe into a two-resource, two-tempo game:

- **IRON = structure** (mined, hauled, stacked — slow, strategic)
- **BRASS = the seal** (molten, poured, time-critical — fast, arcade)

#### The Ledger (macro layer)
Opening the Orb of Aristotle in Act III reveals **the Ledger** — a living tapestry-map of the whole 40km world, drawn in the game's pixel style as an illuminated scroll. Here Alexander plays strategist:

- **Assign allied factions** (every faction recruited or spared across Acts I–II appears here — mercy and diplomacy from 20 hours ago become late-game production capacity; conquest choices were the *real* skill tree all along):
  - *Greek engineers* → build speed & crane unlocks
  - *Egyptian masons* → wall HP & monumental tier
  - *Persian qanat-diggers* → underground supply tunnels (fast-travel that the Horde can also breach…)
  - *Steppe horse-clans* → caravan speed and raid warnings
  - *Indus metallurgists* → wootz-steel gate teeth
- **Route caravans** of Altai ore along the actual side-scrolling map. This is the genius loop: **caravans physically travel through the open world in real time.** If the player does nothing, they face Horde ambushes resolved by simulation. Or the player can *be there* — every Ledger decision is also an optional side-scrolling escort/defense mission inside terrain you already know intimately. Macro choices spawn micro gameplay.

#### The Wall itself (micro layer)
The Wall is not a menu — it is **a real, persistent, walkable level that grows.** Each constructed segment adds physical screens of crenellations, stairways, brazier posts, ballista nests, and forge-rooms that Alexander platforms across during **Breach Nights**.

- **Breach Nights (tower-defense from inside the tower):** Horde waves assault the construction line. The player free-runs the Wall's length — manning ballistae, kicking Tower-Knots off the parapet, doing Iron Communion repairs, lighting signal braziers to redirect NPC defenders. Where you *aren't*, your faction assignments and emplacements hold the line (or don't). It plays like a one-man garrison crossed with a beat-'em-up.
- **The Pour (the act of sealing):** Completing a segment triggers the **Brass Pour** — a 90-second arcade sequence riding the crane-bucket of molten qitr along the wall-top, tilting it to fill seams (rhythm/physics minigame) while Skitterlings leap at the bucket. Brass-sealed segments gleam gold — the Wall slowly becomes a horizontal stripe of Alexander's signature color across the monochrome Act III world. **The player paints the screen's hope-color onto the map with their own hands, segment by segment.**

#### Unique loops you didn't ask for (but the myth demands)

1. **"They Lick the Wall by Night."** Straight from the legend: every dawn, Gog and Magog have *eaten* a fraction of yesterday's progress — unless segments are brass-sealed or garrisoned. Unsealed iron is a decaying resource. This creates the endgame's core tension-rhythm: build by day, defend by night, *seal or lose it.* The Wall is a sandcastle against a tide, and the tide is patient.
2. **Sacrifice Masonry (ties to Tier 3):** Skills sealed into the Wall manifest as **physical wonder-segments** — sacrifice *Solar Lance* and that segment carries an eternal beacon that burns Horde at night; seal your *Hetairoi cavalry* and ghost-riders patrol that stretch forever. The skill-tree UI and the Wall map become the same screen by endgame. Your build is literally your building.
3. **The Trumpet Doctrine (legacy/NG+):** In legend, Alexander mounted brass trumpets on the gates that howled in the wind to frighten the Horde — until birds nested in them. Post-game, the world continues: you place wind-trumpets, garrisons fade, birds nest, seals weather. NG+ begins generations later with *your* wall, decayed by *your* gaps, as the world's starting terrain. "Until the appointed day" becomes a mechanic: the Wall was never meant to hold forever — only long enough.
4. **The Final Inversion (last playable beat):** After the Pour that ends Qarash (§4, Phase 4), the camera pulls back through all five parallax layers until the completed, gleaming Gates are a single golden pixel in the mountains — the same trick as the act-landmark rule from §2, now in reverse. Alexander walks west, off-screen, into history. The Horde hammers on the far side of one gold pixel. Roll credits over the sound of it.

---

## 6. ONE-PAGE SUMMARY (PITCH CARD)

| | |
|---|---|
| **Title** | The Two-Horned King: Iskander and the Gates of the World |
| **Elevator** | A pixel-art arcade metroidvania where Alexander the Great conquers his way east — and then has to wall up the apocalypse he finds there. |
| **Hero** | Young Alexander, per reference sheet: golden ram-horned helm, lion aspis, dory spear, tan campaign cloak. |
| **Structure** | 3 acts / 1 seamless 40km scroll: Heroic Bronze (Greece–Egypt) → Gold-to-Strange (Persia–Indus–Zhetysu) → Iron-and-Void (Altai–Himalaya). |
| **Combat** | Stamina arcade action; spear/sword stance-dance; Lion's Roar perfect-parry; 3-tier tree (Mortal Conqueror → Pharaoh's Blessing → Two-Horned Myth) where the final tier costs permanent sacrifice. |
| **Threat** | Gog & Magog: a fluid-sim horde in palette-violating ember-red; warlord Qarash, a 4-phase boss who is an avalanche, a climbing level, a mirror duel, and finally mortar for your wall. |
| **Signature Mechanic** | The Covenant of Iron and Brass: a macro Ledger whose every decision spawns micro side-scrolling missions; a Wall that is a real walkable growing level; build-by-day / defend-by-night / *seal-or-lose-it*; skills sacrificed into wonder-segments; NG+ inherits your decayed wall. |
| **Ending image** | The Gates as one gold pixel in a monochrome mountain range. Something is knocking. |

---

*Document prepared from the visual baseline of `image.png` (pixel-art Greek hero character display: front/back views, horned helmet and lion shield detail panels) and the Iskander Dhul-Qarnayn / Gates of Alexander mythos.*
