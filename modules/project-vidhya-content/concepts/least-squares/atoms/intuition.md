---
id: least-squares.intuition
concept_id: least-squares
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
---

Same projection matrix as the hook: $P=\begin{pmatrix}0.8&0.4\\0.4&0.2\end{pmatrix}$. Feed it the arrow $(2,1)$ and it lands right back on $(2,1)$ — untouched, because $(2,1)$ already sits on the one line $P$ keeps. Feed it the perpendicular arrow $(1,-2)$ and it lands at $(0,0)$ — fully crushed, because that direction carries nothing the line has room for.

Any other arrow you feed in lands somewhere between those two extremes, on the same line as $(2,1)$, at whatever point on it is *closest* to where the arrow started. That "closest point on the line" move is exactly what least squares does to a system $Ax=b$ that has no exact solution: it replaces $b$ with the nearest point $Pb$ that the columns of $A$ (the line, or more generally the plane or space they span, called $\text{Col}(A)$) can actually reach.

The piece left over, $b-Pb$, is called the **residual**. Because the crushed direction here, $(1,-2)$, is exactly perpendicular ("orthogonal," meeting at a right angle) to the kept direction $(2,1)$ — check: $(1,-2)\cdot(2,1)=1\times2+(-2)\times1=0$ — the residual always ends up perpendicular to every column of $A$. That one fact is what the rest of least squares is built on.
