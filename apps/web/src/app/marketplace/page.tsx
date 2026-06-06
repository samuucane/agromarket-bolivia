'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Search, SlidersHorizontal, MapPin, Star, Leaf, ShieldCheck, X, ChevronDown } from 'lucide-react';
import apiClient from '@/lib/api-client';

const DEPARTMENTS = ['Santa Cruz','La Paz','Cochabamba','Oruro','Potosí','Chuquisaca','Tarija','Beni','Pando'];
const PRODUCT_TYPES = [
  { value: '', label: 'Todos' },
  { value: 'AGRICULTURAL_PRODUCT', label: '🌾 Productos Agrícolas' },
  { value: 'SUPPLY', label: '🧪 Insumos' },
  { value: 'MACHINERY', label: '🚜 Maquinaria' },
];

function ListingCard({ listing }: { listing: any }) {
  const image = listing.images?.[0]?.url;
  const sellerName = listing.seller?.producerProfile?.fullName ?? 'Productor';
  const certLevel = listing.seller?.producerProfile?.certificationLevel;

  return (
    <Link href={`/marketplace/${listing.id}`} className="product-card group block">
      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
        {image ? (
          <img src={image} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🌾</div>
        )}
        {listing.isOrganic && (
          <span className="absolute top-2 left-2 bg-am-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
            <Leaf className="w-3 h-3" /> Orgánico
          </span>
        )}
        {listing.hasCertification && (
          <span className="absolute top-2 right-2 bg-white text-am-green-700 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow">
            <ShieldCheck className="w-3 h-3" /> Certificado
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-base line-clamp-2 mb-1 group-hover:text-am-green-700 transition-colors">
          {listing.title}
        </h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
          <MapPin className="w-3 h-3" />
          {listing.locationMuni && `${listing.locationMuni}, `}{listing.locationDept ?? 'Bolivia'}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-display font-bold text-am-green-700">
              Bs. {Number(listing.pricePerUnit).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">por {listing.unit ?? 'unidad'}</p>
          </div>
          {listing.isNegotiable && (
            <span className="text-xs text-am-amber-600 font-medium bg-am-amber-50 px-2 py-1 rounded">Negociable</span>
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>{sellerName}</span>
          {certLevel && certLevel !== 'BASIC' && (
            <span className={`font-medium ${certLevel === 'PREMIUM' ? 'text-am-amber-600' : 'text-am-green-600'}`}>
              {certLevel === 'PREMIUM' ? '⭐ Premium' : certLevel === 'VERIFIED' ? '✓ Verificado' : '🌿 Orgánico'}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function ListingCardSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="aspect-[4/3] skeleton" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-8 w-1/3 rounded" />
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ productType: '', department: '', isOrganic: false, page: 1 });
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['listings', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.productType) params.set('productType', filters.productType);
      if (filters.department) params.set('department', filters.department);
      if (filters.isOrganic) params.set('isOrganic', 'true');
      params.set('page', String(filters.page));
      params.set('limit', '24');
      const res = await apiClient.get(`/marketplace/listings?${params}`);
      return res.data;
    },
  });

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['search', search],
    queryFn: async () => {
      if (!search.trim()) return null;
      const res = await apiClient.get(`/marketplace/search?q=${encodeURIComponent(search)}&limit=24`);
      return res.data;
    },
    enabled: search.trim().length > 2,
  });

  const listings = (search.trim().length > 2 ? searchData : data) ?? { data: [], meta: {} };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-am-green-700 text-white py-8">
        <div className="page-container">
          <h1 className="text-white text-2xl md:text-3xl mb-4">Marketplace AgroBolivia</h1>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar soya, quinua, semillas, tractores..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-am-amber-400"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/20"
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden sm:inline">Filtros</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      {showFilters && (
        <div className="border-b border-border bg-card py-4 animate-fade-in">
          <div className="page-container flex flex-wrap gap-4 items-center">
            {/* Product type */}
            <div className="relative">
              <select
                value={filters.productType}
                onChange={e => setFilters(f => ({ ...f, productType: e.target.value, page: 1 }))}
                className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-am-green-500"
              >
                {PRODUCT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* Department */}
            <div className="relative">
              <select
                value={filters.department}
                onChange={e => setFilters(f => ({ ...f, department: e.target.value, page: 1 }))}
                className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-am-green-500"
              >
                <option value="">Todos los departamentos</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* Organic toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isOrganic}
                onChange={e => setFilters(f => ({ ...f, isOrganic: e.target.checked, page: 1 }))}
                className="w-4 h-4 accent-am-green-500"
              />
              <span className="text-sm flex items-center gap-1"><Leaf className="w-4 h-4 text-am-green-600" /> Solo orgánicos</span>
            </label>

            {/* Clear filters */}
            {(filters.productType || filters.department || filters.isOrganic) && (
              <button
                onClick={() => setFilters({ productType: '', department: '', isOrganic: false, page: 1 })}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto"
              >
                <X className="w-4 h-4" /> Limpiar filtros
              </button>
            )}
          </div>
        </div>
      )}

      {/* Product type tabs */}
      <div className="border-b border-border">
        <div className="page-container flex gap-1 overflow-x-auto py-2">
          {PRODUCT_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setFilters(f => ({ ...f, productType: t.value, page: 1 }))}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.productType === t.value
                  ? 'bg-am-green-100 text-am-green-700'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="page-container py-6">
        {/* Result count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Cargando...' : `${listings.meta?.total ?? listings.data?.length ?? 0} publicaciones encontradas`}
          </p>
          <Link href="/marketplace/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-am-green-500 text-white text-sm font-semibold hover:bg-am-green-600 transition-colors">
            + Publicar
          </Link>
        </div>

        {/* Grid */}
        {isLoading || searchLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-2">Error al cargar publicaciones</p>
            <p className="text-sm">Verifica tu conexión e intenta nuevamente</p>
          </div>
        ) : listings.data?.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🌾</p>
            <p className="text-lg font-medium mb-2">No hay publicaciones</p>
            <p className="text-muted-foreground text-sm mb-6">Sé el primero en publicar en esta categoría</p>
            <Link href="/marketplace/new" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-am-green-500 text-white font-semibold hover:bg-am-green-600 transition-colors">
              Publicar ahora
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.data?.map((listing: any) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {listings.meta?.pages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            <button
              disabled={filters.page <= 1}
              onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
              className="px-4 py-2 rounded-lg border border-border text-sm disabled:opacity-40 hover:bg-muted transition-colors"
            >
              ← Anterior
            </button>
            <span className="px-4 py-2 text-sm text-muted-foreground">
              Pág. {filters.page} de {listings.meta.pages}
            </span>
            <button
              disabled={filters.page >= listings.meta?.pages}
              onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
              className="px-4 py-2 rounded-lg border border-border text-sm disabled:opacity-40 hover:bg-muted transition-colors"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
