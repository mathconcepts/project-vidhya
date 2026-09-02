# Wolfram Prompt Repository → GATE Content-System Research Notes

## Sources reviewed

1. Wolfram Prompt Repository: https://resources.wolframcloud.com/PromptRepository
2. Wolfram `LLMPrompt` documentation: https://reference.wolfram.com/language/ref/LLMPrompt.html
3. Wolfram Prompt resource-object documentation: https://reference.wolfram.com/language/ref/resourceobject/Prompt.html
4. Wolfram APIs documentation: https://www.wolfram.com/apis/documentation/
5. Wolfram Prompt Repository — Computable Output topic: https://resources.wolframcloud.com/PromptRepository/topic/computable-output
6. Wolfram Prompt Repository — Education topic: https://resources.wolframcloud.com/PromptRepository/topic/education
7. Wolfram Prompt Repository — ELI5 resource: https://resources.wolframcloud.com/PromptRepository/resources/f65362e2-3971-4cd7-b0bb-cc795bd74ef7/
8. Wolfram Prompt Repository — GlossaryGenerate resource: https://resources.wolframcloud.com/PromptRepository/resources/6a373484-2325-49c6-887b-08879ee0c9d1/

## Observed design patterns

### 1. Prompts are modular resources, not one giant instruction
The repository separates personas, function prompts and modifiers. This supports composition: a topic generator can be paired with a diagnostic persona, an output-format modifier and a learner-level modifier without rewriting the whole prompt.

### 2. Named slots make prompts reusable and machine-addressable
`LLMPrompt` supports named and numbered parameters, parameter filling and slot reordering. This maps directly to a GATE content contract with slots such as topic, paper, year, learner state, prerequisite evidence, pain-point hypothesis, assessment mode, source bundle, time budget and required output schema.

### 3. Prompt resources have metadata and versioning
Prompt resources carry categories, topics, prompt parameters, locations, definition notebooks, example notebooks and sample chats. Publication includes review. The GATE analogue should treat prompt modules as versioned, provenance-bearing assets with examples, test cases and approval status.

### 4. Function prompts transform or assess an input
The repository includes glossary generation, quiz generation, answer assessment, assessment explanation and grade-level estimation. The GATE analogue should separate generation functions: research-brief builder, claim extractor, misconception classifier, prerequisite-probe selector, worked-example generator, question generator, answer verifier, explanation generator and delta selector.

### 5. Modifiers are composable delivery controls
Examples include ELI5, simple words, translation, personalization and output formatting. For GATE, modifiers should be bounded controls such as concise, Hindi-English glossary, visual-first, formula-light, exam-timed, error-focused, prerequisite-repair, MSQ-caution and NAT-entry-check. Modifiers must not alter canonical mathematics or official rules.

### 6. Computable output is a first-class interface
The repository includes prompts that produce structured or executable outputs, such as JSON/theme tables, Mermaid diagrams, code and assessment objects. GATE generation should require structured intermediate artifacts rather than only prose: claim ledgers, source registers, dependency hypotheses, item specifications, answer keys, verifier traces, state-transition events and release manifests.

### 7. Assessment can be delegated to a separate evaluator
The `QuestionAnswerAssess`, `QuestionAssessmentExplanation` and `LLMPromptAssessment` patterns imply a generator/evaluator split. GATE should never rely on the same unconstrained generation pass to certify its own mathematics, answer key or marking-mode behavior. Independent symbolic/numeric checks and a separate rubric/evaluator are required.

### 8. Prompt libraries can serve as an operating system for content workflows
The repository’s category/topic model offers a scalable taxonomy. GATE should maintain a registry of prompt modules with compatibility rules, required inputs, outputs, cost/latency, evidence level, safety constraints, test fixtures and rollback version.

## Important limits

The repository is a prompt-resource design reference, not evidence that any particular prompt improves GATE learning outcomes. It does not remove the need for official syllabus checks, mathematics verification, assessment validation, copyright/permissions checks, learner-outcome experiments or human review. Wolfram computational output should be stored as a verified computation observation with query, assumptions, version, output and source metadata—not treated as an educational explanation by itself.

## Design implication

The highest-leverage adaptation is not “use more prompts.” It is to turn the GATE pipeline into a composable, typed, versioned content compiler:

`atomic topic + official scope + graph evidence + learner evidence + source bundle + selected prompt modules → structured lesson package → independent verification → delivery delta → outcome event → governed improvement`
