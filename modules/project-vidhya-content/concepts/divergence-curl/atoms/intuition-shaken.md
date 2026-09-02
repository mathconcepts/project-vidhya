---
# Alternative body for divergence-curl.intuition, served when the learner
# stance is `shaken`. Concrete-first, smallest true step, arithmetic in
# full, explicit check at the end.
id: divergence-curl.intuition.shaken
concept_id: divergence-curl
atom_type: intuition
bloom_level: 2
difficulty: 0.12
exam_ids: ["*"]
modality: visual
variant_of: divergence-curl.intuition
for_stance: shaken
---

Take $\mathbf F=(x,y)$.

**Step 1 — divergence.** $\partial_x(x)+\partial_y(y)=1+1=2$. Positive: a source.

**Step 2 — curl.** $\partial_x(y)-\partial_y(x)=0-0=0$. Zero: no spin.

Now take $\mathbf G=(-y,x)$.

**Step 3 — divergence.** $\partial_x(-y)+\partial_y(x)=0+0=0$. Zero: no source.

**Step 4 — curl.** $\partial_x(x)-\partial_y(-y)=1-(-1)=2$. Positive: spin.

**Check.** $\mathbf F$ scores $(\operatorname{div},\operatorname{curl})=(2,0)$; $\mathbf G$ scores $(0,2)$. Each field passes one test and fails the other completely.
