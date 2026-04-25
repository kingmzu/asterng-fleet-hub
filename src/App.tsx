import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";
import LoginPage from "@/pages/LoginPage";
import Dashboard from "@/pages/Dashboard";
import RidersPage from "@/pages/RidersPage";
import MotorcyclesPage from "@/pages/MotorcyclesPage";
import RemittancesPage from "@/pages/RemittancesPage";
import ExpensesPage from "@/pages/ExpensesPage";
import CompliancePage from "@/pages/CompliancePage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import MessagesPage from "@/pages/MessagesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const wrap = (el: React.ReactNode) => (
  <ProtectedRoute>
    <AppLayout>{el}</AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={wrap(<Dashboard />)} />
            <Route path="/riders" element={wrap(<RidersPage />)} />
            <Route path="/motorcycles" element={wrap(<MotorcyclesPage />)} />
            <Route path="/remittances" element={wrap(<RemittancesPage />)} />
            <Route path="/expenses" element={wrap(<ExpensesPage />)} />
            <Route path="/compliance" element={wrap(<CompliancePage />)} />
            <Route path="/messages" element={wrap(<MessagesPage />)} />
            <Route path="/profile" element={wrap(<ProfilePage />)} />
            <Route path="/settings" element={wrap(<SettingsPage />)} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
