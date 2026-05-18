# Japanese Learning App — Business Model

*Business requirements: market, pricing, the content economy, and phasing. Companion to [`requirements.md`](requirements.md) (product / design) and [`build-spec.md`](build-spec.md) (builder-facing). `requirements.md` governs product design; this document governs the business model.*

---

## 1. Summary

An outcome-based Japanese-learning platform. Learners declare a real-world can-do they want; the platform delivers it from a **shared content library**. Content is generated once and reused by everyone. As the model scales, content creation becomes a **creator economy**: anyone can pay to create a topic and earns a share when others use it.

The business rests on one structural fact: **generating content is expensive and one-time; reusing it is near-free.** Pricing, the library, and the creator economy all follow from that.

---

## 2. Market & segments

English speakers learning Japanese (MVP scope — see requirements.md §3). Two segments, served by one product:

- **Casual / holiday learner** — wants a few topics (greetings, ordering, politeness for a trip). Needs only the functional readout (topic mastery). Proficiency is irrelevant and never surfaced.
- **Committed learner** — on a long path; wants real proficiency. Needs both readouts — topic mastery and the JLPT estimate.

One engine serves the whole spectrum — three phrases for a trip up to JLPT N1 — because the two readouts are separate and neither is forced on anyone (requirements.md §14).

---

## 3. Pricing — price tracks cost

The cost structure: **creation** (LLM scenario generation + video generation) is expensive and one-time per topic; **usage** (serving cached content) is near-free.

Pricing mirrors it:

- **Creation is priced high.** Requesting a topic that does not exist triggers expensive generation; that is charged.
- **Reuse is discounted.** Using content that already exists in the shared library costs little — there is nothing to generate.

How it is surfaced:

- **Meter creation, not learning.** Creation is a discrete, visible event ("build a new topic — costs X, takes a short time"). Usage is covered by something flat (a subscription). A live cost-meter must never run inside the learning loop — that is cost-anxiety, and it fights the calm, instrument-like experience (requirements.md §2.6).
- Cost decisions happen at the **request moment** (the chat intent surface), never mid-drill.

---

## 4. The shared content library

Every topic is created once and saved centrally; later learners reuse it.

- **Reuse before create.** A learner's request is matched against the existing library first. If the topic exists, the learner adopts it — no generation, instant, cheap.
- **Semantic matching.** Matching is by meaning, not literal words — "café," "coffee shop," "ordering a coffee," "barista" all route to the same content. The platform authors new content only on a genuine semantic gap.
- **Cost moat.** The more content exists, the more requests are cheap reuse, the lower the average cost-to-serve. **Unit economics improve with scale** — unusual for a content business, and a durable advantage.

---

## 5. The creator economy

As the platform scales, content creation opens up:

- **Pay to create.** A creator funds the generation of a new topic or chapter.
- **Share of usage.** The creator earns a share when other learners use that content.

This turns creation from a cost into an **investment**: fund generation once, earn as it is reused. It **crowdsources the library** — content scales via many creators, not only the platform — and it **aligns creators to quality**, because earnings track usage and good topics get used more.

This makes the product definitively a **platform / marketplace**, not a single-author app.

---

## 6. Hard parts

Creator economies have known failure modes. Three must be designed for:

- **Cold start.** A marketplace needs creators and users at once; early on there are few of each. The platform must **seed the initial library itself**, so early learners have content and early creators see a working market.
- **Quality & correctness.** Usage-share rewards *popular*, not *correct*. For a language app, wrong content is actively harmful — a learner learns bad Japanese. **Correctness validation is mandatory** — every shared topic must be checked to teach accurate Japanese (automated check, with native review where needed). A gate, not a nice-to-have.
- **Attribution.** "Share of usage" requires per-chapter **authorship tracking** and a split rule for multi-author topics (one parent taxonomy, chapters by different creators).

---

## 7. Success metric

Success is **goal completion** — did the learner achieve the can-do they chose. Measured by the two readouts: functional (topic mastery) and standardised (JLPT estimate). Not streaks, not minutes, not daily-active vanity metrics. The product's promise — *what the learner puts in, they get out* — is the thing measured.

---

## 8. Phasing

- **MVP** — platform-seeded content + the adaptive engine. No marketplace. Pricing may be a simple subscription. The creator economy is *off*.
- **Scale** — the creator economy turns on once there is enough usage to make creating worthwhile.
- **MVP requirement now:** record **authorship** on every unit from day one, so the usage-share is computable when the creator economy switches on. Building the marketplace later is fine; losing the authorship data is not.

---

## 9. Open items

- Concrete pricing — subscription tiers, the creation fee, the platform's cut of usage revenue. Not yet modelled.
- First-creator economics — the exact share schedule, and whether / how a creator's upfront cost is recouped.
- The correctness-validation mechanism — automated vs native review, and who bears its cost.
- Content moderation and governance for shared, user-generated topics.
