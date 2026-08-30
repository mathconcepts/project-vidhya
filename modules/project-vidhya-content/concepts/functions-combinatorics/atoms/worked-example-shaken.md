---
# Alternative body for functions-combinatorics.worked_example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: functions-combinatorics.worked_example.shaken
concept_id: functions-combinatorics
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["gate-ma"]
scaffold_fade: 1
variant_of: functions-combinatorics-worked-example
for_stance: shaken
---

Seat $8$ people so that three of them, $A,B,C$, sit together.

Bundle $A,B,C$ into one unit: that turns $8$ people into $8-3+1=6$ items.

Arrange the $6$ items: $6!=720$.

Arrange $A,B,C$ inside the bundle: $3!=6$.

Multiply: $720\times6=4320$.

Second question. Find the coefficient of $x^5y^3$ in $(x+y)^8$. Match the exponent: $x^k$ needs $k=5$. Write the term: $\binom{8}{5}$. Evaluate: $\binom{8}{5}=\frac{8!}{5!\,3!}=\frac{8\times7\times6}{3\times2\times1}=56$.

Third question. Count injective functions from $\{1,2,3\}$ to a $4$-element set. $f(1)$ has $4$ options. $f(2)$ has $3$ remaining. $f(3)$ has $2$ remaining. Multiply: $4\times3\times2=24$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: adjacent-seating count and a binomial coefficient","steps":[{"prompt":"How many ways can 5 people be seated in a row such that 2 specific people (X and Y) are always adjacent?","hint":"Treat X and Y as one unit → 4 entities. Arrange in 4! ways, then multiply by the number of ways X,Y can be ordered within the unit.","answer":"48"},{"prompt":"What is the coefficient of x³y⁵ in (x+y)⁸?","hint":"Use C(8,3) = 8!/(3!·5!). The exponents must sum to 8.","answer":"56"}]}
```

The number of choices shrinks by exactly one at each step precisely because injectivity forbids repeats.
