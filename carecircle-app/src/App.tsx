import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Landing from "@/views/Landing";
import Login from "@/views/Login";
import Register from "@/views/Register";
import Join from "@/views/Join";
import AppShell from "@/components/AppShell";
import TodayDashboard from "@/views/TodayDashboard";
import ElderToday from "@/views/ElderToday";
import Medications from "@/views/Medications";
import CalendarView from "@/views/CalendarView";
import Appointments from "@/views/Appointments";
import HealthLog from "@/views/HealthLog";
import AdherenceReports from "@/views/AdherenceReports";
import ConsentCenter from "@/views/ConsentCenter";
import EmergencyCardPage from "@/views/EmergencyCard";
import SettingsPage from "@/views/SettingsPage";
import EmailDoseAction from "@/views/EmailDoseAction";
import EmergencyPublic from "@/views/EmergencyPublic";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/join" element={<Join />} />
        <Route path="/e/:token" element={<EmailDoseAction />} />
        <Route path="/sos/:token" element={<EmergencyPublic />} />
        <Route path="/app" element={<AppShell />}>
          <Route index element={<TodayDashboard />} />
          <Route path="elder" element={<ElderToday />} />
          <Route path="medications" element={<Medications />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="health" element={<HealthLog />} />
          <Route path="reports" element={<AdherenceReports />} />
          <Route path="members" element={<ConsentCenter />} />
          <Route path="emergency" element={<EmergencyCardPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors position="bottom-right" />
    </>
  );
}
