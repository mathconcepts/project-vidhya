---
id: chain-rule.exam-pattern
concept_id: chain-rule
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions evaluate the composite derivative at a specific point**, usually chosen so the trig or exponential piece simplifies cleanly rather than leaving an ugly decimal.

  Example: for $f(x) = \ln(\sin x)$, $f'(x) = \dfrac{\cos x}{\sin x} = \cot x$. At $x = \pi/4$, $\sin(\pi/4)=\cos(\pi/4)$, so $f'(\pi/4) = 1$ — a clean value that rewards recognizing the simplification rather than carrying decimals through.

- **MCQ options isolate one missing factor.** A typical distractor set has the correct answer alongside: the same expression with the inner derivative dropped entirely, the same expression with the inner derivative's constant multiplier missing, and the outer and inner functions swapped.

- **Multi-layer composites (three or more nested functions) appear specifically to test whether the chain is applied at every layer**, not just the outermost one — dropping a middle layer is the most common failure mode as the layer count grows.

- **Time budget:** a two-layer chain-rule evaluation should take under a minute; a three-layer one, up to ninety seconds — most of that time should go to correctly naming the layers, not to the arithmetic once they're named.
