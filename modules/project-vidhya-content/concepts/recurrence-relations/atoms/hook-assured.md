---
# Alternative body for recurrence-relations.hook, stance `assured`.
id: recurrence-relations.hook.assured
concept_id: recurrence-relations
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: recurrence-relations.hook
for_stance: assured
---

$a_n=5a_{n-1}-6a_{n-2}$ with $a_0=2,a_1=5$ has closed form $a_n=2^n+3^n$ — check: $a_0=1+1=2$ ✓, $a_1=2+3=5$ ✓, $a_2=4+9=13$ ✓.

Unrolling the recurrence day-by-day to reach $a_{20}$ costs $20$ arithmetic steps and compounds sign slips; solving the characteristic equation once and evaluating the closed form at $n=20$ costs one exponentiation each of two terms. Whenever $n$ is large or symbolic, solve for the closed form — don't iterate.
