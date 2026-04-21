import { AppData, CycleId, EventType } from './types';

// Palette for different event types
export const EVENT_COLORS: Record<EventType, string> = {
  [EventType.UNIT]: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-700',
  [EventType.CURRICULAR]: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-700',
  [EventType.COMPLEMENTARY]: 'bg-gradient-to-r from-amber-400 to-amber-500 text-white border-amber-600',
  [EventType.EXTRACURRICULAR]: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-700',
  [EventType.EVALUATION]: 'bg-red-600 text-white border-red-800',
  [EventType.HOLIDAY]: 'bg-slate-300 text-slate-700 border-slate-400',
  [EventType.NON_DOCENT]: 'bg-slate-950 text-white border-black', // Color muy oscuro/negro
};

export const EVENT_LABELS: Record<EventType, string> = {
  [EventType.UNIT]: 'Unidad de Trabajo',
  [EventType.CURRICULAR]: 'Actividad Curricular',
  [EventType.COMPLEMENTARY]: 'Act. Complementaria',
  [EventType.EXTRACURRICULAR]: 'Act. Extraescolar',
  [EventType.EVALUATION]: 'Evaluación',
  [EventType.HOLIDAY]: 'Festivos / Libre disposición',
  [EventType.NON_DOCENT]: 'Sin docencia',
};

