---
id: binomial-theorem.intuition
concept_id: binomial-theorem
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
---

**General term.** Writing out every term of $(a+b)^n$ for large $n$ is slow, and most JEE questions only want ONE term, not all of them. There is a formula for exactly that: $T_{r+1} = \binom{n}{r}a^{n-r}b^r$. The label is $T_{r+1}$, not $T_r$ — the very first term, $a^n b^0$, is produced by $r=0$, so the subscript always runs one ahead of $r$.

**Middle term.** An expansion of $(a+b)^n$ has $n+1$ terms in total. If $n$ is even, $n+1$ is odd, so there is exactly one term sitting dead centre: the $\left(\frac{n}{2}+1\right)$-th. If $n$ is odd, $n+1$ is even, and no single term is in the middle — there are two, sitting on either side of the centre.

**Greatest coefficient.** Read the coefficients $\binom{n}{0},\binom{n}{1},\dots,\binom{n}{n}$ left to right: they climb, peak once, then fall — never up-down-up. The peak sits exactly where the middle term sits: $\binom{n}{n/2}$ for even $n$, and the two equal values $\binom{n}{\frac{n-1}{2}} = \binom{n}{\frac{n+1}{2}}$ for odd $n$. This "greatest coefficient" is a fact about the numbers $\binom{n}{r}$ alone — it says nothing yet about which TERM is numerically biggest once $a$ and $b$ carry real values, which is a separate question the mnemonic below untangles.
