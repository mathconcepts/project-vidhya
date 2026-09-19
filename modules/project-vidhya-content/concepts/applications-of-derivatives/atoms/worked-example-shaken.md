---
id: applications-of-derivatives.worked-example-shaken
concept_id: applications-of-derivatives
atom_type: worked_example
bloom_level: 3
difficulty: 0.35
exam_ids: ["*"]
scaffold_fade: true
variant_of: applications-of-derivatives.worked-example
for_stance: shaken
---

**Problem.** Find the equations of the tangent and normal to $y=x^3-3x^2+2$ at $x=1$.

---

**Step 1 — Compute $f(1)$ first.**

$f(1)=1^3-3(1)^2+2=1-3+2=0$. So the point is $(1,0)$.

---

**Step 2 — Differentiate, then substitute $x=1$.**

$f'(x)=3x^2-6x$. $f'(1)=3(1)^2-6(1)=3-6=-3$. Tangent slope $=-3$.

---

**Step 3 — Tangent line through $(1,0)$, slope $-3$:**

$$
y-0=-3(x-1)\quad\Rightarrow\quad \boxed{y=-3x+3}
$$

---

**Step 4 — Normal slope is $-1$ divided by the tangent slope.**

$-\dfrac{1}{-3}=\dfrac13$. Normal line through $(1,0)$, slope $\dfrac13$:

$$
y-0=\frac13(x-1)\quad\Rightarrow\quad \boxed{x-3y-1=0}
$$

**Confirm it directly.** Multiply the two slopes: $-3\times\dfrac13=-1$. Two perpendicular lines always multiply to $-1$ — confirmed.

```interactive-spec
{"v": 1, "kind": "guided_walkthrough", "title": "Walk through: tangent and normal to y = x^3 - 3x^2 + 2 at x = 1", "steps": [{"prompt": "Find f(1) and f prime(x). What do you get?", "hint": "f(1) is just substituting x = 1 into f(x) = x^3 - 3x^2 + 2. f prime(x) = 3x^2 - 6x by the power rule.", "answer": "f(1) = 1 - 3 + 2 = 0, so the curve passes through (1, 0). f prime(x) = 3x^2 - 6x."}, {"prompt": "Evaluate f prime(1). What is the tangent line's slope at x = 1?", "hint": "Substitute x = 1 into f prime(x) = 3x^2 - 6x.", "answer": "f prime(1) = 3 - 6 = -3. The tangent's slope at x = 1 is -3."}, {"prompt": "Write the tangent line through (1, 0) with slope -3.", "hint": "Use point-slope form: y - y0 = m(x - x0).", "answer": "y - 0 = -3(x - 1), which simplifies to y = -3x + 3."}, {"prompt": "Find the normal's slope and write the normal line.", "hint": "The normal's slope is the negative reciprocal of the tangent's slope: -1/m.", "answer": "Normal slope = -1/(-3) = 1/3. Normal line: y - 0 = (1/3)(x - 1), which simplifies to x - 3y - 1 = 0."}]}
```
