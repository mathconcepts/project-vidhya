# Project Vidhya — Documentation Index

> The canonical map of `/docs/`. Repo-root master docs (architecture,
> deploy, modules, plans) live one level up — see `../README.md` for
> the full doc tree.

---

## 🎬 Demos & quick paths

| File | Contents |
|------|----------|
| [`moat-demo.md`](./moat-demo.md) | **3-minute persona-scenarios demo** — setup, side-by-side moat surface, talking points, troubleshooting |
| [`admin-guide-jee-tn.md`](./admin-guide-jee-tn.md) | **End-to-end admin guide** — launching JEE prep for Tamil-Nadu-board, anxious students. Step-by-step through rulesets → blueprints → persona validation → batch generation → effectiveness ledger |
| [`01-quick-start.md`](./01-quick-start.md) | 5-minute local setup |
| [`admin-dashboard-quickstart.md`](./admin-dashboard-quickstart.md) | Admin dashboard tour |

---

## 🧠 Frameworks (the "why" behind the systems)

| File | Contents |
|------|----------|
| [`COMPOUNDING-MASTERY-FRAMEWORK.md`](./COMPOUNDING-MASTERY-FRAMEWORK.md) | The mastery + compounding model that the student-facing surface defends |
| [`CURRICULUM-FRAMEWORK.md`](./CURRICULUM-FRAMEWORK.md) | Curriculum units, learning objectives, PYQ alignment |
| [`EXAM-FRAMEWORK.md`](./EXAM-FRAMEWORK.md) | Exam packs, scope, sections, weights |
| [`LESSON-FRAMEWORK.md`](./LESSON-FRAMEWORK.md) | Lesson composition + atom selection |
| [`RENDERING-FRAMEWORK.md`](./RENDERING-FRAMEWORK.md) | Frontend rendering + multi-modal sidecars |

---

## 🚪 Roles & journeys

| File | Contents |
|------|----------|
| [`ROLES-AND-ACCESS.md`](./ROLES-AND-ACCESS.md) | Auth model + role-based access |
| [`USER-JOURNEY.md`](./USER-JOURNEY.md) | Student journey: anonymous → identified → engaged |
| [`TEACHER-JOURNEY.md`](./TEACHER-JOURNEY.md) | Teacher journey: roster → assignment → review |
| [`session-planner.md`](./session-planner.md) | Session planner internals |

---

## 🔌 Integration & ops

| File | Contents |
|------|----------|
| [`LLM-CONFIGURATION.md`](./LLM-CONFIGURATION.md) | LLM provider config + fallback chain |
| [`MULTI-CHANNEL-SETUP.md`](./MULTI-CHANNEL-SETUP.md) | Telegram + WhatsApp channel wiring |
| [`mcp-integration.md`](./mcp-integration.md) | MCP server integration |
| [`14-exam-configuration.md`](./14-exam-configuration.md) | Per-exam configuration: Wolfram, channels, vector store |
| [`12-go-live-checklist.md`](./12-go-live-checklist.md) | Pre-launch checklist |
| [`infra/`](./infra/) | Infrastructure configuration files |

---

## 📚 Content system

| File | Contents |
|------|----------|
| [`12-content-delivery.md`](./12-content-delivery.md) | Content delivery pipeline + sequencing |
| [`20-content-system.md`](./20-content-system.md) | Content generation + delivery architecture |
| [`23-two-layer-content-architecture.md`](./23-two-layer-content-architecture.md) | Mandatory + personalised two-layer content |
| [`24-course-playbook.md`](./24-course-playbook.md) | Course Playbook: knowledge graph + 10-section schema |
| [`25-course-material-generator.md`](./25-course-material-generator.md) | Course Material Generator: templates + personalisation variables |
| [`21-course-summary-outline.md`](./21-course-summary-outline.md) | Pre-approval hierarchical course outline |
| [`22-help-manual.md`](./22-help-manual.md) | Long-form help manual |

---

## 🏗 Engineering reference

| File | Contents |
|------|----------|
| [`05-data-layer.md`](./05-data-layer.md) | localStorage + IndexedDB + Supabase data layer |
| [`08-testing-guide.md`](./08-testing-guide.md) | Test setup, unit + integration patterns |
| [`15-frontend-preview.md`](./15-frontend-preview.md) | Frontend routes, role views, UI overview |
| [`16-website-portal-architecture.md`](./16-website-portal-architecture.md) | Public website + app portal architecture |
| [`operator-snippets/`](./operator-snippets/) | Curl recipes for ops |

---

## 📦 Snapshots

`snapshots/` — manifests for every shipped state. Each entry pins git SHA + Docker image + env. See `../scripts/snapshot.sh`.

---

## Notes on the numbered files

The numeric prefixes (`05-`, `12-`, etc.) are historical and don't imply a reading order. Prefer the categories above. Several earlier numbered files described the v2.0 7-agent architecture; those have been pruned. The current architecture is documented in [`../ARCHITECTURE.md`](../ARCHITECTURE.md) and [`../CLAUDE.md`](../CLAUDE.md).
