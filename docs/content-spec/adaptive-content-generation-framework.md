# Research-First Adaptive Content-Generation Framework for GATE Engineering Mathematics

**Version:** 1.0  
**Coverage:** 116 normalized atomic Engineering Mathematics topics  
**Primary use:** Research, generate, personalize, assess, monitor and improve educational content for GATE preparation  
**Design principle:** One stable, verified base package per atomic topic; the smallest evidence-supported personalized delta is composed around it.

> This framework is designed to generate content only after the target topic, official paper scope, evidence state, prerequisites, learner constraints and assessment contract have been researched and recorded. It is not a prompt that asks a language model to “teach the syllabus” from memory.

## 1. Executive summary

The system converts each atomic GATE Engineering Mathematics topic into a governed content object. The object is researched first, generated second, tested before release, instrumented during delivery and revised only through evidence. The system keeps the **canonical base content** stable enough to reuse across learners, while attaching deltas for prerequisite repair, learner language, representation, assessment mode, time pressure, custom PDFs, verified computations, accessibility and current-source changes.

The official GATE 2026 materials require paper-specific scope management: the official syllabus page lists separate test papers and syllabus documents, while the question-pattern page specifies a three-hour computer-based examination using MCQ, MSQ and NAT questions, with 1- or 2-mark questions and different negative-marking rules for MCQ versus MSQ/NAT [1] [2]. Therefore, the generator must never assume one universal Engineering Mathematics syllabus or one universal exam strategy.

The educational sequence is intentionally short and structured for time-pressed learners. It normally starts with an attention hook, creates intuition or a representation, states the formal rule, demonstrates a worked example, exposes a boundary or misconception, asks for active recall and ends with an assessment-mode or time/risk check. This design is compatible with guidance on chunking, scaffolding, worked examples, frequent checks and spaced retrieval [3] [4]. The exact hook and format remain **testable product hypotheses**, not established universal effects.

The system is self-improving through a controlled loop:

```text
official scope + research sources
    → atomic research brief
    → canonical base content
    → validation gates
    → learner delivery and deltas
    → evidence and outcome events
    → bounded experiment or correction proposal
    → benchmark and human approval
    → versioned release or rollback
```

## 2. Operating principles

| Principle | Operational meaning |
|---|---|
| Research before generation | No topic package is generated from an unverified topic name alone. It first receives a research brief and source register. |
| Atomicity | One stable ID represents one teachable and assessable unit. Broad chapters are decomposed into atomic concepts, methods, conditions, representations or distinctions. |
| Official scope wins | Paper, year and official syllabus source are runtime filters. A useful general explanation is not automatically in scope for a particular learner. |
| Canonical base, minimal delta | Reuse the reviewed base. Personalize only the part supported by learner, source, constraint or assessment evidence. |
| Evidence-labelled claims | Definitions, rules, question patterns, learner pain points and design hypotheses carry different evidence labels. |
| Retrieval over passive recognition | Every package should create opportunities to retrieve, verify, apply after delay and transfer to a changed surface [3] [4]. |
| Explainable dependencies | The prerequisite graph supplies candidate causes and sequences, but edges remain governed hypotheses until validated. |
| Deterministic checks around generative work | Schemas, scope checks, equation checks, answer-key checks, citation checks and version checks surround language-model generation. |
| Reversible improvement | New variants, content corrections, graph edges and policies require provenance, benchmarks, versioning, approval and rollback. |
| Learner safety and dignity | Pressure and deadline are constraints to support, not evidence that a learner lacks ability. Avoid manipulative urgency and confidence inflation. |

## 3. System architecture

The system uses a **relational source of truth** and a graph projection. A relational store holds atomic topics, sources, claims, content versions, learner events, experiments and releases. A graph projection holds topic nodes and typed prerequisite edges for sequencing and backward diagnosis. A content registry holds base anchors and deltas. A research registry records what was searched, what was accepted, what remains unresolved and when each source was last checked.

