# Wolfram-Inspired Mapping for Every GATE Engineering Mathematics Atomic Concept

**Coverage:** 116 atomic topics  
**Status:** research-first resource recipe; not authoritative topic content until gates pass.

> The 10,000× design is implemented as reusable leverage: one typed resource can serve many topics, while topic-specific source bundles, graph evidence, computation traces, examples and assessments remain distinct.

## Universal per-topic compiler contract

Each topic is compiled from `scope.resolve`, a research/claim bundle, graph evidence, a static teaching resource recipe, independent verifiers, assessment resources and approved modifiers. The output is a structured lesson package with anchor-level provenance and a delta manifest.

## Per-topic mapping
### LA-01 — Matrix algebra and operations

**Family:** `matrix`  
**Papers:** CS, CE, EE, ME, XE-A  
**Prerequisites:** none asserted  
**Representation:** matrix/table + dimension overlay  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.dimension, verify.scope  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic equivalence; dimension compatibility; determinant/rank/invertibility checks; counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### LA-02 — Determinants and determinant properties

**Family:** `matrix`  
**Papers:** CS, CE, EE, ME, XE-A  
**Prerequisites:** LA-01  
**Representation:** matrix/table + dimension overlay  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.dimension, verify.scope  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic equivalence; dimension compatibility; determinant/rank/invertibility checks; counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### LA-03 — Inverse of a matrix

**Family:** `matrix`  
**Papers:** CS, CE, EE, ME, XE-A  
**Prerequisites:** LA-01, LA-02  
**Representation:** matrix/table + dimension overlay  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.dimension, verify.scope  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic equivalence; dimension compatibility; determinant/rank/invertibility checks; counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### LA-04 — Rank of a matrix

**Family:** `matrix`  
**Papers:** CE, EE, ME, XE-A  
**Prerequisites:** LA-01  
**Representation:** matrix/table + dimension overlay  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.dimension, verify.scope  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic equivalence; dimension compatibility; determinant/rank/invertibility checks; counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### LA-05 — Systems of linear equations

**Family:** `matrix`  
**Papers:** CS, CE, EE, ME, XE-A  
**Prerequisites:** LA-01, LA-02, LA-04  
**Representation:** matrix/table + dimension overlay  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.dimension, verify.scope  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic equivalence; dimension compatibility; determinant/rank/invertibility checks; counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### LA-06 — Eigenvalues

**Family:** `eigen`  
**Papers:** CS, CE, EE, ME, XE-A  
**Prerequisites:** LA-01, LA-02, LA-04  
**Representation:** 2D transformation + invariant direction + characteristic polynomial  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.numeric, verify.dimension  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** eigenpair recomputation; trace/determinant cross-check; nullspace verification; multiplicity and diagonalization counterexamples  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### LA-07 — Eigenvectors

**Family:** `eigen`  
**Papers:** CS, CE, EE, ME, XE-A  
**Prerequisites:** LA-06  
**Representation:** 2D transformation + invariant direction + characteristic polynomial  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.numeric, verify.dimension  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** eigenpair recomputation; trace/determinant cross-check; nullspace verification; multiplicity and diagonalization counterexamples  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### LA-08 — Symmetric-matrix properties

**Family:** `eigen`  
**Papers:** XE-A and paper-dependent overlap  
**Prerequisites:** LA-01  
**Representation:** 2D transformation + invariant direction + characteristic polynomial  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.numeric, verify.dimension  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** eigenpair recomputation; trace/determinant cross-check; nullspace verification; multiplicity and diagonalization counterexamples  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### LA-09 — Diagonalization

**Family:** `eigen`  
**Papers:** XE-A; related in CS/branch contexts  
**Prerequisites:** LA-06, LA-07, LA-08  
**Representation:** 2D transformation + invariant direction + characteristic polynomial  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.numeric, verify.dimension  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** eigenpair recomputation; trace/determinant cross-check; nullspace verification; multiplicity and diagonalization counterexamples  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### LA-10 — Cayley–Hamilton theorem

**Family:** `eigen`  
**Papers:** XE-A  
**Prerequisites:** LA-06  
**Representation:** 2D transformation + invariant direction + characteristic polynomial  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.numeric, verify.dimension  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** eigenpair recomputation; trace/determinant cross-check; nullspace verification; multiplicity and diagonalization counterexamples  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### LA-11 — LU decomposition

