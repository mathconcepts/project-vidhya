---
# Alternative body for discrete-distributions.worked-example, served when
# the learner stance is `assured`. See src/content/stance-variants.ts.
id: discrete-distributions.worked-example.assured
concept_id: discrete-distributions
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: discrete-distributions.worked-example
for_stance: assured
---

Same setup, $\boxed{P(X=2)=0.3087}$. The number worth keeping past this one question: $E[X]=np=1.5$ and $\text{Var}(X)=np(1-p)=1.05$ describe the *whole* distribution's center and spread without computing a single $P(X=k)$ term — useful the moment a question asks for the mean or variance directly rather than one specific probability. Don't reach for $\sum k\cdot P(X=k)$ by hand when the closed form $np$ is available; that sum reproduces $np$ exactly for Binomial, but at far higher arithmetic cost.
