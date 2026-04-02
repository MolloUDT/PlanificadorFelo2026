import React, { useMemo, useState, useRef } from 'react';
import { CalendarEvent, CourseModule, EventType } from '../types';
import { EVENT_COLORS, EVENT_LABELS, INITIAL_DATA } from '../constants';
import { ZoomIn, ZoomOut, Info, Calendar as CalendarIcon, X, MapPin, Clock, FileText, ClipboardList, Link as LinkIcon, Mail, Phone, User, ArrowDownAZ, CalendarDays, TreePine, VenetianMask, Sun, MessageSquare, Users, Save, Send, Reply, Lock, ChevronDown, Eye, Filter, CalendarClock } from 'lucide-react';

interface TimelineViewProps {
  modules: CourseModule[];
  events: CalendarEvent[];
  cycleTitle: string;
  startDate: string;
  endDate: string;
}

// Configuración de niveles verticales (0 a 4) para eventos que ocupan carriles
const EVENT_LEVELS: Record<EventType, number> = {
  [EventType.UNIT]: 0,            // Nivel 1 (Arriba)
  [EventType.EVALUATION]: 1,      // Nivel 2
  [EventType.CURRICULAR]: 2,      // Nivel 3
  [EventType.COMPLEMENTARY]: 3,   // Nivel 4
  [EventType.EXTRACURRICULAR]: 4, // Nivel 5 (Abajo)
  [EventType.HOLIDAY]: 0,         // Sin nivel (full height)
  [EventType.NON_DOCENT]: 0,      // Sin nivel (full height)
};

// Orden específico para la leyenda
const LEGEND_ORDER = [
  EventType.UNIT,
  EventType.EVALUATION,
  EventType.CURRICULAR,
  EventType.COMPLEMENTARY,
  EventType.EXTRACURRICULAR,
  EventType.NON_DOCENT
];

// Etiquetas ultra-cortas específicas para la visualización en la leyenda compacta
const SHORT_LEGEND_LABELS: Record<EventType, string> = {
  [EventType.UNIT]: 'UD de Trabajo',
  [EventType.CURRICULAR]: 'Act. Curricular',
  [EventType.COMPLEMENTARY]: 'Act. Compl.',
  [EventType.EXTRACURRICULAR]: 'Act. Extra.',
  [EventType.EVALUATION]: 'Evaluación',
  [EventType.HOLIDAY]: 'Fes. / Libre disp.',
  [EventType.NON_DOCENT]: 'Sin docencia'
};

