---
id: sequences.worked-example
concept_id: sequences
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

# Worked Example: Proving Convergence and Finding Limits

## Problem (GATE-style)

Consider the sequence $a_n = \frac{3n^2 + 2n - 1}{n^2 + 5n + 3}$.

**(a)** Find $\lim_{n \to \infty} a_n$.  
**(b)** Verify that for all $n \geq 1$, the sequence is bounded above by 4.  
**(c)** Determine whether the sequence is monotone, and justify your answer.

---

## Solution

### Part (a): Finding the Limit

To find the limit of a rational function where both numerator and denominator are polynomials, divide both by the highest power of $n$, which is $n^2$:

$$a_n = \frac{3n^2 + 2n - 1}{n^2 + 5n + 3} = \frac{n^2(3 + \frac{2}{n} - \frac{1}{n^2})}{n^2(1 + \frac{5}{n} + \frac{3}{n^2})} = \frac{3 + \frac{2}{n} - \frac{1}{n^2}}{1 + \frac{5}{n} + \frac{3}{n^2}}$$

As $n \to \infty$: $\frac{2}{n} \to 0$, $\frac{1}{n^2} \to 0$, $\frac{5}{n} \to 0$, $\frac{3}{n^2} \to 0$.

By the limit properties (limit of quotient = quotient of limits):

$$\lim_{n \to \infty} a_n = \frac{3 + 0 - 0}{1 + 0 + 0} = \boxed{3}$$

### Part (b): Boundedness

We need to show $a_n < 4$ for all $n \geq 1$.

$$a_n < 4 \iff \frac{3n^2 + 2n - 1}{n^2 + 5n + 3} < 4$$

Multiply both sides by $(n^2 + 5n + 3)$ (positive for $n \geq 1$):

$$3n^2 + 2n - 1 < 4(n^2 + 5n + 3)$$
$$3n^2 + 2n - 1 < 4n^2 + 20n + 12$$
$$0 < n^2 + 18n + 13$$

Since $n \geq 1$: $n^2 + 18n + 13 \geq 1 + 18 + 13 = 32 > 0$ ✓

Therefore, $a_n < 4$ for all $n \geq 1$, and the sequence is **bounded above by 4**.

By evaluating $a_1 = \frac{3 + 2 - 1}{1 + 5 + 3} = \frac{4}{9} > 0$, the sequence is also bounded below by 0, so it is **bounded**.

### Part (c): Monotonicity

Compute $a_{n+1} - a_n$:

$$a_{n+1} - a_n = \frac{3(n+1)^2 + 2(n+1) - 1}{(n+1)^2 + 5(n+1) + 3} - \frac{3n^2 + 2n - 1}{n^2 + 5n + 3}$$

Numerator of $a_{n+1}$: $3(n^2 + 2n + 1) + 2n + 2 - 1 = 3n^2 + 8n + 4$

Denominator of $a_{n+1}$: $(n^2 + 2n + 1) + 5n + 5 + 3 = n^2 + 7n + 9$

After finding a common denominator and simplifying (algebra omitted for brevity):

$$a_{n+1} - a_n = \frac{(3n^2 + 8n + 4)(n^2 + 5n + 3) - (3n^2 + 2n - 1)(n^2 + 7n + 9)}{(n^2 + 7n + 9)(n^2 + 5n + 3)}$$

The numerator, when expanded, gives $n^2 + 31n + 39 > 0$ for all $n \geq 1$.

Therefore, $a_{n+1} > a_n$, so the sequence is **monotonically increasing** toward its limit of 3.

---

## Key Insights

- **Polynomial limits**: For rational functions, the limit is determined by the leading terms.
- **Boundedness + monotonicity**: A bounded monotone sequence always converges (Monotone Convergence Theorem).
- **Algebraic verification**: Always check inequalities by cross-multiplying carefully when signs are known positive.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Limit of a rational sequence","steps":[{"prompt":"Step 1: To find the limit of $a_n = \\frac{3n^2 + 2n - 1}{n^2 + 5n + 3}$, divide numerator and denominator by the highest power of $n$ present. What is the highest power?","hint":"Look at both the numerator and denominator. The highest power in both is...?","answer":"$n^2$"},{"prompt":"Step 2: Rewrite the sequence as $\\frac{n^2(3 + \\frac{2}{n} - \\frac{1}{n^2})}{n^2(1 + \\frac{5}{n} + \\frac{3}{n^2})}$. Cancel the $n^2$ terms to get $\\frac{3 + \\frac{2}{n} - \\frac{1}{n^2}}{1 + \\frac{5}{n} + \\frac{3}{n^2}}$. As $n \\to \\infty$, what happens to fractions like $\\frac{1}{n}$ and $\\frac{1}{n^2}$?","hint":"What is $\\lim_{n \\to \\infty} \\frac{1}{n}$? What is $\\lim_{n \\to \\infty} \\frac{1}{n^2}$?","answer":"They both approach 0."},{"prompt":"Step 3: Apply the limit to the simplified expression: $\\lim_{n \\to \\infty} \\frac{3 + \\frac{2}{n} - \\frac{1}{n^2}}{1 + \\frac{5}{n} + \\frac{3}{n^2}} = \\frac{3 + 0 - 0}{1 + 0 + 0}$. What is this limit?","hint":"Substitute the limiting values of the fractional terms.","answer":"The limit is $\\frac{3}{1} = 3$. The sequence converges to 3."}],"caption":"Rational sequences converge to the ratio of leading coefficients. This trick works for all polynomial quotients where the numerator and denominator have the same degree."}
```
