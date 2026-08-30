---
# Alternative body for ode-exact-worked-example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: ode-exact.worked-example.shaken
concept_id: ode-exact
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: ode-exact-worked-example
for_stance: shaken
---

## Solve $(2xy+3x^2)\,dx+(x^2+4y^3)\,dy=0$

**Classify.** $M=2xy+3x^2$, $N=x^2+4y^3$. Compute $\dfrac{\partial M}{\partial y}=2x$ and $\dfrac{\partial N}{\partial x}=2x$. They're equal, so the equation is exact.

**Solve.** Integrate $M$ with respect to $x$, holding $y$ fixed:

$$F(x,y)=\int(2xy+3x^2)\,dx=x^2y+x^3+g(y)$$

Differentiate this $F$ with respect to $y$ and match to $N$:

$$\dfrac{\partial F}{\partial y}=x^2+g'(y)=x^2+4y^3 \implies g'(y)=4y^3 \implies g(y)=y^4$$

$$\boxed{F(x,y)=x^2y+x^3+y^4=C}$$

**Check.** Differentiate the boxed $F$ back: $\dfrac{\partial F}{\partial x}=2xy+3x^2=M$, and $\dfrac{\partial F}{\partial y}=x^2+4y^3=N$. Both match, so $F=C$ really does solve the original equation.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving the exact ODE (2xy+3x²)dx + (x²+4y³)dy = 0","steps":[{"prompt":"What is the exactness condition that must hold for M dx + N dy = 0 to be exact?","hint":"It relates a partial derivative of M to a partial derivative of N. Think about mixed second-order partials of the potential function F.","answer":"∂M/∂y = ∂N/∂x. This ensures the mixed partials of F are equal, so F exists."},{"prompt":"After integrating M = 2xy + 3x² with respect to x, we get F = x²y + x³ + g(y). How do we find g(y)?","hint":"Differentiate F with respect to y and set the result equal to N = x² + 4y³.","answer":"∂F/∂y = x² + g′(y) = x² + 4y³, so g′(y) = 4y³ and g(y) = y⁴. The general solution is x²y + x³ + y⁴ = C."}]}
```

The fact worth keeping: $g(y)$ comes only from matching $\partial F/\partial y$ against $N$, never from integrating $N$ separately.
