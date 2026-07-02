import { Routes, Route } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import JobStudio from "../pages/JobStudio";
import ResumeUpload from "../pages/ResumeUpload";
import CandidateRanking from "../pages/CandidateRanking";
import DecisionWorkspace from "../pages/DecisionWorkspace";
import Analytics from "../pages/Analytics";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/jobs/new" element={<JobStudio />} />
        <Route path="/jobs/:jobId/upload" element={<ResumeUpload />} />
        <Route path="/jobs/:jobId/candidates" element={<CandidateRanking />} />
        <Route path="/jobs/:jobId/candidates/:candidateId" element={<DecisionWorkspace />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>
    </Routes>
  );
}
