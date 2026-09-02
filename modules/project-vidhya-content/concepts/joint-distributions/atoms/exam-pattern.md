---
id: joint-distributions.exam-pattern
concept_id: joint-distributions
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions usually give a joint PMF table or a simple joint PDF formula and ask for one derived number**: a marginal, a conditional probability, $E[XY]$, or $\text{Cov}(X,Y)$. Example: from $p(0,0)=0.3,\ p(0,1)=0.2,\ p(1,0)=0.1,\ p(1,1)=0.4$, "$P(Y=1 \mid X=0)$" $= p(0,1)/p_X(0) = 0.2/0.5 = 0.4$ — one division once the marginal is found, not a fresh derivation.

- **MCQ/MSQ "which statement is true" questions target the independence-vs-covariance direction specifically:**
  - Independence $\Rightarrow$ $\text{Cov}(X,Y)=0$: always true.
  - $\text{Cov}(X,Y)=0$ $\Rightarrow$ independence: **false in general**, GATE's favorite trap in this topic.
  - $\text{Var}(X+Y)=\text{Var}(X)+\text{Var}(Y)$ requires zero covariance (independence is sufficient, not necessary).

- **Support-region questions test whether you check the domain before computing.** A joint PDF given only on a triangular or otherwise non-rectangular region cannot describe independent variables, regardless of whether the formula looks "separable" — read the domain line before touching the algebra.

- **Continuous problems favor a triangular or otherwise bounded region** (like $0<x<y<1$) precisely because it forces correct integration limits — the single most common point loss is integrating a variable's full nominal range instead of the range implied by the other variable's value.

- **Time budget:** a two-variable discrete table with 4-6 cells should cost under a minute per sub-question (marginal, conditional, covariance). A continuous joint PDF problem with nested integrals is worth budgeting 3-4 minutes for the full sequence (validity check, marginals, moments).
