---
id: straight-lines.intuition-assured
concept_id: straight-lines
atom_type: intuition
bloom_level: 2
difficulty: 0.1
modality: visual
exam_ids: ["*"]
variant_of: straight-lines.intuition
for_stance: assured
---

The reasoning behind $L_1+\lambda L_2=0$ generalises past pairs of lines: it works for any two curves $S_1=0$, $S_2=0$ that already share a point, since anything satisfying both makes $S_1+\lambda S_2=0$ true for every $\lambda$ by the identical argument. This is exactly how "family of circles through the intersection of two circles" and "circle through the intersection of a circle and a line" both get written down later — same one-line proof, not a new trick each time.

One distinction worth keeping straight: $L_1+\lambda L_2=0$ can approach $L_2=0$ as $\lambda$ grows without bound, but no finite $\lambda$ ever equals it exactly — $L_2$ is the one line through $P$ this parametrisation cannot express. If a problem's extra condition happens to be satisfied only by $L_2$ itself, solving for $\lambda$ turns up nothing, and that non-existence, not an algebra error, is the correct read.

Angle between two lines, by contrast, needs no such family machinery: $\tan\theta=\left|\dfrac{m_1-m_2}{1+m_1m_2}\right|$ answers it directly from slopes alone.
