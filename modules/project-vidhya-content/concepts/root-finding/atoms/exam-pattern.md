---
id: root-finding.exam-pattern
concept_id: root-finding
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions** typically give an equation and an initial guess, and ask for the value after $k$ Newton-Raphson (or bisection) iterations to a stated number of decimal places — the grading tolerance is usually $\pm0.01$ or $\pm0.001$, so carry at least one extra digit through every intermediate step.
- **MCQ questions** often test conceptual properties instead of raw computation: order of convergence of a named method, the condition under which Newton-Raphson fails, or which method needs no derivative.
- **A frequent MCQ pattern:** "Newton-Raphson is applied to $f(x)=x^2-4$ starting at $x_0=3$; what is $x_1$?" — a single-iteration check, worked exactly as: $f(3)=5$, $f'(3)=6$, $x_1=3-5/6=13/6\approx2.167$.
- **Multi-part questions** may ask you to first verify a bracket ($f(a)f(b)<0$) before applying bisection, then compare against Newton-Raphson's iteration count for the same tolerance — testing whether you can reason about convergence speed, not just execute a formula.

**Time budget:** a single-iteration NR or bisection question is a 1–2 minute item; a 3-iteration convergence-and-error question runs 3–4 minutes if the arithmetic is kept to four significant figures throughout.
