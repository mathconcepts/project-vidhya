---
id: inner-product-spaces.mnemonic
concept_id: inner-product-spaces
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"Inner" means it reaches inside and comes back with a single number.** Two vectors go in, one plain number (a "scalar") comes out — that's what separates $\langle u, v \rangle$ from an "outer" product, which instead returns a whole matrix. If your answer isn't a single number, you did the wrong product.

**The three axioms as "CLiP":**

- **C**onjugate symmetry — $\langle u, v \rangle = \overline{\langle v, u \rangle}$ (swap the two vectors and you get the "conjugate" back — for complex numbers that means flipping the sign of the imaginary part; for real numbers there's nothing to flip, so this just means $\langle u,v\rangle=\langle v,u\rangle$)
- **Li**near in the *first* slot — scale or add inside the first vector, and the answer scales or adds the same way
- **P**ositive definite — $\langle v, v \rangle > 0$ for every $v \neq 0$ (a vector's "agreement with itself" always comes out positive)

**The slot rule that stops sign errors:** *the bar (conjugate) and the linearity never share a slot.* This repo's convention puts the conjugate on the **second** argument ($\langle u, v \rangle = u_1\overline{v_1} + \cdots$), so linearity lives in the **first**. Pulling a scalar out of slot two conjugates it: $\langle u, \alpha v \rangle = \overline{\alpha}\,\langle u, v \rangle$.

**The shortcut worth memorizing.** Any real inner product on $\mathbb{R}^n$ has the form $\langle u, v \rangle = u^T M v$ for some matrix $M$. It's valid exactly when $M$ is **symmetric** (check the diagonal-mirror by eye) **and positive definite** — checked via Sylvester's criterion: every "leading principal minor" (the determinant of the top-left $k\times k$ block, for each $k$ from 1 up to the full size) must come out positive. That turns "verify three axioms" into "compute a couple of determinants."

**Sanity-check reflex:** feed the candidate its own worst case. Positive definiteness is the axiom that breaks most often, and finding just one nonzero $v$ with $\langle v, v \rangle \leq 0$ ends the question.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag a symmetric M = [[a,b],[b,d]] — watch Sylvester's test flip",
  "why": "u^T M v is a valid inner product only when both leading principal minors of symmetric M are positive — drag a, b, d and watch Sylvester's test flip, instead of checking three axioms by hand.",
  "inputs": [
    {"id": "a", "label": "a", "min": -3, "max": 3, "step": 0.5, "initial": 2},
    {"id": "b", "label": "b", "min": -3, "max": 3, "step": 0.5, "initial": 1},
    {"id": "d", "label": "d", "min": -3, "max": 3, "step": 0.5, "initial": 2}
  ],
  "outputs": [
    {"label": "Minor 1 = a", "formula": "a", "digits": 2},
    {"label": "Minor 2 = a·d − b²", "formula": "a*d - b^2", "digits": 2}
  ],
  "caption": "Both minors positive ⇒ M defines a valid real inner product (positive definite). Either one ≤ 0 and the axioms fail — usually positive definiteness first."
}
```
