---
id: sequences.intuition
concept_id: sequences
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

Picture the terms of a sequence as a walk along the number line — one landing point per step, in order, forever. $a_n=\dfrac{2n+1}{n}$ walks toward $2$ and never leaves once it arrives close enough: draw any window around $2$, however narrow — say width $0.001$ — and eventually every later step lands inside it and stays. "Eventually stays inside every window, however narrow" is the whole content of convergence. Nothing about how the terms arrived matters, only where they end up, forever after.

Not every walk behaves this way. $a_n=(-1)^n$ never settles into any window narrower than the full swing from $-1$ to $1$ — it keeps re-visiting both ends, so no single target point ever holds all the later terms. $a_n=n$ walks off past every window, however wide, so it diverges by escaping rather than by oscillating.

Three fates, one picture: settle into an ever-narrower cage around one point (converges), bounce between two or more regions forever (diverges by oscillation), or leave every finite cage behind (diverges to infinity). A sequence is defined by which of the three its walk commits to — and the walk's first thousand steps tell you nothing certain about which one it is.
