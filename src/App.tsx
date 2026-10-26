import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './components/ui/toast'
import { PreferencesProvider } from './services/preferences'
import { PublicLayout } from './components/layout/PublicLayout'
import { AppLayout } from './components/layout/AppLayout'
import { LandingPage } from './pages/LandingPage'
import { HowItWorksPage } from './pages/HowItWorksPage'
import { FeaturesPage } from './pages/FeaturesPage'
import { ResearchPage } from './pages/ResearchPage'
import { AboutPage } from './pages/AboutPage'
import { DashboardPage } from './pages/app/DashboardPage'
import { DiagnosisPage } from './pages/app/DiagnosisPage'
import { ExplanationsPage } from './pages/app/ExplanationsPage'
import { TreatmentsPage } from './pages/app/TreatmentsPage'
import { CommunityPage } from './pages/app/CommunityPage'
import { AssistantPage } from './pages/app/AssistantPage'
import { FieldsPage } from './pages/app/FieldsPage'
import { HistoryPage } from './pages/app/HistoryPage'
import { NotificationsPage } from './pages/app/NotificationsPage'
import { SettingsPage } from './pages/app/SettingsPage'
import { EvaluationPage } from './pages/app/EvaluationPage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <ToastProvider>
      <PreferencesProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/research" element={<ResearchPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Route>
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="diagnosis" element={<DiagnosisPage />} />
              <Route path="explanations" element={<ExplanationsPage />} />
              <Route path="treatments" element={<TreatmentsPage />} />
              <Route path="community" element={<CommunityPage />} />
              <Route path="assistant" element={<AssistantPage />} />
              <Route path="fields" element={<FieldsPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="evaluation" element={<EvaluationPage />} />
            </Route>
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </PreferencesProvider>
    </ToastProvider>
  )
}
