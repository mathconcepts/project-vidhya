# Teaching Tips: Group Theory Basics

## Common Student Errors
- **Forgetting closure in verification**: When checking if a set with an operation is a group, students verify associativity and identity but forget to check that the operation actually keeps you in the set (closure). Example: $(\\mathbb{Z}, -)$ fails closure (no, it doesn't), but it fails associativity. **Check first**: if $a \cdot b$ is defined for all $a, b \in G$, closure is satisfied; the real trap is operations like "greatest common divisor" on integers where the result might exceed the set's range.
- **Confusing order of element with order of group**: The order of an element $a$ (smallest $n$ with $a^n = e$) is NOT the same as the order of the group (cardinality $|G|$). By Lagrange, element orders divide group order, but they're distinct concepts. **Test**: in $\\mathbb{Z}_{12}$, the element 2 has order 6, not 12.
- **Misapplying Lagrange's theorem**: Lagrange says subgroup order divides group order, but NOT that every divisor gives a subgroup. For $\\mathbb{Z}_6$, divisors of 6 are 1, 2, 3, 6, but not every divisor necessarily generates a subgroup (though in cyclic groups, every divisor does). **Key point**: Lagrange is a necessary condition, not sufficient in general.

## GATE Question Pattern
Group theory questions in GATE typically appear as:
- **Verify group axioms** (1-2 marks, MCQ): Given a concrete set and operation (modular arithmetic, permutations, matrices), determine if it forms a group. Trap: similar-looking structures that are missing one axiom (e.g., natural numbers under addition have no identity 0 or no inverses).
- **Compute element order** (1 mark, NAT): "What is the order of $a$ in group $G$?" Requires systematic computation of $a^1, a^2, \ldots$ until reaching the identity.
- **Identify subgroups** (1-2 marks): List all subgroups of a finite group (usually small cyclic groups like $\\mathbb{Z}_n$ or $S_3$). Use Lagrange to constrain possible orders.

## Speed Tricks for MCQs
- **Cyclic groups are simple**: For cyclic groups $\\mathbb{Z}_n$, every subgroup is cyclic and unique for each divisor of $n$. Use this to quickly enumerate subgroups (one subgroup per divisor of the group order).
- **Element order in $\\mathbb{Z}_n$**: For $a$ in $\\mathbb{Z}_n$ under addition, $\\text{ord}(a) = \\frac{n}{\\gcd(a, n)}$. Memorize this formula to avoid computing powers.
- **Permutation composition**: When verifying non-abelian groups like $S_n$, find one counterexample pair $\\sigma, \\tau$ with $\\sigma \\circ \\tau \\neq \\tau \\circ \\sigma$ to immediately rule out abelian. Two transpositions always work for $S_n$ with $n \\geq 3$.
- **Modular multiplicative groups**: $\\mathbb{Z}_p^*$ (non-zero elements mod $p$ under multiplication) is always cyclic and has order $\\phi(p) = p-1$ when $p$ is prime. For $\\mathbb{Z}_p^*$ with $p$ prime, generators exist and their order is $p-1$.

## Must-Memorize Formulas / Results
$$\\text{Group axioms}: \\text{Closure, Associativity, Identity, Inverse}$$
$$\\text{Order of element } a: \\quad \\text{ord}(a) = \\min\\{n \\in \\mathbb{Z}^+ : a^n = e\\}$$
$$\\text{Order of group}: |G| = \\text{cardinality of } G$$
$$\\text{Lagrange's Theorem}: |H| \\mid |G| \\text{ for any subgroup } H \\text{ of finite group } G$$
$$\\text{Order of } a \\text{ in } \\mathbb{Z}_n \\text{ (additive)}: \\quad \\text{ord}(a) = \\frac{n}{\\gcd(a, n)}$$
$$\\text{Cyclic group } \\mathbb{Z}_n: \\text{ every subgroup is cyclic, one for each divisor of } n$$
$$\\text{Symmetric group } S_n: |S_n| = n!, \\text{ abelian iff } n \\leq 2$$
$$\\text{Multiplicative group mod prime } p: \\quad \\mathbb{Z}_p^* \\text{ is cyclic of order } p-1$$
$$\\text{Euler's totient function}: \\phi(n) = \\text{order of multiplicative group } \\mathbb{Z}_n^*$$
$$\\text{For prime } p: \\quad \\phi(p) = p - 1$$
