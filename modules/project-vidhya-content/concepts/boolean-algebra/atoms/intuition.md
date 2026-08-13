---
id: boolean-algebra-intuition
concept_id: boolean-algebra
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Boolean Algebra — Core Intuition

## The Basics

**Boolean algebra** operates over the set $\{0, 1\}$ with three fundamental operations:

| Operation | Symbol | Name | Meaning |
|---|---|---|---|
| AND | $A \cdot B$ or $AB$ | Conjunction | 1 only if both inputs are 1 |
| OR | $A + B$ | Disjunction | 1 if at least one input is 1 |
| NOT | $A'$ or $\bar{A}$ | Complement | Flips 0 to 1 and 1 to 0 |

---

## Key Laws

**Complement laws:**
$$A + A' = 1, \qquad A \cdot A' = 0$$

**Idempotent laws:**
$$A + A = A, \qquad A \cdot A = A$$

**Absorption laws:**
$$A + AB = A, \qquad A(A + B) = A$$

**De Morgan's theorems** (most tested in GATE):
$$(A + B)' = A' \cdot B', \qquad (A \cdot B)' = A' + B'$$

*Memory trick:* "Break the bar, change the operation" — AND becomes OR, OR becomes AND.

**Distributive laws:**
$$A(B + C) = AB + AC, \qquad A + BC = (A+B)(A+C)$$

Note: The second law (OR over AND) has no analog in regular algebra!

---

## SOP and POS Forms

**Sum of Products (SOP):** OR of AND terms (minterms).
$$F = A'B + AB' + AB$$

**Product of Sums (POS):** AND of OR terms (maxterms).
$$F = (A + B)(A + B')$$

Every Boolean function can be expressed in either canonical form. GATE often asks you to convert between them or count the number of minterms.

- **Minterms** are AND terms where each variable appears exactly once (complemented or not).
- **Maxterms** are OR terms where each variable appears exactly once (complemented or not).

For $n$ variables: $2^n$ minterms total. If $F$ has $k$ minterms, it has $2^n - k$ maxterms.

---

## Karnaugh Map (K-Map)

A K-map is a visual grid for Boolean minimization. Variables are arranged so adjacent cells differ in **exactly one variable** (Gray code order).

**2-variable K-map:**
```
      B'   B
  A' | 0 | 1 |
  A  | 2 | 3 |
```

**4-variable K-map (row = AB, col = CD):**
```
       CD:  00  01  11  10
  AB: 00  |  0 |  1 |  3 |  2 |
      01  |  4 |  5 |  7 |  6 |
      11  | 12 | 13 | 15 | 14 |
      10  |  8 |  9 | 11 | 10 |
```

**Grouping rules:**
- Group 1s in powers of 2: groups of 1, 2, 4, 8, 16, ...
- Groups can wrap around edges (the map is toroidal).
- Larger groups → simpler terms (fewer literals).
- Every 1 must be covered; maximize group sizes.

---

## Simplification Strategy

1. List all minterms where $F = 1$.
2. Plot on K-map.
3. Find the **largest possible groups** of 1s (each must be a power of 2).
4. Write the minimal SOP: one AND term per group, eliminating the variable that changes across the group.
