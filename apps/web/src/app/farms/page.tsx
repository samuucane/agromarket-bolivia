'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MapPin, Droplets, Sun, CloudRain, AlertCircle, Leaf, TrendingUp, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';

const SOIL_TYPES = ['ARCILLOSO','FRANCO','ARENOSO','LIMOSO'];
const WATER_SOURCES = ['LLUVIA','RIEGO','AMBOS'];
const EXPENSE_CATS = ['SEEDS','FERTILIZER','PESTICIDE','LABOR','MACHINERY','IRRIGATION','PACKAGING','TRANSPORT','CERTIFICATION','OTHER'];

function WeatherWidget({ weather }: { weather: any }) {
  if (!weather?.list) return null;
  const current = weather.list[0];
  const icon = `https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`;
  const days = weather.list.filter((_: any, i: number) => i % 8 === 0).slice(0, 5);

  return (
    <div className="bg-gradient-to-br from-am-green-700 to-am-green-500 text-white rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-white/70 text-sm">Clima en tu finca</p>
          <p className="text-3xl font-bold">{Math.round(current.main.temp)}°C</p>
          <p className="text-white/80 capitalize">{current.weather[0].description}</p>
        </div>
        <img src={icon} alt="" className="w-16 h-16" />
      </div>
      <div className="flex gap-3">
        <div className="flex items-center gap-1 text-sm text-white/80"><Droplets className="w-4 h-4" />{current.main.humidity}%</div>
        <div className="flex items-center gap-1 text-sm text-white/80"><Sun className="w-4 h-4" />{Math.round(current.wind.speed)} m/s</div>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-1">
        {days.map((d: any) => (
          <div key={d.dt} className="text-center">
            <p className="text-xs text-white/60">{new Date(d.dt * 1000).toLocaleDateString('es-BO', { weekday: 'short' })}</p>
            <p className="text-sm font-medium">{Math.round(d.main.temp)}°</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewFarmModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', totalHectares: '', locationDept: '', locationMuni: '', soilType: 'FRANCO', waterSource: 'LLUVIA' });

  const mutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/farms', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['farms'] }); onCreated(); },
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h3 className="font-semibold text-lg mb-5">Registrar nueva finca</h3>
        <div className="space-y-4">
          {[
            { key: 'name', label: 'Nombre de la finca', placeholder: 'Ej: Finca El Palmar' },
            { key: 'totalHectares', label: 'Superficie (hectáreas)', placeholder: '25', type: 'number' },
            { key: 'locationDept', label: 'Departamento', placeholder: 'Santa Cruz' },
            { key: 'locationMuni', label: 'Municipio', placeholder: 'Montero' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium mb-1">{f.label}</label>
              <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder} type={f.type ?? 'text'}
                className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-am-green-500" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de suelo</label>
              <select value={form.soilType} onChange={e => setForm(p => ({ ...p, soilType: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-am-green-500">
                {SOIL_TYPES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fuente de agua</label>
              <select value={form.waterSource} onChange={e => setForm(p => ({ ...p, waterSource: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-am-green-500">
                {WATER_SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border font-medium hover:bg-muted">Cancelar</button>
          <button onClick={() => mutation.mutate({ ...form, totalHectares: Number(form.totalHectares) })}
            disabled={mutation.isPending || !form.name || !form.totalHectares}
            className="flex-[2] py-2.5 rounded-xl bg-am-green-500 text-white font-semibold hover:bg-am-green-600 disabled:opacity-60 flex items-center justify-center gap-2">
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Registrar finca
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FarmsPage() {
  const { isAuthenticated } = useAuthStore();
  const [selectedFarm, setSelectedFarm] = useState<any>(null);
  const [showNewFarm, setShowNewFarm] = useState(false);

  const { data: farms, isLoading } = useQuery({
    queryKey: ['farms'],
    queryFn: () => apiClient.get('/farms').then(r => r.data),
    enabled: isAuthenticated,
  });

  const { data: dashboard } = useQuery({
    queryKey: ['farm-dashboard', selectedFarm?.id],
    queryFn: () => apiClient.get(`/farms/${selectedFarm.id}/dashboard`).then(r => r.data),
    enabled: !!selectedFarm?.id,
  });

  const { data: weather } = useQuery({
    queryKey: ['farm-weather', selectedFarm?.id],
    queryFn: () => apiClient.get(`/farms/${selectedFarm.id}/weather`).then(r => r.data),
    enabled: !!selectedFarm?.id,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Leaf className="w-16 h-16 mx-auto text-am-green-300 mb-4" />
          <h2 className="mb-3">Inicia sesión para gestionar tus fincas</h2>
          <a href="/auth/login" className="inline-flex px-6 py-3 rounded-xl bg-am-green-500 text-white font-semibold">Ingresar</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showNewFarm && <NewFarmModal onClose={() => setShowNewFarm(false)} onCreated={() => setShowNewFarm(false)} />}

      <div className="bg-am-green-700 text-white py-6">
        <div className="page-container flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-display font-bold">Farm Manager</h1>
            <p className="text-white/70 text-sm">Gestiona tus fincas y cultivos</p>
          </div>
          <button onClick={() => setShowNewFarm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/20">
            <Plus className="w-5 h-5" /> Nueva finca
          </button>
        </div>
      </div>

      <div className="page-container py-6">
        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="skeleton h-40 rounded-xl" />)}
          </div>
        ) : farms?.length === 0 ? (
          <div className="text-center py-16">
            <Leaf className="w-16 h-16 mx-auto text-muted-foreground opacity-30 mb-4" />
            <h2 className="mb-3">No tienes fincas registradas</h2>
            <p className="text-muted-foreground mb-6">Registra tu primera finca para empezar a gestionar tus cultivos y mejorar tu score crediticio.</p>
            <button onClick={() => setShowNewFarm(true)} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-am-green-500 text-white font-semibold hover:bg-am-green-600 transition-colors">
              <Plus className="w-5 h-5" /> Registrar mi primera finca
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Farm list */}
            <div className="space-y-3">
              {farms.map((farm: any) => (
                <button key={farm.id} onClick={() => setSelectedFarm(farm)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedFarm?.id === farm.id ? 'border-am-green-500 bg-am-green-50' : 'border-border bg-white hover:border-am-green-200'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{farm.name}</h3>
                    {farm._count?.alerts > 0 && (
                      <span className="w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">{farm._count.alerts}</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{farm.locationMuni}, {farm.locationDept}</p>
                    <p className="flex items-center gap-1"><Leaf className="w-3.5 h-3.5" />{Number(farm.totalHectares)} ha · {farm._count?.cycles ?? 0} ciclos</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Farm detail */}
            <div className="lg:col-span-2 space-y-4">
              {selectedFarm ? (
                <>
                  {weather && typeof weather === 'object' && weather.list && <WeatherWidget weather={weather} />}
                  {dashboard && (
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'Ciclos activos', value: dashboard.activeCycles, icon: Leaf, color: 'text-am-green-600' },
                        { label: 'Gastos totales', value: `Bs. ${Number(dashboard.totalExpenses).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: 'text-am-amber-600' },
                        { label: 'Alertas activas', value: dashboard.alerts?.length ?? 0, icon: AlertCircle, color: 'text-red-500' },
                      ].map(stat => (
                        <div key={stat.label} className="bg-white rounded-xl border border-border p-4 text-center">
                          <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="bg-white rounded-xl border border-border p-5 text-center text-muted-foreground text-sm py-8">
                    <p>Selecciona opciones del menú para gestionar cultivos, registrar gastos y ver el historial de rendimiento.</p>
                    <div className="flex gap-3 justify-center mt-4">
                      <a href={`/farms/${selectedFarm.id}/cycles/new`} className="px-4 py-2 rounded-lg bg-am-green-500 text-white text-sm font-medium hover:bg-am-green-600 transition-colors">+ Nuevo ciclo</a>
                      <a href={`/farms/${selectedFarm.id}/expenses`} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Registrar gasto</a>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-xl border border-border p-12 text-center text-muted-foreground">
                  <Leaf className="w-12 h-12 mx-auto opacity-20 mb-3" />
                  <p>Selecciona una finca para ver su información</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
