---
id: indefinite-integration.worked-example.assured
concept_id: indefinite-integration
atom_type: worked_example
scaffold_fade: true
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
variant_of: indefinite-integration.worked_example
for_stance: assured
---

## The test that decides the method

$\displaystyle\int \frac{3x+5}{(x-1)(x+2)}\,dx$: the denominator's derivative is $2x+1$, and $3x+5$ is not proportional to it, so substitution is ruled out cleanly and partial fractions is correct — not merely convenient.

$$\frac{3x+5}{(x-1)(x+2)} = \frac{A}{x-1}+\frac{B}{x+2} \;\Rightarrow\; 3x+5=A(x+2)+B(x-1)$$

Cover-up at the roots: $x=1 \Rightarrow A=8/3$; $x=-2 \Rightarrow B=1/3$.

$$\int\frac{3x+5}{(x-1)(x+2)}\,dx = \frac{8}{3}\ln|x-1|+\frac{1}{3}\ln|x+2|+C$$

$$\boxed{\frac{8}{3}\ln|x-1|+\frac{1}{3}\ln|x+2|+C}$$

## What actually costs marks here

Not the arithmetic — the discipline of running the derivative-of-denominator test BEFORE setting up the decomposition. Skip that test and you can still land on the correct partial-fraction split by instinct on an easy paper, but on a numerator engineered to match the derivative (as in this concept's own hook), the same instinct wastes the entire time budget factoring a decomposition that a two-second check would have replaced with one substitution.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: partial fractions on (3x+5)/((x-1)(x+2))","why":"Checking the numerator against the denominator's derivative first is what tells you substitution is NOT available here, before you commit to the decomposition.","steps":[{"prompt":"Is the numerator 3x+5 a constant multiple of the denominator's derivative, 2x+1?","hint":"Divide: (3x+5)/(2x+1) is not a constant.","answer":"No — so substitution does not apply; set up partial fractions instead."},{"prompt":"Write the decomposition A/(x-1) + B/(x+2), clear denominators, and find A by setting x=1.","hint":"At x=1, the B-term vanishes: 3(1)+5 = A(1+2).","answer":"A = 8/3"},{"prompt":"Find B by setting x=-2.","hint":"At x=-2, the A-term vanishes: 3(-2)+5 = B(-2-1).","answer":"B = 1/3"},{"prompt":"Integrate both simple fractions.","hint":"Each is of the form k/(x-a), integrating to k·ln|x-a|.","answer":"(8/3)ln|x-1| + (1/3)ln|x+2| + C"}],"caption":"Check the derivative-of-denominator test BEFORE setting up partial fractions — it is the fastest way to know which technique actually applies."}
```