**Family:** `matrix`  
**Papers:** CS, XE-A and branch-dependent numerical scope  
**Prerequisites:** LA-01, LA-05  
**Representation:** matrix/table + dimension overlay  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.dimension, verify.scope  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic equivalence; dimension compatibility; determinant/rank/invertibility checks; counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CA-01 — Limits

**Family:** `limit`  
**Papers:** CS, CE, EE, ME, XE-A  
**Prerequisites:** none asserted  
**Representation:** graph/table + one-sided approach  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.nat, verify.symbolic, verify.scope  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** one-sided limit recomputation; substitution/indeterminate-form classification; counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CA-02 — Indeterminate forms

**Family:** `limit`  
**Papers:** ME, XE-A and paper-dependent overlap  
**Prerequisites:** CA-01  
**Representation:** graph/table + one-sided approach  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.nat, verify.symbolic, verify.scope  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** one-sided limit recomputation; substitution/indeterminate-form classification; counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CA-03 — L’Hospital’s rule

**Family:** `derivative`  
**Papers:** XE-A and branch-dependent scope  
**Prerequisites:** CA-02  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CA-04 — Continuity

**Family:** `limit`  
**Papers:** CS, CE, ME, XE-A  
**Prerequisites:** CA-01  
**Representation:** graph/table + one-sided approach  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.nat, verify.symbolic, verify.scope  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** one-sided limit recomputation; substitution/indeterminate-form classification; counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CA-05 — Differentiability

**Family:** `derivative`  
**Papers:** CS, CE, ME, XE-A  
**Prerequisites:** CA-04  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CA-06 — Mean value theorems

**Family:** `derivative`  
**Papers:** CS, CE, XE-A  
**Prerequisites:** CA-05  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CA-07 — Maxima and minima of one variable

**Family:** `derivative`  
**Papers:** CS, CE, ME, XE-A  
**Prerequisites:** CA-05  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CA-08 — Taylor theorem and remainder

**Family:** `derivative`  
**Papers:** XE-A and branch-dependent scope  
**Prerequisites:** CA-05  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CA-09 — Taylor series

**Family:** `derivative`  
**Papers:** CS/CE/ME/XE-A in varying depth  
**Prerequisites:** CA-08  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CA-10 — Fundamental theorem of integral calculus

**Family:** `integral`  
**Papers:** XE-A and branch-dependent scope  
**Prerequisites:** none asserted  
**Representation:** accumulation/area + bounds  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.nat, verify.symbolic, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** antiderivative/differentiation check; bound and sign check; convergence check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CA-11 — Definite integrals

**Family:** `integral`  
**Papers:** CS, CE, EE, ME, XE-A  
**Prerequisites:** CA-10  
**Representation:** accumulation/area + bounds  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.nat, verify.symbolic, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** antiderivative/differentiation check; bound and sign check; convergence check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CA-12 — Improper integrals

**Family:** `integral`  
**Papers:** CE, EE, ME, XE-A  
**Prerequisites:** CA-11  
**Representation:** accumulation/area + bounds  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.nat, verify.symbolic, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** antiderivative/differentiation check; bound and sign check; convergence check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CA-13 — Area under curves

**Family:** `integral`  
**Papers:** CE, ME, XE-A  
**Prerequisites:** CA-11  
**Representation:** accumulation/area + bounds  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.nat, verify.symbolic, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** antiderivative/differentiation check; bound and sign check; convergence check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CA-14 — Volume of revolution

**Family:** `integral`  
**Papers:** CE, ME, XE-A  
**Prerequisites:** CA-13  
**Representation:** accumulation/area + bounds  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.nat, verify.symbolic, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** antiderivative/differentiation check; bound and sign check; convergence check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CA-15 — Limits and continuity of two variables

**Family:** `limit`  
**Papers:** CE, ME, XE-A  
**Prerequisites:** none asserted  
**Representation:** graph/table + one-sided approach  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.nat, verify.symbolic, verify.scope  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** one-sided limit recomputation; substitution/indeterminate-form classification; counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CA-16 — Partial derivatives

**Family:** `derivative`  
**Papers:** CE, EE, ME, XE-A  
**Prerequisites:** CA-15  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CA-17 — Total derivative

