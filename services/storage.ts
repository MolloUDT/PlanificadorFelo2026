import { AppData, CourseModule, CalendarEvent, Teacher, CommunicationMessage, CycleId, EventType } from '../types';
import { INITIAL_DATA } from '../constants';
import { supabase } from '../lib/supabase';

export const saveData = async (data: AppData): Promise<{success: boolean, error?: any}> => {
  try {
    console.log("Iniciando sincronización profunda con Supabase...");

    // 1. Preparar IDs
    const teacherIds = data.teachers.map(t => t.id);
    const moduleIds = data.modules.map(m => m.id);
    const eventIds = data.events.map(e => e.id);
    const commIds = (data.communications || []).map(c => c.id);

    // 2. Upserts (Crear o Actualizar) - El orden no importa tanto aquí
    const { error: tError } = await supabase.from('teachers').upsert(
      data.teachers.map(t => ({ 
        id: t.id, name: t.name, first_name: t.firstName, last_name: t.lastName,
        password: t.password, photo_url: t.photoUrl, email: t.email, phone: t.phone
      }))
    );
    if (tError) throw tError;

    const { error: mError } = await supabase.from('course_modules').upsert(
      data.modules.map(m => ({
        id: m.id, name: m.name, cycle_id: m.cycleId, teacher_name: m.teacherName,
        year: m.year, pdf_url: m.pdfUrl, evaluation_url: m.evaluationUrl,
        teacher_photo_url: m.teacherPhotoUrl, teacher_email: m.teacherEmail, teacher_phone: m.teacherPhone
      }))
    );
    if (mError) throw mError;

    const { error: eError } = await supabase.from('calendar_events').upsert(
      data.events.map(e => ({
        id: e.id, module_id: (e.moduleId === 'GLOBAL' || !e.moduleId) ? null : e.moduleId,
        type: e.type, title: e.title, start_date: e.startDate, end_date: e.endDate,
        description: e.description, location: e.location, time: e.time
      }))
    );
    if (eError) throw eError;

    if (data.communications && data.communications.length > 0) {
      const { error: cError } = await supabase.from('communications').upsert(
        data.communications.map(c => ({
          id: c.id, sender_id: c.senderId, receiver_id: c.receiverId,
          timestamp: c.timestamp, content: c.content, is_read: c.isRead, parent_id: c.parentId
        }))
      );
      if (cError) throw cError;
    }

    const { error: sConfigError } = await supabase.from('app_settings').upsert({
        id: 1, center_logo: data.centerLogo, admin_name: data.adminConfig?.name,
        admin_password: data.adminConfig?.password, admin_photo_url: data.adminConfig?.photoUrl
    });
    if (sConfigError) throw sConfigError;

    // 3. Deletions (Eliminar lo que ya no existe) - ORDEN CRÍTICO PARA CLAVES FORÁNEAS
    // Primero eliminamos comunicaciones porque dependen de docentes
    if (commIds.length > 0) {
      await supabase.from('communications').delete().not('id', 'in', commIds);
    } else if (data.communications) {
      await supabase.from('communications').delete().neq('id', 'NONE');
    }

    // Luego eventos y módulos
    if (eventIds.length > 0) {
      await supabase.from('calendar_events').delete().not('id', 'in', eventIds);
    } else {
      await supabase.from('calendar_events').delete().neq('id', 'NONE');
    }

    if (moduleIds.length > 0) {
      await supabase.from('course_modules').delete().not('id', 'in', moduleIds);
    } else {
      await supabase.from('course_modules').delete().neq('id', 'NONE');
    }

    // Por último los docentes
    if (teacherIds.length > 0) {
      const { error: tDelError } = await supabase.from('teachers').delete().not('id', 'in', teacherIds);
      if (tDelError) {
        console.warn("Posible conflicto al eliminar docentes (registros relacionados):", tDelError);
        // Si falla por integridad, al menos el resto se guardó
      }
    } else {
      await supabase.from('teachers').delete().neq('id', 'NONE');
    }
    
    console.log("Sincronización finalizada con éxito.");
    return { success: true };
  } catch (e) {
    console.error("Fallo en la sincronización con Supabase:", e);
    return { success: false, error: e };
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
      supabase.from('app_settings').select('*').eq('id', 1).single()
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
    const settings = settingsRes.data;

    // Verificación de base de datos vacía / inicialización
    // Solo usamos INITIAL_DATA si no hay absolutamente nada en la DB (ni docentes, ni módulos, ni configuración)
    if (teachers.length === 0 && modules.length === 0 && !settings) {
      console.warn("Base de datos vacía o no inicializada. Usando INITIAL_DATA.");
      return INITIAL_DATA;
    }

    const centerLogo = settings?.center_logo || undefined;
    const adminConfig = settings ? {
        name: settings.admin_name || INITIAL_DATA.adminConfig?.name || 'admin',
        password: settings.admin_password || INITIAL_DATA.adminConfig?.password,
        photoUrl: settings.admin_photo_url
    } : INITIAL_DATA.adminConfig;

    console.log(`Carga exitosa: ${teachers.length} docentes, ${modules.length} módulos, ${events.length} eventos.`);

    return {
      centerLogo,
      adminConfig,
      academicYear: INITIAL_DATA.academicYear,
      teachers: teachers.map(t => ({
        id: t.id,
        name: t.name,
        firstName: t.first_name,
        lastName: t.last_name,
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
