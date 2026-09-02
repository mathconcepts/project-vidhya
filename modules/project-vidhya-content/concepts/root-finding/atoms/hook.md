---
id: root-finding.hook
concept_id: root-finding
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

A GATE calculator can add, multiply, and take square roots — but it cannot factor $x^3-x-1=0$ symbolically, because no such factorization in radicals need exist. The equation still has a real root, and you can pin it down to four decimal places using nothing but arithmetic: guess, check the sign, correct, repeat. That correction loop — turning a rough guess into a precise one within a fixed error budget — is root-finding. Bisection guarantees convergence by brute force, halving the uncertainty every step; Newton-Raphson gets there in far fewer steps by trusting the slope instead.
