---
id: differentiability.intuition
concept_id: differentiability
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

A derivative is the slope of the single straight line that best hugs a curve at one exact point — zoom in far enough on a differentiable curve and it starts looking indistinguishable from that line. Differentiability is the promise that this zoomed-in line is genuinely unique: however you approach the point, from the left or the right, the local slope settles on the same number.

A corner breaks that promise directly. Zoom in on $|x|$ at $x=0$ and no amount of zooming smooths it out — the left half keeps sloping down at $-1$, the right half keeps sloping up at $+1$, forever, no matter how close you look. There is no single "the" tangent line, only two candidates that disagree.

This is stricter than continuity, which only asks the curve to have no gaps — it says nothing about the *rate* the curve is climbing or falling at. A curve can be perfectly unbroken and still refuse to commit to one slope at a point: a sharp corner, a vertical tangent where the slope itself blows up to infinity, or (rarer, but real) a derivative that exists but oscillates too wildly to be continuous itself. Differentiability asks a genuinely harder question than continuity does, and a "yes" to one is never automatically a "yes" to the other.
