import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export default function QuestionnairePage() {
  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [consents, setConsents] = useState({ privacy: false, marketing: false });
  const [loading, setLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/shared/questionnaire.json')
      .then(res => res.json())
      .then(data => setAllQuestions(data))
      .catch(err => {
        console.error('Erro ao carregar questões:', err);
        setSessionError('Erro ao carregar o questionário. Verifique sua conexão.');
      });
  }, []);

  const visibleQuestions = useMemo(() => {
    return allQuestions.filter(q => {
      if (!q.show_if || q.show_if.length === 0) return true;
      const isAll = q.show_if_mode === 'ALL';
      const evaluator = (cond: any) => answers[cond.dependsOn]?.label === cond.value;
      return isAll ? q.show_if.every(evaluator) : q.show_if.some(evaluator);
    });
  }, [allQuestions, answers]);

  const handleStart = async () => {
    if (!consents.privacy || allQuestions.length === 0) return;
    setLoading(true);
    setSessionError(null);

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error('Falha ao criar sessão no servidor');
      
      const data = await res.json();
      setSessionId(data.sessionId);
      setCurrentIndex(0);
    } catch (err: any) {
      console.error('Erro de conexão:', err);
      setSessionError('Não foi possível conectar ao servidor. Verifique se o backend está ativo.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (qId: string, label: string, weight: number) => {
    if (!sessionId) return;

    // Atualiza estado local
    setAnswers(prev => ({ ...prev, [qId]: { label, weight } }));

    // Sincroniza com servidor
    fetch(`/api/sessions/${sessionId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: qId,
        label: label,
        weight: weight
      })
    }).catch(e => console.warn("Falha ao salvar resposta:", e));

    if (currentIndex < visibleQuestions.length - 1) {
      setCurrentIndex(i => i + 1);
      window.scrollTo(0, 0);
    } else {
      navigate(`/preview/${sessionId}`);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  };

  if (currentIndex === -1) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl p-8 shadow-sm border text-center">
          <h2 className="text-2xl font-bold mb-6">Termos e Privacidade</h2>
          <p className="text-slate-600 mb-8 italic">
            Radar Fiscal é uma ferramenta informativa baseada em autoavaliação.
          </p>

          {sessionError && (
            <div className="mb-6 p-4 bg-rose-50 border rounded-xl text-rose-700 text-sm">
              {sessionError}
            </div>
          )}

          <div className="space-y-4 mb-8 text-left">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1" checked={consents.privacy} onChange={e => setConsents(c => ({ ...c, privacy: e.target.checked }))} />
              <span className="text-sm">Aceito os Termos de Uso e Política de Privacidade</span>
            </label>
          </div>

          <button
            onClick={handleStart}
            disabled={!consents.privacy || loading}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl disabled:bg-slate-300 transition-colors"
          >
            {loading ? 'Conectando...' : 'Iniciar Autoavaliação'}
          </button>
        </div>
      </div>
    );
  }

  const q = visibleQuestions[currentIndex];
  if (!q) return null;

  const progress = Math.round(((currentIndex + 1) / visibleQuestions.length) * 100);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="flex justify-between mb-2 text-xs text-slate-400 font-bold uppercase">
          <button onClick={handleBack} className={currentIndex === 0 ? 'invisible' : ''}>← Voltar</button>
          <span>Questão {currentIndex + 1} de {visibleQuestions.length}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
        <h3 className="text-2xl font-bold mb-8 text-slate-900 leading-tight">{q.text}</h3>
        <div className="space-y-3">
          {q.options.map((opt: any, i: number) => (
            <button
              key={i}
              onClick={() => handleAnswer(q.id, opt.label, opt.weight)}
              className="w-full text-left p-5 rounded-2xl border-2 border-slate-50 bg-slate-50 hover:border-blue-500 hover:bg-blue-50 transition-all font-medium text-slate-700"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
