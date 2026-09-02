---
id: change-of-basis.exam-pattern
concept_id: change-of-basis
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **It rarely gets asked by name.** "Find the matrix representation of $T$ with respect to basis $B$" or "express $x$ in terms of the given basis" are change-of-basis questions wearing a different label. Recognizing the disguise is most of the work.

- **NAT questions usually want one coordinate.** "The coefficient of $v_2$ in the representation of $x$" is one entry of $[x]_B$ — solve the linear system (or invert $P$) only as far as that one component, not the whole vector, if that's all the stem asks for.

  Example: for $B=\{(1,1),(1,-1)\}$ and $x=(5,1)$, solving $a+b=5,\ a-b=1$ gives $a=3$ (verified) directly, without also needing $b$ if only $a$ was asked.

- **The trap GATE likes: which direction the matrix goes.** A question giving $P$ with columns in old-basis coordinates and then asking for new-basis coordinates wants $P^{-1}$, not $P$. Options built from $P$ applied backwards are a standard distractor.

- **The similarity-transform framing.** "If $T$ has matrix $A$ in the standard basis, find its matrix in basis $B=\{v_1,v_2\}$" is $P^{-1}AP$ with $P=[v_1\mid v_2]$. When $B$ is an eigenbasis of $A$, this collapses to the diagonal matrix of eigenvalues — recognizing that shortcut turns a matrix-multiplication question into a two-line one.

- **Time budget:** a $2\times2$ coordinate conversion, either direction, is under 90 seconds — set up $P$, invert if needed, multiply. If you're solving simultaneous equations from scratch each time instead of building $P$ once, you're repeating work the matrix already does for you.
