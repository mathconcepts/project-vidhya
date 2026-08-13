---
id: definite-integrals.worked_example
concept_id: definite-integrals
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Evaluate $\int_0^{\pi} x \sin(x) \, dx$.

**Solution:**

We use integration by parts. Let $u = x$ and $dv = \sin(x) \, dx$.

Then $du = dx$ and $v = -\cos(x)$.

By the integration by parts formula:
$$\int x \sin(x) \, dx = uv - \int v \, du = -x\cos(x) - \int (-\cos(x)) \, dx = -x\cos(x) + \int \cos(x) \, dx$$

The remaining integral is:
$$\int \cos(x) \, dx = \sin(x) + C$$

So:
$$\int x \sin(x) \, dx = -x\cos(x) + \sin(x) + C$$

Now apply the Fundamental Theorem to evaluate from 0 to $\pi$:
$$\int_0^{\pi} x \sin(x) \, dx = \left[-x\cos(x) + \sin(x)\right]_0^{\pi}$$

Evaluate at $x = \pi$:
$$-\pi \cos(\pi) + \sin(\pi) = -\pi(-1) + 0 = \pi$$

Evaluate at $x = 0$:
$$-0 \cdot \cos(0) + \sin(0) = 0$$

Therefore:
$$\int_0^{\pi} x \sin(x) \, dx = \pi - 0 = \pi$$

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: ∫₀^π x sin(x) dx","steps":[{"prompt":"Step 1: Identify which integration technique to use. Why is integration by parts appropriate here?","hint":"Look at the product: x times sin(x). One part is a polynomial, the other trigonometric. Integration by parts handles products where one part gets simpler when differentiated.","answer":"We have a product of a polynomial (x) and a trigonometric function (sin x). Integration by parts is ideal because differentiating x gives a simpler expression (1), while the trig part can be integrated easily."},{"prompt":"Step 2: Set up integration by parts. Choose u and dv, then compute du and v.","hint":"Remember: LIATE helps choose u (Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential come in priority order). Here, x is Algebraic, sin(x) is Trigonometric.","answer":"u = x → du = dx; dv = sin(x) dx → v = -cos(x). This choice makes the remaining integral simpler."},{"prompt":"Step 3: Apply the Fundamental Theorem. Evaluate -x cos(x) + sin(x) at the bounds x = π and x = 0.","hint":"At x = π: cos(π) = -1, sin(π) = 0. At x = 0: cos(0) = 1, sin(0) = 0.","answer":"[−π(−1) + 0] − [0 + 0] = π. The answer is π."}],"caption":"Integration by parts + FTC: the exam workhorse for products of algebraic and trigonometric functions."}
```
```

DONE:definite-integrals
