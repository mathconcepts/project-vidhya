---
id: numerical-error-analysis.exam-pattern
concept_id: numerical-error-analysis
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions** give a true and an approximate value and ask for absolute, relative, or percentage error to a stated precision — or the reverse, giving an error and asking for the original quantity.
- **MCQ questions** often test the propagation rule itself: "if $p$ and $q$ each carry a relative error of $1\%$, what is the relative error in $pq$?" (answer: about $2\%$, the two relative errors adding).
- **A frequent MCQ pattern:** "$x=3.14159$ rounded to $3.14$; find the percentage error" — worked exactly as $E_a=0.00159$, $E_r\approx0.000506$, $E_p\approx0.05\%$.
- **A frequent conceptual pattern:** distinguishing rounding error from truncation error by naming the source — a finite-digit representation versus a cut-short iterative or infinite process — rather than by the size of the error.

**Time budget:** a single error-measure computation is a 1–2 minute item; a two-quantity propagation question (sum or product) runs 2–3 minutes if the relative errors are computed before combining.
