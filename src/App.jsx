import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { isConfigured } from './lib/supabase';
import LoginPage from './pages/LoginPage';
import QuoteEditor from './features/quotes/QuoteEditor';
import QuoteHistory from './features/quotes/QuoteHistory';
import SettingsForm from './features/settings/SettingsForm';
import { DEFAULT_SETTINGS, getSettings } from './services/settings';
import { listClients } from './services/clients';
import { listProducts } from './services/products';
import './index.css';

function Screen({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-sm text-center space-y-3 text-sm text-slate-600">{children}</div>
    </div>
  );
}

const TABS = [
  ['new', 'Nueva'],
  ['history', 'Historial'],
  ['settings', 'Ajustes'],
];

function Shell() {
  const { user, signOut } = useAuth();
  const [view, setView] = useState('new');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [editor, setEditor] = useState({ key: 0, initial: null });

  useEffect(() => {
    Promise.all([getSettings(), listClients(), listProducts()])
      .then(([s, c, p]) => {
        setSettings(s);
        setClients(c);
        setProducts(p);
      })
      .catch((e) => setLoadError(e.message))
      .finally(() => setReady(true));
  }, []);

  const rates = useMemo(
    () => ({ igv: Number(settings.igv_rate), renta: Number(settings.renta_rate) }),
    [settings.igv_rate, settings.renta_rate]
  );

  function openTab(id) {
    if (id === 'new' && view === 'new') setEditor((e) => ({ key: e.key + 1, initial: null }));
    setView(id);
  }

  function duplicate(initial) {
    setEditor((e) => ({ key: e.key + 1, initial }));
    setView('new');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between gap-2">
          <nav className="flex" aria-label="Secciones">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => openTab(id)}
                aria-current={view === id ? 'page' : undefined}
                className={`px-3 sm:px-4 min-h-12 text-sm font-medium border-b-2 transition ${
                  view === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {id === 'new' && view === 'new' ? '+ Nueva' : label}
              </button>
            ))}
          </nav>
          <button type="button" onClick={signOut} title={user?.email} className="text-xs text-slate-400 hover:text-slate-600 px-2 min-h-12">
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5">
        {!ready && <p className="text-sm text-slate-400">Cargando…</p>}
        {loadError && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">
            No se pudieron cargar tus datos: {loadError}. Si dice que el esquema no existe, agrega
            "cotizador" en Supabase → Settings → API → Exposed schemas.
          </p>
        )}
        {ready && (
          <>
            {/* El editor queda montado para no perder lo escrito al cambiar de pestaña */}
            <div hidden={view !== 'new'}>
              <QuoteEditor
                key={editor.key}
                initial={editor.initial}
                settings={settings}
                rates={rates}
                clients={clients}
                products={products}
                onClientsChange={setClients}
                onProductsChange={setProducts}
              />
            </div>
            {view === 'history' && <QuoteHistory clients={clients} onDuplicate={duplicate} />}
            {view === 'settings' && (
              <SettingsForm userId={user.id} settings={settings} onSaved={setSettings} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  const { session, isMember, signOut } = useAuth();

  if (!isConfigured) {
    return (
      <Screen>
        <p className="font-semibold text-slate-800">Falta configurar Supabase</p>
        <p>Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (ver .env.example).</p>
      </Screen>
    );
  }
  if (session === undefined) return <Screen>Cargando…</Screen>;
  if (!session) return <LoginPage />;
  if (isMember === undefined) return <Screen>Verificando acceso…</Screen>;
  if (!isMember) {
    return (
      <Screen>
        <p className="font-semibold text-slate-800">Sin acceso al cotizador</p>
        <p>Tu usuario ({session.user.email}) no está autorizado. Pide que te agreguen a la lista de miembros.</p>
        <button type="button" onClick={signOut} className="text-blue-600 font-medium min-h-11">Cerrar sesión</button>
      </Screen>
    );
  }
  return <Shell />;
}
