'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus, MapPin, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '@/lib/api-client';

const DEPARTMENTS = ['Todos','Santa Cruz','La Paz','Cochabamba','Oruro','Potosí','Chuquisaca','Tarija','Beni','Pando'];

function PriceTrend({ current, previous }: { current: number; previous?: number }) {
  if (!previous) return <Minus className="w-4 h-4 text-muted-foreground" />;
  const pct = ((current - previous) / previous) * 100;
  if (pct > 1) return <div className="flex items-center gap-1 text-green-600 text-xs font-medium"><TrendingUp className="w-4 h-4" />{pct.toFixed(1)}%</div>;
  if (pct < -1) return <div className="flex items-center gap-1 text-red-500 text-xs font-medium"><TrendingDown className="w-4 h-4" />{Math.abs(pct).toFixed(1)}%</div>;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

export default function PricesPage() {
  const [dept, setDept] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const { data: prices, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['prices', dept],
    queryFn: () => apiClient.get(`/marketplace/prices${dept ? `?department=${dept}` : ''}`).then(r => r.data),
    refetchInterval: 1000 * 60 * 5, // auto-refresh every 5 min
  });

  const { data: history } = useQuery({
    queryKey: ['price-history', selectedProduct?.categoryId],
    queryFn: () => apiClient.get(`/marketplace/prices/history/${selectedProduct.categoryId}?days=30`).then(r => r.data),
    enabled: !!selectedProduct?.categoryId,
  });

  const chartData = history?.map((h: any) => ({
    date: new Date(h.recordedAt).toLocaleDateString('es-BO', { month: 'short', day: 'numeric' }),
    avg: Number(h.avgPrice),
    min: Number(h.minPrice),
    max: Number(h.maxPrice),
  })) ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-am-green-700 text-white py-8">
        <div className="page-container">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-white text-2xl font-display font-bold">Precios de Referencia</h1>
              <p className="text-white/70 text-sm mt-1">Precios actualizados del mercado agropecuario boliviano</p>
            </div>
            <button onClick={() => refetch()} className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 transition-colors ${isFetching ? 'opacity-60' : ''}`}>
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>

          {/* Department filter */}
          <div className="flex flex-wrap gap-2">
            {DEPARTMENTS.map(d => (
              <button
                key={d}
                onClick={() => setDept(d === 'Todos' ? '' : d)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  (d === 'Todos' && !dept) || d === dept
                    ? 'bg-white text-am-green-700'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="page-container py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Price table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold">Precios actuales</h3>
                <p className="text-xs text-muted-foreground">Actualizado hace 5 min</p>
              </div>
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="skeleton h-4 w-32 rounded" />
                      <div className="skeleton h-4 w-20 rounded" />
                      <div className="skeleton h-4 w-20 rounded" />
                    </div>
                  ))}
                </div>
              ) : !prices?.length ? (
                <div className="text-center py-16 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No hay datos de precios disponibles</p>
                  <p className="text-sm mt-1">Los precios se agregan automáticamente de las publicaciones</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Producto</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Departamento</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mín</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Promedio</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Máx</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tendencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {prices?.map((p: any) => (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedProduct(p)}
                        className={`hover:bg-muted/30 cursor-pointer transition-colors ${selectedProduct?.id === p.id ? 'bg-am-green-50' : ''}`}
                      >
                        <td className="py-3 px-4 font-medium">{p.productName || p.category?.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.department ?? 'Nacional'}</span>
                        </td>
                        <td className="py-3 px-4 text-right">Bs. {Number(p.minPrice).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-semibold text-am-green-700">Bs. {Number(p.avgPrice).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right">Bs. {Number(p.maxPrice).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right"><PriceTrend current={Number(p.avgPrice)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Price chart */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-border p-5">
              {selectedProduct ? (
                <>
                  <h3 className="font-semibold mb-1">{selectedProduct.productName || selectedProduct.category?.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4">Historial 30 días — {selectedProduct.department ?? 'Nacional'}</p>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: any) => `Bs. ${Number(v).toFixed(2)}`} />
                        <Line type="monotone" dataKey="avg" stroke="#2D7D2A" strokeWidth={2} dot={false} name="Promedio" />
                        <Line type="monotone" dataKey="min" stroke="#F5A623" strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="Mínimo" />
                        <Line type="monotone" dataKey="max" stroke="#1A5C38" strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="Máximo" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sin datos históricos</div>
                  )}
                </>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                  <TrendingUp className="w-8 h-8 opacity-30" />
                  <p>Selecciona un producto para ver su historial de precios</p>
                </div>
              )}
            </div>

            {/* Info card */}
            <div className="bg-am-green-50 rounded-xl border border-am-green-100 p-4">
              <h4 className="font-semibold text-am-green-800 text-sm mb-2">¿Cómo se calculan?</h4>
              <p className="text-xs text-am-green-700 leading-relaxed">
                Los precios se agregan automáticamente de las publicaciones activas en el marketplace. Se actualiza cada 6 horas con mínimo 3 muestras por producto y departamento.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
