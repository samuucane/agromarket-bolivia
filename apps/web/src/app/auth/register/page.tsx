'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Leaf, Loader2, ChevronRight, Phone, Lock, Users, CheckCircle } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';

const ROLES = [
  { value: 'PRODUCER', label: '🌾 Productor Agrícola', desc: 'Vendo mi cosecha y compro insumos' },
  { value: 'BUYER', label: '🏭 Comprador / Empresa', desc: 'Compro productos agropecuarios' },
  { value: 'SUPPLIER', label: '🧪 Proveedor de Insumos', desc: 'Vendo semillas, fertilizantes y más' },
  { value: 'MACHINERY_OWNER', label: '🚜 Arrendador de Maquinaria', desc: 'Alquilo equipos agrícolas' },
];

const step1Schema = z.object({
  role: z.enum(['PRODUCER','BUYER','SUPPLIER','MACHINERY_OWNER']),
});
const step2Schema = z.object({
  phone: z.string().regex(/^\+?[0-9]{8,15}$/, 'Formato: +59170000000 o 70000000'),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(100),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'Las contraseñas no coinciden', path: ['confirmPassword'] });
const step3Schema = z.object({
  otp: z.string().length(6, 'El código tiene 6 dígitos'),
});

type Step = 1 | 2 | 3 | 4;

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState('PRODUCER');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const registerMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/auth/register', data),
    onSuccess: (_, vars) => {
      setPhone(vars.phone);
      setPassword(vars.password);
      setStep(3);
      setError('');
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? 'Error al registrarse'),
  });

  const verifyMutation = useMutation({
    mutationFn: (otp: string) => apiClient.post('/auth/verify-otp', { phone, otp, purpose: 'REGISTRATION' }),
    onSuccess: (res) => {
      const { accessToken, refreshToken, user } = res.data;
      login(user, accessToken, refreshToken);
      setStep(4);
    },
    onError: () => setError('Código incorrecto o expirado. Verifica tu SMS.'),
  });

  const {
    register: r2, handleSubmit: h2, formState: { errors: e2 },
  } = useForm({ resolver: zodResolver(step2Schema) });
  const {
    register: r3, handleSubmit: h3, formState: { errors: e3 },
  } = useForm({ resolver: zodResolver(step3Schema) });

  const steps = [
    { n: 1, label: 'Tipo de cuenta' },
    { n: 2, label: 'Datos de acceso' },
    { n: 3, label: 'Verificación' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-am-green-50 to-white flex flex-col">
      <div className="p-4">
        <Link href="/" className="inline-flex items-center gap-2 font-display font-bold text-lg text-am-green-700">
          <div className="w-8 h-8 bg-am-green-500 rounded-lg flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          AgroMarket Bolivia
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {step < 4 && (
            <>
              <h1 className="text-2xl font-display font-bold text-center mb-2">Crear tu cuenta gratis</h1>
              <p className="text-muted-foreground text-center text-sm mb-8">Solo necesitas tu número de celular</p>

              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {steps.map((s, i) => (
                  <div key={s.n} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      step > s.n ? 'bg-am-green-500 text-white' : step === s.n ? 'bg-am-green-100 text-am-green-700 ring-2 ring-am-green-500' : 'bg-muted text-muted-foreground'
                    }`}>
                      {step > s.n ? <CheckCircle className="w-4 h-4" /> : s.n}
                    </div>
                    <span className={`text-xs hidden sm:block ${step === s.n ? 'text-am-green-700 font-medium' : 'text-muted-foreground'}`}>{s.label}</span>
                    {i < steps.length - 1 && <div className={`w-8 h-0.5 ${step > s.n ? 'bg-am-green-500' : 'bg-border'}`} />}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="bg-white rounded-2xl shadow-xl border border-border p-8">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
            )}

            {/* STEP 1 — Role selection */}
            {step === 1 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-am-green-600" /> ¿Qué eres tú?</h2>
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      role === r.value ? 'border-am-green-500 bg-am-green-50' : 'border-border hover:border-am-green-200'
                    }`}
                  >
                    <p className="font-semibold">{r.label}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{r.desc}</p>
                  </button>
                ))}
                <button
                  onClick={() => { setStep(2); setError(''); }}
                  className="w-full mt-4 py-3 rounded-xl bg-am-green-500 text-white font-semibold hover:bg-am-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  Continuar <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* STEP 2 — Phone + password */}
            {step === 2 && (
              <form onSubmit={h2(d => registerMutation.mutate({ phone: d.phone, password: d.password, role }))} className="space-y-5">
                <h2 className="text-lg font-semibold flex items-center gap-2"><Phone className="w-5 h-5 text-am-green-600" /> Tus datos de acceso</h2>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Número de celular</label>
                  <input {...r2('phone')} type="tel" placeholder="+59170000000"
                    className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-am-green-500" />
                  {e2.phone && <p className="text-red-500 text-xs mt-1">{e2.phone.message}</p>}
                  <p className="text-xs text-muted-foreground mt-1">Te enviaremos un código SMS para verificar</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Contraseña</label>
                  <input {...r2('password')} type="password" placeholder="Mínimo 8 caracteres"
                    className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-am-green-500" />
                  {e2.password && <p className="text-red-500 text-xs mt-1">{e2.password.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Confirmar contraseña</label>
                  <input {...r2('confirmPassword')} type="password" placeholder="Repite tu contraseña"
                    className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-am-green-500" />
                  {e2.confirmPassword && <p className="text-red-500 text-xs mt-1">{e2.confirmPassword.message}</p>}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">Atrás</button>
                  <button type="submit" disabled={registerMutation.isPending} className="flex-[2] py-3 rounded-xl bg-am-green-500 text-white font-semibold hover:bg-am-green-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                    {registerMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {registerMutation.isPending ? 'Enviando...' : 'Recibir código SMS'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3 — OTP verification */}
            {step === 3 && (
              <form onSubmit={h3(d => verifyMutation.mutate(d.otp))} className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-am-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-am-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold mb-2">Verificar tu número</h2>
                  <p className="text-sm text-muted-foreground">Ingresa el código de 6 dígitos enviado a <strong>{phone}</strong></p>
                </div>
                <div>
                  <input {...r3('otp')} type="tel" inputMode="numeric" maxLength={6} placeholder="123456"
                    className="w-full text-center text-3xl font-display font-bold tracking-[0.5em] px-4 py-4 rounded-xl border-2 border-border focus:outline-none focus:ring-2 focus:ring-am-green-500 focus:border-am-green-500"
                  />
                  {e3.otp && <p className="text-red-500 text-xs mt-1 text-center">{e3.otp.message}</p>}
                </div>
                <button type="submit" disabled={verifyMutation.isPending} className="w-full py-3 rounded-xl bg-am-green-500 text-white font-semibold hover:bg-am-green-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {verifyMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {verifyMutation.isPending ? 'Verificando...' : 'Verificar y crear cuenta'}
                </button>
                <p className="text-center text-xs text-muted-foreground">
                  ¿No recibiste el SMS?{' '}
                  <button type="button" onClick={() => registerMutation.mutate({ phone, role })} className="text-am-green-600 hover:underline">Reenviar código</button>
                </p>
              </form>
            )}

            {/* STEP 4 — Success */}
            {step === 4 && (
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-am-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-am-green-600" />
                </div>
                <h2 className="text-2xl font-display font-bold mb-3">¡Bienvenido a AgroMarket!</h2>
                <p className="text-muted-foreground mb-8">Tu cuenta fue creada exitosamente. Completa tu perfil para acceder a todas las funciones.</p>
                <div className="space-y-3">
                  <button onClick={() => router.push('/dashboard')} className="w-full py-3 rounded-xl bg-am-green-500 text-white font-semibold hover:bg-am-green-600 transition-colors">
                    Ir al inicio
                  </button>
                  <button onClick={() => router.push('/profile/setup')} className="w-full py-3 rounded-xl border border-am-green-500 text-am-green-700 font-semibold hover:bg-am-green-50 transition-colors">
                    Completar mi perfil
                  </button>
                </div>
              </div>
            )}
          </div>

          {step < 4 && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              ¿Ya tienes cuenta?{' '}
              <Link href="/auth/login" className="text-am-green-600 font-medium hover:underline">Ingresar</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
