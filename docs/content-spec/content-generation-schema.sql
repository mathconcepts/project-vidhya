-- Research-first adaptive content-generation schema.
-- Relational source of truth; graph and retrieval indexes are projections.

create type evidence_label as enum ('official', 'directly_reviewed', 'pattern_supported', 'design_hypothesis');
create type review_status as enum ('candidate', 'in_review', 'approved', 'rejected', 'stale', 'superseded');
create type content_layer as enum ('base', 'delta', 'assessment', 'research');
create type release_status as enum ('draft', 'pilot', 'published', 'paused', 'rolled_back');

create table atomic_topics (
  atomic_id text primary key,
  domain text not null,
  canonical_title text not null,
  aliases jsonb not null default '[]',
  papers jsonb not null default '[]',
  assessment_modes jsonb not null default '[]',
  objective_contract jsonb not null,
  challenge_hypotheses jsonb not null default '{}',
  template_family text,
  content_structure_version text,
  source_catalogue text not null,
  status review_status not null default 'approved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table paper_scope_versions (
  scope_id uuid primary key,
  paper_code text not null,
  exam_year int not null,
  syllabus_url text not null,
  syllabus_hash text not null,
  assessment_contract jsonb not null,
  retrieved_at timestamptz not null,
  valid_from timestamptz,
  valid_to timestamptz,
  status review_status not null default 'approved',
  unique (paper_code, exam_year, syllabus_hash)
);

create table source_documents (
  source_id uuid primary key,
  source_type text not null check (source_type in ('official_web', 'official_pdf', 'custom_pdf', 'research', 'computation', 'internal_learner', 'candidate_web')),
  title text not null,
  url text,
  file_hash text,
  provider text,
  provider_version text,
  retrieved_at timestamptz not null,
  last_checked_at timestamptz not null,
  next_check_at timestamptz,
  extraction_quality numeric,
  permissions jsonb not null default '{}',
  status review_status not null default 'candidate'
);

create table source_observations (
  observation_id uuid primary key,
  source_id uuid not null references source_documents(source_id),
  locator text not null,
  extracted_text text,
  structured_output jsonb,
  query_or_input jsonb,
  assumptions jsonb not null default '{}',
  output_hash text,
  observed_at timestamptz not null default now(),
  parser_version text,
  extraction_quality numeric,
  conflict_flags jsonb not null default '[]'
);

create table claims (
  claim_id uuid primary key,
  atomic_id text not null references atomic_topics(atomic_id),
  claim_type text not null,
  claim_text text not null,
  evidence_label evidence_label not null,
  confidence numeric,
  source_observation_id uuid references source_observations(observation_id),
  scope_id uuid references paper_scope_versions(scope_id),
  conflicts_with jsonb not null default '[]',
  review_status review_status not null default 'candidate',
  reviewer_note text,
  created_at timestamptz not null default now()
);

create table prerequisite_edges (
  edge_id uuid primary key,
  source_atomic_id text not null references atomic_topics(atomic_id),
  target_atomic_id text not null references atomic_topics(atomic_id),
  edge_type text not null check (edge_type in ('hard_prerequisite', 'supporting')),
  confidence numeric,
  rationale text not null,
  provenance_claim_ids jsonb not null default '[]',
  scope_intersection jsonb not null default '[]',
  review_status review_status not null default 'candidate',
  version text not null,
  rollback_target uuid references prerequisite_edges(edge_id),
  check (source_atomic_id <> target_atomic_id)
);

create table base_content_packages (
  base_version text primary key,
  atomic_id text not null references atomic_topics(atomic_id),
  scope_ids jsonb not null default '[]',
  template_family text not null,
  anchor_contract jsonb not null,
  content_body jsonb not null,
  claim_ids jsonb not null default '[]',
  source_ids jsonb not null default '[]',
  quality_gate_snapshot jsonb not null default '{}',
  status release_status not null default 'draft',
  created_at timestamptz not null default now(),
  supersedes text references base_content_packages(base_version)
);

