
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CLASSIFICATIONS } from '../shared/constants';

export default function PreviewPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/result`)
      .then(res => res.json())
      .then(json => {
        if (json.paymentStatus === 'paid') {
          navigate(`/result/${sessionId}`);
        } else {
          setData(json);
        }
      });
  }, [sessionId, navigate]);

  if (!data) return <div className="py-20 text-center text-slate-400">Gerando sua prévia gratuita...</div>;

  const classification = CLASSIFICATIONS[data.classification as keyof typeof CLASSIFICATIONS];

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Prévia do Diagnóstico</h2>
        <p className="text-slate-600">Sua autoavaliação foi processada. Confira o nível de risco identificado:</p>
      </div>

      <div className={`rounded-3xl p-8 md:p-12 border-2 ${classification.border} ${classification.bg} text-center shadow-lg mb-12`}>
        <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white shadow-sm mb-6 ${classification.color} font-bold text-sm`}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
          <span>RESULTADO PRELIMINAR</span>
        </div>
        <h3 className={`text-4xl font-black mb-6 ${classification.color}`}>{classification.label}</h3>
        <p className="text-slate-700 text-lg font-medium leading-relaxed max-w-xl mx-auto">
          {classification.description}
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
          <div>
            <h4 className="text-xl font-bold text-slate-900">Relatório Completo</h4>
            <p className="text-sm text-slate-500">Desbloqueie todos os detalhes técnicos</p>
          </div>
          <div className="text-right">
            <span className="text-sm text-slate-400 line-through block">R$ 49,90</span>
            <span className="text-2xl font-black text-blue-600">R$ 9,90</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-10">
          {[
            'Score numérico (0 a 100)',
            'Fatores críticos identificados',
            'Relatório técnico em PDF',
            'Checklist de ações preventivas'
          ].map((item, i) => (
            <div key={i} className="flex items-center space-x-3 text-slate-600">
              <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
              </svg>
              <span className="font-medium">{item}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate(`/pay/${sessionId}`)}
          className="w-full py-5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 text-lg active:scale-95"
        >
          Desbloquear Relatório Completo
        </button>
        <p className="mt-4 text-center text-xs text-slate-400">
          Acesso vitalício ao resultado desta sessão.
        </p>
      </div>
    </div>
  );
}
