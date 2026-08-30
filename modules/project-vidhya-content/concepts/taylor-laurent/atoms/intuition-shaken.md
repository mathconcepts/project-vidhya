---
# Alternative body for taylor-laurent.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: taylor-laurent.intuition.shaken
concept_id: taylor-laurent
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: taylor-laurent.intuition
for_stance: shaken
---

Take $f(z)=\dfrac1{1-z}$ near $z=0$: differentiating repeatedly gives $f^{(n)}(0)=n!$, so $a_n=\frac{f^{(n)}(0)}{n!}=1$ for every $n$, and $f(z)=\sum_{n=0}^\infty z^n=1+z+z^2+\cdots$ — a Taylor series. Inside its radius of convergence $|z|<1$, that sum *is* $f$ exactly, not an approximation.

The same function has a pole at $z=1$; expanding around $z=1$ instead needs negative powers of $(z-1)$: $f(z)=\sum_{n=-\infty}^\infty a_n(z-1)^n$, a **Laurent** series. Negative-power terms ($n<0$) form the **principal part**; non-negative terms form the **regular part**.

Count the principal part's terms to classify: zero negative terms is removable; exactly $m$ negative terms (worst $a_{-m}$) is a pole of order $m$; infinitely many is essential.

$a_{-1}$ is the **residue** — read straight off the series, feeding directly into the residue theorem.

Get the mechanics — partial fractions, geometric series — solid first; classification then falls out of the series by inspection.
