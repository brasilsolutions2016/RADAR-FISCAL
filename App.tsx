import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import QuestionnairePage from "./pages/QuestionnairePage";
import PreviewPage from "./pages/PreviewPage";
import PaywallPage from "./pages/PaywallPage";
import ResultPage from "./pages/ResultPage";
import AdminPage from "./pages/AdminPage";

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/radar" element={<QuestionnairePage />} />
            <Route path="/preview/:sessionId" element={<PreviewPage />} />
            <Route path="/pay/:sessionId" element={<PaywallPage />} />
            <Route path="/result/:sessionId" element={<ResultPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
