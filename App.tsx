import React, { useState, useEffect } from 'react';
import { loadData, saveData } from './services/storage';
import { AppData, CycleId, Teacher } from './types';
import { ADMIN_KEY, INITIAL_DATA, DEFAULT_LOGO } from './constants';
import VerticalTimeline from './components/VerticalTimeline';
// Fix: Use named import for AdminPanel as it is exported as a named constant in its source file
import { AdminPanel, AdminTab } from './components/AdminPanel';
import { GraduationCap, Lock, Calendar, BookOpen, LogIn, ChevronRight, Activity, Dumbbell, AlertCircle, X, CheckCircle, User, Users, Megaphone, Loader2, Eye, EyeOff } from 'lucide-react';

type ViewState = 'HOME' | 'VIEW_TSAF' | 'VIEW_TSEAS' | 'LOGIN' | 'ADMIN';

// Build Version: 1.0.3 (Manual Trigger for Vercel Sync)
const App: React.FC = () => {
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<ViewState>('HOME');
  const [password, setPassword] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [typedTeacherName, setTypedTeacherName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [currentTeacherId, setCurrentTeacherId] = useState<string | null>(null);
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | boolean | null>(null);
  
  // Estado elevado para persistir la pestaña del AdminPanel
  const [adminActiveTab, setAdminActiveTab] = useState<AdminTab>('config');

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
        const remoteData = await loadData();
        setData(remoteData);
      } catch (error) {
        console.error("Error inicializando datos:", error);
        setData(INITIAL_DATA);
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const handler = setTimeout(async () => {
        setIsSyncing(true);
        const result = await saveData(data);
        setIsSyncing(false);
        
        if (!result.success) {
            console.error("Error al sincronizar con Supabase:", result.error);
            setSyncError(result.error?.message || "Error desconocido en base de datos");
        } else {
            setSyncError(null);
        }
      }, 1000); // Debounce de 1 segundo para evitar saturar Supabase

      return () => clearTimeout(handler);
    }
  }, [data, isLoading]);

  if (isLoading) {
    const isConfigMissing = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    return (
      <div className="min-h-screen bg-emerald-950 flex flex-col items-center justify-center text-white p-6 text-center">
        {isConfigMissing ? (
          <div className="max-w-md bg-red-900/20 border border-red-500/50 p-6 rounded-2xl backdrop-blur-sm">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 text-red-200">Configuración Faltante</h2>
            <p className="text-red-100/80 mb-6 text-sm">
              No se han encontrado las claves de Supabase. Por favor, ve al menú <strong>Settings</strong> y añade:
            </p>
            <ul className="text-left text-xs space-y-2 bg-black/20 p-4 rounded-lg font-mono mb-6">
              <li className="flex justify-between"><span>VITE_SUPABASE_URL</span> <span className="text-emerald-400">Faltante</span></li>
              <li className="flex justify-between"><span>VITE_SUPABASE_ANON_KEY</span> <span className="text-emerald-400">Faltante</span></li>
            </ul>
            <p className="text-xs text-red-200/50 italic">
              Una vez añadidas, refresca la página.
            </p>
          </div>
        ) : (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-emerald-400 mb-4" />
            <p className="text-emerald-100 font-medium animate-pulse">Conectando con Supabase...</p>
          </>
        )}
      </div>
    );
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // LÓGICA DE SUPERADMIN
    const adminConfig = data.adminConfig || INITIAL_DATA.adminConfig;
    const adminName = adminConfig?.name || 'admin';
    const adminPass = adminConfig?.password || 'esperanza2026';

    const isAdminNameMatch = typedTeacherName.trim() === adminName;

    if (isAdminNameMatch && password === adminPass) {
      setIsAdminLoggedIn(true);
      setCurrentTeacherId('SUPER_ADMIN');
      setAuthError(false);
      setPassword('');
      setView('ADMIN');
      return;
    }

    // LÓGICA DE DOCENTE NORMAL
    const teacher = data.teachers.find(t => t.name === typedTeacherName);
    
    if (!teacher) {
        setAuthError(true);
        return;
    }

    const isTeacherValid = teacher && (
      teacher.password 
      ? password === teacher.password 
      : password === ADMIN_KEY
    );

    if (isTeacherValid) {
      setIsAdminLoggedIn(true);
      setCurrentTeacherId(teacher.id);
      setAuthError(false);
      setPassword('');
      
      const unreadCount = (data.communications || []).filter(c => c.receiverId === teacher.id && !c.isRead).length;
      if (unreadCount > 0) {
          setShowLoginWarning(true);
      } else {
          setView('ADMIN');
      }
    } else {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
      setIsAdminLoggedIn(false);
      setCurrentTeacherId(null);
      setSelectedTeacherId('');
      setTypedTeacherName('');
      setView('HOME');
      setAdminActiveTab('config');
  }

  const handleAdminPreview = (cycleId: CycleId) => {
      if (cycleId === CycleId.TSAF) setView('VIEW_TSAF');
      else setView('VIEW_TSEAS');
  }

  const renderHome = () => (
    <div className="w-full min-h-screen md:h-screen bg-slate-50 flex flex-col relative overflow-y-auto md:overflow-hidden">
       <div className="absolute top-0 left-0 w-full h-[60vh] bg-emerald-950 z-0 rounded-bl-[100px] shadow-2xl overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-800/30 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[0%] left-[-10%] w-[400px] h-[400px] bg-teal-800/20 rounded-full blur-[80px]"></div>
       </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 w-full">
        <div className="max-w-7xl w-full flex flex-col items-center justify-start pt-8 md:pt-16 h-full">
          <div className="text-center mb-12 md:mb-24 space-y-1.5 md:space-y-2 flex-none">
            {/* LOGOTIPO AJUSTADO: Círculo más pequeño e imagen interior más grande (scale-125) */}
            <div className="inline-flex items-center justify-center w-28 h-28 md:w-36 md:h-36 bg-white rounded-full shadow-2xl mb-2 p-1 border-4 border-emerald-50/20 backdrop-blur-sm">
               <img 
                 src={data.centerLogo || DEFAULT_LOGO} 
                 alt="Logo del Centro" 
                 className="w-full h-full object-contain scale-125"
                 referrerPolicy="no-referrer"
               />
            </div>
            <h1 className="text-lg md:text-2xl font-black tracking-tight text-white drop-shadow-lg leading-tight">
              CIFP Felo Monzón Grau-Bassas
            </h1>
            <div className="h-0.5 w-16 bg-emerald-400/50 rounded-full mx-auto shadow-sm backdrop-blur-sm"></div>
            <h2 className="text-sm md:text-lg font-bold text-emerald-100">Planificación Docente</h2>
            <p className="text-emerald-200/80 font-mono font-bold tracking-widest text-[10px] uppercase">Departamento de Actividades Físicas y Deportivas</p>
          </div>

          {/* GRID AJUSTADO: p-5 para contenedores más altos */}
          <div className="grid md:grid-cols-3 gap-3 w-full max-w-4xl flex-none">
            <button onClick={() => setView('VIEW_TSAF')} className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:border-emerald-500 hover:ring-2 hover:ring-emerald-100 transition-all duration-300 flex flex-col items-start text-left shadow-lg hover:shadow-2xl hover:-translate-y-1 min-h-0">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mb-1.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors text-emerald-600"><Dumbbell className="w-4 h-4" /></div>
              <h3 className="text-sm font-bold mb-0.5 leading-tight text-slate-800 group-hover:text-emerald-700">TSAF <span className="text-[9px] font-normal opacity-70 ml-1">(acceso para el alumnado)</span></h3>
              <p className="text-[10px] text-slate-500 mb-8 leading-tight line-clamp-2">Técnico Superior en Acondicionamiento Físico. Fitness y salud.</p>
              <div className="mt-auto flex items-center text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-1.5 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors w-full justify-center">Ver Planificación <ChevronRight className="w-3 h-3 ml-1" /></div>
            </button>

            <button onClick={() => setView('VIEW_TSEAS')} className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:border-teal-500 hover:ring-2 hover:ring-teal-100 transition-all duration-300 flex flex-col items-start text-left shadow-lg hover:shadow-2xl hover:-translate-y-1 min-h-0">
              <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center mb-1.5 group-hover:bg-teal-600 group-hover:text-white transition-colors text-teal-600"><Megaphone className="w-4 h-4" /></div>
              <h3 className="text-sm font-bold mb-0.5 leading-tight text-slate-800 group-hover:text-teal-700">TSEAS <span className="text-[9px] font-normal opacity-70 ml-1">(acceso para el alumnado)</span></h3>
               <p className="text-[10px] text-slate-500 mb-8 leading-tight line-clamp-2">Técnico Superior en Enseñanza y Animación Sociodeportiva.</p>
              <div className="mt-auto flex items-center text-teal-600 font-bold text-[10px] bg-teal-50 px-2 py-1.5 rounded-lg group-hover:bg-teal-600 group-hover:text-white transition-colors w-full justify-center">Ver Planificación <ChevronRight className="w-3 h-3 ml-1" /></div>
            </button>

            <button onClick={() => setView('LOGIN')} className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-400 hover:ring-2 hover:ring-slate-100 transition-all duration-300 flex flex-col items-start text-left shadow-lg hover:shadow-2xl hover:-translate-y-1 min-h-0">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mb-1.5 group-hover:bg-slate-800 group-hover:text-white transition-colors text-slate-600"><Lock className="w-4 h-4" /></div>
              <h3 className="text-sm font-bold mb-0.5 text-slate-800 group-hover:text-slate-900">Acceso Docente</h3>
              <p className="text-[10px] text-slate-500 mb-8 leading-tight line-clamp-2">Área restringida para gestión de módulos y contenidos del curso.</p>
              <div className="mt-auto flex items-center text-slate-600 font-bold text-[10px] bg-slate-100 px-2 py-1.5 rounded-lg group-hover:bg-slate-800 group-hover:text-white transition-colors w-full justify-center">Iniciar Sesión <ChevronRight className="w-3 h-3 ml-1" /></div>
            </button>
          </div>
          
          <div className="mt-auto pb-4 text-slate-600 text-[10px] w-full text-center font-medium opacity-80 flex-none">
            © {new Date().getFullYear()} CIFP Felo Monzón Grau-Bassas | Innovación Educativa
          </div>
        </div>
      </div>
    </div>
  );

  const renderLogin = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
       <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/50 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
       <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-100/50 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>

      <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 relative z-10">
        <div className="flex justify-center mb-8">
            <div className={`p-1 rounded-full bg-emerald-50 shadow-inner border border-emerald-100 ${data.centerLogo ? 'w-24 h-24' : 'p-4'}`}>
                {data.centerLogo ? (
                    <img src={data.centerLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                    <LogIn className="w-10 h-10 text-emerald-700"/>
                )}
            </div>
        </div>
        <h2 className="text-3xl font-bold text-center mb-2 text-slate-800">Bienvenido</h2>
        <p className="text-center text-slate-500 mb-8">Identifícate y usa tu clave de docente para acceder.</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre del Docente</label>
            <div className="relative">
                <input 
                  list="teacher-names"
                  required
                  className="w-full border border-slate-300 p-4 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all text-slate-900 bg-white"
                  placeholder="Escribe o selecciona tu nombre..."
                  value={typedTeacherName}
                  onChange={(e) => setTypedTeacherName(e.target.value)}
                />
                <datalist id="teacher-names">
                   {data.teachers.map(t => <option key={t.id} value={t.name} />)}
                </datalist>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                   <User className="w-5 h-5" />
                </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Clave de Acceso</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                className="w-full border border-slate-300 p-4 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all text-slate-900 bg-white pr-14"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-emerald-600 transition-colors"
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {authError && (
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center animate-pulse gap-2">
              <AlertCircle className="w-4 h-4" /> <span>Credenciales incorrectas. Inténtalo de nuevo.</span>
            </div>
          )}
          <button type="submit" className="w-full bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-800 transition shadow-lg shadow-emerald-200">Acceder al Panel</button>
          <button type="button" onClick={() => setView('HOME')} className="w-full text-slate-500 py-2 text-sm font-medium hover:text-emerald-700 transition">← Volver al inicio</button>
        </form>
      </div>

      {showLoginWarning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-sm overflow-hidden animate-in zoom-in-95 duration-300 border border-emerald-100">
                  <div className="bg-emerald-50 p-8 flex flex-col items-center text-center border-b border-emerald-100">
                      <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mb-4 border border-emerald-100"><AlertCircle className="w-8 h-8 text-emerald-600 animate-bounce" /></div>
                      <h3 className="text-xl font-black text-emerald-900 mb-2 uppercase tracking-tight">Atención Docente</h3>
                      <p className="text-emerald-700 font-medium">Tienes mensajes pendientes en tu bandeja de comunicación.</p>
                  </div>
                  <div className="p-6 bg-white space-y-3">
                      <button onClick={() => { setView('ADMIN'); setAdminActiveTab('communication'); setShowLoginWarning(false); }} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-md"><BookOpen className="w-5 h-5" /> Ver Mensajes Ahora</button>
                      <button onClick={() => { setView('ADMIN'); setShowLoginWarning(false); }} className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition text-sm">Continuar al Panel</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );

  const renderTimelineView = (cycleId: CycleId) => {
    const title = cycleId === CycleId.TSAF ? 'T.S. en Acondicionamiento Físico' : 'T.S. en Enseñanza y Animación Sociodeportiva';
    const cycleModules = data.modules.filter(m => m.cycleId === cycleId);
    const handleBack = () => isAdminLoggedIn ? setView('ADMIN') : setView('HOME');
    
    return (
      <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
        <div className="bg-white/95 backdrop-blur-md border-b border-emerald-100 p-4 flex justify-between items-center z-50 sticky top-0 shadow-sm">
            <button onClick={handleBack} className="text-slate-600 hover:text-emerald-700 font-semibold flex items-center gap-2 hover:bg-emerald-50 px-4 py-2 rounded-lg transition-all">← {isAdminLoggedIn ? 'Volver al Panel' : 'Volver al Inicio'}</button>
            <div className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-emerald-700" /><span className="font-bold text-slate-700 hidden sm:block tracking-tight">Planificación Docente</span></div>
        </div>
        <div className="flex-1 p-4 md:p-6 overflow-hidden bg-emerald-50/30">
            <VerticalTimeline teachers={data.teachers} modules={cycleModules} events={data.events} cycleTitle={title} startDate={data.academicYear.startDate} endDate={data.academicYear.endDate} />
        </div>
      </div>
    );
  };

  switch (view) {
    case 'VIEW_TSAF': return renderTimelineView(CycleId.TSAF);
    case 'VIEW_TSEAS': return renderTimelineView(CycleId.TSEAS);
    case 'LOGIN': return renderLogin();
    case 'ADMIN': return <AdminPanel data={data} onUpdate={setData} onLogout={handleLogout} onPreview={handleAdminPreview} activeTab={adminActiveTab} onTabChange={setAdminActiveTab} currentTeacherId={currentTeacherId} isSyncing={isSyncing} syncError={syncError} />;
    default: return renderHome();
  }
};

export default App;