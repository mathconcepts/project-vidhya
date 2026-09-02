---
id: greens-theorem.mnemonic
concept_id: greens-theorem
atom_type: mnemonic
bloom_level: 2
difficulty: 0.6
exam_ids: ["*"]
modality: mnemonic
---

**"Green's is a determinant, not a new formula."** The circulation density $\partial Q/\partial x-\partial P/\partial y$ is exactly the $2\times2$ determinant of the operator row over the field row: $\begin{vmatrix}\partial_x & \partial_y\\ P & Q\end{vmatrix}=\partial_x Q-\partial_y P$ — the same expand-by-determinant move already familiar from the cross product, so there's nothing new to memorize, only a new place to use it.

**Worked micro-example.** Take $P=-y,\ Q=x$: the density is $\partial_x Q-\partial_y P=1-(-1)=2$. Green's Theorem then gives $\oint_C -y\,dx+x\,dy=\iint_D 2\,dA=2\cdot\pi(1)^2=2\pi$ over the unit circle — the classic "walk the boundary, read off the area" identity, doubled.

**Sanity-check reflex:** glance at the sign of the density before trusting the number. A negative density paired with a positive (counterclockwise) curve means net clockwise circulation — a positive final answer sitting on top of a negative density is a sign flip waiting to be caught.
