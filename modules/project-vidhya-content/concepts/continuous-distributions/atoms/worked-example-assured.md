---
# Alternative body for continuous-distributions.worked-example, served
# when the learner stance is `assured`. See src/content/stance-variants.ts.
id: continuous-distributions.worked-example.assured
concept_id: continuous-distributions
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: continuous-distributions.worked-example
for_stance: assured
---

Same setup, $\boxed{P(40<X<70)=0.8186}$. Worth flagging: this range is *not* symmetric about $\mu=50$ ($z=-1$ to $z=2$, not $-1$ to $1$), so the shortcut "$2\Phi(z)-1$" that works for symmetric intervals doesn't apply here — that shortcut only holds when both endpoints sit the same distance from the mean. For an asymmetric range, always compute $\Phi(z_2)-\Phi(z_1)$ directly, keeping the sign on $z_1$ correct: $\Phi(-1)=1-\Phi(1)$, not $-\Phi(1)$. Dropping that identity is the single most common sign error on this exact question type.