const TimelineView: React.FC<TimelineViewProps> = ({ modules, events, cycleTitle, startDate, endDate }) => {
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%, 2 = 200%, etc.
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<CourseModule | null>(null);
  const [showViewMenu, setShowViewMenu] = useState(false);
  
  // ESTADO PARA EL FILTRO
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | EventType | 'COMBO'>('ALL');
  
  // Ref para controlar el scroll del contenedor principal
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Estado para controlar errores de carga de imágenes por ID de módulo
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const storedData = localStorage.getItem('cifp_planner_data_v6');
  const trimesters = storedData ? JSON.parse(storedData).academicYear.trimesters : INITIAL_DATA.academicYear.trimesters;

  // --- STRICT DATE MATH LOGIC (UTC) ---
  const ONE_DAY_MS = 86400000;

  // FIX: Manual parsing to avoid timezone offsets on "YYYY-MM-DD"
  const getUtcTime = (dateStr: string) => {
    if (!dateStr) return 0;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return new Date(dateStr).getTime();
    const [year, month, day] = parts.map(Number);
    return Date.UTC(year, month - 1, day);
  };

  const startMs = getUtcTime(startDate);
  const endMs = getUtcTime(endDate);
  
  const totalDuration = (endMs - startMs) + ONE_DAY_MS;
  const oneDayPercent = (ONE_DAY_MS / totalDuration) * 100;

  // Aumentado el límite de zoom a 12 para permitir vistas mensuales detalladas en móviles
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 12)); 
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 1));

  // Lógica para enfocar un trimestre específico
  const handleFocusTrimester = (trimesterId: number) => {
      const trimester = trimesters.find((t: any) => t.id === trimesterId);
      if (!trimester) return;

      const tStart = getUtcTime(trimester.startDate);
      const TARGET_ZOOM = 3.1;
      
      setZoomLevel(TARGET_ZOOM);
      setShowViewMenu(false);

      setTimeout(() => {
          if (scrollContainerRef.current) {
              const startDiff = tStart - startMs;
              const startPercentage = startDiff / totalDuration;
              const scrollTarget = scrollContainerRef.current.scrollWidth * startPercentage;
              
              scrollContainerRef.current.scrollTo({
                  left: scrollTarget,
                  behavior: 'smooth'
              });
          }
      }, 350); 
  };

  // Nueva lógica INTELIGENTE para enfocar un mes con márgenes
  const handleFocusMonth = (monthStart: Date, monthEnd: Date) => {
      const ONE_WEEK_MS = ONE_DAY_MS * 7;

      // 1. Definir la ventana de visualización: [Inicio Mes - 7 días] a [Fin Mes + 7 días]
      const viewStartMs = monthStart.getTime() - ONE_WEEK_MS;
      const viewEndMs = monthEnd.getTime() + ONE_WEEK_MS;
      const viewDurationMs = viewEndMs - viewStartMs;

      // 2. Calcular el Zoom necesario para que esa ventana ocupe el 100% de la pantalla
      let targetZoom = totalDuration / viewDurationMs;
      targetZoom = Math.max(1, Math.min(targetZoom, 12));

      setZoomLevel(targetZoom);
      setShowViewMenu(false);

      // 3. Scroll al inicio de la ventana
      setTimeout(() => {
          if (scrollContainerRef.current) {
              const offsetMs = viewStartMs - startMs;
              const safeOffsetMs = Math.max(0, offsetMs);
              const percentage = safeOffsetMs / totalDuration;
              const scrollTarget = scrollContainerRef.current.scrollWidth * percentage;
              
              scrollContainerRef.current.scrollTo({
                  left: scrollTarget,
                  behavior: 'smooth'
              });
          }
      }, 350);
  };

  const handleFocusCurrentWeek = () => {
    const curr = new Date();
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.setDate(diff));
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const MARGIN_DAYS = 5;
    const viewStart = new Date(monday);
    viewStart.setDate(monday.getDate() - MARGIN_DAYS);
    const viewEnd = new Date(sunday);
    viewEnd.setDate(sunday.getDate() + MARGIN_DAYS);

    const viewDurationMs = viewEnd.getTime() - viewStart.getTime();
    let targetZoom = totalDuration / viewDurationMs;
    targetZoom = Math.max(1, Math.min(targetZoom, 12));

    setZoomLevel(targetZoom);
    setShowViewMenu(false);

    setTimeout(() => {
        if (scrollContainerRef.current) {
            const targetUtc = Date.UTC(viewStart.getFullYear(), viewStart.getMonth(), viewStart.getDate());
            const offsetMs = targetUtc - startMs;
            const safeOffsetMs = Math.max(0, offsetMs);
            const percentage = safeOffsetMs / totalDuration;
            
            scrollContainerRef.current.scrollTo({
                left: scrollContainerRef.current.scrollWidth * percentage,
                behavior: 'smooth'
            });
        }
    }, 350);
  };

  const getPosition = (dateStr: string) => {
    const currentMs = getUtcTime(dateStr);
    const diff = currentMs - startMs;
    return Math.max(0, Math.min(100, (diff / totalDuration) * 100));
  };

  const getWidth = (startStr: string, endStr: string) => {
    const s = getUtcTime(startStr);
    const e = getUtcTime(endStr);
    const duration = (e - s) + ONE_DAY_MS; 
    return (duration / totalDuration) * 100;
  };

  const getOptimizedImageUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com') && url.includes('/file/d/')) {
        const idMatch = url.match(/\/file\/d\/([^/]+)/);
        if (idMatch && idMatch[1]) {
            return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w500`;
        }
    }
    return url;
  };

  const handleImageError = (moduleId: string) => {
    setImageErrors(prev => ({ ...prev, [moduleId]: true }));
  };

  const shouldShowEvent = (type: EventType) => {
    if (type === EventType.HOLIDAY) return true;
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'COMBO') {
        return [EventType.CURRICULAR, EventType.COMPLEMENTARY, EventType.EXTRACURRICULAR, EventType.NON_DOCENT].includes(type);
    }
    return type === activeFilter;
  };

  const filterOptions = [
      { id: 'ALL', label: 'Ver todos los eventos' },
      { id: EventType.UNIT, label: 'Ver las Unidades de Trabajo' },
      { id: EventType.EVALUATION, label: 'Ver eventos de Evaluación' },
      { id: EventType.CURRICULAR, label: 'Ver las Actividades Curriculares' },
      { id: EventType.COMPLEMENTARY, label: 'Ver las Actividades Complementarias' },
      { id: EventType.EXTRACURRICULAR, label: 'Ver las Actividades Extraescolares' },
      { id: EventType.NON_DOCENT, label: 'Ver eventos Sin Docencia' },
      { id: 'COMBO', label: 'Ver combo de Curr/Compl/Extraesc' },
  ];

  const months = useMemo(() => {
    const m = [];
    const curr = new Date(startDate);
    curr.setDate(1); 
    const limit = new Date(endDate);
    
    let safety = 0;
    while (curr <= limit && safety < 100) {
        const monthStart = new Date(curr);
        const monthEnd = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);

        const isoDate = curr.toISOString().split('T')[0];
        const pos = getPosition(isoDate);

        const nextMonth = new Date(curr);
        nextMonth.setMonth(curr.getMonth() + 1);
        const nextIsoDate = nextMonth.toISOString().split('T')[0];
        const nextPos = getPosition(nextIsoDate);
        
        const rawWidth = nextPos - pos;
        const width = (pos + rawWidth) > 100 ? (100 - pos) : rawWidth;

        if (pos > -5 && pos < 105) {
            m.push({
                label: curr.toLocaleString('es-ES', { month: 'short', year: '2-digit' }),
                fullLabel: curr.toLocaleString('es-ES', { month: 'long', year: 'numeric' }),
                left: pos,
                width: width,
                startDate: monthStart,
                endDate: monthEnd
            });
        }
        curr.setMonth(curr.getMonth() + 1);
        safety++;
    }
    return m;
  }, [startDate, endDate, totalDuration]);

  const days = useMemo(() => {
    if (zoomLevel < 2.0) return [];
    const d = [];
    const initials = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    let currMs = startMs;
    while (currMs <= endMs) {
        const dateObj = new Date(currMs);
        const dayNum = dateObj.getUTCDate();
        const dayOfWeek = dateObj.getUTCDay();
        const diff = currMs - startMs;
        const pos = (diff / totalDuration) * 100;

        if (pos >= 0 && pos <= 100) {
            d.push({
                day: dayNum,
                initial: initials[dayOfWeek],
                left: pos,
                isWeekend: dayOfWeek === 0 || dayOfWeek === 6 
            });
        }
        currMs += ONE_DAY_MS;
    }
    return d;
  }, [startMs, endMs, totalDuration, zoomLevel]);

  const globalEvents = events.filter(e => e.moduleId === 'GLOBAL');

  const groupedModules = useMemo(() => {
      const groups = { 1: [] as CourseModule[], 2: [] as CourseModule[], others: [] as CourseModule[] };
      modules.forEach(m => {
          if (m.year === 1) groups[1].push(m);
          else if (m.year === 2) groups[2].push(m);
          else groups.others.push(m);
      });
      return groups;
  }, [modules]);

  const getTeacherNameParts = (fullName: string) => {
      const parts = fullName.trim().split(' ');
      if (parts.length === 0) return { name: '', surname: '' };
      if (parts.length === 1) return { name: parts[0], surname: '' };
      return { name: parts[0], surname: parts.slice(1).join(' ') };
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-2xl rounded-xl overflow-hidden border border-emerald-100 font-sans relative">
      {/* Header con Controles */}
      <div className="bg-emerald-950 text-white px-6 py-4 flex-none z-[100] shadow-md flex flex-col md:flex-row justify-between items-center relative overflow-visible gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="z-10 flex-1 min-w-0">
            <h2 className="text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-widest leading-tight whitespace-nowrap overflow-hidden text-ellipsis">{cycleTitle}</h2>
            <div className="text-xs text-emerald-200 font-mono mt-1 flex items-center gap-2">
                <span>{new Date(startDate).toLocaleDateString()}</span>
                <span>→</span>
                <span>{new Date(endDate).toLocaleDateString()}</span>
            </div>
        </div>

        <div className="flex items-center gap-4 z-10 shrink-0">
            {/* MENU DE FILTROS */}
            <div className="relative">
                <button 
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className={`h-9 flex items-center gap-2 text-xs font-bold px-3 rounded-lg border transition-colors ${
                        activeFilter !== 'ALL' 
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-200 shadow-[0_0_10px_rgba(52,211,153,0.5)]' 
                        : 'bg-emerald-900/50 hover:bg-emerald-800 text-emerald-100 border-emerald-800'
                    }`}
                >
                    <Filter className="w-4 h-4" />
                    Filtro
                    <ChevronDown className={`w-3 h-3 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showFilterMenu && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-emerald-100 overflow-hidden z-[120] animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-1">
                            {filterOptions.map((opt) => (
                                <button 
                                    key={opt.id}
                                    onClick={() => { setActiveFilter(opt.id as any); setShowFilterMenu(false); }}
                                    className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-between group ${
                                        activeFilter === opt.id 
                                        ? 'bg-emerald-50 text-emerald-700 font-bold' 
                                        : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                                    }`}
                                >
                                    {opt.label}
                                    {activeFilter === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* SELECTOR DE VISTAS */}
            <div className="relative">
                <button 
                    onClick={() => setShowViewMenu(!showViewMenu)}
                    className="h-9 flex items-center gap-2 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-100 text-xs font-bold px-3 rounded-lg border border-emerald-800 transition-colors"
                >
                    <Eye className="w-4 h-4" />
                    Vistas Rápidas
                    <ChevronDown className={`w-3 h-3 transition-transform ${showViewMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showViewMenu && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-emerald-100 overflow-hidden z-[120] animate-in fade-in zoom-in-95 duration-200 max-h-[400px] overflow-y-auto custom-scrollbar">
                        <div className="p-1">
                            <button 
                                onClick={() => { setZoomLevel(1); setShowViewMenu(false); }}
                                className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors flex items-center justify-between"
                            >
                                Vista general
                                {zoomLevel === 1 && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                            </button>

                            <button 
                                onClick={handleFocusCurrentWeek}
                                className="w-full text-left px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-2 mt-1 mb-1 border border-emerald-100"
                            >
                                <CalendarClock className="w-3 h-3" />
                                Semana actual
                            </button>
                            
                            <div className="h-px bg-slate-100 my-1"></div>
                            <p className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400">Trimestres</p>
                            {trimesters.map((t: any) => (
                                <button 
                                    key={t.id}
                                    onClick={() => handleFocusTrimester(t.id)}
                                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors"
                                >
                                    {t.name}
                                </button>
                            ))}

                            <div className="h-px bg-slate-100 my-1"></div>
                            <p className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400">Meses</p>
                            {months.map((m, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => handleFocusMonth(m.startDate, m.endDate)}
                                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors capitalize"
                                >
                                    {m.fullLabel}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* CONTROLES DE ZOOM */}
            <div className="h-9 flex items-center gap-1 bg-emerald-900/50 px-1 rounded-lg border border-emerald-800">
                <button 
                    onClick={handleZoomOut} 
                    disabled={zoomLevel <= 1}
                    className="w-7 h-7 flex items-center justify-center hover:bg-emerald-800 rounded disabled:opacity-30 transition text-emerald-100"
                    title="Reducir Zoom"
                >
                    <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono w-10 text-center text-emerald-100">{Math.round(zoomLevel * 100)}%</span>
                <button 
                    onClick={handleZoomIn} 
                    disabled={zoomLevel >= 12}
                    className="w-7 h-7 flex items-center justify-center hover:bg-emerald-800 rounded disabled:opacity-30 transition text-emerald-100"
                    title="Aumentar Zoom"
                >
                    <ZoomIn className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>

       {/* LEYENDA COMPACTA */}
       <div className="flex-none bg-white border-b border-emerald-100 py-1.5 px-2 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] z-40 relative">
         <div className="flex flex-nowrap justify-center items-center gap-x-2 sm:gap-x-4 w-full overflow-hidden px-1">
            {LEGEND_ORDER.map((type) => (
                <div key={type} className="flex items-center gap-1 shrink-0">
                  <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm shadow-sm border border-black/10 ${EVENT_COLORS[type]}`}></div>
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] text-slate-700 font-bold uppercase tracking-tight whitespace-nowrap leading-none">
                    {SHORT_LEGEND_LABELS[type]}
                  </span>
                </div>
            ))}
            <div className="flex items-center gap-1 border-l pl-2 sm:pl-3 border-slate-300 ml-1 shrink-0">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm border border-slate-400 bg-slate-200 relative overflow-hidden shadow-sm" style={{backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.4), rgba(255,255,255,0.4) 2px, transparent 2px, transparent 4px)'}}></div>
                <span className="text-[8px] sm:text-[9px] md:text-[10px] text-slate-700 font-bold uppercase tracking-tight whitespace-nowrap leading-none">
                    {SHORT_LEGEND_LABELS[EventType.HOLIDAY]}
                </span>
            </div>
         </div>
      </div>

      {/* Contenedor Principal con Scroll */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-auto relative bg-slate-50/50 custom-scrollbar scroll-smooth"
      >
        <div 
            className="min-h-full flex flex-col relative"
            style={{ minWidth: `${100 * zoomLevel}%`, transition: 'min-width 300ms ease-in-out' }}
        >
            
            {/* CABECERA TIMELINE */}
            <div className="bg-white/95 backdrop-blur-md border-b border-emerald-200 sticky top-0 z-50 flex flex-col shadow-md">
                <div className="h-8 relative border-b border-emerald-100 flex">
                    <div className="w-64 sticky left-0 bg-emerald-50 border-r border-emerald-200 z-50 shrink-0 h-full"></div>
                    <div className="flex-1 relative">
                        {trimesters.map((t: any) => {
                             const start = getPosition(t.startDate);
                             const width = getWidth(t.startDate, t.endDate);
                             if (width <= 0) return null;
                             let bgClass = t.id === 1 ? 'bg-rose-200' : t.id === 2 ? 'bg-amber-200' : 'bg-emerald-200';
                             let textClass = t.id === 1 ? 'text-rose-900' : t.id === 2 ? 'text-amber-900' : 'text-emerald-900';

                             return (
                                <div 
                                    key={t.id}
                                    className={`absolute top-0 bottom-0 border-r border-white/50 px-1 flex items-center ${bgClass} ${textClass}`}
                                    style={{ left: `${start}%`, width: `${width}%` }}
                                >
                                    <span className="sticky left-[260px] font-bold text-xs uppercase tracking-widest whitespace-nowrap pl-2 block">
                                        Trimestre {t.id}
                                    </span>
                                </div>
                             );
                        })}
                    </div>
                </div>

                <div className="h-8 relative border-b border-slate-100 flex bg-white">
                     <div className="w-64 sticky left-0 bg-white border-r border-emerald-200 flex items-center justify-center z-50 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.05)] text-xs font-bold text-emerald-900 uppercase tracking-wider shrink-0">
                        Módulos
                    </div>
                    <div className="flex-1 relative">
                        {months.map((month, idx) => (
                            <div 
                                key={idx}
                                className={`absolute top-0 bottom-0 border-l border-slate-100 text-xs font-bold text-slate-700 pl-2 pt-2 uppercase tracking-wider whitespace-nowrap ${idx % 2 === 0 ? 'bg-slate-200/60' : 'bg-white'}`}
                                style={{ left: `${month.left}%`, width: `${month.width}%` }}
                            >
                                {zoomLevel > 1.5 ? month.fullLabel : month.label}
                            </div>
                        ))}
                    </div>
                </div>

                {zoomLevel >= 2.0 && (
                    <div className="h-8 relative border-b border-slate-100 flex bg-slate-50/50">
                        <div className="w-64 sticky left-0 bg-white border-r border-slate-200 z-50 shrink-0"></div>
                        <div className="flex-1 relative">
                             {days.map((d, idx) => (
                                <div
                                    key={idx}
                                    className={`absolute top-0 bottom-0 border-l border-slate-200 text-[10px] font-semibold flex flex-col items-center justify-center leading-none ${d.isWeekend ? 'text-red-500' : 'text-slate-600'}`}
                                    style={{ left: `${d.left}%`, width: `${oneDayPercent}%` }}
                                >
                                    {zoomLevel > 2.8 && (
                                        <>
                                            <span>{d.day}</span>
                                            <span className="text-[8px] opacity-60 font-normal mt-[1px]">{d.initial}</span>
                                        </>
                                    )}
                                </div>
                             ))}
                        </div>
                    </div>
                )}
            </div>

            {/* CUERPO (Grid) */}
            <div className="flex-1 relative min-h-[500px] pb-32">
                <div className="absolute inset-0 z-0 pointer-events-none flex">
                    <div className="w-64 shrink-0 bg-transparent"></div>
                    <div className="flex-1 relative h-full">
                        {months.map((month, idx) => (
                            <div key={`guide-m-${idx}`} className={`absolute top-0 bottom-0 border-l border-slate-300/30 ${idx % 2 === 0 ? 'bg-slate-200/40' : 'bg-transparent'}`} style={{ left: `${month.left}%`, width: `${month.width}%` }} />
                        ))}
                        {zoomLevel >= 2.0 && days.map((d, idx) => (
                            <div key={`guide-d-${idx}`} className={`absolute top-0 bottom-0 border-l ${d.isWeekend ? 'border-red-100/30 bg-red-50/10' : 'border-slate-100/50'}`} style={{ left: `${d.left}%` }} />
                        ))}
                    </div>
                </div>

                {[1, 2, 'others'].map((yearKey) => {
                    const groupModules = groupedModules[yearKey as 1 | 2 | 'others'];
                    if (groupModules.length === 0) return null;
                    return (
                        <React.Fragment key={yearKey}>
                            {yearKey !== 'others' && (
                                <div className="flex h-10 bg-slate-100 border-b border-slate-200 sticky z-20">
                                    <div className="w-64 sticky left-0 bg-slate-100 border-r border-emerald-200 flex items-center px-4 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.05)] z-50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">{yearKey}º</div>
                                            <span className="font-bold text-slate-600 text-xs uppercase tracking-widest">Curso</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-slate-100/50"></div>
                                </div>
                            )}

                            {groupModules.map((module) => {
                                const moduleEvents = events.filter(e => e.moduleId === module.id);
                                const separatorIndex = module.name.indexOf(':');
                                const hasSeparator = separatorIndex !== -1;
                                const modCode = hasSeparator ? module.name.slice(0, separatorIndex + 1) : module.name;
                                const modName = hasSeparator ? module.name.slice(separatorIndex + 1) : '';
                                const optimizedAvatarUrl = getOptimizedImageUrl(module.teacherPhotoUrl || '');
                                const hasImageError = imageErrors[module.id];
                                const showAvatar = module.teacherPhotoUrl && !hasImageError;
                                const visibleModuleEvents = moduleEvents.filter(e => shouldShowEvent(e.type));

                                return (
                                    <div key={module.id} className={`flex border-b border-slate-200 h-28 relative z-10 group transition-colors ${module.year === 1 ? 'bg-blue-50/40 hover:bg-blue-100/50' : 'bg-emerald-50/40 hover:bg-emerald-100/50'}`}>
                                        <div className={`w-64 sticky left-0 backdrop-blur-sm border-r flex flex-col justify-center px-4 py-2 z-30 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.05)] shrink-0 ${module.year === 1 ? 'bg-blue-50/95 border-blue-100' : 'bg-emerald-50/95 border-emerald-100'}`}>
                                            <h3 className="text-[11px] leading-tight line-clamp-3" title={module.name}>
                                                 <span className="font-black text-slate-900">{modCode}</span>
                                                 <span className={`font-bold ${module.year === 1 ? 'text-blue-700' : 'text-emerald-700'}`}>{modName}</span>
                                            </h3>
                                            <div className="mt-1 flex items-center gap-2 cursor-pointer group/teacher hover:bg-white/40 p-1 -ml-1 rounded transition-colors" onClick={() => setViewingTeacher(module)} title="Ver tarjeta del docente">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors overflow-hidden ${module.year === 1 ? 'bg-blue-100 text-blue-700 group-hover/teacher:bg-blue-200' : 'bg-emerald-100 text-emerald-700 group-hover/teacher:bg-emerald-200'}`}>
                                                    {showAvatar ? <img src={optimizedAvatarUrl} alt="" className="w-full h-full object-cover" onError={() => handleImageError(module.id)} /> : module.teacherName.charAt(0)}
                                                </div>
                                                <span className={`text-xs font-medium truncate underline-offset-2 transition-colors ${module.teacherName === 'Docente por asignar' ? 'text-red-600 font-bold decoration-red-300' : (module.year === 1 ? 'text-blue-500 group-hover/teacher:text-blue-800 decoration-blue-300' : 'text-emerald-500 group-hover/teacher:text-emerald-800 decoration-emerald-300')}`}>{module.teacherName}</span>
                                            </div>
                                            <div className="mt-1 pt-1 border-t border-black/5 flex items-center gap-3">
                                                <a href={module.pdfUrl || '#'} target={module.pdfUrl ? "_blank" : undefined} rel="noopener noreferrer" className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded transition-colors ${module.pdfUrl ? 'bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer border border-red-100' : 'bg-white/40 text-slate-300 cursor-default border border-black/5'}`} title={module.pdfUrl ? "Ver Programación (PDF)" : "Programación no disponible"} onClick={(e) => !module.pdfUrl && e.preventDefault()}><FileText size={14} /></a>
                                                <a href={module.evaluationUrl || '#'} target={module.evaluationUrl ? "_blank" : undefined} rel="noopener noreferrer" className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded transition-colors ${module.evaluationUrl ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer border border-blue-100' : 'bg-white/40 text-slate-300 cursor-default border border-black/5'}`} title={module.evaluationUrl ? "Ver Sistema de Evaluación" : "Evaluación no disponible"} onClick={(e) => !module.evaluationUrl && e.preventDefault()}><ClipboardList size={14} /></a>
                                            </div>
                                        </div>

                                        <div className="flex-1 relative h-full w-full">
                                            <div className="absolute inset-0 w-full h-full flex flex-col pointer-events-none">
                                                {[0, 1, 2, 3, 4].map(i => <div key={i} className="flex-1 border-b border-black/5 last:border-0"></div>)}
                                            </div>

                                            {visibleModuleEvents.map(event => {
                                                const width = getWidth(event.startDate, event.endDate);
                                                const isTiny = width < (2.5 / zoomLevel);
                                                const isFullHeight = event.type === EventType.HOLIDAY || event.type === EventType.NON_DOCENT;
                                                const levelIndex = EVENT_LEVELS[event.type] ?? 0;
                                                const topPercent = levelIndex * 20; 

                                                return (
                                                    <div
                                                        key={event.id}
                                                        onClick={() => setSelectedEvent(event)}
                                                        className={`absolute rounded-sm shadow-sm hover:shadow-xl hover:z-50 hover:scale-[1.01] transition-all duration-200 cursor-pointer flex flex-col justify-center px-1 overflow-hidden border border-white/20 ${EVENT_COLORS[event.type]} ${isFullHeight ? 'h-full z-10' : 'h-[16%] z-20'}`}
                                                        style={{
                                                            left: `${getPosition(event.startDate)}%`,
                                                            width: `${width}%`,
                                                            top: isFullHeight ? '0' : `${topPercent + 2}%`, 
                                                        }}
                                                        title={`${event.title} (${new Date(event.startDate).toLocaleDateString()} - ${new Date(event.endDate).toLocaleDateString()})`}
                                                    >
                                                        {!isTiny && <div className="font-bold text-[9px] leading-none drop-shadow-sm truncate w-full text-center">{event.title}</div>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    );
                })}

                <div className="absolute inset-0 z-[5] pointer-events-none flex">
                    <div className="w-64 shrink-0 bg-transparent"></div>
                    <div className="flex-1 relative h-full">
                        {globalEvents.map(event => (
                            <div
                                key={event.id}
                                className="absolute top-0 bottom-0 border-l border-r border-slate-300/60 bg-slate-100/95 flex justify-center pt-12 overflow-visible"
                                style={{
                                    left: `${getPosition(event.startDate)}%`,
                                    width: `${getWidth(event.startDate, event.endDate)}%`,
                                    backgroundImage: 'repeating-linear-gradient(45deg, rgba(148, 163, 184, 0.25), rgba(148, 163, 184, 0.25) 10px, transparent 10px, transparent 20px)'
                                }}
                            >
                                 <div className="bg-white shadow-md border border-slate-300 py-3 px-1.5 rounded-lg z-10 pointer-events-auto" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', height: 'fit-content' }}>
                                    <span className="text-slate-700 font-bold text-xs whitespace-nowrap uppercase tracking-wider block">{event.title}</span>
                                 </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* MODAL: TARJETA VIRTUAL DEL DOCENTE */}
      {viewingTeacher && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-sm overflow-hidden animate-in zoom-in-95 duration-300 font-sans">
                <button onClick={() => setViewingTeacher(null)} className="absolute top-3 right-3 z-20 bg-black/20 hover:bg-black/40 text-white rounded-full p-1.5 transition-colors"><X className="w-4 h-4" /></button>
                <div className="h-28 bg-gradient-to-br from-emerald-600 to-teal-800 relative"><div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px'}}></div></div>
                <div className="px-6 pb-8 relative">
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-slate-100 mx-auto -mt-12 overflow-hidden flex items-center justify-center text-3xl font-bold text-slate-300 relative z-10">
                        {viewingTeacher.teacherPhotoUrl && !imageErrors[viewingTeacher.id] ? <img src={getOptimizedImageUrl(viewingTeacher.teacherPhotoUrl)} alt={viewingTeacher.teacherName} className="w-full h-full object-cover" onError={() => handleImageError(viewingTeacher.id)} /> : <User className="w-10 h-10" />}
                    </div>
                    <div className="text-center mt-4 mb-6">
                        {(() => {
                            const { name, surname } = getTeacherNameParts(viewingTeacher.teacherName);
                            return (<><h3 className="text-2xl font-black text-slate-800 leading-tight tracking-tight">{name}</h3><p className="text-lg font-light text-slate-500 uppercase tracking-wide mt-1">{surname}</p></>);
                        })()}
                        <div className="w-12 h-1 bg-emerald-500 rounded-full mx-auto mt-4"></div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 group transition-colors hover:border-emerald-200">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform"><Mail className="w-5 h-5" /></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Corporativo</p>
                                <p className="text-sm font-medium text-slate-700 truncate">{viewingTeacher.teacherEmail ? <a href={`mailto:${viewingTeacher.teacherEmail}`} className="hover:text-emerald-600 hover:underline">{viewingTeacher.teacherEmail}</a> : <span className="text-slate-400 italic">No disponible</span>}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 group transition-colors hover:border-emerald-200">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform"><Phone className="w-5 h-5" /></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Teléfono de Contacto</p>
                                <p className="text-sm font-medium text-slate-700">{viewingTeacher.teacherPhone ? <a href={`tel:${viewingTeacher.teacherPhone}`} className="hover:text-emerald-600 hover:underline">{viewingTeacher.teacherPhone}</a> : <span className="text-slate-400 italic">No disponible</span>}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Modal de Detalles del Evento */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                <div className={`p-6 ${EVENT_COLORS[selectedEvent.type]} bg-opacity-10 border-b-0`}>
                    <div className="flex justify-between items-start">
                        <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30 text-xs font-bold uppercase tracking-wider mb-3 inline-block shadow-sm">{EVENT_LABELS[selectedEvent.type]}</div>
                        <button onClick={() => setSelectedEvent(null)} className={`hover:bg-white/20 rounded-full p-1 transition ${selectedEvent.type === EventType.HOLIDAY || selectedEvent.type === EventType.NON_DOCENT ? 'text-slate-500 hover:bg-slate-200' : 'text-white hover:bg-white/20'}`}><X className="w-5 h-5" /></button>
                    </div>
                    <h3 className={`text-2xl font-bold drop-shadow-sm leading-tight ${selectedEvent.type === EventType.HOLIDAY || selectedEvent.type === EventType.NON_DOCENT ? (selectedEvent.type === EventType.NON_DOCENT ? 'text-white' : 'text-slate-800') : 'text-white'}`}>{selectedEvent.title}</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-3"><CalendarIcon className="w-5 h-5 text-slate-400 mt-0.5" /><div><p className="text-sm font-semibold text-slate-700">Fechas</p><p className="text-slate-600">{new Date(selectedEvent.startDate).toLocaleDateString()} <span className="mx-2 text-slate-300">|</span> {new Date(selectedEvent.endDate).toLocaleDateString()}</p></div></div>
                    {(selectedEvent.time || selectedEvent.location) && (
                        <div className="grid grid-cols-2 gap-4">
                            {selectedEvent.time && <div className="flex items-start gap-3"><Clock className="w-5 h-5 text-slate-400 mt-0.5" /><div><p className="text-sm font-semibold text-slate-700">Hora</p><p className="text-slate-600">{selectedEvent.time}</p></div></div>}
                            {selectedEvent.location && <div className="flex items-start gap-3"><MapPin className="w-5 h-5 text-slate-400 mt-0.5" /><div><p className="text-sm font-semibold text-slate-700">Lugar</p><p className="text-slate-600">{selectedEvent.location}</p></div></div>}
                        </div>
                    )}
                    <div className="flex items-start gap-3"><Info className="w-5 h-5 text-slate-400 mt-0.5" /><div><p className="text-sm font-semibold text-slate-700">Descripción</p><p className="text-slate-600 text-sm leading-relaxed mt-1">{selectedEvent.description || "Sin descripción detallada."}</p></div></div>
                    {selectedEvent.moduleId !== 'GLOBAL' && (
                        <div className="mt-4 pt-4 border-t border-slate-100"><p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Módulo Asociado</p><p className="text-slate-700 font-medium">{modules.find(m => m.id === selectedEvent.moduleId)?.name || "Módulo desconocido"}</p></div>
                    )}
                </div>
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end"><button onClick={() => setSelectedEvent(null)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 transition">Cerrar</button></div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TimelineView;