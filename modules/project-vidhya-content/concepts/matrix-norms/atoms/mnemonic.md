---
id: matrix-norms.mnemonic
concept_id: matrix-norms
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**Four norms, four instincts:** $\|A\|_1$ reads **down** columns (sum absolute values, take the largest column). $\|A\|_\infty$ reads **across** rows (sum absolute values, take the largest row). $\|A\|_F$ **flattens** the whole matrix into one long vector and takes its ordinary length. $\|A\|_2$ asks the real geometric question: the true worst-case stretch, $\sigma_{\max}$.

**Numeric shortcut:** for a diagonal (or triangular, using the diagonal) matrix, sanity-check $\|A\|_2$ against the largest $|d_i|$ on the diagonal — for a genuinely diagonal matrix they must be exactly equal, since the diagonal entries ARE the singular values there.

$$\kappa_2(A)=\frac{\sigma_{\max}}{\sigma_{\min}}\geq1$$

**Sanity-check reflex:** after computing $\kappa_2$, confirm it's $\geq1$, and confirm the product of all singular values matches $|\det(A)|$ for a square matrix — a condition number under $1$, or a singular-value product missing $|\det(A)|$, means an arithmetic slip upstream.

```interactive-spec
{"v":1,"kind":"manipulable","title":"Diagonal matrix, condition number live: sigma_max / sigma_min","why":"For a diagonal matrix the singular values ARE the |diagonal entries| — drag them and watch the condition number and singular-value product move together.","inputs":[{"id":"d1","label":"d1","min":1,"max":9,"step":1,"initial":5},{"id":"d2","label":"d2","min":1,"max":9,"step":1,"initial":2}],"outputs":[{"label":"sigma_max = max(|d1|,|d2|)","formula":"max(abs(d1),abs(d2))","digits":2},{"label":"sigma_min = min(|d1|,|d2|)","formula":"min(abs(d1),abs(d2))","digits":2},{"label":"kappa_2 = sigma_max / sigma_min","formula":"max(abs(d1),abs(d2))/min(abs(d1),abs(d2))","digits":2},{"label":"sigma_max * sigma_min (should match |det(A)|)","formula":"max(abs(d1),abs(d2))*min(abs(d1),abs(d2))","digits":2},{"label":"|det(A)| = |d1 * d2|","formula":"abs(d1*d2)","digits":2}],"caption":"sigma_max times sigma_min always equals |det(A)| exactly for a diagonal matrix — the sanity-check reflex, live."}
```
