---
id: functions-combinatorics.formal-definition
concept_id: functions-combinatorics
atom_type: formal_definition
bloom_level: 2
difficulty: 0.32
exam_ids: ["*"]
---

**Function**: A relation $f: A \to B$ is a function if every element $a \in A$ is paired with exactly one element $f(a) \in B$.
- **Injective (one-to-one)**: If $f(a) = f(b)$, then $a = b$. No two inputs map to the same output.
- **Surjective (onto)**: For every $b \in B$, there exists $a \in A$ such that $f(a) = b$. Every output is "covered."
- **Bijective**: Both injective and surjective. There is a perfect one-to-one pairing between $A$ and $B$.

**Combinatorial Fundamentals**:
- **Permutation**: An ordered arrangement of $n$ distinct objects. $P(n) = n! = n \cdot (n-1) \cdot \ldots \cdot 1$.
- **Combination**: An unordered selection of $k$ objects from $n$ objects. $\binom{n}{k} = \frac{n!}{k!(n-k)!}$.
- **Binomial Theorem**: $(a + b)^n = \sum_{k=0}^{n} \binom{n}{k} a^{n-k} b^k$.
