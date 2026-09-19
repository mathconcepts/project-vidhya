---
id: oscillations-shm.intuition-assured
concept_id: oscillations-shm
atom_type: intuition
variant_of: oscillations-shm.intuition
for_stance: assured
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

A pendulum swinging periodically, restoring toward the bottom every time, looks like enough to justify $T=2\pi\sqrt{L/g}$. It is not — that formula holds only under the **small-angle approximation**, $\sin\theta\approx\theta$ (in radians), and being periodic and restoring is not, on its own, enough to make something SHM.

Counterexample: swing the pendulum through $60^\circ$. Here $\sin60^\circ\approx0.866$ while $60^\circ$ in radians is $\approx1.047$ — a $17\%$ gap, far too large to treat as equal. The true restoring force is $-mg\sin\theta$, not $-mg\theta$, so this motion is genuinely periodic and restoring but is **not** true SHM at this amplitude. Its real period runs measurably longer than $2\pi\sqrt{L/g}$ predicts, and — unlike true SHM, where period never depends on amplitude — this period *does* grow with amplitude once the small-angle approximation breaks down.
