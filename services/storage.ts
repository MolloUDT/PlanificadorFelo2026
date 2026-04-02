import { AppData, CourseModule, CalendarEvent, Teacher, CommunicationMessage, CycleId, EventType } from '../types';
import { INITIAL_DATA } from '../constants';
import { supabase } from '../lib/supabase';

export const saveData = async (data: AppData): Promise<void> => {
  try {
    // 1. Guardar Docentes (Upsert)
    if (data.teachers.length > 0) {
      await supabase.from('teachers').upsert(
        data.teachers.map(t => ({ id: t.id, name: t.name, password: t.password }))
      );
    }

    // 2. Guardar Módulos
    if (data.modules.length > 0) {
      await supabase.from('course_modules').upsert(
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
    }

    // 3. Guardar Eventos
    if (data.events.length > 0) {
       await supabase.from('calendar_events').upsert(
         data.events.map(e => ({
           id: e.id,
           module_id: e.moduleId === 'GLOBAL' ? null : e.moduleId,
           type: e.type,
           title: e.title,
           start_date: e.startDate,
           end_date: e.endDate,
           description: e.description,
           location: e.location,
           time: e.time
         }))
       );
    }

    // 4. Guardar Comunicaciones
    if (data.communications && data.communications.length > 0) {
      await supabase.from('communications').upsert(
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
    }
  } catch (e) {
    console.error("Failed to save data to Supabase", e);
  }
};

export const loadData = async (): Promise<AppData> => {
  try {
    const [
      teachersRes,
      modulesRes,
      eventsRes,
      communicationsRes
    ] = await Promise.all([
      supabase.from('teachers').select('*'),
      supabase.from('course_modules').select('*'),
      supabase.from('calendar_events').select('*'),
      supabase.from('communications').select('*')
    ]);

    if (teachersRes.error) {
      console.error("Supabase Error (teachers):", teachersRes.error);
    }

    const teachers = teachersRes.data;
    const modules = modulesRes.data;
    const events = eventsRes.data;
    const communications = communicationsRes.data;

    // Si hay error o no hay docentes, usamos los datos iniciales
    if (teachersRes.error || !teachers || teachers.length === 0) {
      console.log("No data found or error occurred, using INITIAL_DATA");
      return INITIAL_DATA;
    }

    return {
      academicYear: INITIAL_DATA.academicYear,
      teachers: (teachers || []).map(t => ({
        id: t.id,
        name: t.name,
        password: t.password
      })),
      modules: (modules || []).map(m => ({
        id: m.id,
        name: m.name,
        cycleId: m.cycle_id as CycleId,
        teacherName: m.teacher_name,
        year: m.year,
        pdfUrl: m.pdf_url,
        evaluationUrl: m.evaluation_url,
        teacherPhotoUrl: m.teacher_photo_url,
        teacherEmail: m.teacher_email,
        teacherPhone: m.teacher_phone
      })),
      events: (events || []).map(e => ({
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
      communications: (communications || []).map(c => ({
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
    console.error("Failed to load data from Supabase", e);
    return INITIAL_DATA;
  }
};
