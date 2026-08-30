---
# Alternative body for continuity.worked_example, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: continuity.worked_example.assured
concept_id: continuity
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: continuity.worked_example
for_stance: assured
---

$\dfrac{x^2-4}{x-2}$ at $x=2$ gives $\frac00$ — the cue to factor and cancel rather than walk the three conditions in order: $\dfrac{(x-2)(x+2)}{x-2}=x+2$ for $x\neq2$, so $\lim_{x\to2}f(x)=4$ while $f(2)$ itself is undefined. Limit exists, value doesn't: removable, by inspection.

**Answer:** discontinuous at $x=2$; removable, repaired by defining $\tilde f(2)=4$.

The distinction that costs marks: a $\frac00$ form only signals *removable* when the offending factor cancels cleanly. If the one-sided limits had disagreed instead — say $3$ from the left, $5$ from the right — no redefinition at the single point $x=2$ could fix it; that is a jump, and jumps are not repaired by patching one value, only removable discontinuities are. Confusing the two is the gap between "discontinuous, removable" and "discontinuous, hence removable" — the second does not follow from the first.

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: classifying the removable discontinuity at x = 2","steps":[{"prompt":"Apply the three-condition checklist to $f(x) = \\frac{x^2-4}{x-2}$ at $x=2$. Which condition fails first, and why?","hint":"Substitute $x=2$ directly into the formula. What happens to the denominator?","answer":"**Condition 1 fails.** $f(2) = \\frac{0}{0}$ is undefined — the denominator is zero, so the function is not defined at $x=2$."},{"prompt":"Even though $f(2)$ is undefined, compute $\\lim_{x \\to 2} f(x)$ and name the type of discontinuity.","hint":"Factor $x^2-4 = (x-2)(x+2)$ and cancel the $(x-2)$ term before substituting.","answer":"$\\lim_{x \\to 2}(x+2) = 4$. The limit exists, but $f(2)$ is undefined, so this is a **removable discontinuity**. Redefining $f(2)=4$ makes the function continuous."}]}
```
