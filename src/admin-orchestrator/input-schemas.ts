// @ts-nocheck
/**
 * JSON Schema input contracts for each tool in the registry.
 *
 * Separate file from tool-registry.ts so the human-readable
 * input_schema_doc strings remain colocated with the tool definition,
 * while the machine-readable schemas live here and can be iterated
 * on independently.
 *
 * Schemas follow JSON Schema Draft 2020-12 (the version MCP uses).
 * Every tool has an entry; tools that take no input declare an empty
 * object schema rather than being omitted, so external agents see
 * a consistent contract for every capability.
 */

export type JSONSchema = {
  type?: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  enum?: any[];
  items?: JSONSchema;
  description?: string;
  default?: any;
  additionalProperties?: boolean | JSONSchema;
  $schema?: string;
};

const EMPTY_SCHEMA: JSONSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {},
  additionalProperties: false,
};

export const INPUT_SCHEMAS: Record<string, JSONSchema> = {
  // ─── FEEDBACK ────────────────────────────────────────────────────
  'feedback:list-pending-triage': EMPTY_SCHEMA,
  'feedback:list-by-exam': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['exam_id'],
    properties: {
      exam_id: { type: 'string', description: 'Exam identifier e.g. EXM-UGEE-MATH-SAMPLE' },
    },
    additionalProperties: false,
  },
  'feedback:triage': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['feedback_id', 'priority'],
    properties: {
      feedback_id: { type: 'string', description: 'Feedback item id, e.g. FB-ci-xxxxxx' },
      priority: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'], description: 'Priority assignment' },
      actor: { type: 'string', description: 'User id performing the triage. Defaults to "agent".' },
    },
    additionalProperties: false,
  },
  'feedback:approve': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['feedback_id'],
    properties: {
      feedback_id: { type: 'string' },
      actor: { type: 'string', description: 'User id performing the approval' },
    },
    additionalProperties: false,
  },
  'feedback:apply': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['feedback_id', 'release_tag', 'change_description'],
    properties: {
      feedback_id: { type: 'string' },
      release_tag: { type: 'string', description: 'Release identifier, e.g. ugee-v1.0.1' },
      change_description: { type: 'string', description: 'Human-readable change summary' },
      actor: { type: 'string' },
    },
    additionalProperties: false,
  },

  // ─── SAMPLE-CHECK ────────────────────────────────────────────────
  'sample-check:list-open': EMPTY_SCHEMA,
  'sample-check:get-latest-for-exam': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['exam_id'],
    properties: {
      exam_id: { type: 'string' },
    },
    additionalProperties: false,
  },
  'sample-check:close-resolved': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['sample_id'],
    properties: {
      sample_id: { type: 'string', description: 'Sample-check id, e.g. SC-xxxxxxxx' },
      actor: { type: 'string' },
    },
    additionalProperties: false,
  },

  // ─── COURSE ──────────────────────────────────────────────────────
  'course:get-for-exam': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['exam_id'],
    properties: { exam_id: { type: 'string' } },
    additionalProperties: false,
  },
  'course:list-all': EMPTY_SCHEMA,
  'course:list-promotions': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: {
      exam_id: { type: 'string', description: 'Optional — if omitted, returns promotions for all exams' },
    },
    additionalProperties: false,
  },

  // ─── EXAM-BUILDER ────────────────────────────────────────────────
  'exam-builder:list-adapters': EMPTY_SCHEMA,
  'exam-builder:build-or-update': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['exam_id', 'build_kind', 'actor'],
    properties: {
      exam_id: { type: 'string' },
      build_kind: { type: 'string', enum: ['new', 'iterate'] },
      actor: { type: 'string' },
      options: {
        type: 'object',
        properties: {
          skip_llm: { type: 'boolean', default: false },
          auto_supersede_open: { type: 'boolean', default: false },
          source_sample_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'Required when build_kind is "iterate"',
          },
        },
        additionalProperties: true,
      },
    },
    additionalProperties: false,
  },

  // ─── ATTENTION ───────────────────────────────────────────────────
  'attention:get-overdue-deferrals': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['user_id'],
    properties: {
      user_id: { type: 'string' },
      threshold_days: { type: 'number', default: 7 },
    },
    additionalProperties: false,
  },
  'attention:coverage-for-user': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['user_id'],
    properties: { user_id: { type: 'string' } },
    additionalProperties: false,
  },

  // ─── MARKETING ───────────────────────────────────────────────────
  'marketing:list-stale-articles': EMPTY_SCHEMA,
  'marketing:list-articles-for-exam': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['exam_id'],
    properties: { exam_id: { type: 'string' } },
    additionalProperties: false,
  },
  'marketing:get-dashboard': EMPTY_SCHEMA,
  'marketing:detect-drift': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['feature_id', 'change_summary'],
    properties: {
      feature_id: { type: 'string', description: 'Feature identifier, e.g. feature:attention:short-session' },
      change_summary: { type: 'string' },
      actor: { type: 'string' },
    },
    additionalProperties: false,
  },
  'marketing:launch-campaign': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['campaign_id'],
    properties: { campaign_id: { type: 'string' } },
    additionalProperties: false,
  },

  // ─── SCANNER / STRATEGY / TASK ───────────────────────────────────
  'scanner:run-full-scan': EMPTY_SCHEMA,
  'strategy:list-proposed': EMPTY_SCHEMA,
  'task:list-open': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: {
      role: { type: 'string', description: 'Optional role filter' },
      strategy_id: { type: 'string', description: 'Optional strategy filter' },
    },
    additionalProperties: false,
  },
  'task:claim': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['task_id'],
    properties: {
      task_id: { type: 'string' },
      actor: { type: 'string' },
    },
    additionalProperties: false,
  },
  'task:complete': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['task_id'],
    properties: {
      task_id: { type: 'string' },
      actor: { type: 'string' },
      note: { type: 'string', description: 'Optional completion note' },
    },
    additionalProperties: false,
  },

  // ─── LLM-BACKED TOOLS (v2.23.0) ──────────────────────────────────
  'agent:narrate-strategy': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['strategy_id'],
    properties: {
      strategy_id: { type: 'string', description: 'Strategy id to narrate, e.g. STR-xxxxxxxx' },
      run_id: { type: 'string', description: 'Optional — if omitted, uses latest run' },
    },
    additionalProperties: false,
  },
  'agent:summarize-health': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: {
      run_id: { type: 'string', description: 'Optional — if omitted, runs a fresh scan' },
    },
    additionalProperties: false,
  },
  'agent:suggest-next-action': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['role'],
    properties: {
      role: {
        type: 'string',
        enum: ['owner', 'admin', 'content-ops', 'exam-ops', 'marketing-lead', 'qa-reviewer', 'analyst', 'author'],
        description: 'The role asking for suggestion',
      },
    },
    additionalProperties: false,
  },

  // Minimal MCP self-introspection tool
  'agent:describe-capabilities': EMPTY_SCHEMA,

  // Student session planner (v2.31)
  'student:plan-session': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['student_id', 'exam_id', 'exam_date', 'minutes_available'],
    properties: {
      student_id: { type: 'string', minLength: 1 },
      exam_id: { type: 'string', minLength: 1 },
      exam_date: { type: 'string', format: 'date',
        description: 'ISO date (YYYY-MM-DD) of the student\'s target exam' },
      minutes_available: { type: 'integer', minimum: 1, maximum: 180 },
      topic_confidence: {
        type: 'object',
        description: 'Per-topic confidence on a 1-5 scale',
        additionalProperties: { type: 'integer', minimum: 1, maximum: 5 },
      },
      diagnostic_scores: {
        type: 'object',
        description: 'Per-topic diagnostic accuracy in [0, 1]',
        additionalProperties: { type: 'number', minimum: 0, maximum: 1 },
      },
      sr_stats: {
        type: 'array',
        items: {
          type: 'object',
          required: ['topic', 'accuracy', 'sessions_count',
                     'accuracy_first_5', 'accuracy_last_5', 'last_practice_date'],
          properties: {
            topic: { type: 'string' },
            accuracy: { type: 'number', minimum: 0, maximum: 1 },
            sessions_count: { type: 'integer', minimum: 0 },
            accuracy_first_5: { type: 'number', minimum: 0, maximum: 1 },
            accuracy_last_5: { type: 'number', minimum: 0, maximum: 1 },
            last_practice_date: {
              oneOf: [{ type: 'string' }, { type: 'null' }],
            },
          },
        },
      },
      weekly_hours: { type: 'number', minimum: 1, maximum: 60 },
      trailing_7d_minutes: { type: 'number', minimum: 0 },
    },
    additionalProperties: false,
  },
  'student:list-plans': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['student_id'],
    properties: {
      student_id: {
        type: 'string', minLength: 1,
        description: 'Student id, or "*" for cross-student listing (admin dashboard).',
      },
      limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
    },
    additionalProperties: false,
  },
  'student:get-plan': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['plan_id'],
    properties: {
      plan_id: { type: 'string', pattern: '^PLN-[a-z0-9]+$' },
    },
    additionalProperties: false,
  },
  'student:get-plan-with-execution': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['plan_id'],
    properties: {
      plan_id: { type: 'string', pattern: '^PLN-[a-z0-9]+$' },
    },
    additionalProperties: false,
  },
};
