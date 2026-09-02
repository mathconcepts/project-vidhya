---
id: regression-correlation.mnemonic
concept_id: regression-correlation
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"The line is homesick — it always returns to $(\bar{x},\bar{y})$."** Whatever $a$ and $b$ come out to, plugging $x=\bar{x}$ back into $\hat{y}=a+bx$ always gives $\hat{y}=\bar{y}$ exactly. This is not a coincidence of one dataset; it is a property of the least-squares fit itself.

**Worked micro-example:** $a=2.6,\ b=0.8,\ \bar{x}=3,\ \bar{y}=5$. Check: $\hat{y}|_{x=3}=2.6+0.8(3)=2.6+2.4=5=\bar{y}$ ✓.

**"$R$ squared is never the same as $R$."** $R^2=r^2$ — always squared, always non-negative, and it throws away the sign. A correlation of $r=-0.8$ (strong negative) and $r=+0.8$ (strong equally strong positive) give the identical $R^2=0.64$; only $r$ itself tells you the direction.

**Sanity-check reflex:** after fitting any $\hat{y}=a+bx$, substitute $x=\bar{x}$ and confirm you land on $\bar{y}$. If you don't, $a$ or $b$ was computed wrong — this check costs one substitution and catches nearly every arithmetic slip in the fit.
