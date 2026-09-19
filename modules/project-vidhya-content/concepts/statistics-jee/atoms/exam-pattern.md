---
id: statistics-jee.exam-pattern
concept_id: statistics-jee
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How JEE actually asks this.**

- **NAT: variance or standard deviation of grouped data,** almost always solvable fastest by the step-deviation method rather than direct deviations from the true mean.

- **MCQ: variance under a linear transformation.** $\text{Var}(aX+b)=a^2\text{Var}(X)$ — a shift never changes variance, a scale changes it by the square of the scale factor.

- **Trap: $N$ vs $N-1$ in the denominator.** This syllabus always uses $N$. Seeing $N-1$ anywhere in a JEE-level variance question is a signal to re-read the question, not to switch formulas.

- **NAT: comparing two datasets' consistency using coefficient of variation.** State both CVs and say which is smaller — that is the entire answer; do not stop at computing the standard deviations alone.

- **MCQ: median or mode of grouped data.** Identify the correct class first (the one containing the $N/2$-th observation for median, or the one with the highest frequency for mode) before plugging into either formula — using the wrong class number gives a plausible but wrong result.

- **Time budget:** under $2$ minutes for a full grouped-data variance computation via step-deviation; under $45$ seconds for a pure property question (like the $\text{Var}(aX+b)$ identity).
