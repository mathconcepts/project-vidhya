---
# Alternative body for sequences.hook, served when the learner stance is
# `assured` — a student who already trusts the arithmetic. Spends its
# words on the one distinction that costs marks instead of re-teaching.
id: sequences.hook.assured
concept_id: sequences
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: sequences.hook
for_stance: assured
---

$a_n=\dfrac{2n+1}{n}\to 2$ — the arithmetic isn't in question. The distinction GATE actually tests: **bounded is necessary for convergence, never sufficient.** $a_n=(-1)^n$ is bounded between $-1$ and $1$ forever, and it never converges — it just alternates. Monotonic **and** bounded together *is* sufficient (the Monotone Convergence Theorem), which is why that pairing — not boundedness alone — is the real tool for proving a limit exists without computing it first. A sequence can also diverge by oscillating rather than by blowing up to infinity; don't read "bounded" as a synonym for "well-behaved."