This separation matters. A graph can express that one topic supports another, but it should not become the only place where official scope, evidence quality or content provenance lives. The graph is the reasoning projection; the relational records are the audit system.

| Layer | Main responsibility | Example output |
|---|---|---|
| Scope registry | Resolve paper, year, syllabus and assessment contract. | `CS/2026`, `XE-A/2026`, official PDF URL, relevant section. |
| Atomic-topic registry | Define the stable topic object and its joins. | `LA-06 Eigenvalues`, objectives, failure hypotheses, assessment modes. |
| Research registry | Store source observations, claims, citations, conflicts and freshness. | Claim that a theorem requires a condition, linked to page/section. |
| Prerequisite graph | Represent candidate learning dependencies. | `LA-06 Eigenvalues → LA-07 Eigenvectors`. |
| Content registry | Store canonical base package, anchors, deltas and variants. | Base `eigen-v1`; delta `repeated-eigenvalue-contrast-v1`. |
| Assessment registry | Store item blueprints, answer keys, explanations and mode rules. | MCQ/MSQ/NAT variants with validation status. |
| Learner-state store | Track concept, recognition, execution, transfer, mode, time, risk, confidence and constraints. | Learner fails only on MSQ complete-truth-set checks. |
| Experiment and release registry | Compare variants and publish or roll back changes. | Hook A beats Hook B on delayed transfer for a defined segment. |
| Monitoring layer | Detect stale sources, drift, conflicts, quality regressions and learner harm. | Alert: official syllabus hash changed. |

## 4. The atomic topic contract

The 116-topic catalogue is the generation input, not the final lesson. Every atomic record should include the following fields.

| Field group | Required fields |
|---|---|
| Identity | Atomic ID, domain, canonical title, aliases, version, owner. |
| Scope | Applicable paper(s), year(s), official syllabus source, scope confidence, out-of-scope notes. |
| Objectives | Definition, prerequisites, representation, method selection, execution, verification, transfer, assessment-mode, timed performance and retrieval objectives. |
| Challenges | Conceptual, prerequisite, representation, method-selection, execution, edge-case, transfer, assessment-mode, time, risk, retention, metacognition, pressure and resource-fit hypotheses. |
| Graph | Incoming prerequisite IDs, outgoing dependent IDs, edge type, confidence, rationale and provenance. |
| Research | Required research layers, source register, claim register, conflict register, last reviewed timestamp and next review date. |
| Base content | Template family, hook variants, anchor sequence, examples, boundary cases, recall prompts, asset formats and accessibility alternatives. |
| Delta slots | Prerequisite repair, notation, language, representation, custom-PDF clarification, verified computation, misconception contrast, assessment mode, time/risk and confidence calibration. |
| Assessment | MCQ/MSQ/NAT applicability, answer key, explanation, distractor rationale, tolerance/rounding policy and official rule version. |
| Monitoring | Research freshness, citation completeness, mathematical checks, item quality, recall, transfer, time-to-method, support requests and review burden. |

The complete per-topic specifications are maintained in `gate_atomic_content_generation_specs.json`, `gate_atomic_content_generation_specs.csv` and `gate_atomic_content_generation_specs.md`. The attention-optimized template assignments are maintained in `gate_atomic_content_structure_map.json`, `gate_atomic_content_structure_map.csv` and `gate_atomic_content_structure_map.md`.

## 5. Research-first pipeline

### 5.1 Resolve the target scope

The orchestrator begins with the learner’s selected paper, year, language, exam objective and available time. It retrieves the official syllabus and question-pattern contract. The official GATE 2026 site provides paper-specific syllabus links and identifies Engineering Mathematics as a paper-specific component for many engineering papers, while XE includes a compulsory Engineering Mathematics section [1]. Runtime scope must therefore be resolved before research claims or examples are accepted.

### 5.2 Build the research brief

Each topic receives a structured research brief containing the precise definition, applicable conditions, representations, prerequisite links, common misconception hypotheses, direct or pattern-supported historical evidence, example set, counterexample set, assessment-mode implications, learner constraints and unresolved conflicts.

