---
# Alternative body for group-theory-basics.worked_example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: group-theory-basics.worked_example.shaken
concept_id: group-theory-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["gate-ma"]
scaffold_fade: 1
variant_of: group-theory-basics-worked-example
for_stance: shaken
---

Show $(\mathbb{Z}_6,+_6)$ is cyclic. Start at $0$, add $1$ repeatedly: $0\to1\to2\to3\to4\to5\to0$. All six elements appeared — $1$ generates the whole group.

Find its subgroups. Divisors of $6$: $1,2,3,6$. Order $1$: $\{0\}$. Order $2$: $\{0,3\}$, since $3+3=6\equiv0$. Order $3$: $\{0,2,4\}$, since $2+2+2=6\equiv0$. Order $6$: the whole group.

Separate question: is $GL_2(\mathbb{R})$ a group under matrix multiplication? Closure: $\det(AB)=\det(A)\det(B)$, and a product of two nonzero numbers is nonzero, so $AB$ stays invertible. Associativity: matrix multiplication is always associative. Identity: $I$ satisfies $AI=IA=A$, $\det(I)=1\ne0$. Inverse: $\det(A)\ne0$ guarantees $A^{-1}$ exists, and $\det(A^{-1})=1/\det(A)\ne0$.

One more fact worth having ready: the order of an element in $\mathbb{Z}_n$ is $n/\gcd(n,a)$. Check it on $4$ in $\mathbb{Z}_{12}$: $\text{ord}(4)=12/\gcd(12,4)=12/4=3$, matching three additions of $4$ landing on $12\equiv0$. And Lagrange rules out subgroup sizes directly: a group of order $15=3\times5$ has divisors $1,3,5,15$ only, so no subgroup of order $6$ can exist there.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: element order in Z_n and Lagrange's theorem","steps":[{"prompt":"In (ℤ₈, +₈), what is the order of the element 6? Use the formula ord(a) = n/gcd(n,a).","hint":"gcd(8, 6) = 2. So ord(6) = 8/2 = ?","answer":"4"},{"prompt":"A group G has order 28. List all possible orders of subgroups of G (by Lagrange's theorem).","hint":"Find all positive divisors of 28. 28 = 4 × 7.","answer":"1, 2, 4, 7, 14, 28"}]}
```

A group proof checks four separate things, and each one either holds or the claim fails outright — here all four held, and matrix multiplication's failure to commute in general keeps $GL_2(\mathbb{R})$ non-abelian.
