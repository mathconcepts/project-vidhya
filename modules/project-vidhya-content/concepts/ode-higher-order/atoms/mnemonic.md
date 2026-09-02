---
id: ode-higher-order.mnemonic
concept_id: ode-higher-order
atom_type: mnemonic
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: mnemonic
---

**F.A.C.T.** for any order $n$:

- **F**actor the auxiliary polynomial completely — don't stop at the first root.
- **A**ssign each root's contribution by its type (real, repeated, complex, repeated-complex).
- **C**ount: the total constants across every contribution must equal $n$.
- **T**est by re-multiplying your factored roots back out to confirm the original polynomial.

**Worked micro-example:** $y^{(4)}-y=0$. Auxiliary: $r^4-1=0=(r^2-1)(r^2+1)=(r-1)(r+1)(r^2+1)$. Roots: $1,-1,\pm i$ — four simple roots for a fourth-order equation. Assign: $C_1e^{x}+C_2e^{-x}+C_3\cos x+C_4\sin x$. Count: four constants for $n=4$ ✓.

**Sanity-check reflex:** multiply $(r-1)(r+1)(r^2+1)$ back out and confirm it reproduces $r^4-1$ before trusting the roots.
