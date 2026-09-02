---
id: improper-integrals.exam_pattern
concept_id: improper-integrals
atom_type: exam_pattern
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **MCQ questions** commonly ask you to classify a single improper integral as convergent or divergent, often disguised inside a larger expression so spotting the singularity is the actual task.
- **NAT questions** ask for the numeric value of a convergent improper integral — usually a clean fraction or integer once the limit is taken.
- **MSQ questions** may list several integrals sharing a parameter $p$ and ask which converge, deliberately mixing a Type I case (needs $p>1$) with a Type II case (needs $p<1$) so the direction has to be checked separately for each one.

**Worked numeric pattern.** Classify $\int_1^\infty x^{-1.5}\,dx$: $p=1.5>1$, so it converges, to $\frac{1}{p-1}=2$.

**Time budget.** About $2$–$3$ minutes: locate the singularity, decide Type I or Type II, then apply the correctly-directed $p$-test or take the limit directly.
