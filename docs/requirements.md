# Japanese Learning App — MVP Requirements Specification

*Status: requirements phase. Major revision incorporating the adaptive learning-engine model worked out in design discussion. This document is the agreed reference.*

---

## 1. Purpose & Vision

A Japanese-language learning application built around a single conviction: **vocabulary learned without context is too difficult, and context is what makes learning stick.**

The app teaches Japanese through **topics** — concrete real-world competencies the learner chooses (ordering coffee, ordering sushi, learning to drive, negotiating a contract). For each topic the system builds the domain vocabulary and the phrases and scenarios that go with it, ordered simple → complex, expanding as the learner gains mastery. The goal is *comprehensive comprehension within a topic* rather than scattered word knowledge.

The app is **outcome-based**. The learner declares an outcome — a can-do they want — and the engine's job is to deliver it. The contract is plain: **what the learner puts in, they get out.** The outcome belongs to the learner; it can be as small as a few holiday phrases or as large as full standardised proficiency. One engine serves the whole range.

The context-first, topic-organised method is not a personal workaround. It generalises — it is a strong method for any learner — so the app has value beyond its first user.

> Terminology: "taxonomy" was the original spec term for a topic unit. The learner-facing and spec-standard term is now **topic**, or, generically, **unit** (see §6).

---

## 2. Core Constraints & Design Principles

These govern every decision below. Where a later requirement and a principle conflict, the principle wins.

**2.1 Dysgraphia is the central design constraint.** Dysgraphia affects *written output* — handwriting, spelling, organising thought into written form. It does not affect listening, recognition, reading comprehension, or speaking. Therefore: **all learning routes through the intact channels (listening, recognition, reading, speaking), and handwriting is never a gate.** Written production means typing or selecting — never handwriting.

**2.2 Context-first.** Context-free vocabulary learning is too hard. Topics exist to supply context; this is non-negotiable.

**2.3 Fast and simple.** The learner-facing experience must stay as fast and frictionless as a bare spreadsheet drill: a prompt, an answer, repeat. Minimal clutter, instant response.

**2.4 Measurability against external standards.** Proficiency, mastery, and progress must all be measurable against recognised education standards (JLPT, CEFR-J). The *method* may be novel; the *measurement* is deliberately standard — a novel path measured on a novel scale is a closed loop no one can trust. The standard measurement is what licenses the novel path.

**2.5 Complexity behind glass.** The data model and the engine may be as rich as they need to be; the *learner's experience* stays simple. Richness lives in the back end. The framework becomes a problem only if its complexity leaks onto the screen.

**2.6 The system is an instrument, not a voice.** The app states facts: *you are here; the target is here.* It does not narrate a "journey," characterise the learner, or cheer. Encouragement-as-tone is not trusted and is not used — plain fact is the integrity of the product. Progress is shown plainly; diagnosis and correction happen quietly (see §8, §9).

**2.7 The learner moves first.** The learner declares intention and goal; the system serves. The system never places, labels, or buckets the learner — it reads ability from the learner's own success and failure, and adjusts quietly to reality.

> The rule, in one line: *the learner sets their intention; their success and failure hold them accountable; the system pulls them to their real level, quietly.*

**2.8 Start simple; adapt the rate.** Every learner starts simple. The only thing that adapts is the rate at which complexity is layered on — fast for the capable, gentle for the struggling. The simple start is itself the assessment; there is no separate placement test.

---

## 3. Scope

**3.1 Target user (MVP):** English speakers learning Japanese. Single content direction — English is the known language, Japanese the target. The MVP does not teach English to Japanese natives.

**3.2 Learning direction:** EN→JP is the production-heavy direction; JP→EN is the recognition direction. **Testing is bilateral** — the learner is prompted in both directions. This is required: test one direction only and the learner is merely translating the prompt in front of them. The two directions are separate skills, tracked separately (see §13).

