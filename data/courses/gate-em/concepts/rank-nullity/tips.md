# Teaching Tips: Rank & Nullity

## Common Student Errors
- **Confusing rank with the number of rows/columns**: Rank is NOT the number of rows or columns—it's the number of linearly independent rows/columns, which can be less.
- **Forgetting the rank-nullity sum**: Students often compute rank correctly but then forget that $\text{rank}(A) + \text{nullity}(A) = n$. They might incorrectly guess nullity without using this fundamental theorem.
- **Counting dependent rows as rank**: When rows are linearly dependent (e.g., one is a multiple of another), they contribute only one to the rank. Students sometimes count each non-zero row, missing the dependence.

## GATE Question Pattern
GATE rank-nullity questions typically test: (1) computing rank via row reduction; (2) applying rank-nullity to find nullity; (3) interpreting rank in the context of systems (consistency, uniqueness, free variables); (4) identifying when a matrix is full-rank or rank-deficient. Most are MCQ with numerical answers; NAT questions ask for rank or nullity of specific matrices.

## Speed Tricks for MCQs
- **Spot linear dependence visually**: If one row/column is an obvious multiple of another, rank drops immediately. No need for full reduction.
- **Use rank-nullity first**: Before computing rank explicitly, if the question gives both $m$, $n$, and rank, use rank-nullity to find nullity instantly.
- **Full rank check for square matrices**: For $n \times n$ matrices, rank = $n$ iff the matrix is invertible (and $\det(A) \neq 0$). This is a quick check without computing the full rank.

## Must-Memorize Formulas / Results
- **Rank-nullity theorem**: $\text{rank}(A) + \text{nullity}(A) = n$ (for $m \times n$ matrix)
- **Rank bounds**: $\text{rank}(A) \leq \min(m, n)$
- **Full rank condition**: For $m \times n$ matrix, $\text{rank}(A) = \min(m, n)$ means full rank
- **Full column rank**: $\text{rank}(A) = n$ (all $n$ columns are independent)
- **Full row rank**: $\text{rank}(A) = m$ (all $m$ rows are independent)
- **Rank and invertibility**: For $n \times n$ matrix, invertible iff $\text{rank}(A) = n$
- **Rank and null space**: $\text{nullity}(A) = 0$ iff $Ax = 0$ has only the trivial solution
- **Rank and column/row space**: $\text{rank}(A) = \dim(\text{col}(A)) = \dim(\text{row}(A))$
