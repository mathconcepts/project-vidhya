---
id: partial-fractions-worked-example
concept_id: partial-fractions
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Worked Example: Partial Fractions in Integration

**Problem (GATE-style):** Evaluate

$$\int \frac{x+1}{(x-2)(x+3)}\,dx$$

---

## Step 1 — Write the Partial Fraction Template

The denominator has **two distinct linear factors**, so:

$$\frac{x+1}{(x-2)(x+3)} = \frac{A}{x-2} + \frac{B}{x+3}$$

## Step 2 — Clear the Denominator

Multiply both sides by $(x-2)(x+3)$:

$$x + 1 = A(x+3) + B(x-2)$$

This is an **identity** — true for every $x$.

## Step 3 — Solve for Constants Using Cover-Up Values

**Set $x = 2$** (makes the $B$ term vanish):

$$2 + 1 = A(2+3) + B(0) \implies 3 = 5A \implies A = \frac{3}{5}$$

**Set $x = -3$** (makes the $A$ term vanish):

$$-3 + 1 = A(0) + B(-3-2) \implies -2 = -5B \implies B = \frac{2}{5}$$

## Step 4 — Write the Decomposition

$$\frac{x+1}{(x-2)(x+3)} = \frac{3/5}{x-2} + \frac{2/5}{x+3}$$

**Quick verification:** add the right side over the common denominator $(x-2)(x+3)$:

$$\frac{3(x+3) + 2(x-2)}{5(x-2)(x+3)} = \frac{3x+9+2x-4}{5(x-2)(x+3)} = \frac{5x+5}{5(x-2)(x+3)} = \frac{x+1}{(x-2)(x+3)} \checkmark$$

## Step 5 — Integrate Each Slice

$$\int \frac{x+1}{(x-2)(x+3)}\,dx = \frac{3}{5}\int\frac{dx}{x-2} + \frac{2}{5}\int\frac{dx}{x+3}$$

$$= \frac{3}{5}\ln|x-2| + \frac{2}{5}\ln|x+3| + C$$

---

## Key Pattern — Repeated Factor Variant

If the denominator were $(x-2)^2(x+3)$, the template changes:

$$\frac{N(x)}{(x-2)^2(x+3)} = \frac{A}{x-2} + \frac{B}{(x-2)^2} + \frac{C}{x+3}$$

Cover-up still finds $B$ (set $x=2$) and $C$ (set $x=-3$) directly; $A$ then follows by comparing coefficients of $x^2$ or plugging any remaining convenient $x$.

---

## GATE Shortcut — Heaviside Cover-Up Rule

To find the constant over the factor $(x - a)$: **cover that factor in the denominator** of the original fraction, then substitute $x = a$ into what remains.

$$A = \left.\frac{x+1}{(x+3)}\right|_{x=2} = \frac{3}{5} \qquad B = \left.\frac{x+1}{(x-2)}\right|_{x=-3} = \frac{-2}{-5} = \frac{2}{5}$$

This bypasses the algebra of Step 2–3 entirely for distinct linear factors. Saves ~60 seconds per sub-problem.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","steps":[{"prompt":"What is the correct partial fraction template for (x+1)/[(x-2)(x+3)]?","hint":"Two distinct linear factors → one constant term per factor: A/(x-2) + B/(x+3).","answer":"A/(x-2) + B/(x+3), because the denominator has two distinct linear factors, each requiring one constant numerator."},{"prompt":"Using the cover-up rule, what is the value of A (the constant over the x-2 factor)?","hint":"Cover (x-2) in the denominator, then substitute x=2 into the rest of the fraction.","answer":"A = (2+1)/(2+3) = 3/5. Cover (x-2), evaluate (x+1)/(x+3) at x=2: 3/5."},{"prompt":"What is the final integrated result?","hint":"Integrate A/(x-2) and B/(x+3) separately — each gives a natural log.","answer":"(3/5)ln|x-2| + (2/5)ln|x+3| + C. Each term 1/(x-a) integrates to ln|x-a|."}]}
```
