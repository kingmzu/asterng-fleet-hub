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
import SmartMeterPage from "@/pages/SmartMeterPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const wrap = (el: React.ReactNode, opts?: { staffOnly?: boolean; adminOnly?: boolean }) => (
  <ProtectedRoute staffOnly={opts?.staffOnly} adminOnly={opts?.adminOnly}>
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
            <Route path="/" element={wrap(<Dashboard />, { staffOnly: true })} />
            <Route path="/riders" element={wrap(<RidersPage />, { staffOnly: true })} />
            <Route path="/motorcycles" element={wrap(<MotorcyclesPage />, { staffOnly: true })} />
            <Route path="/smart-meter" element={wrap(<SmartMeterPage />)} />
            <Route path="/remittances" element={wrap(<RemittancesPage />, { staffOnly: true })} />
            <Route path="/expenses" element={wrap(<ExpensesPage />, { staffOnly: true })} />
            <Route path="/compliance" element={wrap(<CompliancePage />, { staffOnly: true })} />
            <Route path="/messages" element={wrap(<MessagesPage />, { staffOnly: true })} />
            <Route path="/profile" element={wrap(<ProfilePage />, { staffOnly: true })} />
            <Route path="/settings" element={wrap(<SettingsPage />, { staffOnly: true })} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
