---
id: trace.formal_definition
concept_id: trace
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

## Definition

The **trace** of an $n \times n$ matrix $A$ is the sum of its diagonal elements:
$$\text{tr}(A) = \sum_{i=1}^{n} a_{ii}$$

## Key Theorem: Trace and Eigenvalues

For any square matrix $A$ with eigenvalues $\lambda_1, \lambda_2, \ldots, \lambda_n$ (counting algebraic multiplicity),
$$\text{tr}(A) = \sum_{i=1}^{n} \lambda_i$$

**Corollary (Cyclic Property):** For any matrices $A \in \mathbb{R}^{m \times n}$ and $B \in \mathbb{R}^{n \times m}$,
$$\text{tr}(AB) = \text{tr}(BA)$$

This holds because both products yield the same non-zero eigenvalues (the zero spectrum differs only in multiplicity between $AB$ and $BA$).

## Property: Linearity

Trace is a linear functional:
- $\text{tr}(A + B) = \text{tr}(A) + \text{tr}(B)$
- $\text{tr}(cA) = c \cdot \text{tr}(A)$ for scalar $c$

## Method selector

Use $\text{tr}(A) = \sum\lambda_i$ to **check** eigenvalues already found some other way — not to derive them outright. The trace is one equation in $n$ unknowns, so infinitely many eigenvalue sets share the same sum; it confirms a candidate answer in one glance but a student who tries to *solve for* the eigenvalues from trace alone (with no other equation) has under-constrained the problem.
