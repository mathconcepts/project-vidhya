---
id: probability-jee.mnemonic
concept_id: probability-jee
atom_type: mnemonic
bloom_level: 2
difficulty: 0.0
exam_ids: ["*"]
modality: mnemonic
---

**"Prior times likelihood, then normalise."** Bayes' theorem is that one sentence, written out twice. The numerator is $P(E_1)\times P(A|E_1)$ — your starting belief about $E_1$, weighted by how likely $A$ is UNDER $E_1$. The denominator is the SAME kind of product, added up across every possible $E_j$ — it just rescales the numerator so every posterior across all the $E_i$ adds up to $1$. If you ever forget the symbols, rebuild the formula from this one sentence instead of trying to recall it by rote.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Bayes' theorem live: drag the prior and the two likelihoods",
  "why": "Drag the prior and the two likelihoods and watch the posterior update live. It depends on all three together, not just the strength of the evidence - a rare enough A stays unlikely even with a reliable test.",
  "inputs": [
    {"id": "pA", "label": "prior: P(A)", "min": 0.05, "max": 0.95, "step": 0.05, "initial": 0.3},
    {"id": "pBA", "label": "likelihood: P(B given A)", "min": 0.05, "max": 1, "step": 0.05, "initial": 0.9},
    {"id": "pBnA", "label": "likelihood: P(B given not A)", "min": 0.05, "max": 1, "step": 0.05, "initial": 0.1}
  ],
  "outputs": [
    {"label": "P(not A)", "formula": "1 - pA", "digits": 2},
    {"label": "P(B) - total probability", "formula": "pA*pBA + (1 - pA)*pBnA", "digits": 3},
    {"label": "P(A given B) - the posterior", "formula": "(pA*pBA) / (pA*pBA + (1 - pA)*pBnA)", "digits": 2}
  ],
  "caption": "At the default numbers (prior 0.30, hit rate 0.90, false-alarm rate 0.10): P(B)=0.34 and P(A given B) is about 0.79. Check by hand: (0.30 times 0.90) divided by 0.34. Now drag the prior down towards 0.05 and watch the posterior fall sharply, even though the two likelihoods never changed."
}
```
