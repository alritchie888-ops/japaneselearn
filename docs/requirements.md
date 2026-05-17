# Japanese Learning App — MVP Requirements Specification

*Status: requirements phase complete. This document is the agreed reference, refined as needed during Stage-1 prototyping.*

---

## 1. Purpose & Vision

A Japanese-language learning application built around a single conviction: **vocabulary learned without context is too difficult, and context is what makes learning stick.**

The app teaches Japanese through **taxonomies** — concrete real-world topics the learner chooses (ordering sushi, learning to drive, negotiating a contract). For each topic, the system builds a complete domain vocabulary and the phrases that go with it, ordered from simple to complex, expanding as the learner gains mastery. The goal is *comprehensive comprehension within a topic* rather than scattered word knowledge.

The taxonomy method is not a personal workaround. It generalizes: a context-first, topic-organized approach is a strong method for any learner on any subject. The app therefore has value beyond its first user.

> Note on terminology: "taxonomy" is the internal/spec term for a topic unit; the learner-facing label is **"Topic."**

---

## 2. Core Constraints & Design Principles

These govern every decision below. Where a later requirement and a principle conflict, the principle wins.

**2.1 Dysgraphia is the central design constraint.** Dysgraphia affects *written output* — handwriting, spelling, organizing thought into written form. It does not affect listening, recognition, reading comprehension, or speaking. Therefore: **all learning routes through the intact channels (listening, recognition, reading, speaking), and handwriting is never a gate.** Written production means typing or selecting — never handwriting.

**2.2 Context-first.** Context-free vocabulary learning is too hard. The taxonomy exists to supply context, and this is non-negotiable.

**2.3 Fast and simple.** The learner-facing experience must stay as fast and frictionless as a bare spreadsheet drill: a prompt, an answer, repeat. Minimal clutter, instant response.

**2.4 Measurability.** Proficiency, mastery, and progress must all be measurable against recognized education standards. The app must always be able to answer "where am I" with a real number.

**2.5 Complexity behind glass.** The data model may be as rich as it needs to be; the *learner's experience* must stay simple. Richness lives in the back end. The two must never be conflated — the framework becomes a problem only if its complexity leaks onto the screen.

---

## 3. Scope

**3.1 Target user (MVP):** English speakers learning Japanese. Single learner population, single content direction — English is the known language, Japanese the target. The MVP does **not** also teach English to Japanese natives.

**3.2 Learning direction:** EN→JP is the primary, production-heavy direction. JP→EN is the secondary recognition direction. Testing is **bidirectional** — the learner may be prompted in either direction (matching the proven spreadsheet method: a character *or* an English word, in random order).

**3.3 Platform:** Web application delivered as a **PWA** (Progressive Web App) — one codebase, runs in the browser, installable on phone and desktop, no app store. Two surfaces: the **laptop/web surface is for authoring** content (creating topics, building vocabulary); the **mobile surface is for learning**. The fast text-based drill loop should remain available offline; media generation and first-introduction require a network connection.

**3.4 Explicitly out of scope:** Handwriting kanji. Production is typing / selecting / speaking only.

**3.5 Deferred decisions** (do not block the MVP build — see Appendix): concrete numeric thresholds for JLPT band gates; depth of pronunciation scoring.

---

## 4. Writing Systems

Japanese has three scripts: hiragana, katakana, and kanji. Romaji (Latin letters) is a temporary scaffold, never the target — see §4.1.

- **Hiragana first, then katakana** — the foundational first phases, learned before topical content begins in earnest.
- **Kanji is withheld** until the learner reaches a proficient level, then introduced gradually.
- **Kanji-unlock trigger:** mastery of both kana sets — every hiragana and katakana character "locked" in the app's spaced-repetition system. This is the pre-N5 → N5 boundary, the point where standardized Japanese study begins, and the app measures it directly.
- **Kanji is then introduced in JLPT bands**, each gated by demonstrated mastery of the previous band: N5 (~100 kanji), N4 (~300 cumulative), N3 (~650), N2 (~1,000), N1 (~2,000+). The per-band lists use the well-established community-standard reference lists derived from the JLPT.
- **Rendering rule:** every word stores all its script forms; the app renders only the form appropriate to the learner's level. Kanji is stored but hidden until the kanji-unlock trigger, then surfaces progressively. The form shown in the beginner phase follows the script scaffold below.

### 4.1 Beginner script scaffold

*This revises the original "kana only, never romaji" rendering rule.* A true zero-knowledge learner cannot read kana on day one, so the first phase of a topic uses **romaji as a temporary, fading scaffold** — never a permanent crutch, never the target. The word's English meaning stays constant; the script support fades across three stages:

