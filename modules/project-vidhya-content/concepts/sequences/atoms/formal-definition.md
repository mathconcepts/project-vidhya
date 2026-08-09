---
id: sequences.formal-definition
concept_id: sequences
atom_type: formal_definition
bloom_level: 2
difficulty: 0.24
exam_ids: ["*"]
---

**Sequence**: A function $a: \mathbb{N} \to \mathbb{R}$ is called a sequence, denoted as $\{a_n\}_{n=1}^{\infty}$ or $(a_n)$, where $a_n$ is the $n$-th term. A sequence is called **convergent** if $\lim_{n \to \infty} a_n = L$ for some finite $L \in \mathbb{R}$, otherwise it is **divergent**.

**Monotonic Sequences**: A sequence $(a_n)$ is:
- **Monotone increasing** if $a_n \leq a_{n+1}$ for all $n$
- **Monotone decreasing** if $a_n \geq a_{n+1}$ for all $n$
- **Bounded** if $\exists M, m \in \mathbb{R}$ such that $m \leq a_n \leq M$ for all $n$
