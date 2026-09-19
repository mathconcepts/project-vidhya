---
id: indefinite-integration.worked-example.shaken
concept_id: indefinite-integration
atom_type: worked_example
scaffold_fade: true
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
variant_of: indefinite-integration.worked_example
for_stance: shaken
---

## The integral

$\displaystyle\int \frac{3x+5}{(x-1)(x+2)}\,dx$.

**Check for substitution first.** Denominator's derivative: $\frac{d}{dx}[(x-1)(x+2)] = 2x+1$. Is $3x+5$ a multiple of $2x+1$? No. So substitution is not available — use partial fractions.

**Set up.**

$$\frac{3x+5}{(x-1)(x+2)} = \frac{A}{x-1} + \frac{B}{x+2}$$

Clear denominators: $3x+5 = A(x+2) + B(x-1)$.

**Solve for A.** Put $x=1$: $3(1)+5 = A(1+2)$, so $8=3A$, so $A=\frac{8}{3}$.

**Solve for B.** Put $x=-2$: $3(-2)+5 = B(-2-1)$, so $-1=-3B$, so $B=\frac{1}{3}$.

**Integrate.**

$$\frac{8}{3}\int\frac{dx}{x-1} + \frac{1}{3}\int\frac{dx}{x+2} = \frac{8}{3}\ln|x-1|+\frac{1}{3}\ln|x+2|+C$$

$$\boxed{\frac{8}{3}\ln|x-1|+\frac{1}{3}\ln|x+2|+C}$$

**Check.** Differentiate the answer: $\frac{8/3}{x-1}+\frac{1/3}{x+2} = \frac{8(x+2)+(x-1)}{3(x-1)(x+2)} = \frac{9x+15}{3(x-1)(x+2)} = \frac{3x+5}{(x-1)(x+2)}$. Matches.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: partial fractions on (3x+5)/((x-1)(x+2))","why":"Checking the numerator against the denominator's derivative first is what tells you substitution is NOT available here, before you commit to the decomposition.","steps":[{"prompt":"Is the numerator 3x+5 a constant multiple of the denominator's derivative, 2x+1?","hint":"Divide: (3x+5)/(2x+1) is not a constant.","answer":"No — so substitution does not apply; set up partial fractions instead."},{"prompt":"Write the decomposition A/(x-1) + B/(x+2), clear denominators, and find A by setting x=1.","hint":"At x=1, the B-term vanishes: 3(1)+5 = A(1+2).","answer":"A = 8/3"},{"prompt":"Find B by setting x=-2.","hint":"At x=-2, the A-term vanishes: 3(-2)+5 = B(-2-1).","answer":"B = 1/3"},{"prompt":"Integrate both simple fractions.","hint":"Each is of the form k/(x-a), integrating to k·ln|x-a|.","answer":"(8/3)ln|x-1| + (1/3)ln|x+2| + C"}],"caption":"Check the derivative-of-denominator test BEFORE setting up partial fractions — it is the fastest way to know which technique actually applies."}
```
