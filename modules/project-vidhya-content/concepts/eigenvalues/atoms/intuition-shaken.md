---
# Alternative body for eigenvalues.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive blocks below are copied verbatim from the base
# atom so neither widget can drift between variants; only prose differs.
id: eigenvalues.intuition.shaken
concept_id: eigenvalues
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
modality: visual
variant_of: eigenvalues.intuition
for_stance: shaken
---

## Try three vectors, see what happens

Take $A = \begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix}$ — same matrix as the hook. Watch it act on three specific vectors, one at a time.

```interactive-spec
{"v":1,"kind":"simulation","title":"Same matrix as the hook — three specific vectors, one at a time","why":"Trying three named vectors one by one shows exactly why two of them are eigenvectors and one isn't — direction, not length, is the test.","duration_sec":9,"linear_map":{"matrix":[[2,1],[1,2]],"num_vectors":16,"eigen":[{"dir":[0.70710678,0.70710678],"value":3},{"dir":[0.70710678,-0.70710678],"value":1}]},"narration_steps":[{"at_progress":0,"text":"Same matrix as the hook, $A=\\begin{pmatrix}2&1\\\\1&2\\end{pmatrix}$. Try the plain direction $v=(1,0)$ first — does $Av$ still point along the x-axis, or does it turn?","text_shaken":"Same matrix as before. Start simple: $v=(1,0)$, straight along the x-axis. Push it through $A$ — same direction, or a new one?","text_assured":"Three specific test vectors this time, not sixteen arrows: $(1,0)$, $(1,1)$, $(1,-1)$. Only two of the three are eigenvectors.","emphasize":false},{"at_progress":0.3,"text":"$A(1,0)^T=(2,1)^T$ — swung off the x-axis. The direction changed, so $(1,0)$ is NOT an eigenvector, however far it stretched.","text_shaken":"$(1,0)$ landed at $(2,1)$ — that's a new direction, not the old one. Not an eigenvector.","text_assured":"$(1,0)\\mapsto(2,1)$: direction changed. Length changing is irrelevant here — only a parallel output counts.","emphasize":false},{"at_progress":0.55,"focus_eigen":[0],"text":"Now $v=(1,1)$: $A(1,1)^T=(3,3)^T$ — same direction, exactly $3\\times$ longer. That's an eigenvector: $\\lambda=3$.","text_shaken":"$(1,1)$ lands at $(3,3)$ — same line, just $3\\times$ longer. This one IS an eigenvector, $\\lambda=3$.","text_assured":"$(1,1)\\mapsto(3,3)$: parallel, scaled by $3$. First eigenpair confirmed.","emphasize":false},{"at_progress":0.8,"focus_eigen":[1],"text":"And $v=(1,-1)$: $A(1,-1)^T=(1,-1)^T$ — didn't move at all. Also an eigenvector, $\\lambda=1$. $Av=\\lambda v$ means exactly this: the output stays parallel to the input — only these two directions out of every possible one ever do that.","text_shaken":"$(1,-1)$ lands right back on $(1,-1)$ — unchanged. Also an eigenvector, $\\lambda=1$. Two out of three tested vectors were eigenvectors; one wasn't.","text_assured":"$(1,-1)\\mapsto(1,-1)$: fixed, $\\lambda=1$. $Av=\\lambda v$ is the parallel-output condition, nothing about magnitude.","emphasize":true,"trap":{"text":"$(1,0)$ stretched too — it grew from length $1$ to length $\\sqrt5$ — so it's tempting to call it an eigenvector for \"getting bigger.\"","avoid":"Check direction, not size: an eigenvector's output must point along the SAME line as the input. $(1,0)\\to(2,1)$ changed line; $(1,1)\\to(3,3)$ and $(1,-1)\\to(1,-1)$ did not."}}]}
```

$$Av = \lambda v$$

Two out of three tested vectors stayed on their own line; one didn't. That's the whole rule: most vectors change direction, eigenvectors don't — only their length does.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag the entries of A and watch the eigenvalues move",
  "inputs": [
    {"id": "a", "label": "a (top-left)", "min": 0, "max": 6, "step": 0.5, "initial": 4},
    {"id": "b", "label": "b (top-right)", "min": 0, "max": 3, "step": 0.25, "initial": 1},
    {"id": "c", "label": "c (bottom-left)", "min": 0, "max": 3, "step": 0.25, "initial": 2},
    {"id": "d", "label": "d (bottom-right)", "min": 0, "max": 6, "step": 0.5, "initial": 3}
  ],
  "outputs": [
    {"label": "trace = a + d", "formula": "a + d", "digits": 2},
    {"label": "det = ad - bc", "formula": "a*d - b*c", "digits": 2},
    {"label": "discriminant = (a-d)^2 + 4bc", "formula": "(a-d)^2 + 4*b*c", "digits": 2},
    {"label": "eigenvalue 1 (larger)", "formula": "(a + d + sqrt((a-d)^2 + 4*b*c)) / 2", "digits": 2},
    {"label": "eigenvalue 2 (smaller)", "formula": "(a + d - sqrt((a-d)^2 + 4*b*c)) / 2", "digits": 2}
  ],
  "caption": "b and c are both kept at 0 or above, so (a-d)^2 + 4bc can never go negative on these sliders — the eigenvalues stay real everywhere you drag. Watch the two eigenvalues move as trace and determinant change."
}
```
