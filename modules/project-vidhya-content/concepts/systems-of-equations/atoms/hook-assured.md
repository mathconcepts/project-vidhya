---
# Alternative body for systems-of-equations.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: systems-of-equations.hook.assured
concept_id: systems-of-equations
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: systems-of-equations.hook
for_stance: assured
---

$A\mathbf{x}=\mathbf{b}$ is consistent iff $\text{rank}(A)=\text{rank}([A\mid\mathbf{b}])$ — Rouché–Capelli. Given consistency, compare that common rank to $n$: equal gives a unique solution, less than $n$ gives a free-variable family. Geometrically: hyperplanes meeting at a point, along a subspace, or not at all.

```interactive-spec
{"v":1,"kind":"simulation","title":"A fixed-rank system: the solution slides but never disappears","x_expr":"(3+t)/2","y_expr":"(3-t)/2","t_min":-3,"t_max":3,"duration_sec":6,"view_box":{"x_min":-0.5,"x_max":3.5,"y_min":-0.5,"y_max":3.5},"narration_steps":[{"at_progress":0,"text":"This dot is the solution to $x+y=3,\\ x-y=t$ at $t=-3$: the point $(0,3)$ — where the two lines currently cross.","text_shaken":"At $t=-3$ the two lines cross at $(0,3)$. Plug it back in: $0+3=3$ and $0-3=-3$. Both check out.","text_assured":"Only the right-hand side, $t$, is changing here — the coefficient matrix $\\begin{pmatrix}1&1\\\\1&-1\\end{pmatrix}$ never does."},{"at_progress":0.25,"text":"As $t$ rises, the crossing point slides along a straight line of its own — from $(0,3)$ it is now at $(0.75,2.25)$.","text_shaken":"Now the crossing is at $(0.75,2.25)$. It moved because we changed one number, $t$, not the lines' directions.","text_assured":"The solution moves linearly in $t$ because Cramer's rule gives $x,y$ as linear functions of the constants."},{"at_progress":0.45,"text":"At $t=0$, the crossing lands at $(1.5,1.5)$ — a third value of $t$, a third single crossing. Will that ever change for some other $t$, or does this system always have exactly one solution?","text_shaken":"At $t=0$ the point is $(1.5,1.5)$ — the third value of $t$ tried, still one crossing. Guess: could some other $t$ ever break that, or is it always exactly one?","text_assured":"A third value of $t$, still one unique crossing. Before confirming: is that guaranteed for every $t$, or could some $t$ make this system inconsistent or underdetermined?","emphasize":false},{"at_progress":0.5,"text":"Always exactly one — it keeps existing, uniquely, for every value of $t$ we choose. Consistency here doesn't depend on $t$ at all: with $A$ already full rank, $\\text{rank}(A)=\\text{rank}(A\\mid b)$ for every possible $b$.","text_shaken":"Always exactly one. Try any other $t$: there is always exactly one crossing, never zero, never many — because $A$ already has full rank.","text_assured":"Always: consistency here doesn't depend on $t$ at all — with $A$ already full rank, $\\text{rank}(A)=\\text{rank}(A\\mid b)$ for every possible $b$.","emphasize":true,"trap":{"text":"Students hunt for a value of the constant that makes this system inconsistent, forgetting to check the coefficient matrix's rank first.","avoid":"Check $\\text{rank}(A)$ once: it is already 2 here, so no right-hand side can ever break consistency."}},{"at_progress":0.8,"text":"By $t=1.8$ the crossing has slid to $(2.4,0.6)$ — one straight path traced by a family of always-unique solutions.","text_shaken":"The crossing is now at $(2.4,0.6)$. Same two lines' directions, same guaranteed single answer, just a different constant.","text_assured":"The path this point traces is itself a line — a direct consequence of Cramer's rule being linear in the constants, not a coincidence."}]}
```
