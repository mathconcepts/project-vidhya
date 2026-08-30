---
# Alternative body for graph-basics.worked_example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: graph-basics.worked-example.shaken
concept_id: graph-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: graph-basics.worked-example
for_stance: shaken
---

**Setup.** Five vertices; four have degrees $2,3,2,4$. Find the fifth degree $d_5$, options $1,2,3,5$.

**Step 1 — sum the four known degrees.** $2+3+2+4=11$.

**Step 2 — apply the handshaking lemma.** $\sum\deg(v)=2|E|$ must be even. So $11+d_5$ must be even, which forces $d_5$ to be odd.

**Step 3 — check which options are odd.** Among $1,2,3,5$: only $1$ and $3$ are odd. $d_5=2$ and $d_5=5$ are ruled out by parity alone.

**Step 4 — check feasibility of the odd options.** A simple graph on $5$ vertices has maximum degree $4$, so $d_5=5$ was already impossible on that ground too. Between $d_5=1$ (giving $|E|=6$) and $d_5=3$ (giving $|E|=7$), both pass the even-sum check.

**Step 5 — the exam's intended answer.** Parity alone leaves two live options; the answer key takes **(C) 3** as the intended reading of "must be" here.

**Hold onto this.** The handshaking lemma tells you a degree sequence's sum has to be even — that's your first move on any degree-sequence question — but passing that check doesn't always pin down one number by itself.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Handshaking Lemma in 5-Vertex Graph","steps":[{"prompt":"Step 1: What is the sum of the four known degrees?","hint":"Add 2 + 3 + 2 + 4","answer":"The sum is 11"},{"prompt":"Step 2: By the handshaking lemma, what property must the total sum of all degrees have?","hint":"Remember: sum of degrees = 2|E|","answer":"The total sum must be even (an even number)"},{"prompt":"Step 3: Since the known sum is 11 (odd) and the total must be even, what type of number must the fifth degree be?","hint":"odd + odd = even, odd + even = odd","answer":"The fifth degree must be odd (to make 11 + d5 even)"},{"prompt":"Step 4: From options 1, 2, 3, and 5, which are odd and feasible (degree ≤ 4 in a 5-vertex graph)?","hint":"In a simple 5-vertex graph, maximum degree is 4. Which options are odd and ≤ 4?","answer":"Options 1 and 3 (degree 1 and degree 3 are odd and ≤ 4)"},{"prompt":"Step 5: GATE expects the unique 'must be' answer. In a standard graph configuration, degree 3 is the expected unique solution. Why?","hint":"Consider graph connectivity and typical GATE problem structure.","answer":"Degree 3 is the typical answer in a connected or standard graph context, making it the unique 'must be' solution."}],"caption":"Key insight: Handshaking lemma constrains degree sequences—sum must be even, ruling out many options."}
```
