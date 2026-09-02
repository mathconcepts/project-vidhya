---
id: laplace-transform.interleaved-drill
concept_id: laplace-transform
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: Laplace transform → inverse Laplace transform.**

**Q1.** Find $\mathcal{L}\{t\,e^{-2t}\}$.

**A1.** Using the "multiplication by $t$" rule, $\mathcal{L}\{t\,f(t)\} = -\dfrac{d}{ds}F(s)$, applied to $F(s)=\dfrac{1}{s+2}$: $-\dfrac{d}{ds}\left(\dfrac{1}{s+2}\right) = \dfrac{1}{(s+2)^2}$. Equivalently, this matches the direct pair $t\,e^{at}\leftrightarrow \dfrac{1}{(s-a)^2}$ with $a=-2$.

**Q2.** Now find $\mathcal{L}^{-1}\left\{\dfrac{1}{(s+2)^2}\right\}$ and confirm it recovers what you started with.

**A2.** The denominator $(s+2)^2$ is a repeated pole at $s=-2$, so the inverse pair is $\dfrac{1}{(s+a)^2}\leftrightarrow t\,e^{-at}$ with $a=2$: $\mathcal{L}^{-1}\left\{\dfrac{1}{(s+2)^2}\right\} = t\,e^{-2t}$ — exactly Q1's starting function.

**Why this drill exists:** students often treat "build the transform" and "invert the transform" as two unrelated skill sets — one a rule to apply, the other a partial-fractions recipe to follow. Running the same repeated-pole pair in both directions on one problem makes it visible that they're the same pole-location fact read forwards and backwards, not two separate things to memorise.
