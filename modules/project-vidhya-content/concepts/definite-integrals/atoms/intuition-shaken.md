---
# Alternative body for definite-integrals.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: definite-integrals.intuition.shaken
concept_id: definite-integrals
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
variant_of: definite-integrals.intuition
for_stance: shaken
---

$\int_0^2 x^2\,dx$, using $4$ strips of width $0.5$. Heights at each strip's start: $0,\ 0.25,\ 1,\ 2.25$. Strip areas: $0,\ 0.125,\ 0.5,\ 1.125$. Total: $1.75$.

Use the shortcut instead: find an antiderivative, $F(x)=\tfrac{x^3}{3}$, and subtract. $F(2)-F(0)=\tfrac83-0=\tfrac83\approx2.667$. More strips would push the sliced estimate closer to this exact value.

Check: does the sliced estimate ($1.75$, only $4$ strips) sit below the exact value ($2.667$)? Yes — with $x^2$ increasing on $[0,2]$, starting-height rectangles always undercount, so a low estimate here is expected, not a mistake.
