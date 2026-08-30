---
# Alternative body for propositional-logic.worked_example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: propositional-logic.worked_example.shaken
concept_id: propositional-logic
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
variant_of: propositional-logic.worked-example
for_stance: shaken
---

Take $((p\to q)\land(q\to r))\to(p\to r)$.

Convert each implication. $p\to q\equiv\neg p\lor q$. $q\to r\equiv\neg q\lor r$. $p\to r\equiv\neg p\lor r$.

Convert the outer arrow: the whole thing is $A\to B$ with $A=(\neg p\lor q)\land(\neg q\lor r)$, giving $\neg A\lor(\neg p\lor r)$.

Apply De Morgan's to $\neg A$: $\neg((\neg p\lor q)\land(\neg q\lor r))\equiv(p\land\neg q)\lor(q\land\neg r)$.

Combine: $(p\land\neg q)\lor(q\land\neg r)\lor\neg p\lor r$.

Check every case. If $p$ is false, $\neg p$ makes it true. If $r$ is true, the $r$ term makes it true. If $p$ is true and $r$ is false: $\neg r$ is true, so $(q\land\neg r)$ is true exactly when $q$ is true; when $q$ is false instead, $(p\land\neg q)$ is true. Every case lands on true.

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Simplify: ((p → q) ∧ (q → r)) → (p → r)",
  "steps": [
    {
      "prompt": "Step 1: Convert all three implications using p → q ≡ ¬p ∨ q. What does (p → q) become?",
      "hint": "Replace the arrow with OR and negate the antecedent: ¬p ∨ q",
      "answer": "(p → q) ≡ (¬p ∨ q)"
    },
    {
      "prompt": "Step 2: Now convert the outer implication of the whole formula. A → B ≡ ¬A ∨ B, where A is the antecedent ((p → q) ∧ (q → r)). What is ¬A using De Morgan's law?",
      "hint": "¬(X ∧ Y) ≡ ¬X ∨ ¬Y. Negate each part: ¬(¬p ∨ q) ∨ ¬(¬q ∨ r). Then simplify each: (p ∧ ¬q) ∨ (q ∧ ¬r)",
      "answer": "¬((¬p ∨ q) ∧ (¬q ∨ r)) ≡ (p ∧ ¬q) ∨ (q ∧ ¬r)"
    },
    {
      "prompt": "Step 3: The full formula is now [(p ∧ ¬q) ∨ (q ∧ ¬r)] ∨ (¬p ∨ r). Test all 8 truth assignments for p, q, r. Does this ever evaluate to false?",
      "hint": "When p=F, (¬p ∨ r) is true, so the whole disjunction is true. When r=T, the same term is true. When p=T and r=F, check if (p ∧ ¬q) ∨ (q ∧ ¬r) is true. With r=F, ¬r=T, so (q ∧ ¬r) is true iff q=T. But then (p ∧ ¬q) is false. Sum: it's always true.",
      "answer": "No. The formula is a tautology (always true). This reflects the transitivity law of implication."
    }
  ],
  "caption": "Exam insight: Recognize tautologies by converting to normal form and testing systematically. Implication chains always preserve truth."
}
```

Every row landed on true: nothing more exotic is needed to call a formula a tautology.