**Family:** `derivative`  
**Papers:** CE, ME, XE-A  
**Prerequisites:** CA-16  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CA-18 — Directional derivative

**Family:** `derivative`  
**Papers:** CE, EE, ME, XE-A  
**Prerequisites:** CA-16, CA-17  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CA-19 — Maxima, minima and saddle points of two variables

**Family:** `optimization`  
**Papers:** CE, ME, XE-A  
**Prerequisites:** CA-16, CA-18  
**Representation:** objective landscape + candidate/boundary table  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** stationary-point recomputation; second-order/boundary check; candidate completeness check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CA-20 — Lagrange multipliers

**Family:** `optimization`  
**Papers:** XE-A and paper-dependent scope  
**Prerequisites:** CA-16, CA-19  
**Representation:** objective landscape + candidate/boundary table  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** stationary-point recomputation; second-order/boundary check; candidate completeness check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CA-21 — Double integrals

**Family:** `integral`  
**Papers:** CE, ME, XE-A  
**Prerequisites:** CA-16  
**Representation:** accumulation/area + bounds  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.nat, verify.symbolic, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** antiderivative/differentiation check; bound and sign check; convergence check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CA-22 — Triple integrals

**Family:** `integral`  
**Papers:** ME and paper-dependent scope  
**Prerequisites:** CA-21  
**Representation:** accumulation/area + bounds  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.nat, verify.symbolic, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** antiderivative/differentiation check; bound and sign check; convergence check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### VC-01 — Vector fields and notation

**Family:** `vector`  
**Papers:** CE, EE, ME, XE-A  
**Prerequisites:** none asserted  
**Representation:** vector-field visual + operator map  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** component recomputation; orientation/sign check; identity or theorem-condition check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### VC-02 — Gradient

**Family:** `vector`  
**Papers:** CE, EE, ME, XE-A  
**Prerequisites:** VC-01  
**Representation:** vector-field visual + operator map  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** component recomputation; orientation/sign check; identity or theorem-condition check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### VC-03 — Divergence

**Family:** `vector`  
**Papers:** CE, EE, ME, XE-A  
**Prerequisites:** VC-01  
**Representation:** vector-field visual + operator map  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** component recomputation; orientation/sign check; identity or theorem-condition check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### VC-04 — Curl

**Family:** `vector`  
**Papers:** CE, EE, ME, XE-A  
**Prerequisites:** VC-01  
**Representation:** vector-field visual + operator map  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** component recomputation; orientation/sign check; identity or theorem-condition check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### VC-05 — Vector identities

**Family:** `vector`  
**Papers:** CE, EE, ME, XE-A  
**Prerequisites:** VC-02, VC-03, VC-04  
**Representation:** vector-field visual + operator map  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** component recomputation; orientation/sign check; identity or theorem-condition check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### VC-06 — Line integrals

**Family:** `integral`  
**Papers:** CE, EE, ME, XE-A  
**Prerequisites:** VC-01  
**Representation:** accumulation/area + bounds  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.nat, verify.symbolic, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** antiderivative/differentiation check; bound and sign check; convergence check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### VC-07 — Green’s theorem

**Family:** `vector`  
**Papers:** CE, EE, ME, XE-A  
**Prerequisites:** VC-06  
**Representation:** vector-field visual + operator map  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** component recomputation; orientation/sign check; identity or theorem-condition check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### VC-08 — Surface and volume integrals

**Family:** `integral`  
**Papers:** CE, EE, ME, XE-A  
**Prerequisites:** VC-01  
**Representation:** accumulation/area + bounds  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.nat, verify.symbolic, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** antiderivative/differentiation check; bound and sign check; convergence check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### VC-09 — Stokes’ theorem

**Family:** `vector`  
**Papers:** EE, ME, XE-A and branch-dependent scope  
**Prerequisites:** VC-08  
**Representation:** vector-field visual + operator map  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** component recomputation; orientation/sign check; identity or theorem-condition check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### VC-10 — Gauss/divergence theorem

**Family:** `vector`  
**Papers:** EE, ME, XE-A and branch-dependent scope  
**Prerequisites:** VC-08  
**Representation:** vector-field visual + operator map  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** component recomputation; orientation/sign check; identity or theorem-condition check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### VC-11 — Theorem selection across Green/Stokes/Gauss

