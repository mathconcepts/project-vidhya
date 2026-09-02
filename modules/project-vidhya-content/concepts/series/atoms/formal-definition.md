---
id: series.formal_definition
concept_id: series
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Convergence of a series.** For a series $\sum_{n=1}^{\infty} a_n$, define the partial sum $S_N=\sum_{n=1}^{N}a_n$. The series **converges** to $S$ if $\lim_{N\to\infty}S_N=S$; otherwise it **diverges**.

**Ratio Test.** Let $L=\lim_{n\to\infty}\left|\dfrac{a_{n+1}}{a_n}\right|$. If $L<1$, $\sum a_n$ converges absolutely; if $L>1$ (or $L=\infty$), it diverges; if $L=1$, the test is **inconclusive**.

**Method selector:** reach for the ratio test when the general term is a **product** — factorials, $n$-th powers, or both ($n!$, $r^n$, $n^n$) — since consecutive-term ratios collapse those cleanly. Don't reach for the comparison test here out of habit: it needs an explicit, already-known comparison series to bound $a_n$ against, which is exactly the step that's hard to find for a factorial-heavy term; the ratio test needs no such series at all.
