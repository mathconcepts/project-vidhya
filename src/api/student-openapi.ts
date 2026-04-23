// @ts-nocheck
/**
 * OpenAPI 3.1 spec generator for /api/student/* routes.
 *
 * Mirrors src/api/openapi.ts (which covers admin-agent routes), but
 * describes the student-facing session planner surface instead.
 *
 * Shipped in v2.32 alongside a Swagger UI page at /student/docs so
 * students (and integration partners building student-side tooling)
 * can explore the 12 session-planner routes with schemas + examples.
 */

export function buildStudentOpenAPISpec(
  baseUrl: string = 'http://localhost:8080',
): any {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Project Vidhya — Student Session Planner API',
      version: '2.32.0',
      description:
        'Student-facing HTTP surface for the session planner. Generate time-budgeted ' +
        'study plans, record executions, manage your exam profile, and save/recall ' +
        'plan templates. All routes require an authenticated student JWT.\n\n' +
        'Architectural notes:\n' +
        '  - `student_id` is always forced from the JWT, never accepted in the body.\n' +
        '  - Plan executions feed back into subsequent plans via server-derived ' +
        '`trailing_7d_minutes` and `sr_stats` projection.\n' +
        '  - Multi-exam support: students register up to 5 concurrent exams and the ' +
        'planner allocates time proportional to exam proximity.',
      contact: { name: 'Project Vidhya' },
      license: { name: 'MIT' },
    },
    servers: [{ url: baseUrl }],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Student JWT from your authentication flow.',
        },
      },
      schemas: STUDENT_SCHEMAS,
    },
    tags: [
      { name: 'Planner', description: 'Generate and list session plans' },
      { name: 'Execution', description: 'Record what actually happened in a session' },
      { name: 'Profile', description: 'Which exams is the student preparing for?' },
      { name: 'Templates', description: 'Saved recurring session patterns' },
      { name: 'Activity', description: 'Ad-hoc practice session logging' },
    ],
    paths: buildStudentPaths(),
  };
}

// ============================================================================
// Schemas shared across paths
// ============================================================================

const STUDENT_SCHEMAS = {
  ContentHint: {
    type: 'object',
    required: ['topic', 'difficulty', 'count'],
    properties: {
      topic: { type: 'string' },
      difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
      count: { type: 'integer', minimum: 1 },
      concept_id: { type: 'string' },
    },
  },
  ActionRecommendation: {
    type: 'object',
    required: ['id', 'kind', 'title', 'rationale', 'estimated_minutes',
               'content_hint', 'priority_score', 'exam_id'],
    properties: {
      id: { type: 'string', pattern: '^ACT-\\d+$' },
      kind: { type: 'string', enum: ['practice', 'review', 'spaced-review', 'micro-mock'] },
      title: { type: 'string' },
      rationale: { type: 'string' },
      estimated_minutes: { type: 'integer', minimum: 0 },
      content_hint: { $ref: '#/components/schemas/ContentHint' },
      priority_score: { type: 'number' },
      exam_id: { type: 'string' },
    },
  },
  SessionPlan: {
    type: 'object',
    required: ['id', 'generated_at', 'actions', 'total_estimated_minutes', 'headline'],
    properties: {
      id: { type: 'string', pattern: '^PLN-[a-z0-9]+$' },
      generated_at: { type: 'string', format: 'date-time' },
      request: { type: 'object' },
      budget: { type: 'object' },
      strategy: { type: 'object' },
      top_priorities: { type: 'array' },
      actions: { type: 'array', items: { $ref: '#/components/schemas/ActionRecommendation' } },
      total_estimated_minutes: { type: 'integer', minimum: 0 },
      headline: { type: 'string' },
      execution: { $ref: '#/components/schemas/PlanExecution' },
    },
  },
  PlanExecution: {
    type: 'object',
    required: ['completed_at', 'actual_minutes_spent', 'actions_completed'],
    properties: {
      completed_at: { type: 'string', format: 'date-time' },
      actual_minutes_spent: { type: 'integer', minimum: 0 },
      actions_completed: {
        type: 'array',
        items: {
          type: 'object',
          required: ['action_id', 'completed'],
          properties: {
            action_id: { type: 'string' },
            completed: { type: 'boolean' },
            attempts: { type: 'integer', minimum: 0 },
            correct: { type: 'integer', minimum: 0 },
            actual_minutes: { type: 'number', minimum: 0 },
            note: { type: 'string' },
          },
        },
      },
      session_note: { type: 'string' },
    },
  },
  ExamRegistration: {
    type: 'object',
    required: ['exam_id', 'exam_date', 'added_at'],
    properties: {
      exam_id: { type: 'string' },
      exam_date: { type: 'string', format: 'date' },
      weekly_hours: { type: 'number', minimum: 1, maximum: 60 },
      topic_confidence: {
        type: 'object',
        additionalProperties: { type: 'integer', minimum: 1, maximum: 5 },
      },
      added_at: { type: 'string', format: 'date-time' },
    },
  },
  PlanTemplate: {
    type: 'object',
    required: ['id', 'student_id', 'name', 'minutes_available', 'exam_selection',
               'created_at', 'use_count'],
    properties: {
      id: { type: 'string', pattern: '^TPL-[a-z0-9]+$' },
      student_id: { type: 'string' },
      name: { type: 'string', maxLength: 60 },
      minutes_available: { type: 'integer', minimum: 1, maximum: 180 },
      exam_selection: {
        oneOf: [
          { type: 'string', enum: ['all', 'primary'] },
          { type: 'array', items: { type: 'string' } },
        ],
      },
      weekly_hours: { type: 'number' },
      created_at: { type: 'string', format: 'date-time' },
      last_used_at: { type: 'string', format: 'date-time' },
      use_count: { type: 'integer', minimum: 0 },
    },
  },
  Error: {
    type: 'object',
    required: ['error'],
    properties: { error: { type: 'string' } },
  },
};