- **Stage a** — English meaning + romaji
- **Stage b** — English meaning + romaji + kana
- **Stage c** — English meaning + kana (romaji removed)

Romaji appears only in stages a and b and is gone by stage c. The learner's current stage is gated by their **kana mastery from the Structure track**: as the Structure track teaches hiragana and katakana, the Topic track drops the romaji scaffold in lockstep. A learner who already reads kana starts at stage c and never sees romaji — stages a and b are shown as skippable, with the learner's level visible.

Kanji is absent from all three stages. "Kana" means hiragana and katakana only; kanji is a separate script, withheld entirely until the kanji-unlock trigger above. The principle is preserved — romaji is never the target and never permanent — but made implementable for a learner starting from zero.

---

## 5. Learning Architecture: Two Parallel Tracks

Learning is compartmentalized into two tracks that run **in parallel**, not in sequence:

- **Structure track** — the systematic, generative layer: the kana foundation, numbers, counters, time, the calendar, grammar patterns, particles. This is the *transfer substrate*.
- **Taxonomy track** — the topical, can-do domains: ordering sushi, driving, contracts.

Running them in parallel is deliberate. A strict "finish all structure first" gate would force weeks of grammar drilling before the learner touches anything they care about; a taxonomy-only approach would lack the transfer layer. Parallel tracks give both at once — immediate progress on a wanted topic *while* the structural substrate builds underneath it.

The tracks feed each other and intersect: the structure track supplies grammar and numbers; the taxonomy track supplies the context in which to use them. (See §6.2 — systematic sets are familiarized standalone in the structure track, then *used* inside taxonomies.) The romaji scaffold of §4.1 is one concrete intersection: Structure-track kana mastery directly controls how much script support the Topic track shows.

**Compartmentalize the lanes; interleave inside each lane.** The learner always knows whether a session is a structure session or a taxonomy session. Interleaving (mixing items, see §11) happens *within* a track, not across the two.

---

## 6. Content Model: Two Category Types

**6.1 Topical taxonomies.** User-chosen topics, media-rich. The system builds a complete domain vocabulary plus relevant phrases, ordered simple → complex. A taxonomy expands as the learner masters it — deeper vocabulary, harder phrasing — so comprehension of the topic becomes comprehensive. A taxonomy is, in effect, a "can-do" competency (see §12).

**6.2 Systematic sets.** Foundational, cross-cutting, rule-based vocabulary: numbers (both the native and Sino-Japanese systems), counters/classifiers, time, calendar (days, months, days-of-month, years, seasons), relative time, money and quantities, measurements, directions and positions, colors, family terms, question words and demonstratives, and grammar patterns/particles.

Systematic sets differ fundamentally from topical vocabulary:

- **They are cross-cutting.** Numbers appear in every topic; they cannot belong to one taxonomy.
- **They are generative, not rote.** The learner learns the *pattern*, then can produce all members — so they are taught as *rule + exceptions*, with media used lightly. Japanese has real irregularities worth targeting directly (days of the month 1–10, counter sound changes, time exceptions).
- **They are taught in two stages:** (1) *familiarization* — the standard system learned standalone in the structure track; (2) *usage* — applied inside the topical taxonomies, which is where the irregularities bite and where it becomes usable.

Systematic sets are not a side category. They are **the transfer layer that makes taxonomy mastery add up to general proficiency** (see §12). Taxonomies alone are islands; taxonomies plus a strong systematic layer generalize.

---

## 7. Data Model

**7.1 The word record.** A word is a **single canonical record** — never duplicated. Context, not duplication, carries meaning. Attributes:

- canonical form
- script forms (hiragana / katakana / kanji as applicable) — plus the romaji reading used by the §4.1 scaffold
- senses — multiple meanings; the same word is one word, and context determines which sense applies
- grammatical forms — positive form, negative form, standard conventional uses — shown through concrete example sentences, not abstract rules
- example sentences (demonstrating grammar and use)
- taxonomy links (which topics the word belongs to)
- complexity level
- scheduling fields (spaced-repetition state; see §8.3)
- first-contact drill count (massed repetition before the word enters the spaced queue)

**7.2 The word↔taxonomy link.** Because the same word means and looks different across contexts, the *contextual* layer hangs off the link between a word and a taxonomy (and, where senses differ, the sense) — not off the bare word record. The link carries:

- contextual image (tied to the taxonomy)
- contextual phrase (using the word in that taxonomy)
- video of the word in the taxonomy
- video of the word in use in the taxonomy
- audio
- complexity level within that taxonomy

