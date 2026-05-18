# Japanese Learning App — Build Spec

*A build-oriented specification for an AI app builder (Lovable / Vercel v0): concrete screens, data model, flows, and MVP scope. For design rationale — the "why" behind every decision — see [`requirements.md`](requirements.md). Where the two differ, `requirements.md` is the source of truth.*

---

## 1. Product in one paragraph

An **outcome-based** Japanese-learning **PWA** for English speakers. The learner names a real-world competency they want — "order coffee," "handle a café job," or just "say hello politely on holiday" — and the app delivers it. It builds a **topic** of vocabulary, phrases, and AI-generated practice **scenarios**, then drills the learner to fluency with an **adaptive engine**. The learner works through a guided **checklist** of steps, popping into short intensive **episodes** (media intro, fast drill, scenario, voice practice). Progress shows as two honest numbers: per-topic mastery, and an overall JLPT-band estimate. No streaks, no mascots, no cheerleading — the app states facts.

---

## 2. Platform & stack

- **PWA** — installable web app, runs in-browser on phone and desktop. Mobile is the primary *learning* surface; desktop is also used for *authoring*.
- **Offline:** the fast drill loop must work offline. AI generation (scenarios, media) and a word's first introduction require a network connection.
- **The app needs:** a database (users, content, progress); an LLM API (scenario/phrase generation, scoring open-ended answers); audio playback and microphone capture; image and short-video display.
- **Suggested stack** (builder may choose): React front end + a Supabase-style backend (Postgres, auth, storage). Hard requirements: PWA, offline-capable drill, persistence, an LLM integration.

---

## 3. Core concepts (glossary)

- **Unit** — any learnable thing, with its own 0–100% mastery scale. Two kinds: **topics** (learner-chosen — "order coffee") and **structure units** (auto-summoned by topics — "count," "read hiragana," "negate verbs"). Same data shape, same engine.
- **Hierarchy** — Parent taxonomy ("café") → **Chapter** / sub-topic ("barista talk") → content (words, phrases, scenarios). The **chapter is the working unit**.
- **Scaffold** — per-word script support on a ladder: `romaji → kana → kanji+furigana → kanji`. Set per word, per learner, per direction; adjusts automatically.
- **Scenario** — an AI-generated situation exercising several words together, at a **naturalness level** (slow/simple → fast/native-pace).
- **Engine** — the adaptive scheduler that decides what the learner sees next and how hard it is.
- **Scales** — progress readouts at three tiers: chapter %, topic %, and overall **proficiency** (JLPT band estimate).
- **Episode** — a short intensive interaction the learner pops into from the checklist: Introduce, Drill, Scenario, or Voice capture.

---

## 4. Screens

### 4.1 Onboarding (first run only)
- **Purpose:** capture the one-time script **intention**.
- **Components:** a slider with 4 stops — romaji / kana / furigana / kanji ("how do you want to read Japanese?"); one optional free-text field ("what do you want to learn?").
- **Behaviour:** the slider sets a starting default only — low-stakes, the engine corrects from real performance. Defaults to romaji if skipped. → Home.

### 4.2 Home
- **Purpose:** hub. Start or resume learning.
- **Components:** (a) a natural-language **intent input** ("what do you want to study?" — text, with optional voice input); (b) a list of the learner's adopted **units**, each with its mastery scale (e.g. "café — 60%"); (c) the **proficiency readout** (JLPT band) — shown for committed learners, hidden by default for casual learners.
- **Interactions:** typing/speaking intent starts or resumes a session; tapping a unit opens its Chapter view. A request for a topic that does not exist triggers authoring of it (§6.3).

### 4.3 Chapter view — the core screen
- **Purpose:** the spine of learning. Work through a chapter.
- **Components:** an ordered **checklist** — the chapter's steps (e.g. greet → order → specify → pay), each marked done / not-done; the chapter's scale (%); a natural-language intent input alongside.
- **Interactions:** the engine highlights the next step; tapping it launches the relevant **episode** (§4.4–4.7). On return from an episode the checklist updates. Leaving mid-chapter is non-destructive — state is saved; the checklist is the resume point.

### 4.4 Episode — Introduce
- **Purpose:** first encounter with a new word. Once per word.
- **Components (full-screen, rich media):** audio (auto-plays first), contextual image, contextual phrase, two short video clips (4–8s, auto-advance, replayable, skippable), one one-tap "predict the meaning" beat.
- A word the learner already knows is detected and skips this.