**Family:** `vector`  
**Papers:** CE, EE, ME, XE-A  
**Prerequisites:** VC-07, VC-09, VC-10  
**Representation:** vector-field visual + operator map  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** component recomputation; orientation/sign check; identity or theorem-condition check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DE-01 — First-order linear equations

**Family:** `matrix`  
**Papers:** CE, EE, ME, XE-A  
**Prerequisites:** CA-05, CA-11  
**Representation:** matrix/table + dimension overlay  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.dimension, verify.scope  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic equivalence; dimension compatibility; determinant/rank/invertibility checks; counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DE-02 — First-order separable/nonlinear equations

**Family:** `matrix`  
**Papers:** CE, EE, ME, XE-A  
**Prerequisites:** CA-05, CA-11  
**Representation:** matrix/table + dimension overlay  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.dimension, verify.scope  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic equivalence; dimension compatibility; determinant/rank/invertibility checks; counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DE-03 — Exact equations

**Family:** `derivative`  
**Papers:** Branch-dependent, especially XE-A/engineering papers  
**Prerequisites:** none asserted  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DE-04 — Homogeneous first-order equations

**Family:** `derivative`  
**Papers:** Branch-dependent  
**Prerequisites:** none asserted  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DE-05 — Higher-order constant-coefficient equations

**Family:** `derivative`  
**Papers:** CE, EE, ME, XE-A  
**Prerequisites:** CA-05, CA-11  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DE-06 — Cauchy–Euler equations

**Family:** `derivative`  
**Papers:** XE-A, EE/ME overlap by wording  
**Prerequisites:** DE-05  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DE-07 — Variable-coefficient linear equations

**Family:** `matrix`  
**Papers:** XE-A  
**Prerequisites:** DE-05  
**Representation:** matrix/table + dimension overlay  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.dimension, verify.scope  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic equivalence; dimension compatibility; determinant/rank/invertibility checks; counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DE-08 — Initial-value problems

**Family:** `derivative`  
**Papers:** CE, EE, ME, XE-A  
**Prerequisites:** DE-01, DE-02, DE-03, DE-04  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DE-09 — Boundary-value problems

**Family:** `derivative`  
**Papers:** CE, EE, ME, XE-A  
**Prerequisites:** DE-08  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DE-10 — Wronskian

**Family:** `derivative`  
**Papers:** XE-A  
**Prerequisites:** DE-05  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DE-11 — Variation of parameters

**Family:** `derivative`  
**Papers:** XE-A and branch-dependent scope  
**Prerequisites:** DE-05, DE-10  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DE-12 — Eigenvalue problems for second-order equations

**Family:** `eigen`  
**Papers:** XE-A  
**Prerequisites:** DE-05  
**Representation:** 2D transformation + invariant direction + characteristic polynomial  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.numeric, verify.dimension  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** eigenpair recomputation; trace/determinant cross-check; nullspace verification; multiplicity and diagonalization counterexamples  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DE-13 — Power-series solutions at ordinary points

**Family:** `derivative`  
**Papers:** XE-A  
**Prerequisites:** DE-12  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DE-14 — Laplace transforms in ODE solution

**Family:** `derivative`  
**Papers:** ME and branch-dependent scope  
**Prerequisites:** DE-05  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### PD-01 — Classification of second-order linear PDEs

**Family:** `matrix`  
**Papers:** XE-A  
**Prerequisites:** CA-15, CA-16  
**Representation:** matrix/table + dimension overlay  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.dimension, verify.scope  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic equivalence; dimension compatibility; determinant/rank/invertibility checks; counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### PD-02 — Separation of variables

**Family:** `derivative`  
**Papers:** CE, EE, ME, XE-A  
**Prerequisites:** DE-01, DE-05, PD-01  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### PD-03 — One-dimensional heat/diffusion equation

**Family:** `derivative`  
**Papers:** CE, XE-A and ME overlap  
**Prerequisites:** PD-02, PD-06, PD-07  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### PD-04 — One-dimensional wave equation

**Family:** `derivative`  
**Papers:** CE and ME  
**Prerequisites:** PD-02, PD-06, PD-07  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### PD-05 — Two-dimensional Laplace equation