**7.3 Generated media — stored and shared.** All AI-generated media (images, the two videos, audio) is **persisted and reused**, not regenerated per learner. The first learner to reach a word triggers generation; every learner afterward reuses it. The media library grows once, and the system becomes cheaper and richer the more it is used. Practical notes: images are cheap and generated on demand; videos are expensive and pre-generated in batches per taxonomy and cached; a consistent visual style is pinned per taxonomy so each topic feels coherent. The cache key is **word + taxonomy (+ sense)** — so reuse is shared but never context-wrong.

**7.4 User model.** Each user has their own account, holding private progress: spaced-repetition schedule, mastery levels, writing-system level (kana/kanji unlock state), and adopted taxonomies. **Sharing words and taxonomies between users is encouraged** — a built-out taxonomy can be adopted by anyone.

**7.5 Layered architecture.** The model splits into two layers:

- **Shared content layer** — word records, word↔taxonomy links, generated media, and the taxonomies themselves. Built once, shared, grows with use.
- **Per-user layer** — account, progress, spaced-repetition state, mastery percentages, adopted taxonomies, writing-system level.

The governing line: **the taxonomy content is shared; each user's progress through it is private.** ("Shared content, private progress.")

---

## 8. Learning Flow

Each word moves through a three-stage lifecycle. Familiarity gates stage 2; "locked" status gates stage 3.

**8.1 Stage 1 — Familiarize (the Recognition phase).** Visual learning carries this stage. For each word, presented within its taxonomy, in sequence:

1. **The word** — audio first. The learner *hears* the word before seeing it written (listening-first). The written form follows the script scaffold of §4.1.
2. **Contextual image** — the meaning anchor; instant, glanceable meaning.
3. **Contextual phrase** — the word in a minimal frame; it has neighbors.
4. **Video — the word in the taxonomy** — the word as a situated event, not a label.
5. **Video — the word in use** — a person using the word naturally; pronunciation modeling and grammar in the wild. This is the handoff to spoken practice (see §10.2).

One **active "predict" beat** is included even here — after the image, before the meaning is revealed, a one-tap "what do you think this means?" Pure passive watching is weak; a guess primes recall.

**8.2 Stage 2 — Lock in (the drill loop).** A fast loop, available only *after* familiarity (you cannot drill a word you have never met). The cycle: repeat → check results → re-test only the failed words → fold successful words back in and pull new ones in. Massed repetition does the initial encoding here. **Some typing** cements the word (see §10.1). The drill loop stays bare and fast.

**8.3 Stage 3 — Retain (spaced repetition).** Once a word is "locked," it enters a spaced-repetition queue. Review intervals expand on success and contract on failure, so review time concentrates on words that need it. Massed repetition handles encoding; spacing handles retention — the two are complementary, not rivals.

---

## 9. UI Modes

Two distinct modes resolve the tension between rich media and a fast, simple interface:

- **Introduce mode** — rich media, used once per word during familiarization. Short clips (4–8 seconds each), auto-advancing but always replayable and skippable. This is the only place richness is allowed.
- **Drill mode** — stripped down, fast, tap- and keyboard-quick, no media. This is the repeat-until-locked loop and the everyday experience; it must stay spreadsheet-simple.

---

## 10. Practice Modalities

**10.1 Typing.** Typing is a chosen production mode, kept deliberately despite dysgraphia — Japanese in real life is overwhelmingly typed, not handwritten. It is a **modest component, not the centerpiece**: visual learning carries familiarization; typing's specific job is *locking in*.

- *Stage 1 (early/now):* short, focused typing bursts, especially for recognition — actively good, low-fatigue.
- *Stage 2 (later, at higher proficiency):* listen-and-type (dictation) — the ideal exercise — eased in gradually, at a gentle pace.
- Within Japanese typing, the IME candidate-*selection* step is a recognition task (a strength); the effort is mostly romaji spelling, so that part is kept gentle.
- **The grading engine measures knowledge, not keystrokes.** Typing friction must never be logged as not knowing the word, or the scheduler starts measuring typing instead of knowledge. Therefore: forgiving input matching (accept near-misses), no time pressure on typed answers, and a self-grade override ("I knew that" overrides a typo-driven "wrong").

**10.2 Speaking.** Speaking is **in scope**. Spoken production with **compare-to-correct**: the learner speaks, the app captures the utterance and compares it against a correct reference. This formalizes the shadowing handoff from the "word in use" video, now with automated feedback. Speaking is an intact channel under the dysgraphia constraint, so it is a **primary production mode**, not an extra. (Implementation depth — simple recognition-match vs. pronunciation/pitch-accent scoring — is deferred; the MVP may start with recognition-match. See Appendix.)

---

## 11. Pedagogy Engine

A small set of evidence-based principles does the real work; engagement is a thin layer on top.