**3.3 Platform:** Web application delivered as a **PWA** — one codebase, runs in the browser, installable on phone and desktop, no app store. Two surfaces: the laptop/web surface for **authoring** content; the mobile surface for **learning**. The fast drill loop works offline; media generation, scenario generation, and first-introduction require a network connection.

**3.4 Explicitly out of scope:** Handwriting kanji. Production is typing / selecting / speaking only.

**3.5 Deferred decisions** (see Appendix): concrete JLPT band-gate thresholds; depth of pronunciation scoring; what registers as a "fail" event in the drill (input modality and forgiving-match rules).

---

## 4. Writing Systems & the Per-Word Scaffold

Japanese has three scripts — hiragana, katakana, kanji. Romaji (Latin letters) is a temporary scaffold, never the target.

**4.1 The script ladder.** Script support runs on one ordered ladder, from maximum support to native:

> romaji → kana → kanji + furigana → kanji

Each step is a renderable form; there is no continuous in-between. Rendering is discrete; the learner's *position across their whole word set* is a continuous blend, displayed on the learning scale (see §10).

**4.2 The per-word scaffold.** Script support is **per word, per learner, per direction** — not a global learner setting. There is no global "script level."

- Each word, for each learner, in each test direction, holds a scaffold state — a position on the ladder.
- When a word is failed, that word's rendering drops one step toward more support — quietly, that word only. Nothing global moves; "yanking the learner down" is structurally impossible, because there is no global position to move.
- When a word is proven (see §8.3), its rendering rises one step toward less support.
- The scaffold therefore breathes both ways, per word, on demonstrated capability.

**4.3 Recognition vs production.** The same scaffold state is used as a mirror:

- **Recognition (JP→EN)** — the scaffold sets *prompt support*: how much help reading the Japanese shown.
- **Production (EN→JP)** — the scaffold sets *required output form*: produce it in romaji, kana, or kanji.

Recognition scaffold normally runs ahead of production, because reading a kanji is easier than producing one.

**4.4 The reveal is the diagnosis.** When a word is failed and its support is revealed, that reveal is also the diagnostic probe. If the support rescues the next attempt, the failure was script-reading. If it does not, the failure is a vocabulary gap, and the word routes back to familiarisation (§8.1).

**4.5 Kanji.** Kanji is not hard-gated. There is no separate "kanji-unlock" event — kanji surfaces through the ordinary per-word scaffold as words prove out, supported by furigana that fades word by word. For a beginner whose scaffolds sit low, kanji is simply not reached yet. The JLPT per-band reference lists (N5 ~100, N4 ~300 cumulative, N3 ~650, N2 ~1,000, N1 ~2,000+) remain the difficulty calibration (see §14).

---

## 5. Learning Architecture: Demand-Pull Across Two Tracks

Learning runs across two tracks:

- **Topic track** — the topical, can-do domains the learner chooses (coffee shop, driving, contracts).
- **Structure track** — the systematic substrate: kana, numbers, counters, time, the calendar, polarity, particles, grammar patterns.

The tracks are coupled by **demand-pull**. The topic leads; the structure track catches up behind it. A topic creates demand ("this scenario needs numbers"), and the structural substrate is pulled in just-in-time, exactly as far as the topic needs. This is the source of the app's speed: the learner is not made to pre-load grammar before doing anything they want — they pick an outcome, and the substrate is supplied on demand.

The coupling runs two ways:

- **Forward** — structure mastery removes scaffolding from topic content and raises the difficulty a topic can be pushed to.
- **Diagnostic** — a failure inside a topic can be attributed to a structure gap (a number, a particle), routed to the structure track, and *not* charged against the topic's mastery (see §9, §14).

The substrate must genuinely *catch up*, or topic mastery does not generalise. Character recognition catches up automatically — every per-word scaffold fade is a character-recognition gain. Grammar is the harder half: a pattern used correctly across many phrases is not yet *known* as a rule. The structure track's job is to promote used patterns into generative rules.

---

## 6. Content Model: One Unit Type, Four Learning Patterns

