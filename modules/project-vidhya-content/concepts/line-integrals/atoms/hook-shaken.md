---
# Alternative body for line-integrals.hook, served when the learner stance
# is `shaken`. Concrete-first, smallest true step, arithmetic in full,
# explicit check at the end.
id: line-integrals.hook.shaken
concept_id: line-integrals
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: line-integrals.hook
for_stance: shaken
---

Take $\mathbf F(x,y)=(-y,x)$ and the unit circle $x=\cos t,\ y=\sin t$, $t:0\to2\pi$ — a closed loop, back where it began.

**Step 1 — velocity.** $\mathbf r'(t)=(-\sin t,\cos t)$.

**Step 2 — dot product.** $\mathbf F\cdot\mathbf r'=(-\sin t)(-\sin t)+(\cos t)(\cos t)=\sin^2t+\cos^2t=1$.

**Step 3 — integrate.** $\int_0^{2\pi}1\,dt=2\pi$.

**Check.** The path returns exactly to its start, yet the total work is $2\pi$, not $0$. Work along this field depends on the path taken, not only on where it starts and ends.
