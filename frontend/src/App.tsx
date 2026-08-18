/**
 * Vidhya — exam-agnostic adaptive prep app with AI tutor, auth, and admin.
 *
 * Routes:
 *   /              → Home (topic grid)
 *   /topic/:id     → Topic problems list
 *   /practice/:id  → Practice flow (answer + verify)
 *   /verify        → Verify Any Problem
 *   /chat          → AI Tutor Chat
 *   /progress      → Progress + weak-topic heat map
 *   /settings      → Settings (theme, session)
 *   /login         → Login / Sign up
 *   /admin         → Admin dashboard (teacher/admin only)
 *   *              → 404
 */

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/app/AppLayout';

// Eager load home (fast first paint)
import { Home } from '@/pages/app/Home';

// Lazy load everything else
const TopicPage = lazy(() => import('@/pages/app/TopicPage'));
const PracticePage = lazy(() => import('@/pages/app/PracticePage'));
const VerifyPage = lazy(() => import('@/pages/app/VerifyPage'));
const ProgressPage = lazy(() => import('@/pages/app/ProgressPage'));
const SettingsPage = lazy(() => import('@/pages/app/SettingsPage'));
const ChatPage = lazy(() => import('@/pages/app/ChatPage'));
const NotebookPage = lazy(() => import('@/pages/app/NotebookPage'));
// v2.5: LoginPage deleted — used Supabase Auth which the backend never validated.
// /login now redirects to /sign-in (canonical Vidhya JWT auth via SignInPage).
const AdminPage = lazy(() => import('@/pages/app/AdminPage'));
const OnboardPage = lazy(() => import('@/pages/app/OnboardPage'));
const DiagnosticPage = lazy(() => import('@/pages/app/DiagnosticPage'));
const ExamStrategyPage = lazy(() => import('@/pages/app/ExamStrategyPage'));
const ErrorPatternsPage = lazy(() => import('@/pages/app/ErrorPatternsPage'));
const StudentAuditPage = lazy(() => import('@/pages/app/StudentAuditPage'));
const WeeklyDigestPage = lazy(() => import('@/pages/app/WeeklyDigestPage'));
const MockExamPage = lazy(() => import('@/pages/app/MockExamPage'));
const GBrainAdminPage = lazy(() => import('@/pages/app/GBrainAdminPage'));
const MarketingLanding = lazy(() => import('@/pages/app/MarketingLanding'));
const MaterialsPage = lazy(() => import('@/pages/app/MaterialsPage'));
const SmartPracticePage = lazy(() => import('@/pages/app/SmartPracticePage'));
const PracticeAttemptPage = lazy(() => import('@/pages/app/PracticeAttemptPage'));
const CheckpointQuizPage = lazy(() => import('@/pages/app/CheckpointQuizPage'));
const PlannedSessionPage = lazy(() => import('@/pages/app/PlannedSessionPage'));
const ExamProfilePage = lazy(() => import('@/pages/app/ExamProfilePage'));
const KnowledgePickerPage = lazy(() => import('@/pages/app/KnowledgePickerPage'));
const KnowledgeHomePage = lazy(() => import('@/pages/app/KnowledgeHomePage'));
const SnapPage = lazy(() => import('@/pages/app/SnapPage'));
const LessonPage = lazy(() => import('@/pages/app/LessonPage'));
const LLMConfigPage = lazy(() => import('@/pages/app/LLMConfigPage'));
const ConvertDemoPage = lazy(() => import('@/pages/app/ConvertDemoPage'));
const SignInPage = lazy(() => import('@/pages/app/SignInPage'));
const UserAdminPage = lazy(() => import('@/pages/app/UserAdminPage'));
const FeaturesPage = lazy(() => import('@/pages/app/FeaturesPage'));
const ContentStudioPage = lazy(() => import('@/pages/app/ContentStudioPage'));
const FounderDashboardPage = lazy(() => import('@/pages/app/FounderDashboardPage'));
const TurnsPage = lazy(() => import('@/pages/app/TurnsPage'));
const OwnerSettingsPage = lazy(() => import('@/pages/app/OwnerSettingsPage'));
const TeacherRosterPage = lazy(() => import('@/pages/app/TeacherRosterPage'));
const AdminDashboardPage = lazy(() => import('@/pages/app/AdminDashboardPage'));
const TeachingDashboardPage = lazy(() => import('@/pages/app/TeachingDashboardPage'));
const WeeklyTeacherBriefPage = lazy(() => import('@/pages/app/WeeklyTeacherBriefPage'));
// SmartNotebookPage import removed in v2.6 (route is now a redirect). The page
// itself stays in tree for the Phase 3 content merge into NotebookPage.
const ExamSetupPage = lazy(() => import('@/pages/app/ExamSetupPage'));
const ExamGroupsPage = lazy(() => import('@/pages/app/ExamGroupsPage'));
const ContentAdminPage = lazy(() => import('@/pages/app/ContentAdminPage'));
const ContentRDPage = lazy(() => import('@/pages/app/ContentRDPage'));
const HoldoutPage = lazy(() => import('@/pages/app/HoldoutPage'));
const WalkthroughPage = lazy(() => import('@/pages/app/WalkthroughPage'));
const PlatformHealthPage = lazy(() => import('@/pages/app/PlatformHealthPage'));
const RunConsolePage = lazy(() => import('@/pages/app/RunConsolePage'));
const SetupWizardPage = lazy(() => import('@/pages/app/SetupWizardPage'));
const GraphBrowserPage = lazy(() => import('@/pages/app/GraphBrowserPage'));
const ScenariosPage = lazy(() => import('@/pages/app/ScenariosPage'));
const DemoDeckPage = lazy(() => import('@/pages/app/DemoDeckPage'));
const DemoDoubtPage = lazy(() => import('@/pages/app/DemoDoubtPage'));
const BlueprintsPage = lazy(() => import('@/pages/app/BlueprintsPage'));
const PlaybooksPage = lazy(() => import('@/pages/app/PlaybooksPage'));
const RulesetsPage = lazy(() => import('@/pages/app/RulesetsPage'));
const AdminJourneyPage = lazy(() => import('@/pages/app/AdminJourneyPage'));
const AdminDecisionsPage = lazy(() => import('@/pages/app/AdminDecisionsPage'));
const AdminCohortPage = lazy(() => import('@/pages/app/AdminCohortPage'));
const ExamPacksPage = lazy(() => import('@/pages/app/ExamPacksPage'));
const SyllabusBridgePage = lazy(() => import('@/pages/app/SyllabusBridgePage'));
const TeacherSyllabusCoveragePage = lazy(() => import('@/pages/app/TeacherSyllabusCoveragePage'));
const ConceptOrchestratorPage = lazy(() => import('@/pages/app/ConceptOrchestratorPage'));
const ContentSettingsPage = lazy(() => import('@/pages/app/ContentSettingsPage'));
const UploadsPage = lazy(() => import('@/pages/app/UploadsPage'));
const StudymateSessionPage = lazy(() => import('@/pages/app/StudymateSessionPage'));
const DailyCardsPage = lazy(() => import('@/pages/app/DailyCardsPage'));
const WelcomePage = lazy(() => import('@/pages/app/WelcomePage'));
// Three-room UX superstrategy (2026-08-09)
const RoomsPage = lazy(() => import('@/pages/app/RoomsPage'));
// Wave U1
const SpinePage = lazy(() => import('@/pages/app/SpinePage'));
const InstitutePage = lazy(() => import('@/pages/app/InstitutePage'));
const SellYourCoursePage = lazy(() => import('@/pages/app/SellYourCoursePage'));
// E7 Delight Bundle
const FormulaMapPage = lazy(() => import('@/pages/app/FormulaMapPage'));
const TheoremWizardPage = lazy(() => import('@/pages/app/TheoremWizardPage'));
const DistributionSelectorPage = lazy(() => import('@/pages/app/DistributionSelectorPage'));

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
    <Loader2 size={24} className="animate-spin" style={{ color: 'var(--indigo-ink)' }} />
  </div>
);

