---
# Alternative body for group-theory-basics.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: group-theory-basics.worked_example.assured
concept_id: group-theory-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["gate-ma"]
scaffold_fade: 1
variant_of: group-theory-basics-worked-example
for_stance: assured
---

$(\mathbb{Z}_6,+_6)=\langle1\rangle$ — one generator suffices to prove cyclic, no need to trace every element's own order. Its subgroups correspond exactly to divisors of $6$: orders $1,2,3,6$, one subgroup each, and that's the complete list, not a lower bound, precisely because $\mathbb{Z}_n$ has exactly one subgroup per divisor.

$GL_2(\mathbb{R})$ under matrix multiplication: the axiom that actually needs an argument is closure, via $\det(AB)=\det(A)\det(B)\ne0$; associativity is free from matrix multiplication generally, identity is $I$, inverse exists exactly because $\det(A)\ne0$. Non-abelian — don't assume commutativity carries over from $(\mathbb{Z}_n,+)$-style examples.

Element order via $\text{ord}(a)=n/\gcd(n,a)$ beats repeated addition once $n$ is large: $\text{ord}(4)$ in $\mathbb{Z}_{12}$ is $12/\gcd(12,4)=3$ directly.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: element order in Z_n and Lagrange's theorem","steps":[{"prompt":"In (ℤ₈, +₈), what is the order of the element 6? Use the formula ord(a) = n/gcd(n,a).","hint":"gcd(8, 6) = 2. So ord(6) = 8/2 = ?","answer":"4"},{"prompt":"A group G has order 28. List all possible orders of subgroups of G (by Lagrange's theorem).","hint":"Find all positive divisors of 28. 28 = 4 × 7.","answer":"1, 2, 4, 7, 14, 28"}]}
```

Lagrange again, sharpened: order $15=3\times5$ rules out a subgroup of order $6$ by non-divisibility alone — no construction attempt needed, and the same non-divisibility bounds every element's order to $\{1,3,5,15\}$.
