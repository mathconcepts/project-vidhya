---
# Alternative body for functions-combinatorics.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: functions-combinatorics.worked_example.assured
concept_id: functions-combinatorics
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["gate-ma"]
scaffold_fade: 1
variant_of: functions-combinatorics-worked-example
for_stance: assured
---

Adjacent-seating: order matters throughout, so bundle-and-multiply is exact — $6!\times3!=4320$ for $8$ people with $A,B,C$ together (treat the bundle as $6$ objects, then unwind the internal order).

Binomial coefficient: $x^5y^3$ in $(x+y)^8$ is $\binom{8}{5}=\binom{8}{3}=56$ — symmetry means the exponent nearer either end is the faster lookup, so skip computing both binomials separately.

Injective count from a $3$-element domain into a $4$-element codomain is $P(4,3)=24$, not $C(4,3)=4$: each assignment is an ordered choice of distinct outputs, since which input got which output is exactly what injectivity distinguishes. Total maps, injective or not, come to $4^3=64$; surjective maps from $3$ elements onto $4$ don't exist at all — $|A|\ge|B|$ is necessary for surjectivity and fails outright here, no computation required.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: adjacent-seating count and a binomial coefficient","steps":[{"prompt":"How many ways can 5 people be seated in a row such that 2 specific people (X and Y) are always adjacent?","hint":"Treat X and Y as one unit → 4 entities. Arrange in 4! ways, then multiply by the number of ways X,Y can be ordered within the unit.","answer":"48"},{"prompt":"What is the coefficient of x³y⁵ in (x+y)⁸?","hint":"Use C(8,3) = 8!/(3!·5!). The exponents must sum to 8.","answer":"56"}]}
```
