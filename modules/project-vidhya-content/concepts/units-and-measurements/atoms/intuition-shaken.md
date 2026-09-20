---
id: units-and-measurements.intuition-shaken
concept_id: units-and-measurements
atom_type: intuition
variant_of: units-and-measurements.intuition
for_stance: shaken
bloom_level: 2
difficulty: 0.05
exam_ids: ["*"]
---

Take two lengths, measured on the same ruler: $l_1 = 12.3$ cm (one decimal place) and $l_2 = 1.234$ cm (three decimal places).

**Add them.** $12.3 + 1.234 = 13.534$ on a calculator. The **addition rule**: round to the *fewest decimal places* among the inputs — here, one. So the honest answer is $13.5$ cm, not $13.534$ cm.

**Now multiply the same two numbers instead.** $12.3 \times 1.234 = 15.1782$ on a calculator. The **multiplication rule** is different: round to the *fewest significant figures* among the inputs. $l_1$ has $3$ significant figures, $l_2$ has $4$; the smaller count wins, so the honest answer is $15.2$ (three significant figures) — a completely different rounding target from the addition case, even with the exact same two starting numbers.

**Error propagation follows the same split.** If two measured lengths are *added*, their absolute errors ($\Delta l_1+\Delta l_2$) simply add. If they are *multiplied* instead, it is the *relative* errors ($\Delta l_1/l_1$ and $\Delta l_2/l_2$) that add together. Check which operation is actually happening before reaching for either rule.

