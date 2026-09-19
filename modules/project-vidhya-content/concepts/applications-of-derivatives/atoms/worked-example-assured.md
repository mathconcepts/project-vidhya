---
id: applications-of-derivatives.worked-example-assured
concept_id: applications-of-derivatives
atom_type: worked_example
bloom_level: 3
difficulty: 0.35
exam_ids: ["*"]
scaffold_fade: true
variant_of: applications-of-derivatives.worked-example
for_stance: assured
---

**Problem.** Find the tangent and normal to $y=x^3-3x^2+2$ at $x=1$.

---

$f(1)=0$, $f'(1)=3-6=-3$.

$$
\text{Tangent: } y-0=-3(x-1)\Rightarrow\boxed{y=-3x+3}\qquad\text{Normal: } y-0=\frac13(x-1)\Rightarrow\boxed{x-3y-1=0}
$$

**Where the formula above quietly breaks.** The normal's slope, $-\dfrac{1}{f'(x_0)}$, silently assumes $f'(x_0)\neq0$. At any $x_0$ where $f'(x_0)=0$ — a critical point — that formula divides by zero, and the correct answer is not "undefined," it is a genuine pair of lines: the tangent is the horizontal line $y=f(x_0)$, and the normal is the vertical line $x=x_0$. This curve happens to have $f'(1)\neq0$, so the formula above is safe here; the same curve has $f'(0)=0$ and $f'(2)=0$, and at either of those points the negative-reciprocal formula must be abandoned in favour of the horizontal-tangent, vertical-normal pair directly.

```interactive-spec
{"v": 1, "kind": "guided_walkthrough", "title": "Walk through: tangent and normal to y = x^3 - 3x^2 + 2 at x = 1", "steps": [{"prompt": "Find f(1) and f prime(x). What do you get?", "hint": "f(1) is just substituting x = 1 into f(x) = x^3 - 3x^2 + 2. f prime(x) = 3x^2 - 6x by the power rule.", "answer": "f(1) = 1 - 3 + 2 = 0, so the curve passes through (1, 0). f prime(x) = 3x^2 - 6x."}, {"prompt": "Evaluate f prime(1). What is the tangent line's slope at x = 1?", "hint": "Substitute x = 1 into f prime(x) = 3x^2 - 6x.", "answer": "f prime(1) = 3 - 6 = -3. The tangent's slope at x = 1 is -3."}, {"prompt": "Write the tangent line through (1, 0) with slope -3.", "hint": "Use point-slope form: y - y0 = m(x - x0).", "answer": "y - 0 = -3(x - 1), which simplifies to y = -3x + 3."}, {"prompt": "Find the normal's slope and write the normal line.", "hint": "The normal's slope is the negative reciprocal of the tangent's slope: -1/m.", "answer": "Normal slope = -1/(-3) = 1/3. Normal line: y - 0 = (1/3)(x - 1), which simplifies to x - 3y - 1 = 0."}]}
```
