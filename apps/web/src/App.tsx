import './App.css'
import { Navigate, Route, Routes } from 'react-router'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import RegistrationPage from './pages/RegistrationPage'
import NewPatientRegistrationPage from './pages/NewPatientRegistrationPage'
import RegistrationDetailPage from './pages/RegistrationDetailPage'
import OutpatientPage from './pages/OutpatientPage'
import OutpatientExaminationPage from './pages/OutpatientExaminationPage'
import MedicalRecordPage from './pages/MedicalRecordPage'
import MedicalRecordDetailPage from './pages/MedicalRecordDetailPage'
import PharmacyPage from './pages/PharmacyPage'
import PharmacyDetailPage from './pages/PharmacyDetailPage'
import CashierPage from './pages/CashierPage'
import CashierDetailPage from './pages/CashierDetailPage'
import ReportPage from './pages/ReportPage'
import EmergencyPage from './pages/EmergencyPage'
import EmergencyAssessmentPage from './pages/EmergencyAssessmentPage'
import EmergencyMedicalRecordDetailPage from './pages/EmergencyMedicalRecordDetailPage'



function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/pendaftaran" element={<RegistrationPage />} />
      <Route
        path="/pendaftaran/pasien-baru"
        element={<NewPatientRegistrationPage />}
      />
      <Route
        path="/pendaftaran/detail/:id"
        element={<RegistrationDetailPage />}
      />
      <Route path="/rawat-jalan" element={<OutpatientPage />} />
      <Route
        path="/rawat-jalan/pemeriksaan/:id"
        element={<OutpatientExaminationPage />}
      />
      <Route path="/rme" element={<MedicalRecordPage />} />
      <Route path="/rme/detail/:id" element={<MedicalRecordDetailPage />} />
      <Route path="/rme/igd/:id" element={<EmergencyMedicalRecordDetailPage />} />
      <Route path="/farmasi" element={<PharmacyPage />} />
      <Route path="/farmasi/detail/:id" element={<PharmacyDetailPage />} />
      <Route path="/kasir" element={<CashierPage />} />
      <Route path="/kasir/detail/:id" element={<CashierDetailPage />} />
      <Route path="/laporan" element={<ReportPage />} />
      <Route path="/igd" element={<EmergencyPage />} />
      <Route path="/igd/asesmen/:id" element={<EmergencyAssessmentPage />} />
     
      <Route path="/igd/asesmen/:id" element={<EmergencyAssessmentPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
