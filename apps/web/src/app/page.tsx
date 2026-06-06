import Link from 'next/link';
import { Leaf, TrendingUp, CreditCard, Tractor, ShieldCheck, MessageCircle, ArrowRight, ChevronRight } from 'lucide-react';

const features = [
  { icon: TrendingUp, title: 'Precios en Tiempo Real', desc: 'Consulta el precio de cualquier producto agrícola en tu departamento antes de vender.', color: 'bg-am-green-100 text-am-green-700' },
  { icon: Leaf, title: 'Marketplace Directo', desc: 'Vende tu cosecha o compra insumos sin intermediarios y con pagos QR seguros.', color: 'bg-am-green-100 text-am-green-700' },
  { icon: CreditCard, title: 'Crédito Agrícola en 24h', desc: 'Scoring inteligente basado en tu historial productivo. Sin papeleos innecesarios.', color: 'bg-am-amber-50 text-am-amber-600' },
  { icon: Tractor, title: 'Alquila Maquinaria', desc: 'Accede a tractores, cosechadoras y equipos por hora o por día desde tu comunidad.', color: 'bg-am-earth-50 text-am-earth-400' },
  { icon: ShieldCheck, title: 'Trazabilidad y Certificación', desc: 'Certifica tu producción orgánica y accede a mercados premium de exportación.', color: 'bg-am-green-100 text-am-green-700' },
  { icon: MessageCircle, title: 'También por WhatsApp', desc: 'Sin app ni internet. Consulta precios y vende tu cosecha enviando un mensaje.', color: 'bg-green-50 text-green-700' },
];

const departments = ['Santa Cruz', 'La Paz', 'Cochabamba', 'Oruro', 'Potosí', 'Chuquisaca', 'Tarija', 'Beni', 'Pando'];

const stats = [
  { value: '26%', label: 'de la PEA boliviana trabaja en el campo' },
  { value: '15%', label: 'del PIB nacional representa el sector agro' },
  { value: '9', label: 'departamentos conectados en la plataforma' },
  { value: '24h', label: 'para obtener crédito agrícola aprobado' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="page-container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-display font-bold text-xl text-am-green-700">
            <div className="w-8 h-8 bg-am-green-500 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            AgroMarket Bolivia
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link>
            <Link href="/prices" className="hover:text-foreground transition-colors">Precios</Link>
            <Link href="/credit" className="hover:text-foreground transition-colors">Crédito</Link>
            <Link href="/about" className="hover:text-foreground transition-colors">Nosotros</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-am-green-700 hover:bg-am-green-50 transition-colors">
              Ingresar
            </Link>
            <Link href="/auth/register" className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-am-green-500 text-white hover:bg-am-green-600 transition-colors shadow-sm">
              Registrarme gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="hero-gradient text-white">
        <div className="page-container py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
              <span className="w-2 h-2 bg-am-amber-400 rounded-full animate-pulse-dot" />
              Plataforma Agritech #1 de Bolivia
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight mb-6">
              El campo boliviano,<br />
              <span className="text-am-amber-400">digitalizado</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl leading-relaxed">
              Vende tu cosecha al precio justo, compra insumos sin intermediarios,
              accede a crédito agrícola en 24 horas y gestiona tu finca desde el celular.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-am-amber-400 text-white font-semibold text-base hover:bg-am-amber-500 transition-colors shadow-lg">
                Empezar gratis
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/marketplace" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 text-white font-medium text-base hover:bg-white/20 transition-colors border border-white/20">
                Ver el mercado
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────────── */}
      <section className="bg-am-green-50 border-y border-am-green-100">
        <div className="page-container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.value} className="text-center">
                <p className="text-3xl font-display font-bold text-am-green-700">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────── */}
      <section className="section">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="text-am-green-700 mb-3">Todo lo que necesitas en un solo lugar</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              AgroMarket Bolivia integra todas las herramientas del productor moderno, diseñadas para funcionar también sin internet en zonas rurales.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card-hover rounded-xl border border-border p-6 bg-card">
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-display font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPARTMENTS ─────────────────────────────────────────────── */}
      <section className="section bg-muted/30">
        <div className="page-container text-center">
          <h2 className="text-am-green-700 mb-3">Activos en los 9 departamentos</h2>
          <p className="text-muted-foreground mb-8">Conectamos productores desde el altiplano hasta el oriente boliviano</p>
          <div className="flex flex-wrap justify-center gap-3">
            {departments.map((d) => (
              <Link key={d} href={`/marketplace?department=${encodeURIComponent(d)}`}
                className="px-4 py-2 rounded-full border border-am-green-200 bg-white text-am-green-700 text-sm font-medium hover:bg-am-green-50 transition-colors">
                {d}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="page-container">
          <div className="hero-gradient rounded-2xl p-8 md:p-12 text-white text-center">
            <h2 className="text-white mb-4">¿Listo para digitalizar tu finca?</h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Regístrate gratis en 2 minutos. Solo necesitas tu número de celular.
            </p>
            <Link href="/auth/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-am-amber-400 text-white font-semibold text-lg hover:bg-am-amber-500 transition-colors shadow-lg">
              Crear cuenta gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-muted/30">
        <div className="page-container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link href="/" className="flex items-center gap-2 font-display font-bold text-lg text-am-green-700 mb-3">
                <Leaf className="w-5 h-5" /> AgroMarket Bolivia
              </Link>
              <p className="text-sm text-muted-foreground">La primera plataforma agritech integrada de Bolivia.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Plataforma</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/marketplace" className="hover:text-foreground">Marketplace</Link></li>
                <li><Link href="/prices" className="hover:text-foreground">Precios</Link></li>
                <li><Link href="/credit" className="hover:text-foreground">Crédito</Link></li>
                <li><Link href="/farms" className="hover:text-foreground">Farm Manager</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">Nosotros</Link></li>
                <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contacto</Link></li>
                <li><Link href="/careers" className="hover:text-foreground">Trabaja con nosotros</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">Privacidad</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Términos</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2025 AgroMarket Bolivia. Todos los derechos reservados.</p>
            <p>Hecho con 🌾 en Bolivia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