The research brief must distinguish at least four evidence states:

| Evidence label | Meaning | Permitted use |
|---|---|---|
| Official | Directly supported by an official syllabus, question-pattern document or official rule. | Scope and assessment contract. |
| Directly reviewed | An item, paper, worked example or source was inspected directly. | Claim about that reviewed instance. |
| Pattern-supported | Supported by a coded family of examples or credible literature, but not a complete frequency dataset. | Design and hypothesis formation with qualification. |
| Design hypothesis | Plausible starting assumption requiring learner or pilot validation. | Experiment only; never state as prevalence or fact. |

The research agent should not convert a syllabus bullet into a claim about historical frequency. A phrase such as “often asked” is forbidden unless backed by a systematic question-coding dataset with a defined sampling frame.

### 5.3 Use source adapters

The source layer supports official web pages, official PDFs, custom learner PDFs, textbooks, research papers, verified computational systems and internal learner evidence. Each adapter returns content plus provenance rather than plain text alone.

| Source type | Accepted contribution | Required provenance |
|---|---|---|
| Official GATE page/PDF | Scope, question pattern, marking rules, official wording and paper/year applicability. | URL, document hash, retrieval time, page/section. |
| Custom learner PDF | Clarification, alternate explanation, notation, worked example or learner-provided context. | File hash, page number, extraction/OCR quality, uploader/permission. |
| Wolfram or verified computational service | Symbolic/numeric checking, alternate forms, plots and generated computations. | Query, assumptions, input, output, provider/version, timestamp and human interpretation. |
| Research literature | Instructional design evidence, learning strategy evidence or domain explanation. | DOI/URL, bibliographic record, relevant passage or table. |
| Internal learner evidence | Error patterns, latency, hint dependence, response quality and outcomes. | Event IDs, item IDs, segment and measurement window. |
| Unverified web content | Discovery lead only. | Store as candidate; do not use as authoritative content without verification. |

The source hierarchy is not a ban on useful custom material. It is a mechanism for preventing a custom explanation or generated computation from silently overriding the official scope or canonical answer key.

### 5.4 Extract atomic claims

Research agents should extract claims into a table with one claim per row. A claim might state a definition, condition, formula, method step, counterexample, historical pattern, misconception hypothesis or source limitation.

```text
claim_id
atomic_id
claim_text
claim_type
scope
source_id
locator
confidence
evidence_label
conflicts_with
review_status
```

A claim is not eligible for generation until it has a source or is explicitly marked as a design hypothesis. Contradictory claims are not averaged by a language model; they are routed to resolution or displayed as a qualified uncertainty where appropriate.

## 6. Research agents and orchestration

The system uses bounded agents with narrow responsibilities. The orchestrator should select agents based on the missing fields in the research and content contracts, not run every agent on every request.

| Agent | Responsibility | Cannot do automatically |
|---|---|---|
| Scope agent | Resolve paper/year syllabus and assessment rules. | Rewrite official scope. |
| Topic decomposer | Check atomicity and identify objective/failure dimensions. | Merge or delete canonical IDs without review. |
| Source discovery agent | Find candidate official, academic, computational and learner sources. | Treat search snippets as evidence. |
| Source verifier | Inspect source pages/PDFs, hashes, sections and conflicts. | Mark an unreviewed source authoritative. |
| Concept analyst | Extract definitions, conditions, methods and counterexamples. | Invent missing theorems or conditions. |
| Graph analyst | Traverse prerequisites and propose dependency explanations. | Rewrite canonical prerequisite edges automatically. |
| Assessment designer | Produce mode-specific item blueprints and distractor rationales. | Release an unverified answer key. |
| Base-content generator | Compose the stable hook-to-retrieval lesson package. | Replace canonical content without versioning. |
| Delta generator | Attach the smallest learner/source/constraint-specific addition. | Regenerate the entire topic by default. |
| Mathematics checker | Test algebra, symbolic steps, numerical values and invariants. | Certify a claim outside its checked assumptions. |
| Pedagogy/UX checker | Inspect cognitive load, chunking, retrieval, accessibility and clarity. | Infer learning from clicks alone. |
| Outcome analyst | Compare learner outcomes and detect segment-specific effects. | Declare causality from one learner or one session. |
| Release governor | Gate, version, approve, publish, monitor and roll back. | Bypass owner approval for high-impact changes. |

