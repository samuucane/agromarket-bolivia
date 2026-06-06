'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Leaf, Eye, EyeOff, Loader2, Phone } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';

const loginSchema = z.object({
  phone: z.string().min(8, 'Número inválido').regex(/^\+?[0-9]{8,15}$/, 'Formato: +59170000000'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginForm) => apiClient.post('/auth/login', data),
    onSuccess: (res) => {
      const { accessToken, refreshToken, user } = res.data;
      login(user, accessToken, refreshToken);
      router.push('/dashboard');
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message ?? 'Credenciales incorrectas. Intenta de nuevo.');
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-am-green-50 to-white flex flex-col">
      {/* Top bar */}
      <div className="p-4">
        <Link href="/" className="inline-flex items-center gap-2 font-display font-bold text-lg text-am-green-700">
          <div className="w-8 h-8 bg-am-green-500 rounded-lg flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          AgroMarket Bolivia
        </Link>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-border p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-display font-bold mb-2">Ingresar a tu cuenta</h1>
              <p className="text-muted-foreground text-sm">Bienvenido de vuelta a AgroMarket Bolivia</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(data => loginMutation.mutate(data))} className="space-y-5">
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Número de celular</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    {...register('phone')}
                    type="tel"
                    placeholder="+59170000000"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-am-green-500 transition-shadow"
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium">Contraseña</label>
                  <Link href="/auth/forgot-pin" className="text-xs text-am-green-600 hover:underline">¿Olvidaste tu PIN?</Link>
                </div>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Tu contraseña"
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-am-green-500 transition-shadow"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground min-h-0 min-w-0">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full py-3 rounded-xl bg-am-green-500 text-white font-semibold hover:bg-am-green-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loginMutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
                {loginMutation.isPending ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">o continúa con</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* WhatsApp login option */}
            <a
              href="https://wa.me/59100000000?text=Hola%2C%20quiero%20ingresar%20a%20mi%20cuenta%20AgroMarket"
              target="_blank" rel="noopener noreferrer"
              className="w-full py-3 rounded-xl border-2 border-[#25D366] text-[#075E54] font-semibold flex items-center justify-center gap-2 hover:bg-[#f0fdf4] transition-colors"
            >
              <svg className="w-5 h-5 fill-[#25D366]" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Continuar por WhatsApp
            </a>

            {/* Register link */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              ¿No tienes cuenta?{' '}
              <Link href="/auth/register" className="text-am-green-600 font-medium hover:underline">
                Regístrate gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
