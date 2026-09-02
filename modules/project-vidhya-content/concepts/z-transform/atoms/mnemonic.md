---
id: z-transform.mnemonic
concept_id: z-transform
atom_type: mnemonic
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: mnemonic
---

**The device: in the circle, in control.** For a causal sequence, a pole's distance from the origin decides everything about long-run behaviour, and the unit circle is the only boundary that matters:

- Pole strictly **inside** $|z|=1$ → the term decays; the sequence is stable.
- Pole strictly **outside** → the term grows without bound.
- Pole **on** the circle itself → neither: a bounded oscillation (or a constant, at $z=1$) that never settles and never blows up — the case worth naming separately rather than lumping into "inside or on."

Pair it with the delay reflex: $z^{-1}$ is not a new kind of number, it's one sample of delay, full stop.

**Worked micro-example.** $X(z)=\dfrac{z}{z-0.3}$ names $x[n]=(0.3)^n u[n]$ for the causal ROC $|z|>0.3$. The pole sits at $z=0.3$, magnitude $0.3 < 1$ — inside the circle, so the prediction is a decaying sequence before you write a single value: $x[0]=1$, $x[1]=0.3$, $x[2]=0.09$, shrinking toward $0$, exactly as "inside the circle" promised.

**Sanity-check reflex:** find the pole's magnitude and compare it to $1$ before labelling anything stable or unstable — and treat a pole sitting exactly on the circle as its own case, not as a rounding error toward one side or the other.