For batch generation, use a cost-aware pipeline: a lower-cost model or deterministic extractor handles routine classification and field completion, a stronger model handles ambiguous research synthesis and structured reasoning, and only failed or high-impact cases are escalated. The live model catalogue should be checked before implementation because model IDs, pricing and capabilities change over time. The generation service should be abstracted behind a provider interface so that a built-in model, external API or local model can be replaced without changing the content contract.

## 7. Canonical base-content design

### 7.1 Universal base sequence

The stable base should normally follow this sequence:

```text
hook
  → intuition or representation
  → formal definition / rule / theorem / algorithm
  → worked example
  → boundary case or misconception contrast
  → active recall
  → assessment-mode, time or verification check
```

This sequence is consistent with cognitive-load-aware guidance to chunk new material, provide models and worked examples, connect to prior knowledge, check understanding, and space retrieval [4]. It also aligns with the reviewed literature’s distinction between recognition, cued recall and free recall [3]. The platform should not claim that every hook works equally well for every learner; it should test alternative structures.

### 7.2 Template families for all topics

The full 116-topic map assigns one template family and one or more starting hooks to every atomic topic. The families are:

| Family | Typical topics | Starting hook | Dominant visual/content pattern |
|---|---|---|---|
| Matrix | Matrix algebra, determinants, inverse, rank, systems, LU. | Shape-before-arithmetic; transformation intuition. | Dimension check, operation rule, worked matrix, invariant. |
| Eigen | Eigenvalues, eigenvectors, symmetric matrices, diagonalization. | Special direction; transformation preserving a line. | Geometric vector, characteristic equation, eigenspace contrast. |
| Limit | Limits, continuity, indeterminate forms, L’Hospital. | Prediction before calculation; graphical intuition. | Graph/table, formal condition, boundary contrast. |
| Derivative | Differentiability, mean-value theorems and derivative reasoning. | Rate-of-change; visual slope. | Animated graph, rule, derivation and sign check. |
| Integral | Definite/improper integrals, area and volume. | Accumulation; area or balance intuition. | Geometric region, rule, bounds/convergence check. |
| Optimization | Maxima/minima, saddle points and Lagrange multipliers. | Decision under a constraint; visual landscape. | Conditions, method selector and boundary/second-order check. |
| Vector | Fields, gradient, divergence, curl, line/surface integrals and theorems. | Field-line intuition; local-to-global question. | Operator visual, field plot, theorem selector. |
| ODE | First-order, higher-order, conditions, series and Laplace methods. | System evolution; recognize the equation form. | Classification decision tree, solution steps, residual. |
| PDE | Classification, separation, heat, wave, Laplace and boundary conditions. | Heat/wave/field story; boundary-condition puzzle. | Field visual, separation steps, compatibility check. |
| Complex | Complex representation, analyticity, Cauchy results, series and residues. | Geometry of a number; mapping intuition. | Argand plane, path/singularity check, series. |
| Probability | Axioms, events, conditional probability and distributions. | Everyday uncertainty puzzle; count before calculate. | Sample-space/tree visual, model, independence check. |
| Statistics | Sampling, median, mode, correlation and regression. | Signal hidden in data; prediction versus association. | Data plot/table, statistic/model, assumption check. |
| Numerical | Error, conditioning, solvers, interpolation, integration and ODE methods. | Approximation under constraint; error budget. | Algorithm trace, iteration, stability/error check. |
| Discrete | Logic, sets, relations, orders, graphs, counting and recurrences. | Small puzzle or counterexample. | Truth table, graph/lattice, invariant and property check. |

### 7.3 Time-pressed delivery modes