create table delta_packages (
  delta_version text primary key,
  atomic_id text not null references atomic_topics(atomic_id),
  anchor_id text not null,
  trigger_type text not null,
  trigger_definition jsonb not null,
  content_body jsonb not null,
  source_ids jsonb not null default '[]',
  claim_ids jsonb not null default '[]',
  assumptions jsonb not null default '{}',
  status release_status not null default 'draft',
  created_at timestamptz not null default now(),
  supersedes text references delta_packages(delta_version)
);

create table assessment_items (
  item_id uuid primary key,
  atomic_id text not null references atomic_topics(atomic_id),
  paper_scope_ids jsonb not null default '[]',
  mode text not null check (mode in ('MCQ', 'MSQ', 'NAT', 'descriptive', 'timed', 'transfer')),
  prompt jsonb not null,
  answer_key jsonb not null,
  distractor_rationales jsonb not null default '{}',
  tolerance_policy jsonb not null default '{}',
  marking_rule_version text,
  claim_ids jsonb not null default '[]',
  quality_gate_snapshot jsonb not null default '{}',
  status review_status not null default 'candidate'
);

create table lesson_manifests (
  manifest_id uuid primary key,
  learner_id text,
  atomic_id text not null references atomic_topics(atomic_id),
  base_version text not null references base_content_packages(base_version),
  delta_versions jsonb not null default '[]',
  scope_id uuid references paper_scope_versions(scope_id),
  learner_constraints jsonb not null default '{}',
  composition_reason jsonb not null,
  source_ids jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table learner_events (
  event_id uuid primary key,
  manifest_id uuid references lesson_manifests(manifest_id),
  learner_id text,
  atomic_id text not null references atomic_topics(atomic_id),
  anchor_id text,
  event_type text not null,
  assessment_mode text,
  response jsonb not null default '{}',
  error_code text,
  latency_seconds numeric,
  confidence numeric,
  constraint_state jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table learner_state_snapshots (
  snapshot_id uuid primary key,
  learner_id text not null,
  atomic_id text not null references atomic_topics(atomic_id),
  state_dimensions jsonb not null,
  evidence_event_ids jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table research_runs (
  research_run_id uuid primary key,
  atomic_id text not null references atomic_topics(atomic_id),
  scope_id uuid references paper_scope_versions(scope_id),
  agent_version text not null,
  prompt_version text not null,
  model_provider text,
  model_id text,
  input_source_ids jsonb not null default '[]',
  output_claim_ids jsonb not null default '[]',
  unresolved_conflicts jsonb not null default '[]',
  quality_gate_snapshot jsonb not null default '{}',
  status review_status not null default 'candidate',
  started_at timestamptz not null,
  completed_at timestamptz
);

create table experiments (
  experiment_id uuid primary key,
  atomic_id text not null references atomic_topics(atomic_id),
  variants jsonb not null,
  target_segment jsonb not null,
  primary_outcomes jsonb not null,
  guardrail_outcomes jsonb not null,
  sample_plan jsonb not null,
  baseline_version text,
  status release_status not null default 'draft',
  decision jsonb,
  rollback_target text,
  created_at timestamptz not null default now()
);

create table content_releases (
  release_id uuid primary key,
  content_layer content_layer not null,
  artifact_version text not null,
  affected_atomic_ids jsonb not null,
  quality_gate_run_ids jsonb not null default '[]',
  source_ids jsonb not null default '[]',
  experiment_id uuid references experiments(experiment_id),
  approval_record jsonb not null,
  rollback_target text,
  status release_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table monitoring_alerts (
  alert_id uuid primary key,
  alert_type text not null,
  affected_ids jsonb not null,
  severity text not null,
  evidence jsonb not null,
  action_taken text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index claims_atomic_idx on claims(atomic_id, review_status);
create index sources_freshness_idx on source_documents(next_check_at, status);
create index learner_events_topic_idx on learner_events(learner_id, atomic_id, created_at);
create index releases_status_idx on content_releases(status, created_at);
