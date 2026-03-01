import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import RidersPage from "@/pages/RidersPage";
import MotorcyclesPage from "@/pages/MotorcyclesPage";
import RemittancesPage from "@/pages/RemittancesPage";
import ExpensesPage from "@/pages/ExpensesPage";
import CompliancePage from "@/pages/CompliancePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/riders" element={<AppLayout><RidersPage /></AppLayout>} />
          <Route path="/motorcycles" element={<AppLayout><MotorcyclesPage /></AppLayout>} />
          <Route path="/remittances" element={<AppLayout><RemittancesPage /></AppLayout>} />
          <Route path="/expenses" element={<AppLayout><ExpensesPage /></AppLayout>} />
          <Route path="/compliance" element={<AppLayout><CompliancePage /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
