---
id: functions-combinatorics.mnemonic
concept_id: functions-combinatorics
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Order? Use P. No order? Use C."** — the one-line filter for every counting problem: if swapping two chosen elements would count as a different outcome, it's $P(n,k)$; if not, it's $\binom{n}{k}$.

**For onto-counting, remember "add, subtract, add" (inclusion-exclusion's alternating signs):** start from the total, subtract the single-box-missing cases, add back the two-boxes-missing cases (they were subtracted twice), and so on — the sign flips every term.

**Sanity-check reflex:** $\binom{n}{k}$ must equal $\binom{n}{n-k}$. If a computed value breaks that symmetry, recompute — the formula was applied backward somewhere.
