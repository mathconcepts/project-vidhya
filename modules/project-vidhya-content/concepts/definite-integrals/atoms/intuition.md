---
id: definite-integrals.intuition
concept_id: definite-integrals
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
---

Split $\int_0^2 x^2\,dx$ into thin rectangles: use $4$ strips of width $0.5$ and the running sum is $1.75$; use $8$ strips and it creeps to $2.1875$; keep shrinking the strips and the running sum closes in on a single exact number: $\tfrac83$. That limiting process — sum infinitely many infinitesimal slices — is what a definite integral literally is.

There is a shortcut that skips the slicing entirely. Find any antiderivative $F$ of the integrand, and just subtract: $F(b)-F(a)$. For $\int_0^2 x^2\,dx$, $F(x)=\tfrac{x^3}{3}$, so $F(2)-F(0)=\tfrac83-0=\tfrac83$ — the same number the strips were converging to. That agreement is the **Fundamental Theorem of Calculus**, and it means you almost never need to think about slicing directly on an exam.

A few properties turn ten-minute problems into two-minute ones: linearity lets a sum split apart term by term; additivity lets an interval split at any point $c$, in or out of $[a,b]$; and symmetry over $[-a,a]$ collapses an odd integrand's answer to $0$ and doubles an even one's — reading the integrand's parity before computing anything is often the fastest first move on this topic.
