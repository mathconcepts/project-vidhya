---
id: definite-integrals.exam_pattern
concept_id: definite-integrals
atom_type: exam_pattern
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions** typically give a definite integral requiring one clean technique — substitution, a standard antiderivative, or a symmetry shortcut — and ask for a decimal or exact numeric value, often a fraction or a simple multiple of $\ln 2$, $\pi$, or $e$.
- **MCQ questions** commonly test the properties directly: which of four candidate values equals $\int_a^b f\,dx$ given additivity, linearity, or an odd/even shortcut, without requiring a full antiderivative.
- **MSQ questions** may ask which of several stated integral identities are valid in general — mixing a true property (additivity, for any $c$) with a false one (treating $\int_{-a}^a f\,dx=0$ for a function that is not actually odd).

**Worked numeric pattern.** $\int_0^\pi \sin x\,dx=[-\cos x]_0^\pi=(-\cos\pi)-(-\cos 0)=1+1=2$ — a typical one-line NAT setup with a clean integer answer.

**Time budget.** Roughly $1$–$2$ minutes once the antiderivative is standard; longer only if a substitution or a by-parts step is needed first.
