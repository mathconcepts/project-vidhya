---
id: laplace-applications.exam-pattern
concept_id: laplace-applications
atom_type: exam_pattern
bloom_level: 2
difficulty: 0.35
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT (numeric answer):** set up a circuit or mechanical ODE from a stated $R$, $L$, $C$ (or spring/damper) and initial conditions, then ask for the response at a specific time, or for the steady-state value directly. Example: for $Y(s)=\dfrac{10}{s(s+5)}$, find $\lim_{t\to\infty}y(t)$ without inverting — the final-value theorem gives $\lim_{s\to0}sY(s) = \dfrac{10}{5} = 2$ in one line.
- **MCQ:** given a circuit description, match it to the correct transformed equation $Y(s)$ before any inversion — testing whether you can write the s-domain KVL/KCL equation, not just invert one.
- **MSQ:** identify which conditions must hold for the final-value theorem to apply (all poles of $sY(s)$ strictly in the left half-plane) versus which candidate $Y(s)$ options violate that (a pole at the origin or in the right half-plane).

**Time budget:** writing the physical equation and transforming it should take about a minute; solving and inverting the resulting rational $Y(s)$ typically costs two to three minutes depending on the denominator's degree. A final-value-theorem check, when it applies, costs seconds and is worth running before submitting an answer.
