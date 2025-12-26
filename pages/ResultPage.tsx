import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CLASSIFICATIONS } from '../shared/constants';

export default function ResultPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/result`)
      .then(res => res.json())
      .then(json => {
        if (json.paymentStatus !== 'paid') {
          navigate(`/preview/${sessionId}`);
        } else {
          setData(json);
        }
      });
  }, [sessionId, navigate]);

  if (!data) return <div className="py-20 text-center text-slate-400">Carregando relatório completo...</div>;

  const classification = CLASSIFICATIONS[data.classification as keyof typeof CLASSIFICATIONS];

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Relatório de Conformidade</h2>
          <p className="text-slate-500">ID da Sessão: {sessionId?.slice(0, 8)}...</p>
        </div>
        <button 
          disabled 
          className="px-6 py-3 bg-slate-300 text-slate-500 font-bold rounded-xl cursor-not-allowed flex items-center space-x-2 transition-all"
          title="Funcionalidade em desenvolvimento"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Baixar PDF (Em breve)</span>
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900">Score de Risco</h3>
            <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${classification.bg} ${classification.color}`}>
              {classification.label}
            </span>
          </div>
          
          <div className="relative pt-1">
            <div className="flex mb-4 items-center justify-between">
              <div>
                <span className="text-5xl font-black text-slate-900">{data.scoreFinal}</span>
                <span className="text-slate-400 text-xl font-bold ml-1">/100</span>
              </div>
            </div>
            <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-slate-100">
              <div 
                style={{ width: `${data.scoreFinal}%` }} 
                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ${data.scoreFinal > 70 ? 'bg-rose-500' : data.scoreFinal > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              ></div>
            </div>
          </div>
          
          <p className="text-slate-600 leading-relaxed mt-6">
            O seu score reflete a probabilidade de inconsistências baseada exclusivamente nas suas respostas. 
            Quanto maior o número, maior a necessidade de revisão técnica.
          </p>
        </div>

        <div className="bg-slate-900 rounded-3xl p-8 text-white">
          <h3 className="text-lg font-bold mb-6">Próximos Passos</h3>
          <ul className="space-y-4">
            <li className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
              <span className="text-sm text-slate-300">Revise os fatores críticos listados abaixo.</span>
            </li>
            <li className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
              <span className="text-sm text-slate-300">Organize os documentos XML dos últimos 12 meses.</span>
            </li>
            <li className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
              <span className="text-sm text-slate-300">Considere uma auditoria especializada via GovScan.</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-900 mb-8">Diagnóstico de Fatores Identificados</h3>
        <div className="space-y-6">
          {data.factors && data.factors.length > 0 ? (
            data.factors.map((f: any, i: number) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-slate-100/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${f.impact === 'Crítico' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'}`}></div>
                    <span className={`text-xs font-black px-3 py-1 rounded-lg uppercase tracking-wider ${f.impact === 'Crítico' ? 'text-rose-600 bg-rose-50' : 'text-amber-600 bg-amber-50'}`}>
                      IMPACTO {f.impact.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">REF: {f.questionId}</span>
                </div>
                <h4 className="text-slate-900 font-bold mb-3 leading-snug">{f.questionText}</h4>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-slate-500 font-medium">Sua resposta:</span>
                  <span className="text-slate-900 font-bold bg-white px-3 py-1 rounded-lg shadow-sm border border-slate-100">{f.answerLabel}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium">Nenhum fator crítico identificado nas respostas.</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-12 p-8 bg-blue-50 rounded-3xl border border-blue-100 text-center">
        <h4 className="text-blue-900 font-bold mb-2 text-xl">Deseja uma análise técnica real?</h4>
        <p className="text-blue-700 text-sm mb-6 max-w-md mx-auto">Conheça o GovScan Fiscal para cruzamento de dados direto da Receita Federal e identificação de créditos.</p>
        <button className="px-10 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95">
          Saber mais sobre GovScan
        </button>
      </div>
    </div>
  );
}