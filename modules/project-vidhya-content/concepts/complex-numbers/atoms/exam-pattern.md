---
id: complex-numbers.exam-pattern
concept_id: complex-numbers
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions want one real number out of a complex computation** — a modulus, an argument in a specified range, or a single real/imaginary part after simplifying. They rarely want the fully expanded $a+bi$ as the final reported value.

  Example: "find $|z|$ where $z=(1+i)^6$." Rather than expanding $(1+i)^6$ term by term, convert first: $1+i=\sqrt2\,e^{i\pi/4}$, so $|z|=(\sqrt2)^6=8$ — read off directly, no expansion needed.

- **MCQ/MSQ "which of the following is true" questions test standard identities**, not computation:
  - $|z_1z_2|=|z_1||z_2|$ and $\arg(z_1z_2)=\arg z_1+\arg z_2$ (mod $2\pi$).
  - $z\bar z=|z|^2$, always real and non-negative.
  - The $n$th roots of any nonzero number are equally spaced around a circle — a common distractor claims they cluster instead.

- **De Moivre / roots-of-unity questions are a pattern, not a one-off**: convert to polar, apply $z^n=r^ne^{in\theta}$ or take the $n$th root formula $r^{1/n}e^{i(\theta+2k\pi)/n}$, and expect $n$ distinct answers for an $n$th root, not one.

- **Time budget:** a modulus/argument or one De Moivre power/root, once in polar form, should cost under 60 seconds. If the algebra is still running past that with real numbers stacking up, the conversion to polar form was likely skipped.
