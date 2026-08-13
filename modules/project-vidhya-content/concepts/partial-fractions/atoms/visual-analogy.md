---
id: partial-fractions-visual-analogy
concept_id: partial-fractions
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Pizza Slices: The Partial Fraction Analogy

Imagine ordering a **whole pizza** and paying with a single bill. That's your original fraction $\dfrac{P(x)}{Q(x)}$ — one object, one transaction.

Now imagine the same pizza cut into **individual slices**, and you pay for each slice separately. Each slice is a partial fraction: simpler, smaller, and easier to handle. Together, all the slices are still the same pizza.

$$\underbrace{\frac{3x+5}{(x-1)(x+2)}}_{\text{whole pizza}} = \underbrace{\frac{A}{x-1}}_{\text{slice 1}} + \underbrace{\frac{B}{x+2}}_{\text{slice 2}}$$

## Cutting Rules Match the Factor Types

The **way you cut** depends on the denominator's factors:

- **Distinct linear factors** $(x-a)(x-b)$: like cutting into two clean slices — one piece for each factor. Each slice has a constant numerator.

- **Repeated factor** $(x-a)^2$: like two slices that are stuck together — you need *two* separate terms to pull them apart: $\dfrac{A}{x-a} + \dfrac{B}{(x-a)^2}$.

- **Irreducible quadratic** $x^2+1$: the slice itself can't be cut further over the reals, so it gets a **linear** numerator $Ax+B$ on top.

## Why Each Slice Is Simpler

The original denominator $(x-1)(x+2)$ makes integration complicated because neither substitution nor standard forms apply directly. Each slice $\dfrac{A}{x-a}$ integrates to $A\ln|x-a|$ — a form you already know. The decomposition converts the problem into forms you have memorized.

## The Verification Picture

After finding $A$ and $B$, **add the slices back together** over a common denominator and check you recover the original pizza. If you do, the decomposition is correct. This reverse check takes only 30 seconds and catches sign errors before they cost marks in GATE.

## Connecting to Inverse Laplace

The same slicing idea powers inverse Laplace transforms. When $F(s) = \dfrac{1}{(s+1)(s+3)}$, slicing gives:

$$F(s) = \frac{1/2}{s+1} - \frac{1/2}{s+3}$$

Each slice is in the table: $\mathcal{L}^{-1}\!\left\{\dfrac{1}{s+a}\right\} = e^{-at}$. Without slicing, there is no table entry.
