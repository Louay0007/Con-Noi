import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import OnboardingPage from "./pages/onboarding/OnboardingPage";
import ForYouPage from "./pages/feed/ForYouPage";
import BrowsePage from "./pages/browse/BrowsePage";
import JobDetailPage from "./pages/posts/JobDetailPage";
import ApplyPage from "./pages/applications/ApplyPage";
import ApplicationsPage from "./pages/applications/ApplicationsPage";
import MessagesPage from "./pages/messages/MessagesPage";
import ProfilePage from "./pages/profile/ProfilePage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminPostsPage from "./pages/admin/AdminPostsPage";
import AdminApplicationsPage from "./pages/admin/AdminApplicationsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminAuditPage from "./pages/admin/AdminAuditPage";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/signup" element={<RegisterPage />} />
        <Route path="/auth/recover" element={<ForgotPasswordPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/posts/*" element={<AdminPostsPage />} />
        <Route path="/admin/applications" element={<AdminApplicationsPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/audit" element={<AdminAuditPage />} />
        {/* User-facing routes wrapped in Layout with nav + notifications */}
        <Route element={<Layout><Outlet /></Layout>}>
          <Route path="/for-you" element={<ForYouPage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/posts/:id" element={<JobDetailPage />} />
          <Route path="/apply/:postId" element={<ApplyPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;