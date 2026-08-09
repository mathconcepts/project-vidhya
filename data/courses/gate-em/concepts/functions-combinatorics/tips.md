# Teaching Tips: Functions & Combinatorics

## Common Student Errors
- **Confusing injective and surjective**: "Injective = one-to-one" (no collisions in output), while "surjective = onto" (every output is covered). A helpful mnemonic: **"Injective = INTO (each input goes into a distinct output)"** and **"Surjective = ONTO (covers all of the target set)"**.
- **Misapplying the binomial coefficient formula**: Students compute $\binom{n}{k} = n \cdot k$ or forget to divide by $k!$ and $(n-k)!$. Always use: $\binom{n}{k} = \frac{n!}{k!(n-k)!}$.
- **Treating identical and distinct objects interchangeably**: Permutations count ordered arrangements of distinct objects. Combinations count unordered selections. Identical objects go with "stars and bars" (composition formula $\binom{n+k-1}{k-1}$), NOT permutations.

## GATE Question Pattern
Functions & Combinatorics problems in GATE typically appear as:
- **Counting functions** (1-2 marks, usually NAT): "How many surjective functions from a 5-element set to a 3-element set?" Requires knowledge of inclusion-exclusion or Stirling numbers of the second kind.
- **Binomial expansion** (1 mark, MCQ): Find the coefficient of $x^k$ in $(a+bx)^n$. Quick drill on binomial theorem + substitution.
- **Constrained permutations** (1-2 marks): Arrange $n$ objects with restrictions (e.g., "2 specific items never adjacent"). Use complementary counting (total − restricted arrangements).
- **Distribution problems** (NAT, 1-2 marks): Distribute identical items into distinct boxes with constraints. Stars-and-bars variant with lower bounds.

## Speed Tricks for MCQs
- **Bijection ↔ same cardinality**: If $|A| = |B|$, the number of bijections is $|A|! = |B|!$. For different cardinalities, no bijections exist.
- **Surjections via inclusion-exclusion**: For $n$ objects into $k$ bins (all bins non-empty): use $\sum_{j=0}^{k} (-1)^j \binom{k}{j} (k-j)^n$. This is faster than Stirling numbers if you memorize the formula.
- **Complementary counting for constraints**: For "NOT adjacent" or "NOT in position X" type problems, compute (all arrangements) − (bad arrangements), which is often simpler than direct counting.
- **Binomial coefficient symmetry**: $\binom{n}{k} = \binom{n}{n-k}$. Use this to reduce calculation (e.g., $\binom{100}{98} = \binom{100}{2}$).

## Must-Memorize Formulas / Results
$$P(n,k) = \frac{n!}{(n-k)!} = n^{\underline{k}} \quad \text{(Permutations of } n \text{ taken } k \text{ at a time)}$$
$$\binom{n}{k} = \frac{n!}{k!(n-k)!} \quad \text{(Combinations)}$$
$$\binom{n}{k} = \binom{n}{n-k} \quad \text{(Symmetry)}$$
$$\binom{n}{0} + \binom{n}{1} + \cdots + \binom{n}{n} = 2^n \quad \text{(Sum of binomial coefficients)}$$
$$(a+b)^n = \sum_{k=0}^{n} \binom{n}{k} a^{n-k} b^k \quad \text{(Binomial Theorem)}$$
$$\text{Number of injections from } |A|=m \text{ to } |B|=n: \quad P(n,m) = \frac{n!}{(n-m)!} \quad (n \geq m)$$
$$\text{Number of surjections from } |A|=n \text{ to } |B|=k: \quad k! \cdot S(n,k)$$
$$\text{Stars and bars (identical items, distinct bins):} \quad \binom{n+k-1}{k-1}$$
$$\text{Stars and bars with minimum requirement:} \quad \binom{(n-km_1) + k - 1}{k-1} \quad \text{after pre-filling}$$
