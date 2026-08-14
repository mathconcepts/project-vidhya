---
id: gram-schmidt.intuition
concept_id: gram-schmidt
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
---

# Gram-Schmidt Process: Intuition

Imagine building a coordinate system vector by vector. You start with your first vector and normalize it (make it unit length). Then, for the next vector, you notice it has a "shadow" or component pointing in the direction of the first vector — that component doesn't help you explore new directions. So you subtract it away, leaving only the orthogonal part. Normalize that remainder, and you have your second basis vector. Repeat: each new vector gets cleaned of all its projections onto the previous (already-clean) vectors, then normalized.

This process guarantees that the resulting vectors are all perpendicular to each other and have unit length — a property called **orthonormality** — and they span the same subspace as the originals.