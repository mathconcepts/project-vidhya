---
id: chain-rule.mnemonic
concept_id: chain-rule
atom_type: mnemonic
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
modality: mnemonic
---

**Outside-Inside, then multiply.** Differentiate the outside layer first, leaving the inside untouched inside it — then multiply by the derivative of what's inside. Two motions, always in that order: peel, then multiply.

**Worked micro-example:** $\dfrac{d}{dx}\cos(5x)$. Outside is $\cos(\cdot)$, differentiating to $-\sin(\cdot)$ with the inside left alone: $-\sin(5x)$. Inside is $5x$, differentiating to $5$. Multiply: $\dfrac{d}{dx}\cos(5x) = -5\sin(5x)$.

**Counting the layers.** Before differentiating, name the layers out loud from outside in — "$\cos$ of ($5x$)" is two layers, "$\ln$ of $\sin$ of ($x^2$)" is three. Each named layer earns exactly one multiplied factor; missing a layer in the count is the surest way to miss a factor in the answer.

**Sanity-check reflex:** count the multiplied factors in your final answer and compare to the number of layers you named — they must match, one for one.