The system should generate at least three delivery lengths from the same base anchors.

| Mode | Contents preserved | Contents compressed |
|---|---|---|
| Micro | Hook, minimum formal rule, one example, one trap, one recall and one mode check. | Extended intuition and secondary examples. |
| Standard | Full base sequence with one worked example, one contrast and retrieval. | Optional historical context. |
| Deep | Standard base plus multiple representations, worked-example fading, varied transfer and extended assessment practice. | Nothing essential unless scope requires removal. |

The first 20–40 seconds should communicate relevance and create the first learner action. This is an attention design target, not a license to use manipulative urgency. A high watch time with poor delayed recall is a negative signal for the content structure.

## 8. Personalized delta composition

A delta is a versioned object attached to a stable base anchor. It is selected by evidence and constraints.

| Delta trigger | Example | Typical anchor |
|---|---|---|
| Prerequisite gap | Determinant sign error before eigenvalue computation. | Worked example / prerequisite. |
| Definition misconception | Learner says the eigenvalue must be nonzero. | Formal rule / boundary. |
| Representation gap | Learner solves symbolic form but fails a graph or verbal form. | Intuition / representation. |
| Assessment-mode gap | Learner finds one true MSQ option but misses the complete truth set. | Mode check. |
| Time/risk constraint | Learner knows the method but takes too long or guesses on MCQ. | Worked example / time check. |
| Custom PDF clarification | Learner uploads a notation-heavy classroom note. | Formal rule / worked example. |
| Verified computation | A symbolic or numeric result needs checking or alternate form. | Worked example / verification. |
| Language/accessibility | Simplify language, add captions, increase visual contrast or change pacing. | Any stable anchor. |
| Freshness update | Official syllabus or assessment rule changes. | Scope / mode check. |
| Confidence calibration | Learner’s confidence is high but transfer is weak. | Recall / transfer check. |

Composition rules are strict: attach the smallest supported delta; label its source and assumptions; show the learner what changed when helpful; preserve the base version; avoid contradictions; and record the reason for attachment. A delta can be generated from a custom PDF or verified computation, but it cannot silently rewrite the canonical definition or official rule.

## 9. Assessment-mode generation

The official GATE question-pattern page identifies MCQ, MSQ and NAT as question types, and specifies different negative-marking rules and no partial marking in MSQ [2]. The content generator therefore creates mode variants after the concept base is validated.

| Mode | Content-generation requirement | Common control |
|---|---|---|
| MCQ | One correct option, plausible distractors tied to observable misconceptions, explanation of why alternatives fail. | Check negative-marking risk and attempt decision. |
| MSQ | Complete truth-set logic, independent option checks, no partial-credit assumption. | Test all options and condition boundaries. |
| NAT | Numerical model, tolerance/rounding and answer-entry discipline. | Separate mathematical error from entry error. |
| Descriptive/long form where applicable | Assumptions, derivation, intermediate reasoning and defensible conclusion. | Use a rubric and evidence-linked feedback. |
| Timed set | Method-recognition cue, explicit time budget and stop/skip/review decision. | Record time-to-method and verification time. |
| Transfer set | Changed surface, representation or combination of concepts. | Avoid declaring mastery from same-form repetition. |

Assessment generation must preserve the official rule version and paper scope. Item difficulty, historical pattern and learner prevalence must not be invented to make the package appear authoritative.

## 10. Prerequisite graph integration

The graph is used in three directions. **Forward traversal** creates a suggested sequence. **Backward traversal** investigates a failed target. **Impact traversal** identifies which content packages and deltas may be affected by a source, scope or edge change.

For a target failure, the diagnostic algorithm is:

```text
1. validate item quality and target mapping
2. identify the failed target atomic node
3. filter the graph by learner paper, year and official scope
4. traverse incoming edges to a bounded depth
5. rank candidate prerequisites by edge confidence and learner evidence
6. choose the smallest discriminating probe
7. test target, prerequisite, representation, mode and constraint hypotheses
8. require converging evidence before declaring a root-cause hypothesis
9. attach the smallest bridge delta
10. check immediately, after delay and on changed surface
11. update learner state and store the graph path shown
```

