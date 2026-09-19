---
id: probability-jee.worked-example-assured
concept_id: probability-jee
atom_type: worked_example
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
variant_of: probability-jee.worked-example
for_stance: assured
---

The 3-machine setup ($25\%/35\%/40\%$ output, $5\%/4\%/2\%$ defect rates) gives $P(D)=0.0345$ and posteriors $0.362/0.406/0.232$ for A/B/C — Machine B, not the worse-defect-rate Machine A, is the top suspect. The step worth isolating is the FIRST one: checking $\sum P(E_i)=1$ before touching Bayes at all, since the theorem's denominator is only guaranteed to equal $P(D)$ when the $E_i$ genuinely partition the sample space.

If the given priors were instead $0.25,0.35,0.35$ (summing to $0.95$, a typo dropping $5\%$ of output unaccounted for), plugging blindly into Bayes still returns numbers — $P(A_1|D)=0.0125/0.0335\approx0.373$ — but this answer no longer means "probability given it's defective," because the sample space was never fully covered; some real chunk of output belongs to no named machine at all. The arithmetic cannot detect this failure; only checking the sum against $1$ before starting can.
