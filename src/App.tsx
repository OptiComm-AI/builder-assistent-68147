import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";

const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NewProject = lazy(() => import("./pages/NewProject"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Chat = lazy(() => import("./pages/Chat"));
const Admin = lazy(() => import("./pages/Admin"));
const About = lazy(() => import("./pages/About"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}><Auth /></Suspense>} />
          <Route path="/dashboard" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}><Dashboard /></Suspense>} />
          <Route path="/projects/new" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}><NewProject /></Suspense>} />
          <Route path="/projects/:id" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}><ProjectDetail /></Suspense>} />
          <Route path="/chat" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}><Chat /></Suspense>} />
          <Route path="/chat/:conversationId" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}><Chat /></Suspense>} />
          <Route path="/admin" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}><Admin /></Suspense>} />
          <Route path="/about" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}><About /></Suspense>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}><NotFound /></Suspense>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
