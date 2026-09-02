---
id: continuous-distributions.exam-pattern
concept_id: continuous-distributions
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions on Normal distributions give $\mu$, $\sigma$ (or variance), and an interval, and expect a probability computed via $z$-scores and a standard-normal table.** Standardize both endpoints before looking anything up, and watch the sign on $\Phi(-z)=1-\Phi(z)$.

  Example: $X\sim N(50,100)$, $P(40<X<70)=\Phi(2)-\Phi(-1)=0.9772-0.1587=0.8186$.

- **MCQ "which property applies" questions test memorylessness specifically** — a question phrased as "given a component has already survived $t$ years…" is testing whether you apply the memoryless shortcut only to Exponential, never to Normal, Uniform, or general Gamma.

- **NAT questions on Exponential/Gamma often ask for $P(X>t)$ or $E[X]$ directly** from the rate $\lambda$ — $E[X]=1/\lambda$ for Exponential, $k/\lambda$ for Gamma with shape $k$.

- **Time budget:** a standard-normal interval probability with two given endpoints should take under 90 seconds once both $z$-scores are written down; most of that time should be the table lookup, not the standardization arithmetic.
