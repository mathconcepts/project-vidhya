---
# Alternative body for definite-integrals.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: definite-integrals.worked_example.assured
concept_id: definite-integrals
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: definite-integrals.worked_example
for_stance: assured
---

LIATE names the choice before you compute: pick $u$ so differentiating it simplifies — here $u=x$ (algebraic), $dv=\sin x\,dx$ (trig). Reversed — $u=\sin x$, $dv=x\,dx$ — gives $v=\frac{x^2}{2}$, and the remaining integral $\int\frac{x^2}{2}\cos x\,dx$ is now degree $2$ instead of degree $1$: one direction shrinks the polynomial, the other grows it.

One application closes the correct direction, since differentiating $x$ once reaches a constant: $\int x\sin x\,dx=-x\cos x+\int\cos x\,dx=-x\cos x+\sin x$.

**Answer:** $\left[-x\cos x+\sin x\right]_0^\pi=(\pi+0)-(0+0)=\pi$.

The pattern generalizes: for $x^n\sin x$, $x^n\cos x$, or $x^n e^{ax}$, differentiating the polynomial factor $n$ times terminates at $0$, so by parts closes in exactly $n$ applications — choosing $u$ to be the *other* factor instead raises the polynomial's degree with every step.

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: ∫₀^π x sin(x) dx","steps":[{"prompt":"Step 1: Identify which integration technique to use. Why is integration by parts appropriate here?","hint":"Look at the product: x times sin(x). One part is a polynomial, the other trigonometric. Integration by parts handles products where one part gets simpler when differentiated.","answer":"We have a product of a polynomial (x) and a trigonometric function (sin x). Integration by parts is ideal because differentiating x gives a simpler expression (1), while the trig part can be integrated easily."},{"prompt":"Step 2: Set up integration by parts. Choose u and dv, then compute du and v.","hint":"Remember: LIATE helps choose u (Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential come in priority order). Here, x is Algebraic, sin(x) is Trigonometric.","answer":"u = x → du = dx; dv = sin(x) dx → v = -cos(x). This choice makes the remaining integral simpler."},{"prompt":"Step 3: Apply the Fundamental Theorem. Evaluate -x cos(x) + sin(x) at the bounds x = π and x = 0.","hint":"At x = π: cos(π) = -1, sin(π) = 0. At x = 0: cos(0) = 1, sin(0) = 0.","answer":"[−π(−1) + 0] − [0 + 0] = π. The answer is π."}],"caption":"Integration by parts + FTC: the exam workhorse for products of algebraic and trigonometric functions."}
```
