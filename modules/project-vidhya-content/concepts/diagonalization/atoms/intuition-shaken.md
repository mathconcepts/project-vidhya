---
# Alternative body for diagonalization-intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: diagonalization.intuition.shaken
concept_id: diagonalization
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: diagonalization-intuition
for_stance: shaken
---

## One example first

Take $A = \begin{pmatrix} 4 & 1 \\ 2 & 3 \end{pmatrix}$. Its eigenvalues are $5$ and $2$; its eigenvectors are $(1,1)$ and $(1,-2)$.

Stack the eigenvectors as columns: $P = \begin{pmatrix} 1 & 1 \\ 1 & -2 \end{pmatrix}$. Put the eigenvalues on a diagonal, same order: $D = \begin{pmatrix} 5 & 0 \\ 0 & 2 \end{pmatrix}$.

$$A = PDP^{-1}$$

Same matrix, rewritten so the middle piece only scales.

## Why bother

$A^{100}$ the ordinary way is 100 matrix multiplications. $D^{100}$ is two numbers each raised to a power. $A^{100} = PD^{100}P^{-1}$ turns the hard problem into the easy one.

## When it works

Count independent eigenvectors. An $n\times n$ matrix needs $n$ of them. Two free guarantees: all eigenvalues distinct, or $A$ symmetric ($A=A^T$).

## The check

Multiply $PDP^{-1}$ back out. If you don't land on $A$, a column of $P$ is out of order with $D$ — column $i$ of $P$ must match diagonal entry $i$ of $D$.
