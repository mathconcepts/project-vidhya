---
id: regression-correlation.exam-pattern
concept_id: regression-correlation
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions typically give you summary sums** ($n$, $\sum x_i$, $\sum y_i$, $\sum x_i^2$, $\sum x_iy_i$, sometimes $\sum y_i^2$) and ask for $b$, $a$, $r$, or $R^2$ — never raw data pairs to differentiate by hand. Example: $r=0.6$ directly gives $R^2=0.36$, a squaring, not a re-derivation.

- **MCQ/MSQ "which is true" questions target the symmetry-vs-direction distinction:**
  - "$r$ is the same whether you regress $y$ on $x$ or $x$ on $y$" — true, $r$ is symmetric.
  - "The regression slope $b$ is the same in both directions" — **false in general**; $b_{yx}=S_{xy}/S_{xx}$ and $b_{xy}=S_{xy}/S_{yy}$ agree only when $S_{xx}=S_{yy}$.
  - "A high $R^2$ proves $x$ causes $y$" — false; $R^2$ measures fit, not causal mechanism.

- **A frequent short-answer format gives $SS_T$ and $SS_E$ (or $SS_R$) and asks for $R^2$ directly**: $R^2=SS_R/SS_T=1-SS_E/SS_T$ — a one-line substitution once the sum-of-squares identity $SS_T=SS_R+SS_E$ is recalled.

- **A less common but real pattern asks for the OTHER regression line** — $x$ on $y$ instead of $y$ on $x$ — specifically to test whether a student assumes the two coincide. They meet only at $|r|=1$.

- **Time budget:** a summary-statistics regression fit (slope, intercept, and one derived quantity like $R^2$) should cost under 2 minutes; recognize that most of the work is substitution once $\bar{x},\bar{y}$ are found.