The graph should not send a learner backward through an entire domain because of one wrong answer. A wrong eigenvector may be caused by a direct matching misconception, a determinant execution error, a matrix-notation gap, a representation problem or a time/risk issue. The diagnostic probes separate these possibilities.

## 11. Quality-gate pipeline

Content generation is a staged pipeline rather than one model call.

| Gate | Question | Failure action |
|---|---|---|
| Scope | Is this claim inside the learner’s paper/year syllabus? | Remove, qualify or route to review. |
| Source | Does each factual claim have a source and locator? | Add source or mark hypothesis. |
| Mathematics | Do derivations, computations, examples and edge cases pass checks? | Repair or block release. |
| Dependency | Are prerequisite edges and bridges consistent with the graph? | Request graph review. |
| Assessment | Are item type, answer key, tolerance and marking rules correct? | Block item release. |
| Cognitive load | Is the package chunked, guided and free of distracting excess? | Simplify or scaffold. |
| Retrieval | Is there active recall, delayed retrieval and transfer? | Add checks. |
| Accessibility | Can the learner access the same objective through suitable language, captions, contrast and pacing? | Add accessible variant. |
| Provenance | Can every generated component be traced to inputs, model, prompt, source and version? | Block publication. |
| Pilot | Does the variant improve predefined outcomes for its target segment? | Keep draft, promote or roll back. |

A high-impact change includes changes to official scope, answer keys, canonical definitions, prerequisite edges, marking rules, learner risk routing or a base package used by many learners. These changes require owner review even if automated checks pass.

## 12. Self-improvement loop

The system improves through **observations, hypotheses, experiments and releases**, not through silent online rewriting. A learner event might reveal that one visual hook increases first action but reduces transfer. A question audit might reveal that a distractor is ambiguous. A source monitor might detect a changed official PDF. A graph audit might find an edge with repeated negative remediation outcomes.

The improvement proposal should contain:

```text
proposal_id
change_type
affected_atomic_ids
current_version
proposed_version
problem_statement
supporting_events
source_register
benchmark_results
segment_definition
risk_assessment
rollout_plan
rollback_target
owner_decision
```

The release process is:

```text
observe → diagnose → propose → benchmark → bounded pilot → monitor → promote or rollback
```

This mirrors the operational logic of continuous evaluation and metadata management used in production ML systems: validate inputs, track versions and parameters, compare a candidate against a baseline, monitor deployed behavior and retain rollback references [6]. NIST’s AI RMF provides a complementary governance pattern around Govern, Map, Measure and Manage [5].

## 13. Research and source monitoring

Every source has a freshness policy. Official GATE pages and syllabus PDFs receive a high-priority check around notification and syllabus-update windows. Custom PDFs are reprocessed if their file hash changes. Computational-source adapters retain provider/version metadata and are rechecked when assumptions, APIs or output formats change. Research sources receive periodic review according to their impact on design decisions.

| Monitor | Trigger | Response |
|---|---|---|
| Official syllabus hash | URL content or document hash changes. | Freeze affected packages, diff scope, review impact graph. |
| Question-pattern page | Assessment wording or marking rule changes. | Revalidate every mode-specific item and strategy delta. |
| Custom PDF | New hash, OCR confidence drop or page extraction change. | Re-extract, compare claims and request confirmation if conflict appears. |
| Wolfram/computation adapter | API/version/assumption change or failed reproducibility check. | Mark computation delta stale and rerun validated examples. |
| Research source | Retraction, update or changed interpretation. | Reopen linked claims and affected design hypotheses. |
| Learner outcomes | Regression in recall, transfer, trust or error rates. | Pause variant or route to rollback review. |
| Graph topology | New cycle, disconnected node, scope mismatch or low-confidence edge. | Open graph-quality ticket and block affected routing if high risk. |