**6.1 Everything is a can-do unit.** Topics and structure sets are the *same object*: a **unit** — a "learn to ___" can-do with its own levels and its own mastery %. "Order coffee," "count," "read hiragana," "negate verbs" are all units. There is no category split in the data model or the engine; one engine runs every unit.

A unit carries two pieces of metadata:

- **Role** — *chosen* (the learner picks it — topics) or *summoned* (a topic's demand activates it — structure units); and *terminal* (its mastery feeds only itself — topics) or *cross-cutting* (its mastery is an input to every other unit — structure units).
- **Learning pattern** — one of the four below. This, not the topic/structure label, is what the engine branches its teaching method on.

**6.2 The four learning patterns.**

- **Pattern A — Closed set** (hiragana, katakana). A finite set of arbitrary symbol↔sound pairs, no generative rule. Paired-associate recognition. "100%" is reachable and final.
- **Pattern B — Rule + exceptions** (counting, dates, time, counters). A generative rule covers the infinite regular cases; the learning effort is the irregularities. Tested by generating a fresh, unseen instance.
- **Pattern C — Rule proven in production** (polarity, particles, conjugation). Rule-based, but only real when produced inside a live utterance. Must route through scenarios; fakes mastery if drilled in isolation.
- **Pattern D — Open contextual acquisition** (topics). No rule. Open, expandable vocabulary and phrases, familiarised in context and made fluent through varied fresh scenarios.

The learning-pattern split is orthogonal to the topic/structure split — the old "systematic sets" category alone spans patterns A, B, and C. The engine is one mechanism; the pattern is a template plugged into it per unit.

**6.3 A unit's levels.** Every unit progresses simple → complex. For Pattern D (topics) the levels are deeper vocabulary and harder, more natural scenarios. For Patterns B and C the levels are the rule first, then exception clusters layered on. Levels are *content* levels — the i+1 progression of the material — never *learner* labels.

---

## 7. Data Model

**7.1 The word record.** A word is a **single canonical record** — never duplicated. Context, not duplication, carries meaning. Shared attributes:

- canonical form
- script forms (hiragana / katakana / kanji as applicable) plus the romaji reading
- senses — multiple meanings; context determines which sense applies
- grammatical forms (positive, negative, conventional uses) — shown through example sentences, not abstract rules
- example sentences
- unit links (which units the word belongs to)
- complexity level
- first-contact drill count

**7.2 The word↔unit link.** Because the same word means and looks different across contexts, the *contextual* layer hangs off the link between a word and a unit (and the sense, where senses differ): contextual image, contextual phrase, scenario membership, audio, complexity within that unit.

**7.3 Scenarios.** A scenario is a generated situation within a topic that exercises several words, phrases, and structure elements together. Each scenario carries a **naturalness level** — slow/simple/scaffolded → fast/idiomatic/native-pace — calibrated on the JLPT scale. Scenarios are generated by the LLM, persisted, and shared (§7.4). Fluency is tested on **fresh, unseen** scenarios — material the learner has not met — so the test cannot be memorised.

**7.4 Generated media — stored and shared.** All AI-generated media (images, video, audio, scenarios) is **persisted and reused**, not regenerated per learner. The first learner to reach a word or scenario triggers generation; everyone after reuses it. The cache key is **word + unit (+ sense)**. Images are cheap and generated on demand; video is expensive and pre-generated in batches per topic and cached; a consistent visual style is pinned per topic.

**7.5 The user profile.** Each user has a private, persistent **profile** that develops with use ("memory"):

- per-word, per-direction scaffold state and spaced-repetition state
- per-unit mastery
- the script intention set at onboarding (§10.1)
- adopted units

The profile is a continuous record. It carries **no level label and no bucket** — the learner is a set of continuous coordinates, read continuously.

**7.6 Layered architecture.**

- **Shared content layer** — word records, word↔unit links, scenarios, generated media, and the units themselves. Built once, shared, grows with use.
- **Per-user layer** — the profile.

The governing line: **shared content, private progress.**

---

## 8. Learning Flow: Familiarity → Fluency

A word — and a unit — moves from **familiarity** to **fluency**. These are not gated sequential stages with a binary "locked" checkpoint between them; the earlier three-stage "familiarise / lock-in / retain" model is replaced. Familiarity and fluency overlap, and the mix shifts continuously.

**8.1 Familiarity — the first encounter.** Word-level. The first time a word is met, presented within its unit, in sequence:

1. **The word** — audio first. The learner *hears* the word before seeing it written. The written form follows the per-word scaffold (§4).
2. **Contextual image** — the meaning anchor.
3. **Contextual phrase** — the word in a minimal frame.
4. **Video — the word in the topic** — the word as a situated event.
5. **Video — the word in use** — a person using the word naturally.

One active **"predict" beat** is included — after the image, before the meaning is revealed, a one-tap "what do you think this means?"

Familiarity is then built by **rapid repetition** — short, fast drill bursts. Rapid repetition produces familiarity, not knowledge: success in massed repetition proves only that the word is in working memory (see §8.3).

**8.2 Fluency — the topic-level achievement.** Knowledge is fluency, and fluency is a property of the *topic*, not the isolated word. Fluency is built and proven through **AI-generated scenarios**: the words are used, varied, and recombined across many situations of increasing naturalness. Scenario variety simultaneously delivers spaced retrieval, interleaving, and comprehensible input (i+1).

A unit is **fluent** when the learner clears **fresh, unseen scenarios** at the target naturalness level, unscaffolded.

**8.3 Proof of ability.** Success in *immediate / massed* repetition proves **familiarity** — the word is in working memory now. Success in *spaced and varied* repetition — after a gap, in a form not just seen — proves **ability**. The engine weights proof by the gap: a correct answer straight after exposure barely moves the model; a correct answer after a long gap moves it a lot. The adaptive ramp acts on proven ability, never on massed-repetition success.

**8.4 The familiarity↔fluency mix.** A learner does not finish all familiarity before any fluency. A scenario with three familiar words is already worth doing. Early: mostly rapid repetition plus a few simple scenarios. Later: mostly scenarios, with repetition only for freshly introduced vocabulary. The mix shifts continuously; there is no boundary event.

---

## 9. The Adaptive Engine

The engine spots weakness and drives what the learner sees next. It is **roughly 80% ML, 20% AI**.

**9.1 Diagnosis — ML, not an LLM.** Spotting weakness is a scheduler / diagnostic task. It uses a proven spaced-repetition model (FSRS-style) that predicts per-word recall probability from review history — deterministic, instant, offline-capable, explainable, measurable. An LLM is not used here.

- **Per-word scheduler** — always on; predicts recall probability for every word.
- **Pattern diagnosis** — periodic; clusters failures across tagged attributes ("weak on counters," "weak on production," "EN→JP fails, JP→EN fine"). Heuristics to start; an LLM pass over the error log is a later upgrade.

**9.2 Generation and open-ended scoring — the LLM.** The LLM does the three jobs nothing else can: generate scenarios, phrases, and probe items; score open-ended production (is this spoken or typed answer natural); write the pattern diagnosis in human terms.

**9.3 What the engine serves.** It schedules **scenarios**, not flashcards: the scheduler picks the weak and due words, the generator weaves a fresh scenario around them at the learner's i+1 naturalness. It balances three pools every session — **new** (introduce), **weak** (remediate), **due** (maintain) — and controls intake pace: struggling → slow new words; cruising → accelerate.

**9.4 Start simple; the ramp adapts.** Every learner starts simple. The engine reads ability from how fast the learner clears the simple material, and layers complexity just above current ability (i+1). The simple start *is* the assessment — there is no placement test, no onboarding probe, no shift. The ramp breathes both ways: cruising layers faster, struggling eases off.

**9.5 Bring back / push up.** On proven capability the engine moves each word's rendering: **bring back** (more support) on failure, **push up** (less support) on proven success. Per word, quiet, never global. It moves on proven — spaced — capability, not a single answer.

**9.6 The guarantee.** The engine has no give-up state — bring back, push up, pull in substrate, adjust until the target is met. The guarantee that "what the learner puts in, they get out" is a property of this mechanism, not a matter of tone.

**9.7 Correlate and evaluate.** As data accumulates, the system evaluates both the **learner** (position, gaps, predicted proficiency from unit history) and the **content** (each unit's yield, the demand-pull edge weights). Evaluation sharpens with the dataset: thin data → weak evaluation (cold start); dense data → accurate.

---

## 10. The Learning Scale

A single device — the **scale** — is the learner's whole interface. Everything in the model is a position on a scale; the learner learns one interface and reads "you are here" on whichever scale.

**10.1 Onboarding — set once.** At the start the learner sets a slider — their **intention** — choosing where to enter the script ladder (romaji / kana / furigana / kanji). This is an *intention*, not a self-rating: it states what the learner *wants*, so no setting can be "wrong." It is a low-friction on-ramp, set one time. The choice is low-stakes because the engine corrects from reality regardless (§9.5); it is neither a placement test nor a ceiling. If skipped, it defaults to full support.

**10.2 After onboarding — a display.** The slider's role then flips: the learner no longer sets it, they read it. It shows where they actually are as the system rebalances. Same device — input once, then display.

**10.3 Two scale types.**

- **Topic scale** — many of them, one per unit. Scoped to a single can-do, 0→100%, bounded (100% = done). The learner *acts* on these. The **functional** readout.
- **Proficiency scale** — one. The aggregate, mapped to the external standard (JLPT / CEFR-J). Derived, not acted on directly; it moves as a consequence of topic scales. A readout, not a target. The **standardised** readout.

**10.4 Accountability.** The scale is the honest mirror: the learner set an intention, their own results moved the marker, and they can see it. It reads as position, never as a verdict.

---

## 11. UI Modes

Two distinct modes resolve the tension between rich media and a fast, simple interface:

- **Introduce mode** — rich media, used once per word during familiarisation (§8.1). Short clips (4–8 seconds each), auto-advancing but always replayable and skippable. This is the only place richness is allowed.
- **Drill mode** — stripped down, fast, tap- and keyboard-quick, no media. The everyday repeat loop; it must stay spreadsheet-simple.

---

## 12. Practice Modalities

**12.1 Typing.** Typing is a chosen production mode, kept deliberately despite dysgraphia — Japanese in real life is overwhelmingly typed, not handwritten. It is a **modest component, not the centrepiece**: visual learning and scenarios carry the load. Typing serves production drilling and, later, listen-and-type dictation. Within Japanese typing, the IME candidate-*selection* step is a recognition task; the romaji-spelling effort is kept gentle. **The grading engine measures knowledge, not keystrokes** — forgiving input matching, no time pressure on typed answers, and a self-grade override ("I knew that").

**12.2 Speaking.** Speaking is **in scope** and is a **primary production mode** — an intact channel under the dysgraphia constraint. Spoken production with **compare-to-correct**: the learner speaks, the app captures the utterance and compares it against a correct reference. Implementation depth — recognition-match vs pronunciation/pitch-accent scoring — is deferred; the MVP may begin with recognition-match (see Appendix).

---

## 13. Pedagogy Engine

A small set of evidence-based principles does the real work; engagement is a thin layer on top.

- **Spaced repetition** — expanding review intervals; the retention engine.
- **Active recall / the testing effect** — retrieving an answer strengthens memory far more than re-reading or re-watching.
- **The recognition → production ladder** — "knowing" a word is five rungs: (1) recognition, (2) comprehension, (3) cued recall, (4) contextual use, (5) free production. Rungs 4–5 exist only inside scenarios. Production rungs are reached by typing, selecting, or speaking — never handwriting. Each testing direction (EN→JP, JP→EN) is a separate skill, tracked separately.
- **Comprehensible input (i+1)** — input pitched just above current ability. This is the universal mechanic: start simple, layer complexity just above. Difficulty steps are small.
- **Dual coding** — verbal plus visual beats verbal alone; the word → image → phrase → video sequence exploits this.
- **Interleaving** — mixing items within a session aids discrimination; delivered by scenario variety.

**Engagement is tied to learning outcomes, not activity.** Reward attaches to a unit's topic scale climbing and to mastery — not to streaks or minutes, and never to cheerleading (§2.6). Letting the learner choose the topic is itself a strong, built-in motivator (autonomy).

---

## 14. Proficiency Model: Two Separate Readouts

The app reports two readouts. They are **completely separate measurements** — separate questions, separate scales, neither computed from the other, neither diminishing the other.

1. **Functional readout — topic mastery.** Per-topic mastery % ("coffee shop: 100%"). What the learner can actually *do*. "Perfect at barista" is whole on its own — not a fraction of proficiency. This is a faithful instance of the functional / can-do model (CEFR-J, the Japan Foundation Standard).
2. **Standardised readout — proficiency.** A JLPT band estimate — the learner's aggregate mastered inventory mapped to JLPT reference lists. The externally comparable number.

"Perfect at barista" and "beginner in Japanese" are both true at once, and not a contradiction. The two readouts are separate; the only thing they share is that a word is stored once (§7.1).

**They correlate in aggregate.** One topic is small against the JLPT whole, but the *count* of units learned tracks proficiency upward. Structure units correlate directly and tightly — kana, numbers, grammar *are* the JLPT substrate. Topic units correlate indirectly, through the vocabulary they add and the structure they pull in (§5). Separate measurements; not uncorrelated.

**Two segments.** The casual / holiday learner needs only the functional readout — a few topics; proficiency is irrelevant and never surfaced. The committed learner needs both. One engine serves the whole spectrum — three phrases for a trip, up to N1 — because the readouts are separate and neither is forced on anyone.

JLPT bands also serve as the **universal difficulty scale**, calibrating every unit's levels and every scenario's naturalness — one coherent measure across the whole app.

---

## 15. MVP Summary — What v1 Is

A web/PWA Japanese-learning app for English speakers, **outcome-based**: the learner declares a can-do they want, and the engine delivers it. Everything — topics and structure alike — is a can-do **unit** with its own mastery scale, run by **one adaptive engine** across four learning patterns. The learner sets a one-time script **intention**; from then the engine reads ability from success and failure, starts simple, layers complexity at the rate the learner can take, and scaffolds script support **per word**. Words move from **familiarity** (rapid repetition) to **fluency** (fresh AI-generated scenarios); knowledge is topic fluency, proven on unseen scenarios. Progress is two **separate** readouts — functional (topic mastery) and standardised (JLPT proficiency). The system **states facts, never cheers**; complexity stays behind glass. Production is typing, selecting, and speaking — never handwriting. Content is shared; progress is private.

---

## Appendix: Open Items & Deferred Decisions

These do not block the MVP build and can be settled when the relevant phase is reached.

- **Concrete JLPT band-gate thresholds** — the exact numeric criteria for unit and band advancement. To be defined when the kanji phase is approached.
- **Pronunciation-scoring depth** — whether "compare-to-correct" speaking uses simple recognition-match or finer pronunciation/pitch-accent scoring. The MVP may begin with recognition-match.
- **"Fail" event definition in the drill** — what registers as a failure (typed / tapped / spoken input), and the forgiving-match rules around it (§2.1, §12).
- **Scenario reuse vs freshness** — scenarios are shared (§7.4), but fluency must be tested on scenarios fresh *to that learner*; the policy for drawing fresh vs reused scenarios per learner is to be tuned.

*Resolved during design discussion: the three-stage word lifecycle (familiarise / lock-in / retain) replaced by familiarity → fluency; placement tests and learner levels/buckets removed in favour of the continuous profile and the start-simple ramp; the §4.1 staged romaji scaffold replaced by the per-word, per-direction scaffold; the two content categories unified into one unit type with four learning patterns; the adaptive engine, the learning scale, and the two separate readouts specified; bilateral testing required; the system-as-instrument principle adopted.*