**Family:** `derivative`  
**Papers:** CE, ME, XE-A  
**Prerequisites:** PD-02, PD-06, PD-07  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### PD-06 — Fourier-series boundary representation

**Family:** `derivative`  
**Papers:** CE, XE-A and branch-dependent scope  
**Prerequisites:** CA-09, CA-11, PD-02  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### PD-07 — Initial and boundary condition compatibility

**Family:** `derivative`  
**Papers:** CE, EE, ME, XE-A  
**Prerequisites:** PD-01  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### PD-08 — PDE solution interpretation and verification

**Family:** `derivative`  
**Papers:** CE, ME, XE-A  
**Prerequisites:** PD-01, PD-03, PD-04, PD-05  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CX-01 — Complex numbers and algebra

**Family:** `complex`  
**Papers:** EE, ME, XE-A  
**Prerequisites:** none asserted  
**Representation:** Argand-plane mapping + contour/singularity geometry  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic simplification; analyticity/condition check; residue/contour recomputation  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CX-02 — Argand plane

**Family:** `complex`  
**Papers:** EE, ME, XE-A  
**Prerequisites:** CX-01  
**Representation:** Argand-plane mapping + contour/singularity geometry  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic simplification; analyticity/condition check; residue/contour recomputation  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CX-03 — Polar/exponential representation

**Family:** `complex`  
**Papers:** EE, ME, XE-A  
**Prerequisites:** CX-01  
**Representation:** Argand-plane mapping + contour/singularity geometry  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic simplification; analyticity/condition check; residue/contour recomputation  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CX-04 — De Moivre’s theorem

**Family:** `complex`  
**Papers:** XE-A and branch-dependent scope  
**Prerequisites:** CX-03  
**Representation:** Argand-plane mapping + contour/singularity geometry  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic simplification; analyticity/condition check; residue/contour recomputation  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CX-05 — Analytic functions

**Family:** `complex`  
**Papers:** EE, ME, XE-A  
**Prerequisites:** CX-02, CX-03  
**Representation:** Argand-plane mapping + contour/singularity geometry  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic simplification; analyticity/condition check; residue/contour recomputation  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CX-06 — Cauchy–Riemann equations

**Family:** `complex`  
**Papers:** EE, ME, XE-A  
**Prerequisites:** CX-05  
**Representation:** Argand-plane mapping + contour/singularity geometry  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic simplification; analyticity/condition check; residue/contour recomputation  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CX-07 — Cauchy’s integral theorem

**Family:** `integral`  
**Papers:** EE, ME, XE-A  
**Prerequisites:** CX-05, CX-06  
**Representation:** accumulation/area + bounds  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.nat, verify.symbolic, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** antiderivative/differentiation check; bound and sign check; convergence check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CX-08 — Cauchy’s integral formula

**Family:** `integral`  
**Papers:** EE, ME, XE-A  
**Prerequisites:** CX-07  
**Representation:** accumulation/area + bounds  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.nat, verify.symbolic, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** antiderivative/differentiation check; bound and sign check; convergence check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CX-09 — Taylor and Laurent series

**Family:** `derivative`  
**Papers:** EE, ME, XE-A  
**Prerequisites:** CX-05  
**Representation:** slope/rate graph + local linearization  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic derivative recomputation; condition checks; graph/slope sanity check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### CX-10 — Residue theorem and contour integrals

**Family:** `integral`  
**Papers:** EE, ME, XE-A  
**Prerequisites:** CX-07, CX-08, CX-09  
**Representation:** accumulation/area + bounds  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.nat, verify.symbolic, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** antiderivative/differentiation check; bound and sign check; convergence check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### PS-01 — Probability axioms

**Family:** `probability`  
**Papers:** CS, CE, EE, ME, XE-A  
**Prerequisites:** DM-03  
**Representation:** sample-space tree/table + distribution shape  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** probability normalization; conditional/independence check; enumeration or simulation cross-check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### PS-02 — Counting and event construction

**Family:** `probability`  
**Papers:** CS and prerequisite for all papers  
**Prerequisites:** DM-13, PS-01  
**Representation:** sample-space tree/table + distribution shape  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** probability normalization; conditional/independence check; enumeration or simulation cross-check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### PS-03 — Conditional probability