const NotFound = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 16 }}>
    <h1 style={{ fontSize: 36, fontWeight: 700, color: 'var(--text-tertiary)', margin: 0 }}>404</h1>
    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Page not found</p>
    <a href="/" style={{ color: 'var(--indigo-ink)', textDecoration: 'underline' }}>Back to Home</a>
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="topic/:topicId" element={<TopicPage />} />
          {/* Practice-surface hierarchy (v2.6 consolidation):
              /practice              → /planned (canonical entry, Study Commander)
              /practice/:problemId   → PracticePage (deep-link to specific problem)
              /smart-practice        → SmartPracticePage (topic + difficulty picker)
              /attempt/:objectId     → PracticeAttemptPage (server-graded attempt — Wave 10)
              /planned               → PlannedSessionPage (time-bounded session — DEFAULT)
              /session               → StudymateSessionPage (15-min anytime drop-in)
              The 4 surfaces serve distinct entry needs; the canonical /practice
              redirect ensures one obvious place to start. */}
          <Route path="practice" element={<Navigate to="/planned" replace />} />
          <Route path="practice/:problemId" element={<PracticePage />} />
          <Route path="verify" element={<VerifyPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="notebook" element={<NotebookPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="login" element={<Navigate to="/sign-in" replace />} />
          {/* v2.6: /admin redirects to canonical dashboard. AdminPage's social
              queue moved to /admin/social. AdminDashboardPage is the role-aware
              landing for admin + owner roles. */}
          <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="admin/social" element={<AdminPage />} />
          <Route path="onboard" element={<OnboardPage />} />
          <Route path="diagnostic" element={<DiagnosticPage />} />
          <Route path="exam-strategy" element={<ExamStrategyPage />} />
          <Route path="error-patterns" element={<ErrorPatternsPage />} />
          <Route path="audit" element={<StudentAuditPage />} />
          <Route path="digest" element={<WeeklyDigestPage />} />
          <Route path="mock-exam" element={<MockExamPage />} />
          <Route path="admin/gbrain" element={<GBrainAdminPage />} />
          <Route path="admin/concept-orchestrator" element={<ConceptOrchestratorPage />} />
          <Route path="gbrain" element={<MarketingLanding />} />
          <Route path="spine" element={<SpinePage />} />
          {/* Visitor-facing demo deck. The API it reads 404s unless
              DEMO_MODE_ENABLED=true, so the page renders an honest
              "demo mode is off" state on any other instance. */}
          <Route path="demo" element={<DemoDeckPage />} />
          <Route path="demo/doubt" element={<DemoDoubtPage />} />
          <Route path="institute" element={<InstitutePage />} />
          <Route path="sell-your-course" element={<SellYourCoursePage />} />
          <Route path="materials" element={<MaterialsPage />} />
          <Route path="smart-practice" element={<SmartPracticePage />} />
          <Route path="attempt/:objectId" element={<PracticeAttemptPage />} />
          <Route path="checkpoint" element={<CheckpointQuizPage />} />
          <Route path="planned" element={<PlannedSessionPage />} />
          <Route path="exam-profile" element={<ExamProfilePage />} />
          <Route path="knowledge" element={<KnowledgePickerPage />} />
          <Route path="knowledge-home" element={<KnowledgeHomePage />} />
          <Route path="snap" element={<SnapPage />} />
          <Route path="lesson/:concept_id" element={<LessonPage />} />
          <Route path="llm-config" element={<LLMConfigPage />} />
          <Route path="content-settings" element={<ContentSettingsPage />} />
          <Route path="uploads" element={<UploadsPage />} />
          <Route path="convert-demo" element={<ConvertDemoPage />} />
          <Route path="sign-in" element={<SignInPage />} />
          <Route path="admin/users" element={<UserAdminPage />} />
          <Route path="admin/features" element={<FeaturesPage />} />
          <Route path="admin/content-studio" element={<ContentStudioPage />} />
          <Route path="admin/content-rd" element={<ContentRDPage />} />
          <Route path="admin/holdout" element={<HoldoutPage />} />
          <Route path="admin/walkthrough" element={<WalkthroughPage />} />
          <Route path="admin/platform-health" element={<PlatformHealthPage />} />
          <Route path="admin/jobs" element={<RunConsolePage />} />
          <Route path="admin/setup" element={<SetupWizardPage />} />
          <Route path="admin/graph" element={<GraphBrowserPage />} />
          <Route path="admin/scenarios" element={<ScenariosPage />} />
          <Route path="admin/scenarios/:id" element={<ScenariosPage />} />
          <Route path="admin/blueprints" element={<BlueprintsPage />} />
          <Route path="admin/blueprints/:id" element={<BlueprintsPage />} />
          <Route path="admin/playbooks" element={<PlaybooksPage />} />
          <Route path="admin/rulesets" element={<RulesetsPage />} />
          <Route path="admin/journey" element={<AdminJourneyPage />} />
          <Route path="admin/decisions" element={<AdminDecisionsPage />} />
          <Route path="admin/cohort" element={<AdminCohortPage />} />
          <Route path="admin/exam-packs" element={<ExamPacksPage />} />
          <Route path="admin/syllabus-bridge" element={<SyllabusBridgePage />} />
          <Route path="admin/founder" element={<FounderDashboardPage />} />
          <Route path="turns" element={<TurnsPage />} />
          <Route path="turns/:id" element={<TurnsPage />} />
          <Route path="owner/settings" element={<OwnerSettingsPage />} />
          <Route path="teacher/roster" element={<TeacherRosterPage />} />
          <Route path="teacher/syllabus-coverage" element={<TeacherSyllabusCoveragePage />} />
          <Route path="owner/dashboard" element={<AdminDashboardPage />} />
          <Route path="admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="teaching" element={<TeachingDashboardPage />} />
          <Route path="teaching/brief" element={<WeeklyTeacherBriefPage />} />
          {/* v2.6: /smart-notebook redirects to canonical /notebook. The
              full content merge (clusters + gaps + download into NotebookPage
              gated by auth state) is a Phase 3 follow-up — for now the URL
              consolidation removes the duplicate entry point. */}
          <Route path="smart-notebook" element={<Navigate to="/notebook" replace />} />
          <Route path="exams" element={<ExamSetupPage />} />
          <Route path="exam-groups" element={<ExamGroupsPage />} />
          <Route path="admin/content" element={<ContentAdminPage />} />
          <Route path="session" element={<StudymateSessionPage />} />
          <Route path="daily" element={<DailyCardsPage />} />
          {/* E7 Delight Bundle */}
          <Route path="formula-map/:module" element={<FormulaMapPage />} />
          <Route path="theorem-wizard/:module" element={<TheoremWizardPage />} />
          <Route path="distribution-selector" element={<DistributionSelectorPage />} />
          {/* /welcome is the first-visit demo landing. AppLayout redirects
              new visitors here once. After dismissal, localStorage flag
              vidhya.demo_welcomed prevents re-prompting. */}
          <Route path="welcome" element={<WelcomePage />} />
          {/* Three-room UX superstrategy: conscious room selection, switchable anytime */}
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
