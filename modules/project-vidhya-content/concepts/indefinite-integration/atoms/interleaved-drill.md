---
id: indefinite-integration.interleaved-drill
concept_id: indefinite-integration
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.58
modality: drill
tested_by_atom: indefinite-integration.micro_exercise
exam_ids: ["*"]
---

**Cross-concept check: integration $\to$ differentiation, then $\to$ a definite value.**

**Question 1 (verify by reversing the operation):** Find $\int x\,e^x\,dx$ using integration by parts, then confirm the answer WITHOUT redoing the integral — by differentiating it instead.

*Answer:* By parts with $u=x$ (Algebraic, ahead of Exponential in LIATE), $dv=e^x\,dx$: $\int x\,e^x\,dx = x\,e^x - \int e^x\,dx = (x-1)e^x + C$.

Check by differentiating: $\dfrac{d}{dx}[(x-1)e^x] = e^x + (x-1)e^x = x\,e^x$ — matches the original integrand exactly. Differentiation is always the fast, mechanical way to confirm an integration answer; it never requires remembering which technique solved the integral.

**Question 2 (the same antiderivative answers a definite question too):** Using the antiderivative from Question 1, evaluate $\displaystyle\int_0^1 x\,e^x\,dx$.

*Answer:* $\Big[(x-1)e^x\Big]_0^1 = (1-1)e^1 - (0-1)e^0 = 0 - (-1) = 1$.

**Why this drill exists:** finding an antiderivative is not the finish line — it is a reusable tool. The exact same $(x-1)e^x$ both confirms itself (by differentiating back) and produces a number (by evaluating at two limits). A student who treats each integral as a one-off computation redoes work that a single correct antiderivative already paid for twice.
