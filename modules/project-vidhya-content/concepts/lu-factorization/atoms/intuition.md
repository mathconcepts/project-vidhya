---
id: lu-factorization.intuition
concept_id: lu-factorization
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
---

# The Two-Stage Transformation

Imagine a linear system as a two-stage process. The **lower triangular matrix $L$** encodes the elementary row operations that simplify the system, while the **upper triangular matrix $U$** is the simplified form itself. Together, $A = LU$ says: "I can reach the simple form by first applying $L$'s operations, then reading off $U$." This separation is powerful—once you know $L$ and $U$, solving $Ax = b$ becomes two fast back-substitution passes instead of one slow Gaussian elimination.