**Family:** `probability`  
**Papers:** CS, CE, EE, ME, XE-A  
**Prerequisites:** PS-01, PS-02  
**Representation:** sample-space tree/table + distribution shape  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** probability normalization; conditional/independence check; enumeration or simulation cross-check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### PS-04 — Bayes’ theorem

**Family:** `probability`  
**Papers:** CS, CE, EE, ME, XE-A  
**Prerequisites:** PS-03  
**Representation:** sample-space tree/table + distribution shape  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** probability normalization; conditional/independence check; enumeration or simulation cross-check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### PS-05 — Random variables

**Family:** `probability`  
**Papers:** CS, CE, EE, ME, XE-A  
**Prerequisites:** PS-01  
**Representation:** sample-space tree/table + distribution shape  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** probability normalization; conditional/independence check; enumeration or simulation cross-check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### PS-06 — Mean/expectation

**Family:** `probability`  
**Papers:** CS, CE, EE, ME, XE-A  
**Prerequisites:** PS-05  
**Representation:** sample-space tree/table + distribution shape  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** probability normalization; conditional/independence check; enumeration or simulation cross-check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### PS-07 — Variance and standard deviation

**Family:** `probability`  
**Papers:** CS, CE, EE, ME, XE-A  
**Prerequisites:** PS-05, PS-06  
**Representation:** sample-space tree/table + distribution shape  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** probability normalization; conditional/independence check; enumeration or simulation cross-check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### PS-08 — Median and mode

**Family:** `ode`  
**Papers:** CS, CE, ME, XE-A  
**Prerequisites:** PS-05  
**Representation:** equation classifier + direction field + solution residual  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** residual substitution; initial/boundary condition check; equation-classification check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### PS-09 — Binomial distribution

**Family:** `probability`  
**Papers:** CS, CE, EE, ME, XE-A  
**Prerequisites:** PS-05  
**Representation:** sample-space tree/table + distribution shape  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** probability normalization; conditional/independence check; enumeration or simulation cross-check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### PS-10 — Poisson distribution

**Family:** `probability`  
**Papers:** CS, CE, EE, ME, XE-A  
**Prerequisites:** PS-05  
**Representation:** sample-space tree/table + distribution shape  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** probability normalization; conditional/independence check; enumeration or simulation cross-check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### PS-11 — Normal distribution

**Family:** `probability`  
**Papers:** CS, CE, EE, ME, XE-A  
**Prerequisites:** PS-05  
**Representation:** sample-space tree/table + distribution shape  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** probability normalization; conditional/independence check; enumeration or simulation cross-check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### PS-12 — Sampling theorems

**Family:** `probability`  
**Papers:** CE, EE, ME, branch-dependent scope  
**Prerequisites:** PS-06, PS-07, PS-09, PS-10, PS-11  
**Representation:** sample-space tree/table + distribution shape  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** probability normalization; conditional/independence check; enumeration or simulation cross-check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### PS-13 — Correlation

**Family:** `probability`  
**Papers:** EE, CE and branch-dependent scope  
**Prerequisites:** PS-06, PS-07  
**Representation:** sample-space tree/table + distribution shape  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** probability normalization; conditional/independence check; enumeration or simulation cross-check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### PS-14 — Linear regression

**Family:** `matrix`  
**Papers:** CE, EE and branch-dependent scope  
**Prerequisites:** PS-06, PS-07, PS-13  
**Representation:** matrix/table + dimension overlay  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.dimension, verify.scope  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic equivalence; dimension compatibility; determinant/rank/invertibility checks; counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### NM-01 — Numerical error and error analysis

**Family:** `numerical`  
**Papers:** CE and branch-dependent scope  
**Prerequisites:** none asserted  
**Representation:** iteration trace + residual/error budget  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.numeric, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** iteration recomputation; residual and stopping-rule check; convergence/stability check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### NM-02 — Conditioning and stability concepts

**Family:** `numerical`  
**Papers:** Branch-dependent numerical scope  
**Prerequisites:** NM-01  
**Representation:** iteration trace + residual/error budget  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.numeric, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** iteration recomputation; residual and stopping-rule check; convergence/stability check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### NM-03 — Gauss elimination

