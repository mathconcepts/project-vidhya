---
id: hypothesis-testing.mnemonic
concept_id: hypothesis-testing
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"If $p$ is low, $H_0$ must go."** The entire decision rule in one rhyme: compare the p-value to $\alpha$, and a small p-value is the signal to reject.

**Worked micro-example:** $p=0.02$, $\alpha=0.05$. Since $0.02<0.05$, $p$ is low — $H_0$ goes. Reject.

**SIZE vs POWER, so the two errors never swap.** $\alpha$ is the test's **SIZE** — the false-alarm rate you fixed *before* seeing data. $1-\beta$ is its **POWER** — how often it correctly catches a real effect. Size is a promise you make in advance; power is a property of the test given the truth. Confusing them (treating $\alpha$ as "how often I'm right") is the single most common conceptual slip in this topic.

**Sanity-check reflex:** after any test statistic, ask "does the sign make sense?" — a negative $z$ or $t$ means $\bar{x}<\mu_0$; if the alternative was one-sided the other way, you've already got your answer without touching a table.
