---
# Alternative body for divergence-curl.hook, served when the learner stance
# is `shaken`. Concrete-first, smallest true step, arithmetic in full,
# explicit check at the end.
id: divergence-curl.hook.shaken
concept_id: divergence-curl
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: divergence-curl.hook
for_stance: shaken
---

Take $\mathbf F(x,y)=(x,y)$, so $P=x$ and $Q=y$.

**Divergence.** $\operatorname{div}\mathbf F=\dfrac{\partial P}{\partial x}+\dfrac{\partial Q}{\partial y}=1+1=2$. Positive — a source at every point.

**Curl (2D).** $\dfrac{\partial Q}{\partial x}-\dfrac{\partial P}{\partial y}=0-0=0$. Zero — no spin anywhere.

**Check.** The field's arrows all point straight outward from the centre with no visible rotation, matching curl $=0$. Answer to the opening question: this field has a source, not a spin.
