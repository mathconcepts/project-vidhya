---
# Alternative body for integration-by-parts.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: integration-by-parts.worked_example.assured
concept_id: integration-by-parts
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: integration-by-parts.worked_example
for_stance: assured
---

Tabular shortcut collapses both applications into one pass: differentiate $x^2$ down to $0$ ($x^2,2x,2$), integrate $e^x$ unchanged across each row ($e^x,e^x,e^x$), alternate signs $+,-,+$: $x^2e^x-2xe^x+2e^x$.

**Answer:** $\boxed{e^x(x^2-2x+2)+C}$, confirmed by differentiating back to $x^2e^x$.

The tabular method terminates only because the polynomial factor's derivatives reach $0$ in finitely many steps — it extends to any $x^ne^{ax}$ or $x^n\sin(ax)$ pairing, always $n+1$ rows, but fails outright on $\int e^x\sin x\,dx$, where neither factor ever reaches a derivative of $0$: that pairing needs the algebraic self-referential trick, not more rows in the table.

The mark-loser on repeated application: losing track of the sign on the second pass, since the outer $-2\int xe^x\,dx$ already carries a minus sign that must multiply through the *entire* result of the inner by-parts, not just its first term.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Solve: ∫x² eˣ dx using integration by parts (repeated)","steps":[{"prompt":"Step 1: Use LIATE to choose u and dv. What should u be?","hint":"LIATE: Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential. Which appears first in our integrand x²·eˣ?","answer":"u = x² (algebraic comes before exponential in LIATE)"},{"prompt":"Step 2: If u = x², what is dv and v?","hint":"Once u = x² and du = 2x dx, the remaining part is e^x dx","answer":"dv = e^x dx, so v = e^x"},{"prompt":"Step 3: Write the integration by parts formula: ∫u dv = uv - ∫v du","hint":"Plug in: u = x², v = e^x, du = 2x dx","answer":"∫x² e^x dx = x² e^x - ∫e^x · 2x dx = x² e^x - 2∫x e^x dx"},{"prompt":"Step 4: Now solve ∫x e^x dx using integration by parts again","hint":"Let u = x, dv = e^x dx. Then du = dx, v = e^x. Use the formula.","answer":"∫x e^x dx = x e^x - ∫e^x dx = x e^x - e^x"},{"prompt":"Step 5: Substitute back to get the final answer","hint":"Replace ∫x e^x dx in Step 3's result with (x e^x - e^x)","answer":"∫x² e^x dx = x² e^x - 2(x e^x - e^x) = e^x(x² - 2x + 2) + C"}],"caption":"Key insight: Repeated application of LIATE reduces polynomial degree step-by-step until only exponential/trig remains, which is integrable directly."}
```
