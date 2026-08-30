---
# Alternative body for continuity.intuition, served when the learner stance
# is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: continuity.intuition.assured
concept_id: continuity
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: continuity.intuition
for_stance: assured
---

The classification trap: $\sin(1/x)$ at $x=0$ is discontinuous, but it is none of removable, jump, or infinite — the limit never settles on a value and never diverges to $\pm\infty$; it oscillates through every value in $[-1,1]$ infinitely often as $x\to0$. Calling it "removable" because "$f$ isn't defined there" skips the real reason: there is no limit to fill the hole with.

A second false generalization: "$1/x$ is discontinuous" is imprecise. It is continuous everywhere *on its domain* $\mathbb{R}\setminus\{0\}$, since continuity only makes a claim at points where the function is defined. IVT still needs the domain to be a genuine interval $[a,b]$; a function continuous on $(-\infty,0)\cup(0,\infty)$ but undefined at $0$ gives no license to apply IVT across that gap.

Endpoint continuity on $[a,b]$ needs only the *inward*-facing one-sided limit to match $f(a)$ or $f(b)$ — demanding the outward side too is a fabricated extra condition, since $f$ was never defined beyond the interval in the first place.
