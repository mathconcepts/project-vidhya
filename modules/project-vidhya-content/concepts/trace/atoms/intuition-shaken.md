---
# Alternative body for trace.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: trace.intuition.shaken
concept_id: trace
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: trace.intuition
for_stance: shaken
---

For $A=\begin{pmatrix}5&1\\2&4\end{pmatrix}$: add the diagonal, $5+4=9$. That's the trace.

```interactive-spec
{"v":1,"kind":"simulation","title":"Change the axes — does the diagonal sum still equal 9?","x_expr":"5*cos(t) + sin(t)","y_expr":"2*cos(t) + 4*sin(t)","t_min":0,"t_max":6.28319,"duration_sec":8,"view_box":{"x_min":-5.8,"x_max":5.8,"y_min":-5.1,"y_max":5.1},"why":"Shows the diagonal sum doesn't depend on which axes you use to write A down — because the eigenvalues, the real stretch factors, never move.","narration_steps":[{"at_progress":0,"text":"In the hook animation, $A$ stretched $(1,1)$ by $6$ and $(1,-2)$ by $3$, and $6+3$ matched the diagonal sum, $9$. Question: if you described the same transformation using a different pair of axes, would that $9$ still show up?","text_shaken":"Hook showed: $(1,1)$ stretched by $6$, $(1,-2)$ stretched by $3$. $6+3=9$, same as the diagonal. Now: use different axes to describe $A$ — does $9$ still come out?","text_assured":"Trace's basis-independence is the claim under test: does $\\text{tr}(A)=9$ survive an arbitrary change of basis, not just this eigenbasis?","emphasize":false},{"at_progress":0.3,"text":"Yes, always. Change the axes you use to write the matrix down, and the four numbers inside it can change completely. But add up the new diagonal, and you get $9$ again, every time.","text_shaken":"Yes. New axes, new diagonal entries — but add them, still $9$. Any matrix similar to $A$ gives the same total.","text_assured":"Always: for any invertible $P$, $\\text{tr}(P^{-1}AP)=\\text{tr}(A)$. The entries move; the sum is fixed.","emphasize":false},{"at_progress":0.6,"text":"Here is why: changing axes never changes what the transformation actually does to space, only how you describe it on paper. So the real stretch factors, the eigenvalues $6$ and $3$, stay exactly the same, and the trace is just their sum.","text_shaken":"Why: new axes only change how you WRITE the transformation down, not what it DOES. The real stretch numbers, $6$ and $3$, don't move. Trace is just their sum.","text_assured":"Because similar matrices share a characteristic polynomial: $\\det(\\lambda I-P^{-1}AP)=\\det(\\lambda I-A)$. Same polynomial, same eigenvalues, same sum.","emphasize":true},{"at_progress":0.85,"text":"Students see the diagonal entries change after new axes and assume the trace changed too. It hasn't — the entries change, but their total never does. That's what makes trace an invariant: a number that stays fixed no matter how you view the problem.","text_shaken":"After new axes, the entries look different, so it's tempting to think the trace changed. It didn't. Check the SUM, never the individual entries, when comparing across axes.","text_assured":"A common false step: reporting the new diagonal entries as if trace changed. It hasn't — trace is invariant precisely because it tracks eigenvalues, not entry positions.","emphasize":false,"trap":{"text":"Students see the diagonal entries change after new axes and think the trace changed too.","avoid":"Check the SUM, not individual entries — the total never moves, even though each entry can."}}]}
```

Same matrix, any axes you pick — add the diagonal, you still get $9$. That's the one fact worth keeping: trace never changes, even when the matrix's own numbers do.