**Family:** `numerical`  
**Papers:** XE-A and branch-dependent scope  
**Prerequisites:** LA-01, LA-05, NM-01, NM-02  
**Representation:** iteration trace + residual/error budget  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.numeric, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** iteration recomputation; residual and stopping-rule check; convergence/stability check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### NM-04 — LU decomposition

**Family:** `matrix`  
**Papers:** CS, XE-A and branch-dependent scope  
**Prerequisites:** LA-05, LA-06, NM-02, NM-03  
**Representation:** matrix/table + dimension overlay  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.dimension, verify.scope  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic equivalence; dimension compatibility; determinant/rank/invertibility checks; counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### NM-05 — Lagrange interpolation

**Family:** `optimization`  
**Papers:** CE, XE-A and branch-dependent scope  
**Prerequisites:** NM-01  
**Representation:** objective landscape + candidate/boundary table  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** stationary-point recomputation; second-order/boundary check; candidate completeness check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### NM-06 — Newton interpolation

**Family:** `numerical`  
**Papers:** XE-A and branch-dependent scope  
**Prerequisites:** NM-05  
**Representation:** iteration trace + residual/error budget  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.numeric, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** iteration recomputation; residual and stopping-rule check; convergence/stability check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### NM-07 — Newton–Raphson method

**Family:** `numerical`  
**Papers:** XE-A and branch-dependent scope  
**Prerequisites:** CA-05, NM-01, NM-02  
**Representation:** iteration trace + residual/error budget  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.numeric, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** iteration recomputation; residual and stopping-rule check; convergence/stability check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### NM-08 — Numerical integration: trapezoidal rule

**Family:** `numerical`  
**Papers:** CE, ME, XE-A  
**Prerequisites:** CA-11, NM-01  
**Representation:** iteration trace + residual/error budget  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.numeric, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** iteration recomputation; residual and stopping-rule check; convergence/stability check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### NM-09 — Numerical integration: Simpson’s rule

**Family:** `numerical`  
**Papers:** CE, ME, XE-A  
**Prerequisites:** CA-11, NM-08  
**Representation:** iteration trace + residual/error budget  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.numeric, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** iteration recomputation; residual and stopping-rule check; convergence/stability check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### NM-10 — Explicit Euler method

**Family:** `numerical`  
**Papers:** XE-A and branch-dependent scope  
**Prerequisites:** CA-05, NM-01  
**Representation:** iteration trace + residual/error budget  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.numeric, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** iteration recomputation; residual and stopping-rule check; convergence/stability check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### NM-11 — Single- and multistep ODE methods

**Family:** `ode`  
**Papers:** CE, ME and branch-dependent scope  
**Prerequisites:** NM-10  
**Representation:** equation classifier + direction field + solution residual  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.numeric  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** residual substitution; initial/boundary condition check; equation-classification check  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DM-01 — Propositional logic

**Family:** `discrete`  
**Papers:** CS  
**Prerequisites:** none asserted  
**Representation:** small instance + truth table/graph/recurrence  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** finite enumeration; truth-table/property check; small-counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DM-02 — First-order logic

**Family:** `discrete`  
**Papers:** CS  
**Prerequisites:** DM-01  
**Representation:** small instance + truth table/graph/recurrence  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** finite enumeration; truth-table/property check; small-counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DM-03 — Sets

**Family:** `discrete`  
**Papers:** CS  
**Prerequisites:** none asserted  
**Representation:** small instance + truth table/graph/recurrence  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** finite enumeration; truth-table/property check; small-counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DM-04 — Relations

**Family:** `discrete`  
**Papers:** CS  
**Prerequisites:** DM-03  
**Representation:** small instance + truth table/graph/recurrence  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** finite enumeration; truth-table/property check; small-counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DM-05 — Functions

**Family:** `matrix`  
**Papers:** CS  
**Prerequisites:** DM-03  
**Representation:** matrix/table + dimension overlay  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.dimension, verify.scope  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic equivalence; dimension compatibility; determinant/rank/invertibility checks; counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DM-06 — Partial orders

**Family:** `matrix`  
**Papers:** CS  
**Prerequisites:** DM-04  
**Representation:** matrix/table + dimension overlay  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.dimension, verify.scope  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic equivalence; dimension compatibility; determinant/rank/invertibility checks; counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DM-07 — Lattices

