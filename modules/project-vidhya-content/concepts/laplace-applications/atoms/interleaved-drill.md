---
id: laplace-applications.interleaved-drill
concept_id: laplace-applications
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: Laplace applications → Laplace transform.**

**Q1.** A circuit obeys $i' + 4i = 8$, $i(0)=0$. Solve for $i(t)$.

**A1.** Transform: $sI(s)+4I(s)=8/s \Rightarrow I(s)=\dfrac{8}{s(s+4)}$. Cover-up: at $s=0$, $A=2$; at $s=-4$, $B=-2$. So $I(s)=\dfrac{2}{s}-\dfrac{2}{s+4}$, giving $i(t)=2(1-e^{-4t})$.

**Q2.** Before trusting that answer, use the Laplace transform concept's initial value theorem — $i(0^+)=\lim_{s\to\infty}sI(s)$ — directly on $I(s)$ without inverting. Does it match the given $i(0)=0$?

**A2.** $\displaystyle\lim_{s\to\infty} s\cdot\frac{8}{s(s+4)} = \lim_{s\to\infty}\frac{8}{s+4} = 0$ — matching $i(0)=0$ exactly, with no partial fractions required.

**Why this drill exists:** the initial and final value theorems are introduced in the Laplace transform concept as properties to memorise, easy to forget once the applications problems start. This pairing shows they're a free, inversion-free check on every applications answer — a sign error in cover-up survives the algebra but usually breaks this check, catching it before the wrong final answer is submitted.
