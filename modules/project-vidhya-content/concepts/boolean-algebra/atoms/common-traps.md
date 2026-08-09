---
id: boolean-algebra.common-traps
concept_id: boolean-algebra
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Misapplying De Morgan's Laws**: Students often write $\overline{A + B} = \overline{A} + \overline{B}$ (incorrect—should be $\overline{A} \cdot \overline{B}$). **Mnemonic**: "When you negate a sum, you flip the operator AND negate the terms: $\overline{A + B} = \overline{A} \cdot \overline{B}$ (AND replaces OR). Same rule with AND/OR swapped." Always **break the line, change the sign** (negate each term and flip the operator).
- **Forgetting the complement law**: Students compute $X + X = X$ (correct, idempotence) but then assume $X + \overline{X} = \overline{X}$ (wrong—it's always 1). Similarly, $X \cdot X = X$ but $X \cdot \overline{X} = 0$ (always). **Double-check**: complementing a variable and ANDing/ORing it with the original always gives 0 or 1, not the variable itself.
- **Not fully simplifying**: Students stop after one or two factoring steps. Always apply idempotence, absorption, and consensus repeatedly until no further reduction is possible. Test your result against the original with a truth table for small examples.
