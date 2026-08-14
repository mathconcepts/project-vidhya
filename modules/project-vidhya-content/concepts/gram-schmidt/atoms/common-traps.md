---
id: gram-schmidt.common_traps
concept_id: gram-schmidt
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
---

# Gram-Schmidt Process: Common Traps

## **Trap 1: Normalizing before orthogonalization**

**The mistake:** Some students normalize $v_1$ first (correct), but then forget to orthogonalize $v_2$ against the already-produced $e_1$. They instead try to orthogonalize the *original* $v_2$ against $v_1$, which doesn't guarantee orthogonality to the *normalized* $e_1$.

**Why it fails:** The projections $\langle v_i, e_j \rangle$ are computed with respect to the already-normalized vectors $e_j$, not the original $v_j$. If you use inner products with non-normalized vectors, you lose orthonormality.

**Correct approach:** Always compute $\langle v_i, e_j \rangle$ (inner product of the current vector $v_i$ with the *already-normalized* basis vectors $e_j$), subtract all those projections, and *then* normalize the remainder.

---

## **Trap 2: Forgetting to subtract all previous projections**

**The mistake:** When orthogonalizing $v_3$, a student subtracts the projection onto $e_1$ but forgets to subtract the projection onto $e_2$.

$$\text{Wrong: } \tilde{u}_3 = v_3 - \langle v_3, e_1 \rangle e_1 \quad (\text{missing } e_2 \text{ term})$$

**Why it fails:** The vector $\tilde{u}_3$ still has a component in the direction of $e_2$, so $\langle e_2, e_3 \rangle \neq 0$. The basis is no longer orthogonal.

**Correct approach:** Always subtract *all* projections onto previously computed orthonormal vectors:
$$\tilde{u}_i = v_i - \sum_{j=1}^{i-1} \langle v_i, e_j \rangle e_j$$

---

## **Trap 3: Not checking linear independence**

**The mistake:** A student assumes the input vectors are linearly independent without checking. If they are linearly dependent, at some step $\tilde{u}_i = 0$, and normalization $e_i = \tilde{u}_i / \|\tilde{u}_i\|$ becomes $0/0$ — undefined.

**Why it fails:** Gram-Schmidt requires linearly independent inputs. If $v_i$ lies in $\text{span}(v_1, \ldots, v_{i-1})$, then the orthogonalization step produces the zero vector, and you cannot normalize it.

**Correct approach:** Before applying Gram-Schmidt, verify that the vectors are linearly independent (e.g., their determinant is non-zero, or the rank equals the number of vectors). If they are not, discard redundant vectors first.

---

## **Trap 4: Confusing the inner product**

**The mistake:** In an inner-product space other than $\mathbb{R}^n$ with the dot product (e.g., polynomials, continuous functions with $\langle f, g \rangle = \int f(x) g(x) \, dx$), a student uses the dot product formula instead of the correct inner product.

**Why it fails:** The algorithm depends on the inner product definition. Using the wrong one produces vectors that are "orthogonal" with respect to the wrong metric.

**Correct approach:** Always clarify which inner product the space uses. For $\mathbb{R}^n$, it's the standard dot product $\langle u, v \rangle = u^T v$. For function spaces or weighted spaces, apply the correct definition carefully.