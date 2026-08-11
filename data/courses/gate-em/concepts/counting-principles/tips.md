# Teaching Tips: Counting Principles

## Common Student Errors

- **Confusing permutation and combination**: Students often use $P(n,r)$ when they should use $C(n,r)$, or vice versa. The key: if the problem says "arrange," "order," "sequence," or "roles," use permutation; if it says "select," "choose," "committee," or "group," use combination.
- **Forgetting the constraint handling**: When certain objects must be together or must NOT be together, students fail to apply the "treat as one unit" trick, leading to massive overcounting or undercounting.
- **Miscalculating factorial division**: Students write $\frac{8!}{3! \cdot 5!}$ and then compute $8 \times 7 \times 6 / (3 \times 2 \times 1)$ but make arithmetic errors in the final multiplication/division step. Always cancel factors first: $\frac{8 \times 7 \times 6}{6} = 56$.

## GATE Question Pattern

GATE presents counting principles in three forms: (1) **Pure counting** — "how many ways to select/arrange $r$ from $n$" (direct $C(n,r)$ or $P(n,r)$ application, ~1 mark), (2) **Constrained counting** — "how many arrangements where A and B are adjacent" or "A and B are NOT adjacent" (requires the grouping/exclusion techniques, ~2 marks, NAT or MCQ), and (3) **Probability via counting** — "probability of selecting a subset with a given property" (use counting to find favorable and total outcomes, ~2 marks). GATE rarely asks for formulas in isolation; instead, formulas are applied to realistic scenarios (passwords, seating, committee formation, etc.).

## Speed Tricks for MCQs

- **Use the $C(n, r) = C(n, n-r)$ symmetry**: If computing $C(20, 17)$ takes 20 multiplications, flip it to $C(20, 3) = \frac{20 \times 19 \times 18}{6}$ for instant mental arithmetic.
- **Cancel before multiplying**: In $\frac{8 \times 7 \times 6}{3 \times 2 \times 1}$, observe that $6 / 6 = 1$ and $8 / 2 = 4$, giving $4 \times 7 \times 1 = 28$... wait, that's wrong. Actually: $\frac{8 \times 7 \times 6}{3!} = \frac{336}{6} = 56$. Pre-cancel to avoid large numerators: $\frac{8 \times 7 \times 6}{3 \times 2 \times 1} = \frac{8 \times 7}{1} \times \frac{6}{3 \times 2} = 56 \times 1 = 56$.
- **Treat-as-one-unit for constraints**: If a problem says "4 books must be together," immediately replace those 4 with a single object, reducing $n$ by 3, then multiply by $4!$ at the end. This transforms a complex constrained permutation into two simple independent calculations.

## Must-Memorize Formulas / Results

$$n! = n \times (n-1) \times (n-2) \times \cdots \times 1$$

$$P(n, r) = \frac{n!}{(n-r)!} = n \times (n-1) \times \cdots \times (n-r+1)$$

$$C(n, r) = \binom{n}{r} = \frac{n!}{r!(n-r)!}$$

$$C(n, r) = C(n, n-r)$$ (symmetry property)

$$C(n, 0) = C(n, n) = 1$$

$$C(n, 1) = n$$

**For "objects must be together":**
$$\text{Arrangements} = (n - r + 1)! \times r!$$
where $r$ is the number of objects that must stay together and $n$ is the total.

**For "objects must NOT be together":**
$$\text{Valid arrangements} = P(n, n) - \text{(arrangements with both together)}$$
or use inclusion-exclusion principle for multiple constraints.