A source update does not automatically rewrite all content. The system calculates an impact set: claims, base anchors, deltas, assessment items, graph edges, learner segments and marketing statements that depend on the changed source. Only the affected set is revalidated.

## 14. Data and event model

The minimum relational model contains `atomic_topics`, `paper_scope_versions`, `source_documents`, `source_observations`, `claims`, `prerequisite_edges`, `base_content_packages`, `content_anchors`, `delta_packages`, `assessment_items`, `learner_state_snapshots`, `lesson_events`, `experiments`, `content_variants`, `quality_gate_runs`, `release_manifests`, `monitoring_alerts` and `rollback_targets`.

A lesson event should record enough detail to reconstruct what the learner saw and why.

```json
{
  "event_type": "content_delivery_checkpoint",
  "atomic_id": "LA-06",
  "base_version": "eigen-v1",
  "anchor_id": "boundary_or_misconception",
  "delta_ids": ["zero-vector-definition-v1", "eigenspace-multiplicity-v1"],
  "paper_scope": {"paper": "selected_at_runtime", "year": "selected_at_runtime"},
  "assessment_mode": "mixed",
  "learner_state_before": {"recognition": 0.35, "execution": 0.45, "transfer": 0.25},
  "response_evidence": {"answer": "...", "error_code": "multiplicity_confusion", "latency_seconds": 42},
  "routing_reason": "targeted_contrast_after_changed_surface_failure",
  "source_provenance": ["claim-...", "source-..."],
  "content_version": "delivery-manifest-v1",
  "next_action": "delayed_retrieval_and_transfer",
  "created_at": "timestamp"
}
```

The companion schema `gate_base_delta_content_schema.sql` should be extended with the research, claim, quality-gate and content-structure tables described here. The prerequisite diagnosis schema `gate_prerequisite_root_cause_schema.sql` supplies the root-cause and probe layer.

## 15. Metrics that matter

Metrics must be tied to learning and system reliability. Engagement metrics are useful for detecting friction but are not sufficient evidence of learning.

| Metric family | Examples | Interpretation |
|---|---|---|
| Scope reliability | Scope freshness, scope conflicts, out-of-scope exposure rate. | Whether the system teaches the correct target. |
| Content reliability | Citation completeness, math-check pass rate, answer-key corrections, stale-source rate. | Whether the base is trustworthy. |
| Attention-to-learning | First-action latency, first recall completion, early abandonment. | Whether the opening earns a learning action. |
| Learning | Immediate recall, delayed retrieval, transfer accuracy, error recurrence. | Whether content becomes usable knowledge. |
| Exam performance | Time-to-method, verification time, MCQ risk decisions, MSQ truth-set accuracy, NAT entry accuracy. | Whether concept learning transfers to the exam contract. |
| Personalization | Delta precision, unnecessary delta rate, delta benefit, segment conflicts. | Whether personalization is minimal and useful. |
| System improvement | Experiment throughput, promotion rate, rollback rate, time to resolve source update. | Whether learning assets compound safely. |
| Operations | Review minutes per package, unresolved queue, API failure rate, cost per validated package. | Whether a one-person operator can sustain the system. |

The system should prefer improvements that increase delayed retrieval and transfer without raising error, confusion, time or support burden. A variant that generates more clicks but lower retention is a regression.

## 16. One-person operating model

A practical one-person deployment begins with deterministic registries, batch research and a small number of high-impact agents. The operator reviews high-risk outputs and lets low-risk, schema-valid work move through automated gates. The system should expose a daily queue rather than require the operator to inspect every event.

| Queue | Daily question |
|---|---|
| Scope queue | Did any official paper/year document change? |
| Research queue | Which topics lack a complete research brief or have unresolved conflicts? |
| Content queue | Which base packages failed a deterministic or pedagogical gate? |
| Source queue | Which custom PDFs, computational outputs or research sources changed? |
| Learner queue | Which recurring errors lack a validated delta? |
| Experiment queue | Which content variant has enough exposure for a bounded comparison? |
| Governance queue | Which proposed changes affect canonical definitions, scope, keys or graph edges? |

