import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-4xl font-bold text-slate-900 mb-6">Radar Fiscal</h1>
      <p className="text-xl text-slate-600 max-w-2xl mb-10">
        Ferramenta de autoavaliação preventiva.
      </p>
      <Link
        to="/radar"
        className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all"
      >
        Entrar no Radar
      </Link>
    </div>
  );
};

export default LandingPage;
