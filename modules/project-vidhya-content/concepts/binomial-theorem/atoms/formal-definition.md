---
id: binomial-theorem.formal-definition
concept_id: binomial-theorem
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Binomial theorem**: for a positive integer $n$,

$$(a+b)^n = \sum_{r=0}^{n} \binom{n}{r} a^{n-r} b^r$$

**General term**: $T_{r+1} = \binom{n}{r}a^{n-r}b^r$, for $r = 0, 1, \dots, n$.

**Middle term**: if $n$ is even, the single middle term is $T_{\frac{n}{2}+1}$. If $n$ is odd, the two middle terms are $T_{\frac{n+1}{2}}$ and $T_{\frac{n+3}{2}}$.

**Greatest binomial coefficient**: for even $n$, it is $\binom{n}{n/2}$. For odd $n$, the two equal greatest values are $\binom{n}{(n-1)/2}$ and $\binom{n}{(n+1)/2}$.

**Key identities**:

- $\binom{n}{0}+\binom{n}{1}+\cdots+\binom{n}{n} = 2^n$
- $\binom{n}{0}-\binom{n}{1}+\binom{n}{2}-\cdots+(-1)^n\binom{n}{n} = 0$ (for $n \geq 1$)
- $\binom{n}{r} = \binom{n}{n-r}$ (symmetry)
- $\binom{n}{r}+\binom{n}{r+1} = \binom{n+1}{r+1}$ (Pascal's rule)

**Method selector — divisibility and remainder problems.** Rewrite the given power as (a multiple of the divisor $\pm\, 1)^m$, expand by the binomial theorem, and note that every term carrying a positive power of that multiple is itself divisible by the divisor. Only the one term with the multiple raised to the power $0$ survives — usually the very last term in the expansion. The tempting wrong move is expanding the original base directly instead of rewriting it first: $7^{103}$ expanded on its own carries no multiple of $25$ anywhere, and the shortcut vanishes.
