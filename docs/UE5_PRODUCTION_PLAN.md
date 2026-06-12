# ISKANDER: GATES OF THE TWO-HORNED
## UE5 Vertical Slice — Production & Technical Plan

This document maps the AAA master prompt onto concrete Unreal Engine 5.4+
systems and a realistic vertical-slice scope. The playable web prototype in
this repository is the **design reference**: every mechanic listed here ships
today in the prototype, with tuned numbers (parry windows, forge-cycle pacing,
boss phase lengths) that a slice team can lift directly.

---

## 1. What the prototype already validates

| Pillar | Prototype implementation | Validated numbers |
|---|---|---|
| Parry-centric combat | Lion-shield block with frame-perfect window | 140 ms window (260 ms assist), 1.5 s stagger, 0.55 s time dilation |
| Three-tier Myth system | 11 skills, dual Doxa/Mythos currencies | Tier gates: Siwa event, Wall arrival; Tier-3 aging cost −0.5 max HP/cast, floor 7 |
| Forge Cycle | Sortie → build → pour → wave, on one camera | 75 s doom-clock, 4-iron frame, 2-brass pour (2.6 s channel, interruptible) |
| Five-stage Khagan | Rider / Swarm Crown / Devouring chase / False Iskander / the Sealing | HP 130/100/—/110, 12 s chase, 8-unit seal channel |
| Hunger Front | Real-time westward corruption with render degradation | 1.1 px/s + 0.13/wave; ×0.25 behind any built wall |
| Final Choice | One-sprite-wide gap, two endings, NG+ carries age | — |

## 2. Engine system mapping

### Rendering & art (master prompt §2)
- **Nanite** for all hero-path geometry: colonnades, Tyre siegeworks, the
  4 km Wall (modular 8 m segment meshes with construction-state variants:
  foundation → iron frame → brass-sealed; states swapped via PCG + level
  instances so the strategy layer literally edits level geometry).