### 4.5 Episode — Drill
- **Purpose:** rapid repetition. The everyday loop.
- **Components (stripped, fast — no media):** a prompt (English or Japanese; **bilateral** — both directions), an input (type, or tap-to-select), instant pass/fail, next.
- **Rules:** spreadsheet-fast, instant response. Forgiving input matching (accept near-misses). No time pressure. A self-grade override ("I knew that") corrects a typo-driven fail.

### 4.6 Episode — Scenario
- **Purpose:** build and prove fluency. Words used in context.
- **Components:** a small visual situation — scene image, character(s), dialogue, audio. The learner responds (select / type / speak); the response affects what follows.
- Media-rich but quick. Scene visuals reuse pinned per-topic assets; only the dialogue is freshly generated. Fluency is tested on **fresh, unseen** scenarios.

### 4.7 Episode — Voice capture
- **Purpose:** spoken production.
- **Components:** a **voice-message** control — hold-to-record, release, send; re-recordable; no live timer. The app scores it **compare-to-correct** against a reference.

### 4.8 Progress
- **Purpose:** "where am I." Honest, factual.
- **Components:** the three scale tiers — chapter scales, topic scales, the JLPT proficiency estimate. No celebration, no streaks. Reads as position only.

### 4.9 Authoring (desktop)
- **Purpose:** create or grow a topic.
- **Components:** a chat/text prompt ("build a topic about X"); a view of the generated topic that the author can lightly adjust.
- **Behaviour:** the author seeds one rough idea; the system generates and **organises** the hierarchy (clusters, parents, splits, relabels) automatically. The author never builds the tree manually.

---

## 5. Core flows

**Onboarding:** open app → set script-intention slider → (optional) type a first goal → Home.

**Daily learning:** Home → type or speak intent ("study barista talk") *or* tap a unit → Chapter view → work down the checklist, popping into episodes → leave anytime (state saved) → return later; the engine front-loads weak/due items, the checklist shows where you were.

**New topic:** type a topic that does not exist → system authors it (generates content, organises it) → learner drops into the chapter's first checklist items (familiarisation).

**Expansion:** a chapter's checklist reaches 100% → the system offers the next chapter under the parent (it inherits shared vocabulary), or re-enters the same chapter at higher naturalness.

---

## 6. Data model

Entities and key fields (a builder may map these to tables):

**User** — `id`, `script_intention` (romaji/kana/furigana/kanji), `created_at`.

**Unit** — `id`, `name`, `kind` (topic | structure), `role` (chosen | summoned), `scope` (terminal | cross-cutting), `learning_pattern` (A | B | C | D), `parent_unit_id` (nullable — a chapter points to its parent taxonomy), `level_count`.
- Learning patterns: A = closed set (kana); B = rule+exceptions (counting, time); C = rule-in-production (grammar, particles); D = open contextual (topics).

**Word** — `id`, `canonical_form`, `hiragana`, `katakana`, `kanji`, `romaji`, `senses[]`, `grammatical_forms`, `example_sentences[]`, `complexity_level`. One canonical record per word — never duplicated.

**WordUnitLink** — `word_id`, `unit_id`, `sense`, `relationship_tag` (role within the chapter — drink / size / modifier / transaction / register), `contextual_image`, `contextual_phrase`, `audio`, `complexity_in_unit`.

**Scenario** — `id`, `unit_id`, `naturalness_level`, `content` (situation + dialogue), `word_ids[]`, `media_refs[]`.

**Media** — `id`, `type` (image | video | audio), `cache_key` (word + unit + sense), `url`, `style_ref`. Generated once, shared across all users.

**UserProgress** (per user, private) —
- per word: `scaffold_state` (per direction: EN→JP, JP→EN), `srs_state` (FSRS fields: stability, difficulty, due date).
- per unit: `mastery_pct`, `checklist_position`.
- adopted units list.

Architecture: **shared content layer** (units, words, links, scenarios, media — built once, shared) + **per-user layer** (UserProgress — private). *Shared content, private progress.*

---

## 7. The engine (application logic)

The engine decides what the learner sees next. Roughly **80% deterministic ML, 20% LLM**.

