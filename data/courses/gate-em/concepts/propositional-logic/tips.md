# Teaching Tips: Propositional Logic

## Common Student Errors
- **Misunderstanding implication truth table**: Many students think $p \rightarrow q$ is equivalent to $\neg p \lor q$ only when they memorize it wrongly. They incorrectly assume that a false antecedent makes the implication false (it actually makes it true). **Mnemonics**: "Only $T \rightarrow F$ is false; everything else is true."
- **Confusing converse with contrapositive**: The converse of $p \rightarrow q$ is $q \rightarrow p$ (NOT equivalent), while the contrapositive $\neg q \rightarrow \neg p$ IS equivalent. Students often use these interchangeably. **Test**: If a statement and its contrapositive are both true, the converse is not necessarily true.
- **De Morgan's law reversals**: Forgetting that $\neg(p \land q) = \neg p \lor \neg q$ and $\neg(p \lor q) = \neg p \land \neg q$. Students often flip the operator incorrectly. **Check**: The negation distributes across AND→OR and OR→AND.

## GATE Question Pattern
Propositional logic questions in GATE typically appear as:
- **Truth table construction** (1 mark): Given a complex formula, determine how many rows satisfy it, or which rows evaluate to a specific value.
- **Tautology/contradiction identification** (1-2 marks): Recognize standard tautologies (like $(p \rightarrow q) \land (q \rightarrow r) \rightarrow (p \rightarrow r)$) and contradictions. Common trap: presenting formulas that are contingent (sometimes true, sometimes false).
- **Logical equivalence** (1 mark): Pair up formulas that are semantically equivalent (e.g., $(p \land q) \lor (\neg p \land \neg q)$ vs. $(p \leftrightarrow q)$). The trap is false "look-alikes."

## Speed Tricks for MCQs
- **Use the contrapositive shortcut**: If asked whether $p \rightarrow q$ entails something, check if $\neg (\text{conclusion}) \rightarrow \neg p$ is true. This often avoids full truth-table work.
- **Partial truth table**: Don't build all 8 rows for 3 variables; focus on rows where you suspect the formula fails. For tautology checks, find one FALSE row to eliminate the option.
- **Standardize notation early**: Rewrite $p \rightarrow q$ as $\neg p \lor q$ immediately. This makes De Morgan's laws and simplifications automatic, saving mental overhead.

## Must-Memorize Formulas / Results
$$p \rightarrow q \equiv \neg p \lor q$$
$$p \leftrightarrow q \equiv (p \land q) \lor (\neg p \land \neg q)$$
$$\neg(p \land q) \equiv \neg p \lor \neg q \quad \text{(De Morgan)}$$
$$\neg(p \lor q) \equiv \neg p \land \neg q \quad \text{(De Morgan)}$$
$$p \rightarrow q \equiv \neg q \rightarrow \neg p \quad \text{(Contrapositive Law)}$$
$$(p \rightarrow q) \land (q \rightarrow r) \rightarrow (p \rightarrow r) \quad \text{(Hypothetical Syllogism — Tautology)}$$
$$p \lor (p \land q) \equiv p \quad \text{(Absorption)}$$
$$p \land (p \lor q) \equiv p \quad \text{(Absorption)}$$
