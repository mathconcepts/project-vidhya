---
id: sampling-distributions.exam-pattern
concept_id: sampling-distributions
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions typically give $n$, $\bar{x}$, and either $\sigma$ or $s$, and ask for a standard error or a confidence-interval endpoint.** Example: $n=64$, $\sigma=16$ known $\Rightarrow SE=16/\sqrt{64}=16/8=2$ — a single division, no table lookup needed for the SE itself.

- **MCQ/MSQ "which distribution" questions test the $z$/$t$/$\chi^2$ triage directly:**
  - "$\sigma$ known, any $n$" → $Z$.
  - "$\sigma$ unknown, estimated by $s$" → $t_{n-1}$, whatever $n$ is.
  - "Testing or bounding the population variance" → $\chi^2_{n-1}$.
  - A frequent false option pairs "$n<30$" with "$t$" as if sample size alone were the trigger — the real trigger is always what's known about $\sigma$.

- **CLT-application questions give a skewed or unspecified population shape and ask what happens to $\bar{X}$'s distribution for large $n$.** The expected answer is always "approximately normal, mean $=\mu$, SE $=\sigma/\sqrt{n}$" — never "it inherits the population's skew."

- **A common numeric pattern asks you to compare two standard errors** (e.g., doubling $n$) to test whether the $\sqrt{n}$ scaling is understood: doubling $n$ shrinks $SE$ by a factor of $\sqrt{2}\approx1.41$, not by half.

- **Time budget:** a standard-error or CLT-approximation question should cost under a minute; a full $t$-based confidence interval (identify distribution, compute $SE$, apply critical value) is worth 2 minutes.
