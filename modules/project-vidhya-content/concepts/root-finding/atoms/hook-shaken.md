---
# Alternative body for root-finding.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: root-finding.hook.shaken
concept_id: root-finding
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: root-finding.hook
for_stance: shaken
---

$f(x)=x^3-x-1$ equals $0$ somewhere between $x=1$ and $x=2$: $f(1)=-1$, $f(2)=5$ — opposite signs. Check the midpoint, $x=1.5$: $f(1.5)=0.875$, positive. So the root is between $1$ and $1.5$ now, not $1$ and $2$ — the search space just cut in half from one sign check. Repeating this — check the sign at the midpoint, keep the half that changed sign, discard the other — is the entire bisection method.