// ============================================================================
// Paths
// ============================================================================

function buildStudentPaths(): Record<string, any> {
  return {
    '/api/student/session/plan': {
      post: {
        tags: ['Planner'],
        summary: 'Generate a single-exam session plan',
        description:
          'Planner takes the minutes budget and (implicitly) the student identity from ' +
          'JWT, runs priority engine × attention resolver, returns an ordered action list.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['exam_id', 'exam_date', 'minutes_available'],
                properties: {
                  exam_id: { type: 'string' },
                  exam_date: { type: 'string', format: 'date' },
                  minutes_available: { type: 'integer', minimum: 1, maximum: 180 },
                  topic_confidence: {
                    type: 'object',
                    additionalProperties: { type: 'integer', minimum: 1, maximum: 5 },
                  },
                  diagnostic_scores: {
                    type: 'object',
                    additionalProperties: { type: 'number', minimum: 0, maximum: 1 },
                  },
                  sr_stats: { type: 'array' },
                  weekly_hours: { type: 'number', minimum: 1, maximum: 60 },
                  trailing_7d_minutes: { type: 'number' },
                },
              },
              examples: {
                typical: {
                  summary: 'Typical 8-minute coffee break',
                  value: {
                    exam_id: 'EXM-UGEE-MATH-SAMPLE',
                    exam_date: '2026-08-15',
                    minutes_available: 8,
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Plan generated', content: jsonRef('#/components/schemas/SessionPlan') },
          '400': errorResponse('Invalid input (missing fields, out-of-range minutes)'),
          '401': errorResponse('Missing or invalid JWT'),
        },
      },
    },
    '/api/student/session/plan/multi-exam': {
      post: {
        tags: ['Planner'],
        summary: 'Generate a multi-exam plan (1-5 exams)',
        description:
          'Proximity-weighted allocation across exams. Closer exams get more minutes; ' +
          'below the 2-min-per-exam floor the exam is skipped.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['minutes_available', 'exams'],
                properties: {
                  minutes_available: { type: 'integer', minimum: 1, maximum: 180 },
                  exams: {
                    type: 'array',
                    minItems: 1,
                    maxItems: 5,
                    items: {
                      type: 'object',
                      required: ['exam_id', 'exam_date'],
                      properties: {
                        exam_id: { type: 'string' },
                        exam_date: { type: 'string', format: 'date' },
                        topic_confidence: { type: 'object' },
                        diagnostic_scores: { type: 'object' },
                        sr_stats: { type: 'array' },
                      },
                    },
                  },
                  weekly_hours: { type: 'number' },
                  trailing_7d_minutes: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Multi-exam plan', content: jsonRef('#/components/schemas/SessionPlan') },
          '400': errorResponse('Invalid input'),
          '401': errorResponse('Missing or invalid JWT'),
        },
      },
    },
    '/api/student/session/plans': {
      get: {
        tags: ['Planner'],
        summary: 'List recent session plans',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 } },
        ],
        responses: {
          '200': {
            description: 'Plan list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    plans: { type: 'array', items: { $ref: '#/components/schemas/SessionPlan' } },
                    count: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': errorResponse('Missing or invalid JWT'),
        },
      },
    },
    '/api/student/session/plans/{id}': {
      get: {
        tags: ['Planner'],
        summary: 'Get one plan by id',
        parameters: [pathParam('id', 'Plan id (PLN-…)')],
        responses: {
          '200': { description: 'Plan', content: jsonRef('#/components/schemas/SessionPlan') },
          '403': errorResponse('Plan belongs to another student'),
          '404': errorResponse('Plan not found'),
        },
      },
    },
    '/api/student/session/plans/{id}/complete': {
      post: {
        tags: ['Execution'],
        summary: 'Record execution outcomes for a plan',
        parameters: [pathParam('id', 'Plan id')],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PlanExecution' },
              examples: {
                full: {
                  summary: 'All actions completed',
                  value: {
                    actual_minutes_spent: 14,
                    actions_completed: [
                      { action_id: 'ACT-1', completed: true, attempts: 2, correct: 1 },
                      { action_id: 'ACT-2', completed: true, attempts: 3, correct: 3 },
                    ],
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Plan with execution recorded', content: jsonRef('#/components/schemas/SessionPlan') },
          '400': errorResponse('Malformed outcomes (e.g. correct > attempts)'),
          '403': errorResponse('Plan belongs to another student'),
          '404': errorResponse('Plan not found'),
        },
      },
    },
    '/api/student/profile': {
      get: {
        tags: ['Profile'],
        summary: "Get this student's exam profile",
        description: 'Returns the list of exams the student has registered (empty on first use).',
        responses: {
          '200': {
            description: 'Profile',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    student_id: { type: 'string' },
                    exams: { type: 'array', items: { $ref: '#/components/schemas/ExamRegistration' } },
                    updated_at: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '401': errorResponse('Missing JWT'),
        },
      },
      put: {
        tags: ['Profile'],
        summary: 'Upsert the full exam list (1-5 exams)',
        description: 'Whole-profile upsert. To change one exam, PUT the full list.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['exams'],
                properties: {
                  exams: {
                    type: 'array',
                    maxItems: 5,
                    items: { $ref: '#/components/schemas/ExamRegistration' },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Profile updated', content: jsonRef('#/components/schemas/ExamRegistration') },
          '400': errorResponse('Too many exams or bad date'),
        },
      },
    },
    '/api/student/session/templates': {
      get: {
        tags: ['Templates'],
        summary: 'List this student\'s plan templates',
        responses: {
          '200': {
            description: 'Template list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    templates: { type: 'array', items: { $ref: '#/components/schemas/PlanTemplate' } },
                    count: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Templates'],
        summary: 'Create a new plan template',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'minutes_available', 'exam_selection'],
                properties: {
                  name: { type: 'string', maxLength: 60 },
                  minutes_available: { type: 'integer', minimum: 1, maximum: 180 },
                  exam_selection: {
                    oneOf: [
                      { type: 'string', enum: ['all', 'primary'] },
                      { type: 'array', items: { type: 'string' } },
                    ],
                  },
                  weekly_hours: { type: 'number' },
                },
              },
              examples: {
                morning: {
                  summary: 'Morning commute template',
                  value: { name: 'Morning commute', minutes_available: 8, exam_selection: 'primary' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Template created', content: jsonRef('#/components/schemas/PlanTemplate') },
          '400': errorResponse('Invalid spec or template cap reached'),
        },
      },
    },
    '/api/student/session/templates/{id}': {
      delete: {
        tags: ['Templates'],
        summary: 'Delete a template',
        parameters: [pathParam('id', 'Template id (TPL-…)')],
        responses: {
          '200': { description: 'Deleted' },
          '403': errorResponse('Template belongs to another student'),
          '404': errorResponse('Template not found'),
        },
      },
    },
    '/api/student/session/templates/{id}/use': {
      post: {
        tags: ['Templates'],
        summary: 'Recall template → run planner → return plan',
        description:
          'One-tap path: load the template\'s saved inputs, look up the student\'s ' +
          'exam profile, run the appropriate single/multi-exam planner, return the plan.',
        parameters: [pathParam('id', 'Template id')],
        responses: {
          '200': {
            description: 'Fresh plan derived from the template',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    template_id: { type: 'string' },
                    plan: { $ref: '#/components/schemas/SessionPlan' },
                  },
                },
              },
            },
          },
          '400': errorResponse('No matching exams or template needs exam profile first'),
          '403': errorResponse('Template belongs to another student'),
          '404': errorResponse('Template not found'),
        },
      },
    },
    '/api/student/session/practice-log': {
      post: {
        tags: ['Activity'],
        summary: 'Log an ad-hoc practice session',
        description:
          'Outside of plan-driven sessions (SmartPracticePage free-form, mock exams, ' +
          'etc.) the client posts session minutes here. Trailing-7d totals aggregate ' +
          'this alongside plan executions.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['minutes'],
                properties: {
                  minutes: { type: 'number', minimum: 0, maximum: 300 },
                  source: {
                    type: 'string',
                    enum: ['smart-practice', 'practice-page', 'mock-exam', 'plan-execution', 'other'],
                  },
                  completed_at: { type: 'string', format: 'date-time' },
                  plan_id: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Logged' },
          '400': errorResponse('Bad minutes'),
        },
      },
    },
  };
}

// ============================================================================
// Tiny helpers (mirrors src/api/openapi.ts)
// ============================================================================

function pathParam(name: string, description: string): any {
  return {
    name, in: 'path', required: true,
    schema: { type: 'string' }, description,
  };
}
function jsonRef(ref: string): any {
  return { 'application/json': { schema: { $ref: ref } } };
}
function errorResponse(description: string): any {
  return { description, content: jsonRef('#/components/schemas/Error') };
}
