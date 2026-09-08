---
id: mean-value-theorems.mnemonic
concept_id: mean-value-theorems
atom_type: mnemonic
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
modality: mnemonic
---

**"Same start, same finish, flat somewhere in between"** is Rolle's Theorem in one breath: if $f(a)=f(b)$, some interior point must have slope exactly $0$.

**"Your average slope shows up somewhere along the ride"** extends this to the general Mean Value Theorem: the secant's slope $\frac{f(b)-f(a)}{b-a}$ is guaranteed to equal the tangent's slope $f'(c)$ at some $c$ strictly inside $(a,b)$.

**Worked check:** the 180-km-in-2-hours trip from the hook gives position $f(t)=130t-20t^2$ (so $f(0)=0$, $f(2)=180$). Average slope $=\frac{180-0}{2}=90$. Solve $f'(c)=130-40c=90$, giving $c=1$ — squarely inside $(0,2)$.

**Sanity-check reflex:** whatever $c$ you find, confirm it lies strictly inside the open interval, never at an endpoint. A root landing exactly on $a$ or $b$ is not evidence the theorem applies there — it's a separate, unremarkable coincidence.