- **Scheduler (ML, no LLM):** an FSRS-style spaced-repetition model predicts per-word recall probability from review history. Deterministic, instant, offline-capable.
- **Pattern diagnosis:** periodically clusters failures by tag (e.g. "weak on counters," "production weaker than recognition") to find systematic gaps.
- **Generation (LLM):** generates scenarios, phrases, and probe items; scores open-ended spoken/typed answers; writes diagnoses in plain language.
- **Session composition:** balances three pools every session — **new** (introduce), **weak** (remediate), **due** (maintain). It schedules **scenarios, not isolated flashcards** — it picks a cluster of words that is *mostly-due and related* (via `relationship_tag`) and the LLM weaves one coherent scenario around them.
- **Start simple, adapt the rate:** every learner starts simple; the engine reads ability from how fast they clear material and layers complexity just above current ability (i+1). No placement test.
- **Per-word scaffold:** on failure, drop a word one step toward more support; on proven (spaced) success, raise it one step. Per word, never global.
- **Guarantee:** the engine has no give-up state — it adjusts until the learner's target is met.

---

## 8. Content Generation & Caching

### 8.1 Generation pipeline

Video and scenario generation is slow and expensive. It runs as a background pipeline — never blocking a learner.

- **Enqueued at topic creation.** The moment a topic's words and scenarios are defined, the generation job starts, server-side. By the time any learner reaches the content, it is ready.
- **Generated in learning order.** Chapter 1, core words, opening scenarios first; depth later. The pipeline needs only to stay *ahead* of the fastest learner (learners move at human speed), not finish instantly.
- **Eager entry slice, lazy depth.** Eagerly generate the entry slice (where cold-start bites — bounded); generate deeper content lazily, as a topic shows real usage. Avoids spend on topics that get no use.
- **Generated once, shared.** Media is persisted and reused by every learner (requirements.md §7.4–7.5), keyed to word + context — so emergent reorganisation never invalidates it. A request is matched semantically against the existing library first; new generation happens only on a genuine gap.
- **Cold-start fallback.** If a learner reaches a topic before its video exists, that pass runs on images only — cheap, instant; video appears on a later visit. Never a spinner.

### 8.2 Caching & the no-wait guarantee

Principle: **heavy loading runs in parallel with the fast loop, never in series with a click.**

- A session's media need is small and specific — Introduce clips for the session's *new* words only (~5–8, shown once each) plus assets for the scheduled scenarios. Review needs no media. Not the whole topic, not "everything."
- At session start the app **pre-fetches that whole slice** as one batch into the browser cache.
- The session opens with the **media-free Drill** — instant, client-side. It is the loading window.
- **Media episodes are gated on their assets being local.** The engine never shows an Introduce or Scenario episode until its media is fully cached; until then it keeps the learner in the Drill (a deep, instant review buffer). The Drill stretches to cover loading — the learner is never idle, never on a spinner.
- Drill content is tiny (text + SRS state): pre-loaded fully, runs entirely client-side and **offline**. Answers buffer locally and **sync in the background**. The FSRS scheduler is light math — it runs in-browser.

---

## 9. MVP scope

**In v1:**
- Screens: Onboarding, Home, Chapter view, the four Episodes, Progress. Authoring may be minimal or seeded.
- The adaptive engine: FSRS-style scheduler + scenario generation + per-word scaffold + start-simple ramp.
- Topics: a small set of seed topics, and/or the chat-to-author flow.
- Two readouts: topic mastery and JLPT proficiency estimate.
- Bilateral testing (EN→JP and JP→EN).
- Practice modalities: typing, tap-select, speaking (voice capture).

**Deferred (do not block v1):** pitch-accent pronunciation scoring (start with recognition-match); exact JLPT band-gate thresholds; refined authoring tools.

---

## 10. Non-negotiable constraints

- **No handwriting.** Production is typing, tap-selecting, or speaking only. Handwriting is never required.
- **Instrument, not a voice.** No streaks, points, badges, mascots, confetti, or cheerleading copy. The app states facts ("you are here"). Progress is shown plainly; correction happens quietly.
- **The drill must be spreadsheet-fast** — instant prompt → answer → result → next. Friction here breaks the product.
- **Measurable against external standards** — progress maps to JLPT / CEFR-J, not a custom scale.
- **No learner levels or buckets.** The learner is never labelled "beginner/intermediate/advanced." Ability is read continuously from performance; the per-word scaffold and the scales are the only "level" anywhere.
- **Complexity behind glass** — the data model and engine are rich; the learner-facing screens stay simple.

---

## 11. Open items (flag for the builder; not blockers)

- **Long-absence re-entry** — a learner returning after weeks must see "refresh," not "start over."
- **Fresh-chapter cold start** — a brand-new AI-authored chapter's first version is the roughest; it improves as it is used.
- **Over-large chapters** — a chapter whose checklist grows too long must auto-split into sub-chapters.
- **"Fail" event definition** — exact rules for what registers as a failure in the drill across typed / tapped / spoken input.
