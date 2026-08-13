---
id: propositional-logic.worked-example
concept_id: propositional-logic
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

## Worked Example: Simplify a Boolean Expression

**Problem (GATE-style):**

Simplify the boolean expression:
$$((p \to q) \land (q \to r)) \to (p \to r)$$

Determine whether this is a tautology, contradiction, or contingent. If contingent, identify the truth assignment(s) that make it false.

---

### Solution

**Step 1: Convert implications to OR**

Recall that $p \to q \equiv \neg p \lor q$. Apply this to each implication:

- $(p \to q) \equiv (\neg p \lor q)$
- $(q \to r) \equiv (\neg q \lor r)$
- $(p \to r) \equiv (\neg p \lor r)$

The expression becomes:
$$((\neg p \lor q) \land (\neg q \lor r)) \to (\neg p \lor r)$$

**Step 2: Convert the outer implication**

The main connective is an implication. Apply $A \to B \equiv \neg A \lor B$:

$$\neg((\neg p \lor q) \land (\neg q \lor r)) \lor (\neg p \lor r)$$

**Step 3: Apply De Morgan's law**

$$\neg((\neg p \lor q) \land (\neg q \lor r)) \equiv \neg(\neg p \lor q) \lor \neg(\neg q \lor r)$$

$$\equiv (p \land \neg q) \lor (q \land \neg r)$$

So the full expression is:
$$(p \land \neg q) \lor (q \land \neg r) \lor (\neg p \lor r)$$

**Step 4: Rearrange and simplify**

$$(p \land \neg q) \lor (q \land \neg r) \lor \neg p \lor r$$

- When $\neg p$ is true, the whole expression is true.
- When $r$ is true, the whole expression is true.
- When both $p$ and $r$ are false: we need $(p \land \neg q) \lor (q \land \neg r)$ to be true. But $p$ is false, so the first term is false. And $r$ is false, so $\neg r$ is true, meaning the second term requires $q$ to be true. If $q$ is true, the second term $(q \land \neg r)$ is true.

By exhaustive case analysis, this expression is **a tautology**—it is true for all truth assignments of $p$, $q$, $r$.

**Key insight:** This is the transitive property of implication: if $p$ implies $q$ and $q$ implies $r$, then $p$ implies $r$. It's a logical law, so the formula always evaluates to true.

---

### Interactive Walkthrough

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
```

---

**DONE:propositional-logic**
