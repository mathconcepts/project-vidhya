---
id: change-of-basis.intuition
concept_id: change-of-basis
atom_type: intuition
bloom_level: 2
difficulty: 0.1
modality: visual
exam_ids: ["*"]
---

A basis is a choice of ruler, and coordinates are what you read off that ruler. $[x]_B$ answers "how many of each basis vector, added together, makes $x$?" — change the basis, and the same $x$ gets a new answer to that question, even though $x$ itself never moved.

The change-of-basis matrix $P$ packages this translation as one matrix multiplication instead of solving a fresh system every time: its columns are the *new* basis vectors, written in the *old* coordinates. Multiplying by $P$ converts new-basis coordinates into old-basis coordinates; multiplying by $P^{-1}$ goes the other way.

This matters beyond bookkeeping. A linear transformation's matrix representation is basis-dependent — the same transformation $T$ can look like a messy matrix in the standard basis and a clean diagonal matrix in a basis built from its eigenvectors. Choosing the right basis is often the entire trick to a problem, not a formality before it.
