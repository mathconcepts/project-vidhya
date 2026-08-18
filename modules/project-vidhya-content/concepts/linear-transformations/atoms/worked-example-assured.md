---
# Alternative body for linear-transformations.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: linear-transformations.worked-example.assured
concept_id: linear-transformations
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: linear-transformations.worked_example
for_stance: assured
---

**Problem:** $T:\mathbb{R}^3\to\mathbb{R}^2$, $T(x,y,z)=(x+y,y+z)$. Find $\text{Ker}(T)$, $\text{Im}(T)$.

**Kernel:** $x+y=0,\ y+z=0 \Rightarrow (x,y,z)=t(-1,1,-1)$.

$$\boxed{\text{Ker}(T)=\{(-1,1,-1)\}}, \quad \text{nullity}=1$$

**Image:** since $T$ is onto $\mathbb{R}^2$ here (the coefficient matrix $\begin{pmatrix}1&1&0\\0&1&1\end{pmatrix}$ already has rank 2 by inspection — two independent columns are visible without row-reducing), $\text{Im}(T)=\mathbb{R}^2$; any two independent output vectors serve as a basis.

$$\boxed{\text{Im}(T)=\{(1,0),(1,1)\}}, \quad \text{rank}=2$$

**Check:** $\text{rank}+\text{nullity} = 2+1 = 3 = \dim(\mathbb{R}^3)$ ✓.

**The shortcut worth keeping.** Rank of $T$'s matrix bounds everything: read it off the coefficient matrix directly (rank ≤ number of rows, here 2) rather than solving for $\text{Im}(T)$ from scratch — nullity then falls out of Rank-Nullity without a second computation. Where does this break down if $T$ instead mapped into $\mathbb{R}^4$?

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Finding Ker(T) and Im(T)","steps":[{"prompt":"Step 1: To find Ker(T), set the outputs equal to zero. What equations do you need to solve?","hint":"The transformation gives $(x+y, y+z)$. Setting this to $(0, 0)$ yields two equations.","answer":"$x + y = 0$ and $y + z = 0$"},{"prompt":"Step 2: Solve for the free variable. If $y = t$, what are $x$ and $z$ in terms of $t$?","hint":"From the first equation, $x = -y = -t$. From the second, $z = -y = -t$.","answer":"$x = -t$, $z = -t$. Kernel vectors are $t(-1, 1, -1)$, giving basis $\\{(-1, 1, -1)\\}$."},{"prompt":"Step 3: For the image, express $(x+y, y+z)$ as a linear combination. Which vectors form a basis?","hint":"Write $(x+y, y+z) = x(1, 0) + y(1, 1) + z(0, 1)$. Check if all three span vectors are independent in $\\mathbb{R}^2$.","answer":"Any two of the three vectors are independent; the third is in their span. Basis: $\\{(1, 0), (1, 1)\\}$ or $\\{(1, 0), (0, 1)\\}$."},{"prompt":"Step 4: Check rank-nullity. We have nullity = 1 (Ker dimension) and rank = 2 (Im dimension). Does $1 + 2 = 3 = \\dim(\\mathbb{R}^3)$?","hint":"The rank-nullity theorem states: dimension of domain = rank + nullity.","answer":"Yes, $3 = 2 + 1$. The theorem is verified."}],"caption":"Key exam insight: Kernel finds what vanishes; image finds what can be reached. Rank-nullity is your algebra sanity check."}
```
