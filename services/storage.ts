import { AppData, CourseModule, CalendarEvent, Teacher, CommunicationMessage, CycleId, EventType } from '../types';
import { INITIAL_DATA } from '../constants';
import { supabase } from '../lib/supabase';

export const saveData = async (data: AppData): Promise<void> => {
  try {
    console.log("Iniciando guardado en Supabase...");

    // 1. Guardar Docentes (Upsert)
    if (data.teachers.length > 0) {
      const { error: tError } = await supabase.from('teachers').upsert(
        data.teachers.map(t => ({ 
          id: t.id, 
          name: t.name, 
          password: t.password,
          photo_url: t.photoUrl,
          email: t.email,
          phone: t.phone
        }))
      );
      if (tError) console.error("Error upserting teachers:", tError);
    }

    // 2. Guardar Módulos
    if (data.modules.length > 0) {
      const { error: mError } = await supabase.from('course_modules').upsert(
        data.modules.map(m => ({
          id: m.id,
          name: m.name,
          cycle_id: m.cycleId,
          teacher_name: m.teacherName,
          year: m.year,
          pdf_url: m.pdfUrl,
          evaluation_url: m.evaluationUrl,
          teacher_photo_url: m.teacherPhotoUrl,
          teacher_email: m.teacherEmail,
          teacher_phone: m.teacherPhone
        }))
      );
      if (mError) console.error("Error upserting modules:", mError);
    }

    // 3. Guardar Eventos
    if (data.events.length > 0) {
       const { error: eError } = await supabase.from('calendar_events').upsert(
         data.events.map(e => ({
           id: e.id,
           module_id: (e.moduleId === 'GLOBAL' || !e.moduleId) ? null : e.moduleId,
           type: e.type,
           title: e.title,
           start_date: e.startDate,
           end_date: e.endDate,
           description: e.description,
           location: e.location,
           time: e.time
         }))
       );
       if (eError) console.error("Error upserting events:", eError);
    }

    // 4. Guardar Comunicaciones
    if (data.communications && data.communications.length > 0) {
      const { error: cError } = await supabase.from('communications').upsert(
        data.communications.map(c => ({
          id: c.id,
          sender_id: c.senderId,
          receiver_id: c.receiverId,
          timestamp: c.timestamp,
          content: c.content,
          is_read: c.isRead,
          parent_id: c.parentId
        }))
      );
      if (cError) console.error("Error upserting communications:", cError);
    }

    // 5. Guardar Configuración General (Logo)
    const { error: sConfigError } = await supabase.from('app_settings').upsert({
        id: 1,
        center_logo: data.centerLogo
    });
    if (sConfigError) console.error("Error upserting app_settings:", sConfigError);
    
    console.log("Proceso de guardado finalizado.");
  } catch (e) {
    console.error("Excepción crítica al guardar en Supabase:", e);
  }
};

export const loadData = async (): Promise<AppData> => {
  try {
    console.log("Cargando datos desde Supabase...");
    const [
      teachersRes,
      modulesRes,
      eventsRes,
      communicationsRes,
      settingsRes
    ] = await Promise.all([
      supabase.from('teachers').select('*'),
      supabase.from('course_modules').select('*'),
      supabase.from('calendar_events').select('*'),
      supabase.from('communications').select('*'),
      supabase.from('app_settings').select('center_logo').eq('id', 1).single()
    ]);

    // Registro de errores individuales si existen
    if (teachersRes.error) console.error("Supabase Error (teachers):", teachersRes.error);
    if (modulesRes.error) console.error("Supabase Error (modules):", modulesRes.error);
    if (eventsRes.error) console.error("Supabase Error (events):", eventsRes.error);
    if (communicationsRes.error) console.error("Supabase Error (communications):", communicationsRes.error);
    if (settingsRes.error && settingsRes.error.code !== 'PGRST116') {
        // Ignoramos el error PGRST116 que significa "sin resultados", lo cual es normal la primera vez
        console.error("Supabase Error (settings):", settingsRes.error);
    }

    const teachers = teachersRes.data || [];
    const modules = modulesRes.data || [];
    const events = eventsRes.data || [];
    const communications = communicationsRes.data || [];
    const centerLogo = settingsRes.data?.center_logo || undefined;

    // Verificación crítica: Si no hay teachers, es muy probable que la DB esté vacía o haya un error de conexión/RLS
    if (teachers.length === 0) {
      console.warn("No se encontraron docentes en la DB. Posible base de datos vacía. Usando INITIAL_DATA.");
      return INITIAL_DATA;
    }

    console.log(`Carga exitosa: ${teachers.length} docentes, ${modules.length} módulos, ${events.length} eventos.`);

    return {
      centerLogo,
      academicYear: INITIAL_DATA.academicYear,
      teachers: teachers.map(t => ({
        id: t.id,
        name: t.name,
        password: t.password,
        photoUrl: t.photo_url,
        email: t.email,
        phone: t.phone
      })),
      modules: modules.map(m => {
        // Enlace dinámico: Buscamos los datos del docente por su nombre
        const teacherData = teachers.find(t => t.name === m.teacher_name);
        return {
          id: m.id,
          name: m.name,
          cycleId: m.cycle_id as CycleId,
          teacherName: m.teacher_name,
          year: m.year,
          pdfUrl: m.pdf_url,
          evaluationUrl: m.evaluation_url,
          // Priorizamos los datos del objeto Teacher (perfil centralizado)
          teacherPhotoUrl: teacherData?.photo_url || m.teacher_photo_url,
          teacherEmail: teacherData?.email || m.teacher_email,
          teacherPhone: teacherData?.phone || m.teacher_phone
        };
      }),
      events: events.map(e => ({
        id: e.id,
        moduleId: e.module_id || 'GLOBAL',
        type: e.type as EventType,
        title: e.title,
        startDate: e.start_date,
        endDate: e.end_date,
        description: e.description,
        location: e.location,
        time: e.time
      })),
      communications: communications.map(c => ({
        id: c.id,
        senderId: c.sender_id,
        receiverId: c.receiver_id,
        timestamp: c.timestamp,
        content: c.content,
        isRead: c.is_read,
        parentId: c.parent_id
      }))
    };
  } catch (e) {
    console.error("Excepción crítica al cargar desde Supabase:", e);
    return INITIAL_DATA;
  }
};
