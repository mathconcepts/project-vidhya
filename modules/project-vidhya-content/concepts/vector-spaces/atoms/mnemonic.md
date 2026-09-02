---
id: vector-spaces.mnemonic
concept_id: vector-spaces
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**Subspace test = "Zero, Add, Scale."** Three checks, in that order — and the order is the trick:

1. **Zero** — is $\mathbf{0}\in W$?
2. **Add** — $u,v\in W \Rightarrow u+v\in W$?
3. **Scale** — $c\in\mathbb{F},v\in W \Rightarrow cv\in W$?

Always run Zero first — it's the fastest disqualifier. $\{(x,y,z):x+y+z=1\}$ dies in five seconds: substitute $(0,0,0)$, get $0\neq1$, done.

**The shape rule (what to look for before testing anything):** a subspace is defined by equations that are **homogeneous and linear**.

> **A constant term or a curve kills it.**

Any $=1$ on the right, any square, product, or inequality means "not a subspace." $x+2y=0$ ✓. $x+2y=1$ ✗. $x^2+y^2=1$ ✗. $xy=0$ ✗.

**Once it passes, name the dimension immediately.** The solution set of $k$ independent homogeneous equations in $\mathbb{R}^n$ is the null space of a $k\times n$ matrix, so $\dim W = n-k$ by rank–nullity.

**Counting facts to have cold:** $\dim\mathbb{R}^n=n$; $\dim P_n = n+1$ (the $+1$ is the constant term); $\dim M_{m\times n}=mn$.
