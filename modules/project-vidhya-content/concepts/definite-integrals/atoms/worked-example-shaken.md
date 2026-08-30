---
# Alternative body for definite-integrals.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: definite-integrals.worked_example.shaken
concept_id: definite-integrals
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: definite-integrals.worked_example
for_stance: shaken
---

**Problem:** $\int_0^\pi x\sin x\,dx$.

**Step 1.** Pick $u=x$, $dv=\sin x\,dx$.

**Step 2.** Then $du=dx$, $v=-\cos x$.

**Step 3.** By parts: $\int x\sin x\,dx=-x\cos x+\int\cos x\,dx=-x\cos x+\sin x$.

**Step 4.** Plug in $\pi$: $-\pi(-1)+0=\pi$. Plug in $0$: $0+0=0$.

**Answer:** $\pi-0=\pi$.

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: ∫₀^π x sin(x) dx","steps":[{"prompt":"Step 1: Identify which integration technique to use. Why is integration by parts appropriate here?","hint":"Look at the product: x times sin(x). One part is a polynomial, the other trigonometric. Integration by parts handles products where one part gets simpler when differentiated.","answer":"We have a product of a polynomial (x) and a trigonometric function (sin x). Integration by parts is ideal because differentiating x gives a simpler expression (1), while the trig part can be integrated easily."},{"prompt":"Step 2: Set up integration by parts. Choose u and dv, then compute du and v.","hint":"Remember: LIATE helps choose u (Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential come in priority order). Here, x is Algebraic, sin(x) is Trigonometric.","answer":"u = x → du = dx; dv = sin(x) dx → v = -cos(x). This choice makes the remaining integral simpler."},{"prompt":"Step 3: Apply the Fundamental Theorem. Evaluate -x cos(x) + sin(x) at the bounds x = π and x = 0.","hint":"At x = π: cos(π) = -1, sin(π) = 0. At x = 0: cos(0) = 1, sin(0) = 0.","answer":"[−π(−1) + 0] − [0 + 0] = π. The answer is π."}],"caption":"Integration by parts + FTC: the exam workhorse for products of algebraic and trigonometric functions."}
```
