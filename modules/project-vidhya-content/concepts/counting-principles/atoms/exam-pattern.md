---
id: counting-principles.exam-pattern
concept_id: counting-principles
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions usually want a single number from a compound scenario** — a count with a stated constraint (a fixed seat, a forbidden pair, an "at least" condition). Read the constraint first and decide whether direct case-counting or the complement is the shorter route before writing any factorial.

  Example: choosing a 4-person team from 5 women and 4 men with at least 2 women — the complement (0 or 1 women, just 2 cases) is faster than the 3 direct cases, giving $126 - 1 - 20 = 105$.

- **MCQ/MSQ "which formula applies" questions test recognition, not computation.** Look for words that signal order (arrange, rank, sequence, code) versus no order (select, choose, form a team, distribute identical items).

- **Pigeonhole questions rarely ask you to count anything.** They ask you to prove a minimum guaranteed overlap exists — the answer is usually a "yes, because…" or a small integer like "at least 2," not a large computed count.

- **Time budget:** a clean counting problem with a single constraint should take under 90 seconds once you've identified P vs C vs complement. If you're enumerating cases by hand past two minutes, you likely picked the longer of two equivalent routes.
