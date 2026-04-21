export enum CycleId {
  TSAF = 'TSAF', // Acondicionamiento Físico
  TSEAS = 'TSEAS' // Enseñanza y Animación Socio-deportiva
}

export enum EventType {
  UNIT = 'UNIT', // Unidad de Trabajo
  CURRICULAR = 'CURRICULAR', // Actividad Curricular
  COMPLEMENTARY = 'COMPLEMENTARY', // Actividad Complementaria
  EXTRACURRICULAR = 'EXTRACURRICULAR', // Actividad Extraescolar
  HOLIDAY = 'HOLIDAY', // Periodo Vacacional
  EVALUATION = 'EVALUATION', // Producto de Evaluación
  NON_DOCENT = 'NON_DOCENT' // Sin docencia (asociado a módulo)
}

export interface Teacher {
  id: string;
  name: string; // Full name for quick display: Combined firstName + lastName
  firstName?: string;
  lastName?: string;
  password?: string; 
  photoUrl?: string;
  email?: string;
  phone?: string;
}

export interface CourseModule {
  id: string;
  name: string;
  cycleId: CycleId;
  teacherName: string;
  year: number; // 1 or 2
  pdfUrl?: string; // Enlace a la Programación
  evaluationUrl?: string; // Enlace al resumen de evaluación
  // Estos campos se mantendrán temporalmente en la interfaz para compatibilidad,
  // pero los datos reales ahora vendrán del objeto Teacher
  teacherPhotoUrl?: string; 
  teacherEmail?: string;    
  teacherPhone?: string;    
}

export interface CalendarEvent {
  id: string;
  moduleId: string; // Links to a module (or 'GLOBAL' for holidays)
  type: EventType;
  title: string;
  startDate: string; // ISO Date string YYYY-MM-DD
  endDate: string;   // ISO Date string YYYY-MM-DD
  description?: string;
  location?: string; // Nuevo campo: Lugar
  time?: string;     // Nuevo campo: Hora
}

export interface Trimester {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface AcademicYearConfig {
  startDate: string;
  endDate: string;
  trimesters: Trimester[];
  christmas: DateRange; // Nuevo
  carnival: DateRange;  // Nuevo
  easter: DateRange;    // Nuevo
}

export interface CommunicationMessage {
  id: string;
  senderId: string;
  receiverId: string;
  timestamp: string; // ISO string
  content: string;
  isRead: boolean;
  parentId?: string; // Para anidamiento de respuestas
}

export interface AdminConfig {
  name: string;
  password?: string;
  photoUrl?: string;
}

export interface AppData {
  academicYear: AcademicYearConfig;
  modules: CourseModule[];
  events: CalendarEvent[];
  teachers: Teacher[];
  communications: CommunicationMessage[];
  centerLogo?: string; // Nuevo campo para el logo del centro
  adminConfig?: AdminConfig; // Configuración del Super Administrador
}

export interface UserSession {
  isAuthenticated: boolean;
  teacherId?: string;
  teacherName?: string;
}