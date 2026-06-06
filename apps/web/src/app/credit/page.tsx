'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CreditCard, TrendingUp, Clock, CheckCircle, AlertCircle, Loader2, Calculator } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';

const PURPOSES = [
  { value: 'SEEDS', label: '🌱 Semillas' },
  { value: 'FERTILIZERS', label: '🧪 Fertilizantes' },
  { value: 'MACHINERY', label: '🚜 Maquinaria' },
  { value: 'WORKING_CAPITAL', label: '💼 Capital de trabajo' },
  { value: 'INFRASTRUCTURE', label: '🏗️ Infraestructura' },
];

function ScoreGauge({ score }: { score: number }) {
  const pct = ((score - 300) / 550) * 100;
  const color = score >= 720 ? '#2D7D2A' : score >= 600 ? '#F5A623' : score >= 480 ? '#E07B00' : '#DC2626';
  const label = score >= 720 ? 'Excelente' : score >= 600 ? 'Bueno' : score >= 480 ? 'Regular' : 'Bajo';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${pct * 2.51} 251`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-display font-bold" style={{ color }}>{score}</span>
          <span className="text-xs text-muted-foreground">/ 850</span>
        </div>
      </div>
      <span className="mt-2 font-semibold text-sm" style={{ color }}>{label}</span>
    </div>
  );
}

function CreditSimulator() {
  const [amount, setAmount] = useState(5000);
  const [term, setTerm] = useState(6);

  const { data } = useQuery({
    queryKey: ['credit-sim', amount, term],
    queryFn: () => apiClient.get(`/credit/simulate?amount=${amount}&term=${term}`).then(r => r.data),
    enabled: amount > 0 && term > 0,
  });

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2"><Calculator className="w-5 h-5 text-am-green-600" /> Simulador de Crédito</h3>
      <div className="space-y-5">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium">Monto solicitado</label>
            <span className="text-sm font-bold text-am-green-700">Bs. {amount.toLocaleString('es-BO')}</span>
          </div>
          <input type="range" min="500" max="100000" step="500" value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            className="w-full accent-am-green-500" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Bs. 500</span><span>Bs. 100,000</span>
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium">Plazo</label>
            <span className="text-sm font-bold text-am-green-700">{term} meses</span>
          </div>
          <input type="range" min="1" max="24" step="1" value={term}
            onChange={e => setTerm(Number(e.target.value))}
            className="w-full accent-am-green-500" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>1 mes</span><span>24 meses</span>
          </div>
        </div>
        {data && (
          <div className="bg-am-green-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cuota mensual</span>
              <span className="font-bold text-am-green-700 text-base">Bs. {data.monthlyPayment?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tasa anual</span>
              <span className="font-medium">{((data.annualRate ?? 0) * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total a pagar</span>
              <span className="font-medium">Bs. {data.totalToPay?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Interés total</span>
              <span className="font-medium text-am-amber-600">Bs. {data.totalInterest?.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreditPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [applying, setApplying] = useState(false);
  const [purpose, setPurpose] = useState('WORKING_CAPITAL');
  const [amount, setAmount] = useState(5000);
  const [term, setTerm] = useState(6);
  const [success, setSuccess] = useState(false);

  const { data: score } = useQuery({
    queryKey: ['credit-score'],
    queryFn: () => apiClient.get('/credit/score').then(r => r.data),
    enabled: isAuthenticated,
  });

  const { data: applications } = useQuery({
    queryKey: ['credit-applications'],
    queryFn: () => apiClient.get('/credit/applications').then(r => r.data),
    enabled: isAuthenticated,
  });

  const applyMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/credit/apply', data),
    onSuccess: () => { setSuccess(true); setApplying(false); },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-am-green-700 text-white py-8">
        <div className="page-container">
          <h1 className="text-white text-2xl font-display font-bold mb-1">Crédito Agrícola</h1>
          <p className="text-white/70 text-sm">Accede a financiamiento basado en tu historial productivo</p>
        </div>
      </div>

      <div className="page-container py-6">
        {!isAuthenticated ? (
          <div className="text-center py-16">
            <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-30" />
            <h2 className="mb-3">Inicia sesión para acceder al crédito</h2>
            <a href="/auth/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-am-green-500 text-white font-semibold hover:bg-am-green-600 transition-colors">
              Ingresar
            </a>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Score + Apply */}
            <div className="lg:col-span-2 space-y-6">
              {/* Score card */}
              <div className="bg-white rounded-xl border border-border p-6">
                <h3 className="font-semibold mb-6">Tu Score Crediticio</h3>
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <ScoreGauge score={score?.score ?? 400} />
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Crédito disponible</span>
                      <span className="font-bold text-am-green-700">
                        {score?.score >= 600 ? 'Hasta Bs. 50,000' : score?.score >= 480 ? 'Hasta Bs. 12,000' : 'Hasta Bs. 3,000'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Nivel de riesgo</span>
                      <span className={`font-medium text-sm ${score?.score >= 720 ? 'text-am-green-600' : score?.score >= 600 ? 'text-am-amber-600' : 'text-red-600'}`}>
                        {score?.riskTier === 'LOW' ? 'Bajo' : score?.riskTier === 'MEDIUM' ? 'Medio' : 'Alto'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-muted-foreground">Última actualización</span>
                      <span className="text-sm">{score?.updatedAt ? new Date(score.updatedAt).toLocaleDateString('es-BO') : 'Hoy'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Mejora tu score completando más transacciones, verificando tu KYC y registrando tus cosechas en Farm Manager.
                    </p>
                  </div>
                </div>
              </div>

              {/* Apply form */}
              {success ? (
                <div className="bg-am-green-50 rounded-xl border border-am-green-200 p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-am-green-600 mx-auto mb-3" />
                  <h3 className="text-am-green-800 font-semibold mb-2">¡Solicitud enviada exitosamente!</h3>
                  <p className="text-am-green-700 text-sm">Tu solicitud está siendo procesada. Te notificaremos por SMS y WhatsApp.</p>
                </div>
              ) : applying ? (
                <div className="bg-white rounded-xl border border-border p-6">
                  <h3 className="font-semibold mb-5">Solicitar Crédito</h3>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium mb-2">Propósito del crédito</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {PURPOSES.map(p => (
                          <button key={p.value} onClick={() => setPurpose(p.value)}
                            className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${purpose === p.value ? 'border-am-green-500 bg-am-green-50 text-am-green-700' : 'border-border hover:border-am-green-200'}`}>
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Monto (BOB)</label>
                      <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} min={500} max={100000}
                        className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-am-green-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Plazo (meses)</label>
                      <select value={term} onChange={e => setTerm(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-am-green-500">
                        {[3,6,9,12,18,24].map(m => <option key={m} value={m}>{m} meses</option>)}
                      </select>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setApplying(false)} className="flex-1 py-3 rounded-xl border border-border font-medium hover:bg-muted transition-colors">Cancelar</button>
                      <button onClick={() => applyMutation.mutate({ purpose, requestedAmount: amount, requestedTerm: term })}
                        disabled={applyMutation.isPending}
                        className="flex-[2] py-3 rounded-xl bg-am-green-500 text-white font-semibold hover:bg-am-green-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                        {applyMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {applyMutation.isPending ? 'Procesando...' : 'Enviar solicitud'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button onClick={() => setApplying(true)}
                  className="w-full py-4 rounded-xl bg-am-green-500 text-white font-semibold text-lg hover:bg-am-green-600 transition-colors flex items-center justify-center gap-2 shadow-sm">
                  <CreditCard className="w-6 h-6" /> Solicitar Crédito Ahora
                </button>
              )}

              {/* Applications history */}
              {applications?.length > 0 && (
                <div className="bg-white rounded-xl border border-border p-6">
                  <h3 className="font-semibold mb-4">Historial de solicitudes</h3>
                  <div className="space-y-3">
                    {applications.map((app: any) => (
                      <div key={app.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div>
                          <p className="font-medium text-sm">{PURPOSES.find(p => p.value === app.purpose)?.label ?? app.purpose}</p>
                          <p className="text-xs text-muted-foreground">Bs. {Number(app.requestedAmount).toLocaleString()} · {app.requestedTerm} meses</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          app.status === 'APPROVED' ? 'badge-active' : app.status === 'REJECTED' ? 'badge-error' : 'badge-pending'
                        }`}>{app.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Simulator */}
            <div className="space-y-4">
              <CreditSimulator />
              <div className="bg-am-amber-50 rounded-xl border border-am-amber-100 p-4">
                <h4 className="font-semibold text-am-amber-800 text-sm mb-2">¿Cómo funciona?</h4>
                <ul className="text-xs text-am-amber-700 space-y-1.5">
                  <li>✓ Evaluamos tu historial en la plataforma</li>
                  <li>✓ Scoring automático en segundos</li>
                  <li>✓ El banco socio desembolsa en 24–48h</li>
                  <li>✓ Paga tus cuotas desde tu wallet</li>
                  <li>✓ AgroMarket NO cobra comisión al productor</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