// Theme configuration for Admin Panel Forms
export const EVENT_THEMES: Record<EventType, { bg: string; border: string; text: string; ring: string, titleColor: string }> = {
  [EventType.UNIT]: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', ring: 'focus:ring-blue-500', titleColor: 'text-blue-700' },
  [EventType.CURRICULAR]: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', ring: 'focus:ring-emerald-500', titleColor: 'text-emerald-700' },
  [EventType.COMPLEMENTARY]: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', ring: 'focus:ring-amber-500', titleColor: 'text-amber-700' },
  [EventType.EXTRACURRICULAR]: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', ring: 'focus:ring-purple-500', titleColor: 'text-purple-700' },
  [EventType.EVALUATION]: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', ring: 'focus:ring-red-500', titleColor: 'text-red-700' },
  [EventType.HOLIDAY]: { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-800', ring: 'focus:ring-slate-500', titleColor: 'text-slate-700' },
  [EventType.NON_DOCENT]: { bg: 'bg-slate-900', border: 'border-slate-950', text: 'text-white', ring: 'focus:ring-black', titleColor: 'text-slate-100' },
};

// --- DYNAMIC DATE LOGIC ---
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth(); // 0-11

const startYear = currentMonth < 8 ? currentYear - 1 : currentYear;
const endYear = startYear + 1;

const defaultStart = `${startYear}-09-01`;
const defaultEnd = `${endYear}-06-30`;

export const DEFAULT_LOGO = "https://drive.google.com/thumbnail?id=1a_mfqngTi5-5lm33gqQWAo5UEpJfO-KD&sz=w1000";

export const INITIAL_DATA: AppData = {
  academicYear: {
    startDate: defaultStart,
    endDate: defaultEnd,
    trimesters: [
      { id: 1, name: '1º Trimestre', startDate: `${startYear}-09-11`, endDate: `${startYear}-12-22` },
      { id: 2, name: '2º Trimestre', startDate: `${endYear}-01-08`, endDate: `${endYear}-03-22` },
      { id: 3, name: '3º Trimestre', startDate: `${endYear}-04-01`, endDate: `${endYear}-06-21` }
    ],
    christmas: { startDate: `${startYear}-12-23`, endDate: `${endYear}-01-07` },
    carnival: { startDate: `${endYear}-02-12`, endDate: `${endYear}-02-18` },
    easter: { startDate: `${endYear}-03-25`, endDate: `${endYear}-03-31` }
  },
  modules: [
    { id: 'tsaf_fik', name: 'FIK: Fitness en sala de entrenamiento polivalente', cycleId: CycleId.TSAF, teacherName: 'Docente por asignar', year: 1 },
    { id: 'tsaf_acq', name: 'ACQ: Actividades básicas de acond. físico con soporte musical', cycleId: CycleId.TSAF, teacherName: 'Docente por asignar', year: 1 },
    { id: 'tsaf_vab', name: 'VAB: Valoración de la condición física e intervención en accidentes', cycleId: CycleId.TSAF, teacherName: 'Docente por asignar', year: 1 },
    { id: 'tsaf_acw', name: 'ACW: Acondicionamiento físico en el agua', cycleId: CycleId.TSAF, teacherName: 'Docente por asignar', year: 1 },
    { id: 'tsaf_itk1', name: 'ITK: Itinerario personal para la empleabilidad 1', cycleId: CycleId.TSAF, teacherName: 'Docente por asignar', year: 1 },
    { id: 'tsaf_djk', name: 'DJK: Digitalización aplicada a los sectores productivos', cycleId: CycleId.TSAF, teacherName: 'Docente por asignar', year: 1 },
    { id: 'tsaf_ikl', name: 'IKL: Inglés profesional', cycleId: CycleId.TSAF, teacherName: 'Docente por asignar', year: 1 },
    { id: 'tsaf_has', name: 'HAS: Habilidades Sociales', cycleId: CycleId.TSAF, teacherName: 'Docente por asignar', year: 2 },
    { id: 'tsaf_acx', name: 'ACX: Act. especializadas de acond. físico con soporte musical', cycleId: CycleId.TSAF, teacherName: 'Docente por asignar', year: 2 },
    { id: 'tsaf_te5', name: 'TE5: Técnicas de hidrocinesia', cycleId: CycleId.TSAF, teacherName: 'Docente por asignar', year: 2 },
    { id: 'tsaf_co4', name: 'CO4: Control postural, bienestar y mantenimiento funcional', cycleId: CycleId.TSAF, teacherName: 'Docente por asignar', year: 2 },
    { id: 'tsaf_sost', name: 'SOST: Sostenibilidad aplicada al sector productivo', cycleId: CycleId.TSAF, teacherName: 'Docente por asignar', year: 2 },
    { id: 'tsaf_itk2', name: 'ITK 2: Itinerario personal para la empleabilidad 2', cycleId: CycleId.TSAF, teacherName: 'Docente por asignar', year: 2 },
    { id: 'tsaf_pr6', name: 'PR6: Proyecto intermodular de acondicionamiento físico', cycleId: CycleId.TSAF, teacherName: 'Docente por asignar', year: 2 },
    { id: 'tsaf_optat', name: 'OPTAT: Módulo profesional optativo', cycleId: CycleId.TSAF, teacherName: 'Docente por asignar', year: 2 },
    { id: 'tseas_dnm', name: 'DNM: Dinamización grupal', cycleId: CycleId.TSEAS, teacherName: 'Docente por asignar', year: 1 },
    { id: 'tseas_vab', name: 'VAB: Valoración de la condición física e intervención en accidentes', cycleId: CycleId.TSEAS, teacherName: 'Docente por asignar', year: 1 },
    { id: 'tseas_jub', name: 'JUB: Juegos y actividades físico-recreativas y de animación turística', cycleId: CycleId.TSEAS, teacherName: 'Docente por asignar', year: 1 },
    { id: 'tseas_acp', name: 'ACP: Actividades físico-deportivas individuales', cycleId: CycleId.TSEAS, teacherName: 'Docente por asignar', year: 1 },
    { id: 'tseas_me1', name: 'ME1: Metodología de la enseñanza de actividades físico-deportivas', cycleId: CycleId.TSEAS, teacherName: 'Docente por asignar', year: 1 },
    { id: 'tseas_ikl', name: 'IKL: Inglés profesional', cycleId: CycleId.TSEAS, teacherName: 'Docente por asignar', year: 1 },
    { id: 'tseas_djk', name: 'DJK: Digitalización aplicada a los sectores productivos', cycleId: CycleId.TSEAS, teacherName: 'Docente por asignar', year: 1 },
    { id: 'tseas_itk1', name: 'ITK: Itinerario personal para la empleabilidad I', cycleId: CycleId.TSEAS, teacherName: 'Docente por asignar', year: 1 },
    { id: 'tseas_atl', name: 'ATL: Actividades de ocio y tiempo libre', cycleId: CycleId.TSEAS, teacherName: 'Docente por asignar', year: 2 },
    { id: 'tseas_pl1', name: 'PL1: Planificación de la animación sociodeportiva', cycleId: CycleId.TSEAS, teacherName: 'Docente por asignar', year: 2 },
    { id: 'tseas_aco', name: 'ACO: Actividades físico-deportivas de equipo', cycleId: CycleId.TSEAS, teacherName: 'Docente por asignar', year: 2 },
    { id: 'tseas_ac6', name: 'AC6: Actividades físico-deportivas de implementos', cycleId: CycleId.TSEAS, teacherName: 'Docente por asignar', year: 2 },
    { id: 'tseas_ac5', name: 'AC5: Actividades físico-deportivas para la inclusión social', cycleId: CycleId.TSEAS, teacherName: 'Docente por asignar', year: 2 },
    { id: 'tseas_sost', name: 'SOST: Sostenibilidad aplicada al sector productivo', cycleId: CycleId.TSEAS, teacherName: 'Docente por asignar', year: 2 },
    { id: 'tseas_itk2', name: 'ITK 2: Itinerario personal para la empleabilidad 2', cycleId: CycleId.TSEAS, teacherName: 'Docente por asignar', year: 2 },
    { id: 'tseas_pr7', name: 'PR7: Proyecto intermodular de enseñanza animación sociodeportiva', cycleId: CycleId.TSEAS, teacherName: 'Docente por asignar', year: 2 },
    { id: 'tseas_optat', name: 'OPTAT: Módulo profesional optativo', cycleId: CycleId.TSEAS, teacherName: 'Docente por asignar', year: 2 },
  ],
  events: [
    {
      id: 'e1',
      moduleId: 'tsaf_fik',
      type: EventType.UNIT,
      title: 'UT1: Intro Sala Fitness',
      startDate: `${startYear}-09-15`,
      endDate: `${startYear}-10-15`,
    },
    {
      id: 'global_christmas',
      moduleId: 'GLOBAL', 
      type: EventType.HOLIDAY,
      title: 'Vacaciones de Navidad',
      startDate: `${startYear}-12-23`,
      endDate: `${endYear}-01-07`,
    },
    {
      id: 'global_carnival',
      moduleId: 'GLOBAL', 
      type: EventType.HOLIDAY,
      title: 'Carnavales',
      startDate: `${endYear}-02-12`,
      endDate: `${endYear}-02-18`,
    },
    {
      id: 'global_easter',
      moduleId: 'GLOBAL', 
      type: EventType.HOLIDAY,
      title: 'Semana Santa',
      startDate: `${endYear}-03-25`,
      endDate: `${endYear}-03-31`,
    }
  ],
  teachers: [
    { id: 't1', name: 'Jordi Machado Morales' },
    { id: 't2', name: 'Diego Claudio Quintana Santana' },
    { id: 't3', name: 'Yanira Troya Montañez' },
    { id: 't4', name: 'Carlos Serantes Asenjo' },
    { id: 't5', name: 'Alejandro Díaz Quintana' },
    { id: 't6', name: 'Guillermo Gil Sánchez' }
  ],
  communications: [],
  adminConfig: {
    name: 'admin',
    password: 'esperanza2026',
  }
};

export const ADMIN_KEY = "felo2627";