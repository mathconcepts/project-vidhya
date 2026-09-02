---
# Alternative body for ode-classification.hook, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, explicit
# check at the end. No praise, no reassurance, no mention of feelings.
id: ode-classification.hook.shaken
concept_id: ode-classification
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: ode-classification.hook
for_stance: shaken
---

Start with one equation: $y'' + (y')^3 = 0$. First question: what is the highest derivative present? It is $y''$, so order $=2$. Second question: is every derivative a whole-number power? Yes — no roots, no trig of a derivative — so degree is defined. Look at the power on $y''$ *specifically*: it is $1$ here (the cubed term is $y'$, not $y''$), so degree $=1$. Third question: does $y$ or any derivative multiply another, or sit inside a nonlinear function? $(y')^3$ raises a derivative to a power other than one, so the equation is non-linear. Check: order $2$, degree $1$, non-linear — three separate questions, three separate answers.
