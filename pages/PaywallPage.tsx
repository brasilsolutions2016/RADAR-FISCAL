import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function PaywallPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixData, setPixData] = useState<{qr_code: string, qr_code_base64: string, expires_at?: string} | null>(null);
  const [paymentApproved, setPaymentApproved] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // BUG FIX: Redirecionamento automático imediato após aprovação (Etapa 5)
  useEffect(() => {
    if (paymentApproved && sessionId) {
      const t = setTimeout(() => navigate(`/result/${sessionId}`), 800);
      return () => clearTimeout(t);
    }
  }, [paymentApproved, sessionId, navigate]);

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/payment-status`);
      const data = await res.json();
      if (data.paid) {
        setPaymentApproved(true);
        return true;
      }
    } catch (e) {
      console.error("Erro ao verificar status do pagamento:", e);
    }
    return false;
  }, [sessionId]);

  // Lógica de Polling com limite de 5 minutos (100 tentativas a cada 3 segundos)
  useEffect(() => {
    let interval: any;
    if (pixData && !paymentApproved && !hasTimedOut) {
      interval = setInterval(async () => {
        setAttempts(prev => {
          const next = prev + 1;
          if (next >= 100) { // 300 segundos = 5 minutos
            setHasTimedOut(true);
            return prev;
          }
          pollStatus();
          return next;
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [pixData, paymentApproved, hasTimedOut, pollStatus]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isProcessing) return;
    
    setIsProcessing(true);
    setHasTimedOut(false);
    setAttempts(0);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setPixData(data);
      } else {
        alert(data.error || "Erro ao gerar PIX");
      }
    } catch (e) {
      alert("Erro de conexão");
    } finally {
      setIsProcessing(false);
    }
  };

  const checkManual = async () => {
    setIsProcessing(true);
    const paid = await pollStatus();
    if (paid) {
      navigate(`/result/${sessionId}`);
    } else {
      alert("Pagamento ainda não identificado. Se você já pagou, aguarde alguns instantes.");
    }
    setIsProcessing(false);
  };

  const copyToClipboard = () => {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code);
      alert("Código PIX copiado!");
    }
  };

  if (paymentApproved) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-12 shadow-xl border border-emerald-100">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 01-1.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Pagamento Confirmado!</h2>
          <p className="text-slate-500">Redirecionando para seu relatório...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 md:py-20">
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Checkout Seguro</h2>
          <p className="text-slate-500">Pagamento via PIX</p>
        </div>

        {!pixData ? (
          <form onSubmit={handleCheckout} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail para envio do relatório</label>
              <input 
                type="email" 
                required 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="flex justify-between items-center py-4 border-b border-slate-50">
              <span className="text-slate-600">Total a pagar</span>
              <span className="font-bold text-slate-900">R$ 9,90</span>
            </div>
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-slate-300 transition-all shadow-lg flex items-center justify-center space-x-2"
            >
              {isProcessing ? "Gerando PIX..." : "Gerar PIX R$ 9,90"}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-6">
            <div className="bg-slate-50 p-4 rounded-2xl inline-block">
              <img 
                src={`data:image/png;base64,${pixData.qr_code_base64}`} 
                alt="QR Code PIX" 
                className="w-48 h-48 mx-auto"
              />
            </div>
            
            <div className="space-y-4">
              {hasTimedOut ? (
                <div className="space-y-3">
                  <p className="text-sm text-rose-600 font-semibold">O tempo de verificação automática expirou.</p>
                  <button 
                    onClick={checkManual}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg text-sm"
                  >
                    Verificar Pagamento
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                   <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></div>
                    <p className="text-sm text-slate-600 font-medium">Aguardando pagamento...</p>
                  </div>
                </div>
              )}
              
              <button 
                onClick={copyToClipboard}
                className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center space-x-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span>PIX Copia e Cola</span>
              </button>

              {pixData.expires_at && (
                <p className="text-[10px] text-slate-400">
                  Expira em: {new Date(pixData.expires_at).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
            <div className="text-xs text-slate-400 leading-relaxed italic">
              Não feche esta página. O relatório será liberado automaticamente após a confirmação.
            </div>
          </div>
        )}

        <button 
          onClick={() => navigate(-1)}
          className="w-full mt-6 text-sm text-slate-400 font-medium hover:text-slate-600"
        >
          Cancelar e Voltar
        </button>
      </div>
    </div>
  );
}