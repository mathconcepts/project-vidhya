---
id: quadratic-equations.mnemonic
concept_id: quadratic-equations
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Sum before Product, Sign flips only for Sum."** Alphabetically Sum comes before Product, and that order matches $-b/a$ then $c/a$. The one sign flip in the whole pair sits on Sum: $-b/a$, never $+b/a$. Product $c/a$ carries no extra minus sign of its own.

**The discriminant story, in one line each.** $D>0$: two separate guests arrive (two distinct real roots). $D=0$: one guest arrives, but is announced twice (one repeated root). $D<0$: no real guest shows up at all — instead, a complex-conjugate pair "visits" only on paper.

**For common roots, remember: "solve the easy one first, then knock on the hard one's door twice."** Factor whichever quadratic factors cleanly, then substitute *each* of its two roots into the other equation, one at a time — never stop after checking just one.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag a, b, c — watch the discriminant and Vieta's formulas update live",
  "why": "Sum and product of roots, and the discriminant, are all just numbers read off a, b, c directly — drag the sliders and watch all three rebuild instantly, for any quadratic, not only the profit example above.",
  "inputs": [
    {"id": "a", "label": "a (coefficient of x^2)", "min": 1, "max": 5, "step": 0.5, "initial": 1},
    {"id": "b", "label": "b (coefficient of x)", "min": -10, "max": 10, "step": 0.5, "initial": -5},
    {"id": "c", "label": "c (constant term)", "min": -10, "max": 10, "step": 0.5, "initial": 6}
  ],
  "outputs": [
    {"label": "Discriminant D = b^2 - 4ac", "formula": "b^2 - 4*a*c", "digits": 2},
    {"label": "Sum of roots = -b/a", "formula": "-b/a", "digits": 2},
    {"label": "Product of roots = c/a", "formula": "c/a", "digits": 2}
  ],
  "caption": "Start at a=1, b=-5, c=6 (the roots are 2 and 3): D should read 1, sum 5, product 6 — matching 2+3=5 and 2x3=6. Then drag any slider and watch all three numbers update from the coefficients alone, with no need to factor or solve anything."
}
```
