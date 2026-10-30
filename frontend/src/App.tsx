import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Layout from "./components/Layout";

// Route-level code splitting: the landing page must not download the
// admin dashboard or the study builder. Each screen loads on demand.
const Index = lazy(() => import("./pages/Index"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));
const OnboardingPage = lazy(() => import("./pages/onboarding/OnboardingPage"));
const ForYouPage = lazy(() => import("./pages/feed/ForYouPage"));
const BrowsePage = lazy(() => import("./pages/browse/BrowsePage"));
const JobDetailPage = lazy(() => import("./pages/posts/JobDetailPage"));
const ApplyPage = lazy(() => import("./pages/applications/ApplyPage"));
const ApplicationsPage = lazy(() => import("./pages/applications/ApplicationsPage"));
const MessagesPage = lazy(() => import("./pages/messages/MessagesPage"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminPostsPage = lazy(() => import("./pages/admin/AdminPostsPage"));
const AdminApplicationsPage = lazy(() => import("./pages/admin/AdminApplicationsPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminAuditPage = lazy(() => import("./pages/admin/AdminAuditPage"));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
      <Loader2 className="size-8 animate-spin text-[#0F4C81]" aria-label="Caricamento" />
    </div>
  );
}

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<RegisterPage />} />
          <Route path="/auth/recover" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/posts/*" element={<AdminPostsPage />} />
          <Route path="/admin/applications" element={<AdminApplicationsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/audit" element={<AdminAuditPage />} />
          {/* User-facing routes wrapped in Layout with nav + notifications */}
          <Route element={<Layout />}>
            <Route path="/for-you" element={<ForYouPage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/posts/:id" element={<JobDetailPage />} />
            <Route path="/apply/:postId" element={<ApplyPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
