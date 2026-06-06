'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { TrendingUp, Package, CreditCard, Bell, Plus, ArrowRight, Leaf, MapPin, Star, AlertCircle } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';

function StatCard({ title, value, sub, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-display font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function CreditScoreGauge({ score }: { score: number }) {
  const pct = ((score - 300) / 550) * 100;
  const color = score >= 720 ? '#2D7D2A' : score >= 600 ? '#F5A623' : score >= 480 ? '#E07B00' : '#DC2626';
  const label = score >= 720 ? 'Excelente' : score >= 600 ? 'Bueno' : score >= 480 ? 'Regular' : 'Bajo';

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <p className="text-sm text-muted-foreground mb-4">Score Crediticio</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-4xl font-display font-bold" style={{ color }}>{score}</p>
          <p className="text-sm font-medium mt-1" style={{ color }}>{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">de 850 puntos posibles</p>
        </div>
        <div className="relative w-24 h-24">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" />
            <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="12"
              strokeDasharray={`${pct * 2.51} 251`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <CreditCard className="w-6 h-6" style={{ color }} />
          </div>
        </div>
      </div>
      <Link href="/credit" className="mt-4 inline-flex items-center gap-1 text-xs text-am-green-600 hover:underline font-medium">
        Ver mi crédito disponible <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: analytics } = useQuery({
    queryKey: ['analytics', 'producer'],
    queryFn: () => apiClient.get('/analytics/producer').then(r => r.data),
    enabled: !!user,
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get('/notifications').then(r => r.data),
    enabled: !!user,
  });

  const { data: myListings } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => apiClient.get('/marketplace/listings/my?limit=3').then(r => r.data),
    enabled: !!user,
  });

  const { data: creditScore } = useQuery({
    queryKey: ['credit-score'],
    queryFn: () => apiClient.get('/credit/score').then(r => r.data),
    enabled: !!user,
  });

  const unreadNotifs = notifications?.filter((n: any) => !n.isRead).length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-am-green-700 text-white">
        <div className="page-container py-5 flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Buen día,</p>
            <h1 className="text-white text-xl font-display font-bold">{user?.phone ?? 'Productor'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/notifications" className="relative p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <Bell className="w-5 h-5" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-am-amber-400 rounded-full text-xs flex items-center justify-center font-bold">
                  {unreadNotifs}
                </span>
              )}
            </Link>
            <Link href="/profile" className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
              {user?.phone?.slice(-2) ?? 'U'}
            </Link>
          </div>
        </div>
      </div>

      <div className="page-container py-6 space-y-6">
        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/marketplace/new', icon: Plus, label: 'Publicar cosecha', color: 'bg-am-green-500 text-white' },
            { href: '/marketplace', icon: Package, label: 'Ver mercado', color: 'bg-white text-am-green-700 border border-border' },
            { href: '/credit', icon: CreditCard, label: 'Pedir crédito', color: 'bg-white text-am-amber-600 border border-border' },
            { href: '/farms', icon: Leaf, label: 'Mi finca', color: 'bg-white text-am-earth-400 border border-border' },
          ].map(a => (
            <Link key={a.href} href={a.href} className={`${a.color} rounded-xl p-4 flex flex-col items-center gap-2 text-center font-medium text-sm hover:opacity-90 transition-opacity`}>
              <a.icon className="w-6 h-6" />
              {a.label}
            </Link>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Ingresos del mes" value={`Bs. ${Number(analytics?.totalRevenue ?? 0).toLocaleString('es-BO')}`} sub="Ventas completadas" icon={TrendingUp} color="bg-am-green-100 text-am-green-700" />
          <StatCard title="Pedidos completados" value={analytics?.ordersCompleted ?? '—'} sub="Total histórico" icon={Package} color="bg-blue-100 text-blue-700" />
          <StatCard title="Saldo wallet" value={`Bs. ${Number(analytics?.walletBalance ?? 0).toLocaleString('es-BO')}`} sub="Disponible" icon={CreditCard} color="bg-am-amber-50 text-am-amber-600" />
          {creditScore?.score ? (
            <CreditScoreGauge score={creditScore.score} />
          ) : (
            <StatCard title="Score crediticio" value="Sin datos" sub="Completa tu perfil" icon={Star} color="bg-muted text-muted-foreground" />
          )}
        </div>

        {/* My listings + alerts row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* My listings */}
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Mis publicaciones</h3>
              <Link href="/marketplace/my" className="text-xs text-am-green-600 hover:underline">Ver todas</Link>
            </div>
            {myListings?.data?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm mb-3">No tienes publicaciones activas</p>
                <Link href="/marketplace/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-am-green-500 text-white text-sm font-semibold hover:bg-am-green-600 transition-colors">
                  <Plus className="w-4 h-4" /> Publicar ahora
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myListings?.data?.slice(0, 3).map((l: any) => (
                  <Link key={l.id} href={`/marketplace/${l.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-am-green-100 flex items-center justify-center text-lg overflow-hidden">
                      {l.images?.[0]?.url ? <img src={l.images[0].url} alt="" className="w-full h-full object-cover" /> : '🌾'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{l.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {l.locationDept ?? 'Bolivia'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-am-green-700 text-sm">Bs. {Number(l.pricePerUnit).toFixed(2)}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${l.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>{l.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Notifications / alerts */}
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Alertas recientes</h3>
              <Link href="/notifications" className="text-xs text-am-green-600 hover:underline">Ver todas</Link>
            </div>
            {notifications?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No hay alertas nuevas</div>
            ) : (
              <div className="space-y-3">
                {notifications?.slice(0, 5).map((n: any) => (
                  <div key={n.id} className={`flex gap-3 p-3 rounded-lg ${!n.isRead ? 'bg-am-green-50' : 'hover:bg-muted/30'} transition-colors`}>
                    <div className="w-8 h-8 rounded-full bg-am-green-100 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4 text-am-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(n.createdAt).toLocaleDateString('es-BO')}</p>
                    </div>
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-am-green-500 mt-1.5 shrink-0" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
