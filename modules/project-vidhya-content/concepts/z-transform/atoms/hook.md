---
id: z-transform.hook
concept_id: z-transform
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
---

The Z-transform is the discrete-time counterpart of the Laplace transform. While Laplace handles continuous-time signals (analog), the Z-transform handles discrete-time sequences (digital samples). Instead of $e^{st}$, you use $z^{-n}$ where $n$ is the sample index. It's how digital signal processors (DSPs), filters, and control systems analyze sequences: turn a recurrence relation into an algebraic equation, solve in the $z$-domain, and inverse-transform back.
