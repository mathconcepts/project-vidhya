---
id: semiconductor-electronics.exam-pattern
concept_id: semiconductor-electronics
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
modality: text
---

**How JEE actually asks this.**

- **NAT: cutoff wavelength from a given band gap.** The moment a question states a material's band gap in eV and asks for a maximum detectable or emitted wavelength, apply $\lambda=1240/E_g$ (or $1240/\Delta E$ for a specific transition) directly — no intermediate frequency step needed.

- **MCQ: identifying majority carriers.** "Pentavalent impurity" always means n-type, electrons majority; "trivalent impurity" always means p-type, holes majority — these two words alone settle the whole question.

- **Trap: forward vs reverse bias direction.** A circuit diagram showing which terminal connects where is testing whether the p-side sits at the higher potential (forward, conducts) or the lower potential (reverse, blocks) — read the diagram's polarity before anything else.

- **Trap: smaller band gap "should" mean shorter wavelength.** $\lambda_{max}=1240/E_g$ is an inverse relationship — a smaller gap reaches a *longer* wavelength, not shorter. This trips up otherwise-correct arithmetic when the final comparison step is skipped.

- **Time budget:** a band-gap-to-wavelength NAT should take under $30$ seconds — one division, done.