**Family:** `matrix`  
**Papers:** CS  
**Prerequisites:** DM-06  
**Representation:** matrix/table + dimension overlay  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.dimension, verify.scope  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic equivalence; dimension compatibility; determinant/rank/invertibility checks; counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DM-08 — Monoids

**Family:** `matrix`  
**Papers:** CS  
**Prerequisites:** none asserted  
**Representation:** matrix/table + dimension overlay  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.dimension, verify.scope  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic equivalence; dimension compatibility; determinant/rank/invertibility checks; counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DM-09 — Groups

**Family:** `matrix`  
**Papers:** CS  
**Prerequisites:** DM-08  
**Representation:** matrix/table + dimension overlay  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.dimension, verify.scope  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic equivalence; dimension compatibility; determinant/rank/invertibility checks; counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DM-10 — Graph connectivity

**Family:** `discrete`  
**Papers:** CS  
**Prerequisites:** DM-03  
**Representation:** small instance + truth table/graph/recurrence  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** finite enumeration; truth-table/property check; small-counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DM-11 — Matching

**Family:** `matrix`  
**Papers:** CS  
**Prerequisites:** DM-10  
**Representation:** matrix/table + dimension overlay  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.dimension, verify.scope  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic equivalence; dimension compatibility; determinant/rank/invertibility checks; counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DM-12 — Graph colouring

**Family:** `discrete`  
**Papers:** CS  
**Prerequisites:** DM-10  
**Representation:** small instance + truth table/graph/recurrence  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** finite enumeration; truth-table/property check; small-counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DM-13 — Counting

**Family:** `matrix`  
**Papers:** CS  
**Prerequisites:** DM-03  
**Representation:** matrix/table + dimension overlay  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.dimension, verify.scope  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic equivalence; dimension compatibility; determinant/rank/invertibility checks; counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DM-14 — Recurrence relations

**Family:** `discrete`  
**Papers:** CS  
**Prerequisites:** DM-13  
**Representation:** small instance + truth table/graph/recurrence  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.method_selector, teach.checked_example, teach.counterexample, assess.mcq, assess.msq, assess.nat, verify.symbolic  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** finite enumeration; truth-table/property check; small-counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

### DM-15 — Generating functions

**Family:** `matrix`  
**Papers:** CS  
**Prerequisites:** DM-14  
**Representation:** matrix/table + dimension overlay  
**Prompt resources:** teach.hook, teach.intuition, teach.formal_anchor, teach.checked_example, assess.mcq, assess.msq, assess.nat, verify.symbolic, verify.dimension, verify.scope  
**Computation roles:** verification, counterexample_search, representation_generation, question_variation, learner_exploration  
**Verifier recipe:** symbolic equivalence; dimension compatibility; determinant/rank/invertibility checks; counterexample search  
**Dynamic deltas:** prerequisite_gap, representation_gap, execution_gap, assessment_mode_gap, constraint_gap, custom_source, verified_computation  
**Research inputs:** official_syllabus_scope_and_year, official_question_pattern_and_marking_rules, topic_definitions_theorems_algorithms_and_conditions, prerequisite_dependencies_and_common_misconception_hypotheses, historical_question_pattern_coding_with_evidence_label, worked_examples_and_counterexamples, assessment_mode_variants_mcq_msq_nat_and_descriptive_if_applicable, learner_constraints_time_pressure_deadline_confidence_and_accessibility, source_freshness_provenance_and_conflict_check  
**Outcome metrics:** immediate_accuracy, delayed_retrieval, changed_surface_transfer, time_to_method, error_recurrence, hint_dependence, confidence_calibration, support_burden

## Operating rule

No topic is considered production-authoritative merely because a prompt generated fluent text. The canonical base requires scope, claim, mathematics, assessment, accessibility and provenance gates. Personalized deltas require linked learner evidence and must not silently change canonical mathematics, official rules or graph edges.

## References

[1]: https://resources.wolframcloud.com/PromptRepository "Wolfram Prompt Repository"
[2]: https://reference.wolfram.com/language/ref/LLMPrompt.html "Wolfram Research, LLMPrompt"
[3]: https://reference.wolfram.com/language/ref/resourceobject/Prompt.html "Wolfram Research, Prompt Resource Object"
[4]: https://www.wolfram.com/apis/documentation/ "Wolfram APIs Documentation"
