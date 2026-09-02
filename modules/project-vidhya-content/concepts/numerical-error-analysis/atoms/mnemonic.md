---
id: numerical-error-analysis.mnemonic
concept_id: numerical-error-analysis
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**The add-add rule.** Same operation family, same error rule: **+** or **−** on the quantities means **add** their absolute errors; **×** or **÷** on the quantities means **add** their relative errors instead. Two operation pairs, two "add"s — nothing ever multiplies or subtracts the errors themselves.

**Worked check:** $p=12.5\pm0.05$, $q=8.2\pm0.02$. Sum: $E_a(p+q)=0.05+0.02=0.07$. Product: $E_r(p)+E_r(q)=0.004+0.002439=0.006439$, converting to $E_a(pq)\approx0.66$ on $pq=102.5$.

**Sanity-check reflex:** before combining two error bounds, name the operation first — "+/− → add absolutes" or "×/÷ → add relatives" — then compute. Reaching for the wrong error type is the single most common slip in this topic.