- **Lumen** GI with three act-locked lighting scenarios (golden hour /
  steppe dusk / glacial night) blended by world-position along the lateral
  spline. The "gold is only Alexander" rule is enforced via a material
  palette LUT validated in CI (the prototype's palette legend is the spec).
- **Corruption/Fraying**: a post-process material stack — chromatic tear,
  index-shift color grade toward grey-green, plus **Nanite de-tessellation
  faked via WPO dissolve + dither** in corruption volumes. Drive intensity
  from the same scalar the gameplay Hunger Front uses.
- **Character**: MetaHuman base for Alexander with a custom groom and a
  **morph-target aging rig** (Tier-3 casts write a persistent age scalar —
  identical to the prototype's `G.age`). Armor wear via runtime virtual
  texturing layers (dust/frost/blood masks, cleared at camps).
- Shield damage: the lion emboss uses a deformation blendshape stack +
  decal scarring; health is read off the shield (diegetic HUD shipped in
  the prototype).

### Gameplay framework (§4, §5)
- **Gameplay Ability System (GAS)** for the full kit. Abilities 1:1 with the
  prototype: SarissaLunge, PhalanxEcho, LionsRebuke, Besieger, HornsOfAmmon,
  SolarDisc, WhisperOfTheOracle, AnointedStride, IronVerse, BrassTide,
  SealingRoar. Doxa/Mythos as GAS attribute sets.
- **Motion matching** (Pose Search) for locomotion; contextual finishers via
  motion-warped montages; parry hit-stop and time dilation through a custom
  world-time-dilation manager (prototype: 0.35× for 0.55 s).
- **Camera**: side-on dolly on a rail spline with lookahead, dynamic FOV on
  dash/charge, and authored rotation events at set-pieces (Tyre, Devouring).

### The horde (§4, §7)
- **MassEntity + Niagara GPU swarms** for the Numberless: Mass for logic
  LOD (200+ agents), Niagara for the visual tide; the prototype's
  swarm-climbs-walls behavior becomes a Mass trait (vertical flow on
  blocked navmesh).
- Wall-Biters: standard AIController heavies with destruction targets
  (wall segment HP components — same numbers as prototype: 9 dps chew).
- **Echo-Born mimicry**: record the player's input ring-buffer (the
  prototype mimics dash-thrust/combo patterns; in UE5, replay through the
  same GAS abilities with a corrupted MetaHuman palette).
- Yajuj-Khagan: five-phase encounter as a State Tree; phase 3 (Devouring)
  is a chase volume destroying scaffolding via Chaos geometry collections
  behind the player.

### World & streaming (§3)
- **World Partition** + HLODs along one continuous lateral spline; no loads.
  Acts are data layers; the Hunger Front is a moving runtime data layer that
  swaps corrupted variants westward in real time (prototype rule: explored
  regions can be lost).
- Fast travel via founded Alexandria hubs + completed wall-segment beacons
  (prototype: blueprint mode, camp + brass segments only, blocked during
  waves).

### The Wall strategy layer (§8)
- Blueprint mode = a zoomed camera rig over the same world (no separate
  map scene), exactly like the prototype's blueprint overlay: segment
  states, HP, garrisons, weak seams from failed pours, corruption front.
- Pour set-piece: spline-run minigame with crucible kicks and Wall-Biter
  parries; failure writes a persistent `weak` flag on the segment
  (prototype: −30% max HP).

### Audio (§9)
- **MetaSounds**: act-based stem unmixing (the score loses instruments as
  corruption rises — drive stem gains from the Hunger Front scalar),
  parry ducking, off-screen horde spatialization. The Khagan's voice:
  10,000-whisper granular layer convolved under a single dry king voice.

### Accessibility & modes (§10)
- Parry assist (prototype ships it: window 140→260 ms), full remapping,
  colorblind-safe corruption (the prototype's green/magenta indices need a
  deuteranopia-safe alternate LUT), 60 fps performance mode (cap Mass agent
  visual LOD), HDR10 grading per act.

## 3. Vertical slice scope (matches master prompt deliverable)

1. **Siwa crowning** (Act I): 4-minute in-engine cinematic + the oasis
   approach. Prototype reference: `SIWA_SCENE` beats and the horn-ignition
   reward moment.
2. **One full Forge Cycle** (Act III): sortie into a corrupted quarry,
   two buildable segments, one pour, one wave defense.
3. **Complete five-stage Yajuj-Khagan encounter** ending in the playable
   Sealing and the Final Choice gap.

## 4. Milestones (slice team ≈ 35–45 people, 9–12 months)

| Phase | Duration | Exit criteria |
|---|---|---|
| Pre-production | 8 weeks | Combat graybox hits prototype's parry feel on a pad; Wall segment pipeline proven (3 states, Chaos destruction) |
| First playable | +12 weeks | Forge Cycle loop playable graybox end-to-end; Mass swarm at 200 agents/60 fps |
| Alpha slice | +16 weeks | All five boss phases scripted; Siwa cinematic previz locked; Fraying post-process approved |
| Polish | +8 weeks | Performance mode locked, accessibility pass, demo build |

## 5. Top risks

1. **Swarm count vs. 60 fps** — mitigate with Mass LOD + Niagara impostors;
   the fantasy survives at 120 visible + 80 implied (audio/VFX).
2. **The Hunger Front consuming authored content** — cap losable regions to
   side-content rings (the prototype only de-rezzes visuals west of the
   front; full region loss needs careful economy).
3. **Tier-3 aging as permanent cost** — playtest fatigue carefully; the
   prototype's floor (7/10 HP) keeps it expressive but never punitive.
4. **One-camera strategy/action blend** — the prototype proves the loop at
   small scale; the 4 km wall needs streaming rehearsal early.

---

*The web prototype (`index.html`) is the single source of truth for feel,
numbers, and narrative beats until the slice's own systems overtake it.*