- **Spaced repetition** — expanding review intervals; the retention engine (§8.3).
- **Active recall / the testing effect** — retrieving an answer strengthens memory far more than re-reading or re-watching.
- **The recognition → production ladder** — "knowing" a word is not one thing. A word climbs five rungs: (1) recognition, (2) comprehension (recall meaning), (3) cued recall (produce the word from the meaning/image), (4) contextual use (place it correctly in a phrase), (5) free production (use it unprompted). A word graduates a topic only at the top. Production rungs are reached by typing, selecting, or speaking — never handwriting. Each testing direction (EN→JP, JP→EN) is a separate skill and is tracked separately.
- **Comprehensible input (i+1)** — input pitched just slightly above current level; the "simple → complex" taxonomy progression *is* this principle. Difficulty steps must be small.
- **Dual coding** — verbal plus visual beats verbal alone; the word → image → phrase → video sequence exploits this.
- **Interleaving** — mixing items within a session aids discrimination. Applied *within* a track (§5).

**Engagement is tied to learning outcomes, not activity.** Rewards attach to a word climbing the ladder and to topic mastery percentages — not to streaks or minutes. Letting the learner choose the topic is itself a strong, built-in motivator (autonomy).

---

## 12. Proficiency Model

"Proficiency" has two recognized definitions in Japanese-language education, and the app speaks to both:

- **The functional / can-do model** (CEFR-J, the Japan Foundation Standard) — proficiency as the set of real-world tasks one can accomplish. A taxonomy *is* a can-do competency, so the app's approach is a faithful instance of this model — not a degraded subset of anything.
- **The standardized test model** (JLPT, N5–N1) — proficiency as a measured inventory of vocabulary, kanji, grammar, and comprehension.

The app reports **two measurable readouts**, both computed from data the spaced-repetition system already tracks:

1. **Functional readout** — per-taxonomy mastery percentage (e.g. "ordering sushi: 85%"). The *useful* number: what the learner can actually do.
2. **Standardized readout** — a JLPT band estimate, by mapping the learner's locked words, kanji, and grammar against JLPT reference lists (e.g. "≈ N4"). The *comparable* number: externally meaningful.

The two are not rivals — one measures usefulness, the other measures against the external bar. JLPT bands also serve as the app's **universal difficulty scale**: the "simple → complex" complexity levels inside every taxonomy can be calibrated against JLPT bands, giving one coherent measure across the whole app.

Functional proficiency from taxonomy mastery is genuine **only if the structure track is real** — transfer (handling un-drilled situations) comes from the generative substrate of grammar and systematic sets. Taxonomies plus a strong structure track equal general proficiency; taxonomies without it equal a phrasebook.

The hard constraint on this whole model: **whatever shape proficiency takes, it must be measurable.**

---

## 13. MVP Summary — What v1 Is

A web/PWA Japanese-learning app for English speakers, organized around two parallel learning tracks (Structure and Taxonomy). Content is authored on the laptop/web surface and learned on mobile. The learner picks topics; the system generates a context-rich, JLPT-calibrated vocabulary and phrase set, stored as shared canonical word records with per-context media. Each word is familiarized through a short rich-media recognition sequence — the written form following the §4.1 romaji-to-kana scaffold — locked in through a fast drill loop with some typing, and retained through spaced repetition. Production is typing, selecting, and speaking — never handwriting. Kana is taught first; kanji is deferred until kana mastery, then introduced in JLPT bands. Progress is reported as both a functional (taxonomy mastery) and a standardized (JLPT band) number. The learner-facing experience stays spreadsheet-fast; all complexity lives behind glass. Accounts are per-user, and sharing taxonomies is encouraged.

---

## Appendix: Open Items & Deferred Decisions

These do not block the MVP build and can be settled when the relevant phase is reached.

- **Concrete JLPT band-gate thresholds** — the exact numeric criteria for advancing N5 → N4 → N3, etc. To be defined when the kanji phase is approached.
- **Pronunciation-scoring depth** — whether "compare-to-correct" speaking uses simple recognition-match or finer pronunciation/pitch-accent scoring. The MVP may begin with recognition-match.
- **Scaffold skip thresholds (§4.1)** — the exact kana-mastery levels at which stages a and b auto-skip. To be tuned during prototyping.

*Resolved during the requirements phase: handwriting kanji — out of scope; platform — web + PWA; MVP audience — English speakers learning Japanese; testing — bidirectional; proficiency standard — JLPT spine with a CEFR-J/JF-style functional readout. Refined during prototyping: §4.1 beginner script scaffold (romaji as a fading aid); laptop = authoring / mobile = learning surfaces.*