For a first release, generate research briefs and base packages in batches, validate them with deterministic checks, and pilot a small subset of domains. Do not begin by generating every possible media format. Text, diagrams, worked examples, recall items and mode variants provide a more manageable base. Add Manim, interactive graphs, custom-PDF deltas and verified computation where the topic or learner evidence justifies the cost.

## 17. Implementation roadmap

| Stage | Deliverable | Exit condition |
|---|---|---|
| 0. Registry | Import all 116 topics, scope metadata, objectives, challenge hypotheses and graph IDs. | No missing IDs; all rows schema-valid. |
| 1. Research MVP | Complete research briefs for a pilot domain and register sources/claims. | Every generated claim has a source or explicit hypothesis label. |
| 2. Base content | Generate standard text packages using template families and anchor IDs. | Math, scope, citation, retrieval and accessibility gates pass. |
| 3. Assessment layer | Add MCQ/MSQ/NAT and timed/transfer variants. | Answer keys and marking rules are verified. |
| 4. Delta layer | Add prerequisite, representation, custom-PDF and verified-computation deltas. | Deltas attach selectively and remain reproducible. |
| 5. Learner loop | Instrument responses, latency, confidence, retrieval, transfer and constraints. | State transitions and next actions are reconstructable. |
| 6. Experiment layer | Compare hooks, sequences and formats by segment. | Promotion and rollback are evidence-based. |
| 7. Source monitoring | Add change detection, impact traversal and review queues. | Updates are detected and affected content is revalidated. |
| 8. Replication | Swap the syllabus, exam contract and taxonomy. | The same pipeline generates a new course without changing core services. |

## 18. Portability beyond GATE

To replicate the system for another course or exam, replace the domain-specific registries: syllabus source, paper/year scope, topic inventory, assessment contract, prerequisite graph and item taxonomy. Keep the core services unchanged: research registry, source adapters, claim ledger, base/delta composer, quality gates, learner state, experiment registry and release governance.

The framework should represent topic schemes with stable identifiers, labels, notes and links. W3C SKOS provides a lightweight model for identifying concepts, labels, notes, semantic relations, collections and mappings [7]. The framework should use that kind of concept organization for portability while keeping formal mathematical claims and learner policies in explicit governed records rather than pretending that a lightweight taxonomy is a complete formal ontology.

## 19. What must never be hallucinated

The system must not invent official syllabus scope, paper applicability, historical frequency, question weightage, marking rules, answer keys, theorem conditions, numerical results, source content, learner prevalence or treatment effectiveness. When evidence is insufficient, it should say what is known, what is inferred, what was directly reviewed and what remains to be validated.

The system may generate a **candidate** example, hook, analogy, delta or graph edge. It may not present that candidate as canonical until it passes the appropriate source, mathematics, scope, assessment and pilot gates. This distinction is what makes the framework adaptable without making it unreliable.

## 20. References

[1]: https://gate2026.iitg.ac.in/exam-papers-and-syllabus.html "GATE 2026 Test Papers & Syllabus — IIT Guwahati"

[2]: https://gate2026.iitg.ac.in/question-paper-pattern.html "GATE 2026 Question Paper Pattern — IIT Guwahati"

[3]: https://pmc.ncbi.nlm.nih.gov/articles/PMC11078833/ "Systematic review of distributed practice and retrieval practice in health professions education"

[4]: https://www.edresearch.edu.au/summaries-explainers/explainers/managing-cognitive-load-optimises-learning "Managing cognitive load optimises learning — Australian Education Research Organisation"

[5]: https://www.nist.gov/itl/ai-risk-management-framework "AI Risk Management Framework — National Institute of Standards and Technology"

[6]: https://docs.cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning "MLOps: Continuous delivery and automation pipelines in machine learning — Google Cloud"

[7]: https://www.w3.org/TR/skos-reference/ "SKOS Simple Knowledge Organization System Reference — W3C"

[8]: https://www.wolfram.com/apis/documentation/ "Wolfram APIs Documentation"
