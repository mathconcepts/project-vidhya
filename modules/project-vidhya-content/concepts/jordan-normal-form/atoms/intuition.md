---
id: jordan-normal-form.intuition
concept_id: jordan-normal-form
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
modality: visual
---

Diagonalization's promise is a set of independent "stubborn directions" — eigenvectors — that together span the whole space. Hook's own matrix, $A=\begin{pmatrix}5&1&0\\0&5&1\\0&0&5\end{pmatrix}$, breaks that promise: eigenvalue $5$ repeats three times, but solving $(A-5I)v=0$ turns up only ONE independent direction, $v=(1,0,0)$ — a **defective matrix**, the name for exactly this shortfall between how many times an eigenvalue repeats and how many independent eigenvectors it actually hands you.

Jordan form is the fallback for the two missing slots. Watch what $A$ does to $w_1=(0,1,0)$: $Aw_1=(1,5,0)=5w_1+v$ — not a clean scale by $5$ the way a true eigenvector would give, because a copy of $v$ rides along for free. A vector like $w_1$ — one step short of being a genuine eigenvector, dragged along by the one that came before it — is called a **generalized eigenvector**.

The chain does not stop there: $w_2=(0,0,1)$ gives $Aw_2=(0,1,5)=5w_2+w_1$ — dragged along by $w_1$ in turn, the same way $w_1$ was dragged by $v$. Three vectors now — $v$, $w_1$, $w_2$ — fill the three slots diagonalization needed but could not find independent directions for.

Look again at $A$ itself: the $1$'s sitting directly above its diagonal ARE this chain, already written out — $A$ is already in Jordan form, nothing left to compute.

Every square matrix — defective or not — has a Jordan form. Diagonal matrices are simply the case with no chains at all: every eigenvector already stands alone.
