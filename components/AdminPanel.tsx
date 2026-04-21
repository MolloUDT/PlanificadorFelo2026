import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { AppData, CycleId, EventType, CourseModule, CalendarEvent, Trimester, Teacher, CommunicationMessage } from '../types';
import { EVENT_LABELS, EVENT_THEMES, EVENT_COLORS, DEFAULT_LOGO } from '../constants';
import { Settings, Book, Calendar, LogOut, Plus, Trash2, CheckCircle, Edit, X, Clock, Eye, ChevronDown, ChevronUp, MapPin, AlertTriangle, AlertCircle, FileText, Link as LinkIcon, ClipboardList, Image, Mail, Phone, User, ArrowDownAZ, CalendarDays, TreePine, VenetianMask, Sun, MessageSquare, Users, Save, Send, Reply, Lock, EyeOff, Camera, Upload, RefreshCw, Palette } from 'lucide-react';

export type AdminTab = 'config' | 'team' | 'modules' | 'events' | 'communication' | 'personalization';

interface AdminPanelProps {
  data: AppData;
  onUpdate: (newData: AppData) => void;
  onLogout: () => void;
  onPreview: (cycleId: CycleId) => void;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  currentTeacherId?: string | null;
}

interface ModalConfig {
  isOpen: boolean;
  type: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
}

// --- COMPONENTE EXTERNALIZADO PARA EVITAR PÉRDIDA DE FOCO AL ESCRIBIR ---
interface MessageCardProps {
  msg: CommunicationMessage;
  isReply?: boolean;
  currentTeacherId: string | null;
  isSuperAdmin: boolean;
  teachers: Teacher[];
  communications: CommunicationMessage[];
  replyingToId: string | null;
  setReplyingToId: (id: string | null) => void;
  replyContent: string;
  setReplyContent: (val: string) => void;
  handleSendCommunication: (e: React.FormEvent, parentId?: string) => void;
  toggleMsgRead: (msgId: string) => void;
  onDeleteMessage: (msgId: string) => void;
  getRepliesForMessage: (parentId: string) => CommunicationMessage[];
}

const MessageCard: React.FC<MessageCardProps> = ({ 
  msg, 
  isReply = false, 
  currentTeacherId, 
  isSuperAdmin,
  teachers, 
  communications, 
  replyingToId, 
  setReplyingToId, 
  replyContent, 
  setReplyContent, 
  handleSendCommunication, 
  toggleMsgRead,
  onDeleteMessage,
  getRepliesForMessage
}) => {
  const sender = msg.senderId === 'SUPER_ADMIN' ? 'Administrador' : (teachers.find(t => t.id === msg.senderId)?.name || 'Desconocido');
  const receiver = msg.receiverId === 'SUPER_ADMIN' ? 'Administrador' : (teachers.find(t => t.id === msg.receiverId)?.name || 'Desconocido');
  const date = new Date(msg.timestamp);
  const formattedDate = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formattedTime = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const isReceiver = msg.receiverId === currentTeacherId;

  return (
    <div className={`bg-white border-2 rounded-2xl p-5 shadow-sm transition-all flex gap-4 ${msg.isRead ? 'border-emerald-50 bg-slate-50/30' : 'border-slate-100 hover:border-emerald-200'} ${isReply ? 'ml-8 md:ml-12 border-l-4 border-l-emerald-200 mt-2' : ''}`}>
      <div className="shrink-0 flex flex-col items-center gap-2">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-inner ${msg.isRead ? 'bg-slate-200 text-slate-400' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
          {sender.charAt(0)}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">De: <span className="text-slate-800">{sender}</span></div>
          <div className="flex items-center gap-2">
            <div className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{formattedDate} {formattedTime}</div>
            {isSuperAdmin && (
              <button 
                onClick={() => onDeleteMessage(msg.id)} 
                className="p-1 text-slate-300 hover:text-red-600 transition"
                title="Eliminar mensaje (Solo Admin)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-3">Para: <span className="text-emerald-700">{receiver}</span></div>
        <div className={`p-3 rounded-xl text-sm border ${msg.isRead ? 'bg-white/50 text-slate-400 border-slate-200 line-through italic' : 'bg-emerald-50/30 text-slate-700 border-emerald-100 font-medium'}`}>
          {msg.content}
        </div>
        
        {/* NUEVA ÁREA DE ACCIONES: Botón "Marcar como leído" y botón "Responder" */}
        <div className="mt-3 flex flex-wrap items-center gap-4">
          {isReceiver && !msg.isRead && (
            <button 
              onClick={() => toggleMsgRead(msg.id)} 
              className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition shadow-sm flex items-center gap-2"
            >
              <CheckCircle className="w-3 h-3" /> Marcar como leído
            </button>
          )}

          {msg.isRead && (
            <div className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
              <CheckCircle className="w-2.5 h-2.5" /> ATENDIDO
            </div>
          )}
          
          {!isReply && isReceiver && msg.isRead && (
            <button 
              onClick={() => {
                setReplyingToId(replyingToId === msg.id ? null : msg.id);
                setReplyContent(''); 
              }} 
              className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-rose-600 hover:text-rose-800 transition"
            >
              <Reply className="w-3 h-3" /> Responder
            </button>
          )}
        </div>

        {replyingToId === msg.id && (
          <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <textarea 
              className="w-full bg-white border border-slate-300 p-2 rounded-lg text-xs min-h-[60px] mb-2 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800" 
              placeholder={`Escribir respuesta a ${sender}...`} 
              value={replyContent} 
              onChange={e => setReplyContent(e.target.value)} 
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setReplyingToId(null)} className="px-2 py-1 text-[10px] font-bold text-slate-500">Cancelar</button>
              <button onClick={e => handleSendCommunication(e, msg.id)} className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition flex items-center gap-1"><Send className="w-2.5 h-2.5" /> Enviar</button>
            </div>
          </div>
        )}
        {!isReply && getRepliesForMessage(msg.id).map(reply => (
          <MessageCard 
            key={reply.id} 
            msg={reply} 
            isReply 
            currentTeacherId={currentTeacherId} 
            isSuperAdmin={isSuperAdmin}
            teachers={teachers} 
            communications={communications}
            replyingToId={replyingToId}
            setReplyingToId={setReplyingToId}
            replyContent={replyContent}
            setReplyContent={setReplyContent}
            handleSendCommunication={handleSendCommunication}
            toggleMsgRead={toggleMsgRead}
            onDeleteMessage={onDeleteMessage}
            getRepliesForMessage={getRepliesForMessage}
          />
        ))}
      </div>
    </div>
  );
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ data, onUpdate, onLogout, onPreview, activeTab, onTabChange, currentTeacherId }) => {
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const isSuperAdmin = currentTeacherId === 'SUPER_ADMIN';
  const currentUser = isSuperAdmin ? {
      id: 'SUPER_ADMIN',
      name: data.adminConfig?.name || 'Administrador General',
      photoUrl: data.adminConfig?.photoUrl
  } : data.teachers.find(t => t.id === currentTeacherId);
  const currentTeacherName = isSuperAdmin ? (data.adminConfig?.name || 'Administrador Principal') : (currentUser?.name || 'Invitado');

  // UI State
  const [showPreviewMenu, setShowPreviewMenu] = useState(false);
  const [expandedCommGroup, setExpandedCommGroup] = useState<string | null>(null);
  const [expandedEventGroup, setExpandedEventGroup] = useState<string | null>(null);
  
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    isOpen: false,
    type: 'danger',
    title: '',
    message: '',
    confirmText: 'Confirmar',
    onConfirm: () => {}
  });

  const previewMenuRef = useRef<HTMLDivElement>(null);
  const eventFormRef = useRef<HTMLFormElement>(null);

  // Config Form State
  const [yearStart, setYearStart] = useState(data.academicYear.startDate);
  const [yearEnd, setYearEnd] = useState(data.academicYear.endDate);
  const [trimesters, setTrimesters] = useState<Trimester[]>(data.academicYear.trimesters);
  
  const [xmasStart, setXmasStart] = useState(data.academicYear.christmas?.startDate || '');
  const [xmasEnd, setXmasEnd] = useState(data.academicYear.christmas?.endDate || '');
  const [carnivalStart, setCarnivalStart] = useState(data.academicYear.carnival?.startDate || '');
  const [carnivalEnd, setCarnivalEnd] = useState(data.academicYear.carnival?.endDate || '');
  const [easterStart, setEasterStart] = useState(data.academicYear.easter?.startDate || '');
  const [easterEnd, setEasterEnd] = useState(data.academicYear.easter?.endDate || '');

  // Modules State
  const [activeCycleTab, setActiveCycleTab] = useState<CycleId>(CycleId.TSAF);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [editModName, setEditModName] = useState('');
  const [editModTeacher, setEditModTeacher] = useState('');
  const [editModPdf, setEditModPdf] = useState('');
  const [editModEval, setEditModEval] = useState('');

  // Filtro de módulos permitidos para el docente actual (para eventos)
  const myAllowedModules = isSuperAdmin 
    ? data.modules 
    : data.modules.filter(m => m.teacherName === currentTeacherName);

  // Events State
  const hasModules = isSuperAdmin || myAllowedModules.length > 0;
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [evTitle, setEvTitle] = useState('');
  const [evType, setEvType] = useState<EventType>(hasModules ? EventType.UNIT : EventType.HOLIDAY);
  const [evStart, setEvStart] = useState('');
  const [evEnd, setEvEnd] = useState('');
  const [evModule, setEvModule] = useState<string>('');
  const [evDesc, setEvDesc] = useState('');
  const [evLocation, setEvLocation] = useState('');
  const [evTime, setEvTime] = useState('');

  // Team State
  const [newTeacherFirstName, setNewTeacherFirstName] = useState('');
  const [newTeacherLastName, setNewTeacherLastName] = useState('');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editTeacherFirstName, setEditTeacherFirstName] = useState('');
  const [editTeacherLastName, setEditTeacherLastName] = useState('');
  const [editTeacherPassword, setEditTeacherPassword] = useState('');
  const [editTeacherPhoto, setEditTeacherPhoto] = useState('');
  const [editTeacherEmail, setEditTeacherEmail] = useState('');
  const [editTeacherPhone, setEditTeacherPhone] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Communication State
  const [msgReceiverId, setMsgReceiverId] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // Personalization State
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const adminPhotoFileInputRef = useRef<HTMLInputElement>(null);
  const [isCapturingLogo, setIsCapturingLogo] = useState(false);
  const [isCapturingAdminPhoto, setIsCapturingAdminPhoto] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  
  // Draft states for personalization to allow Cancel
  const [draftLogo, setDraftLogo] = useState(data.centerLogo);
  const [draftAdminName, setDraftAdminName] = useState(data.adminConfig?.name || '');
  const [draftAdminPass, setDraftAdminPass] = useState(data.adminConfig?.password || '');
  const [draftAdminPhoto, setDraftAdminPhoto] = useState(data.adminConfig?.photoUrl || '');

  // Update drafts when data changes (e.g. on initial load)
  useEffect(() => {
    if (activeTab === 'personalization') {
      setDraftLogo(data.centerLogo);
      setDraftAdminName(data.adminConfig?.name || '');
      setDraftAdminPass(data.adminConfig?.password || '');
      setDraftAdminPhoto(data.adminConfig?.photoUrl || '');
    }
  }, [activeTab, data.centerLogo, data.adminConfig]);

  const visibleModules = data.modules.filter(m => m.cycleId === activeCycleTab);
  
  const toggleCommGroup = (key: string) => {
    setExpandedCommGroup(expandedCommGroup === key ? null : key);
  };

  // Helper para obtener apellidos para ordenar
  const getSurnamesForSorting = (teacher: Teacher) => {
    if (teacher.lastName) return teacher.lastName.toLowerCase();
    
    // Fallback para datos antiguos o sin apellidos separados
    const parts = teacher.name.trim().split(' ');
    if (parts.length <= 1) return teacher.name.toLowerCase();
    return parts.slice(1).join(' ').toLowerCase();
  };

  const sortedTeachers = useMemo(() => {
    return [...data.teachers].sort((a, b) => {
        const surnameA = getSurnamesForSorting(a);
        const surnameB = getSurnamesForSorting(b);
        return surnameA.localeCompare(surnameB, 'es', { sensitivity: 'base' });
    });
  }, [data.teachers]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
  };

  const resetEventForm = useCallback(() => {
    setEditingEventId(null); 
    setEvTitle(''); 
    const hasMod = isSuperAdmin || (myAllowedModules && myAllowedModules.length > 0);
    setEvType(hasMod ? EventType.UNIT : EventType.HOLIDAY); 
    setEvStart(''); 
    setEvEnd(''); 
    setEvModule(''); 
    setEvDesc(''); 
    setEvLocation(''); 
    setEvTime('');
  }, [isSuperAdmin, myAllowedModules]);

  const isEventFormDirty = useMemo(() => {
    if (!editingEventId) return false;
    const editingEvent = data.events.find(e => e.id === editingEventId);
    if (!editingEvent) return false;
    
    return evTitle !== editingEvent.title ||
           evType !== editingEvent.type ||
           evStart !== editingEvent.startDate ||
           evEnd !== editingEvent.endDate ||
           evModule !== editingEvent.moduleId ||
           evDesc !== (editingEvent.description || '') ||
           evLocation !== (editingEvent.location || '') ||
           evTime !== (editingEvent.time || '');
  }, [editingEventId, data.events, evTitle, evType, evStart, evEnd, evModule, evDesc, evLocation, evTime]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (previewMenuRef.current && !previewMenuRef.current.contains(event.target as Node)) {
        setShowPreviewMenu(false);
      }

      // Cancelar edición de evento al pulsar fuera (si no hay cambios)
      if (activeTab === 'events' && editingEventId && eventFormRef.current && !eventFormRef.current.contains(event.target as Node)) {
        // Ignorar si el click fue en un botón de edición del listado
        if (!(event.target as HTMLElement).closest('.event-edit-btn')) {
          if (!isEventFormDirty) {
            resetEventForm();
          }
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeTab, editingEventId, isEventFormDirty, resetEventForm]);

  const handleUpdateConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedConfig = { 
        startDate: yearStart, 
        endDate: yearEnd,
        trimesters: trimesters,
        christmas: { startDate: xmasStart, endDate: xmasEnd },
        carnival: { startDate: carnivalStart, endDate: carnivalEnd },
        easter: { startDate: easterStart, endDate: easterEnd }
    };
    let updatedEvents = [...data.events];
    const syncGlobalEvent = (id: string, title: string, start: string, end: string) => {
        const existingIndex = updatedEvents.findIndex(ev => ev.id === id);
        const eventData: CalendarEvent = {
            id, moduleId: 'GLOBAL', type: EventType.HOLIDAY, title, startDate: start, endDate: end, description: 'Periodo vacacional.'
        };
        if (existingIndex >= 0) updatedEvents[existingIndex] = eventData;
        else updatedEvents.push(eventData);
    };
    if (xmasStart && xmasEnd) syncGlobalEvent('global_christmas', 'Vacaciones de Navidad', xmasStart, xmasEnd);
    if (carnivalStart && carnivalEnd) syncGlobalEvent('global_carnival', 'Carnavales', carnivalStart, carnivalEnd);
    if (easterStart && easterEnd) syncGlobalEvent('global_easter', 'Semana Santa', easterStart, easterEnd);
    onUpdate({ ...data, academicYear: updatedConfig, events: updatedEvents });
    showNotification("Configuración actualizada");
  };

  const handleTrimesterChange = (id: number, field: keyof Trimester, value: string) => {
    setTrimesters(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const openEditModule = (module: CourseModule) => {
    setEditingModule(module);
    setEditModName(module.name);
    setEditModTeacher(module.teacherName);
    setEditModPdf(module.pdfUrl || '');
    setEditModEval(module.evaluationUrl || '');
  };

  const handleSaveModuleChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule) return;
    const updatedModules = data.modules.map(m => 
      m.id === editingModule.id ? { ...m, name: editModName, teacherName: editModTeacher, pdfUrl: editModPdf, evaluationUrl: editModEval } : m
    );
    onUpdate({ ...data, modules: updatedModules });
    showNotification("Módulo actualizado");
    setEditingModule(null);
  };

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherFirstName.trim() || !newTeacherLastName.trim()) return;
    const combinedName = `${newTeacherFirstName.trim()} ${newTeacherLastName.trim()}`;
    const newTeacher: Teacher = { 
        id: `t_${Date.now()}`, 
        name: combinedName,
        firstName: newTeacherFirstName.trim(),
        lastName: newTeacherLastName.trim()
    };
    onUpdate({ ...data, teachers: [...(data.teachers || []), newTeacher] });
    setNewTeacherFirstName('');
    setNewTeacherLastName('');
    showNotification("Profesor añadido");
  };

  const handleOpenEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setEditTeacherFirstName(teacher.firstName || teacher.name.split(' ')[0] || '');
    setEditTeacherLastName(teacher.lastName || teacher.name.split(' ').slice(1).join(' ') || '');
    setEditTeacherPassword(teacher.password || '');
    setEditTeacherPhoto(teacher.photoUrl || '');
    setEditTeacherEmail(teacher.email || '');
    setEditTeacherPhone(teacher.phone || '');
  };

  const handleSaveTeacherChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    const combinedName = `${editTeacherFirstName.trim()} ${editTeacherLastName.trim()}`;
    const updatedTeachers = data.teachers.map(t => 
      t.id === editingTeacher.id ? { 
        ...t, 
        name: combinedName,
        firstName: editTeacherFirstName.trim(),
        lastName: editTeacherLastName.trim(),
        password: editTeacherPassword,
        photoUrl: editTeacherPhoto,
        email: editTeacherEmail,
        phone: editTeacherPhone
      } : t
    );
    onUpdate({ ...data, teachers: updatedTeachers });
    showNotification("Docente actualizado");
    stopWebcam();
    setEditingTeacher(null);
  };

  const startWebcam = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400 } });
        if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = stream;
            setIsWebcamActive(true);
        }
    } catch (err) {
        showNotification("No se pudo acceder a la cámara", "error");
        console.error(err);
    }
  };

  const stopWebcam = () => {
    if (webcamVideoRef.current && webcamVideoRef.current.srcObject) {
        const stream = webcamVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        webcamVideoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  };

  const capturePhoto = () => {
    if (webcamVideoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = webcamVideoRef.current.videoWidth;
        canvas.height = webcamVideoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(webcamVideoRef.current, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            
            if (isCapturingLogo) {
                setDraftLogo(dataUrl);
                showNotification("Logotipo por cargar (pulse Guardar)");
                setIsCapturingLogo(false);
            } else if (isCapturingAdminPhoto) {
                setDraftAdminPhoto(dataUrl);
                showNotification("Foto por cargar (pulse Guardar)");
                setIsCapturingAdminPhoto(false);
            } else {
                setEditTeacherPhoto(dataUrl);
            }
            stopWebcam();
        }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) { // 2MB limit for base64 storage
            showNotification("La imagen es demasiado grande (máx 2MB)", "error");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setEditTeacherPhoto(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) {
            showNotification("La imagen es demasiado grande (máx 2MB)", "error");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setDraftLogo(reader.result as string);
            showNotification("Logotipo por cargar (pulse Guardar)");
        };
        reader.readAsDataURL(file);
    }
  };

  const handleAdminPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) {
            showNotification("La imagen es demasiado grande (máx 2MB)", "error");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setDraftAdminPhoto(reader.result as string);
            showNotification("Foto por cargar (pulse Guardar)");
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSavePersonalization = () => {
    onUpdate({
        ...data,
        centerLogo: draftLogo,
        adminConfig: {
            ...(data.adminConfig || {name: 'admin', password: 'esperanza2026'}),
            name: draftAdminName.trim(),
            password: draftAdminPass,
            photoUrl: draftAdminPhoto
        }
    });
    showNotification("Personalización guardada con éxito");
  };

  const handleCancelPersonalization = () => {
    setDraftLogo(data.centerLogo);
    setDraftAdminName(data.adminConfig?.name || '');
    setDraftAdminPass(data.adminConfig?.password || '');
    setDraftAdminPhoto(data.adminConfig?.photoUrl || '');
    showNotification("Cambios descartados");
  };

  const confirmDeleteTeacher = (id: string) => {
    const teacher = data.teachers.find(t => t.id === id);
    setModalConfig({
        isOpen: true, type: 'danger', title: '¿Eliminar profesor?', message: `Se eliminará a ${teacher?.name}.`, confirmText: 'Eliminar',
        onConfirm: () => {
            onUpdate({ ...data, teachers: data.teachers.filter(t => t.id !== id) });
            setModalConfig(p => ({...p, isOpen: false}));
            showNotification("Profesor eliminado", "error");
        }
    });
  };

  const handleSendCommunication = (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    const content = parentId ? replyContent : msgContent;
    let receiverId = msgReceiverId;
    
    if (parentId) {
        const parentMsg = data.communications.find(m => m.id === parentId);
        receiverId = parentMsg?.senderId || '';
    }

    if (!receiverId || !content.trim() || !currentTeacherId) return;

    setModalConfig({
        isOpen: true, type: 'info', title: '¿Confirmar envío?', message: 'Una vez enviado, el registro es permanente.', confirmText: 'Enviar ahora',
        onConfirm: () => {
            const newMessage: CommunicationMessage = {
                id: `msg_${Date.now()}`,
                senderId: currentTeacherId,
                receiverId: receiverId,
                timestamp: new Date().toISOString(),
                content: content.trim(),
                isRead: false,
                parentId: parentId
            };
            onUpdate({ ...data, communications: [newMessage, ...(data.communications || [])] });
            if (parentId) { setReplyContent(''); setReplyingToId(null); }
            else { setMsgContent(''); setMsgReceiverId(''); }
            setModalConfig(p => ({...p, isOpen: false}));
            showNotification("Comunicación enviada");
        }
    });
  };

  const toggleMsgRead = (msgId: string) => {
      setModalConfig({
          isOpen: true,
          type: 'warning',
          title: '¿Confirmar lectura?',
          message: 'Una vez marcado como leído, esta acción no se puede deshacer.',
          confirmText: 'Confirmar ahora',
          onConfirm: () => {
              const updatedMsgs = (data.communications || []).map(m => 
                  m.id === msgId ? { ...m, isRead: true } : m
              );
              onUpdate({ ...data, communications: updatedMsgs });
              setModalConfig(p => ({...p, isOpen: false}));
              showNotification("Mensaje marcado como leído");
          }
      });
  };

  const handleDeleteMessage = (msgId: string) => {
      setModalConfig({
          isOpen: true,
          type: 'danger',
          title: '¿Eliminar mensaje?',
          message: 'Se eliminará el mensaje y todas sus respuestas asociadas de forma permanente.',
          confirmText: 'Eliminar ahora',
          onConfirm: () => {
              const idsToRemove = new Set([msgId]);
              // Encontrar respuestas recursivamente (simplificado a un nivel para el filtro de data)
              data.communications.filter(m => m.parentId === msgId).forEach(r => idsToRemove.add(r.id));
              
              const updatedMsgs = (data.communications || []).filter(m => !idsToRemove.has(m.id));
              onUpdate({ ...data, communications: updatedMsgs });
              setModalConfig(p => ({...p, isOpen: false}));
              showNotification("Mensaje eliminado", "error");
          }
      });
  };

  const getGroupedCommunications = () => {
    const grouped: Record<string, CommunicationMessage[]> = {};
    const topLevelMessages = (data.communications || []).filter(m => !m.parentId);

    topLevelMessages.forEach(msg => {
      const date = new Date(msg.timestamp);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(msg);
    });
    
    return Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .map(key => ({
        key,
        label: new Date(key + '-02').toLocaleString('es-ES', { month: 'long', year: 'numeric' }),
        messages: grouped[key]
      }));
  };

  const getGroupedEvents = () => {
    const grouped: Record<string, CalendarEvent[]> = {};
    data.events.forEach(ev => {
      const module = ev.moduleId === 'GLOBAL' ? 'Festivos / Libre disposición' : (data.modules.find(m => m.id === ev.moduleId)?.name || 'Sin Módulo');
      if (!grouped[module]) grouped[module] = [];
      grouped[module].push(ev);
    });
    return Object.entries(grouped).sort(([a],[b]) => a.localeCompare(b));
  };

  const getRepliesForMessage = (parentId: string) => {
      return (data.communications || [])
        .filter(m => m.parentId === parentId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };


  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEventId(event.id); setEvTitle(event.title); setEvType(event.type); setEvStart(event.startDate); setEvEnd(event.endDate); setEvModule(event.moduleId); setEvDesc(event.description || ''); setEvLocation(event.location || ''); setEvTime(event.time || '');
    document.getElementById('event-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const confirmDeleteEvent = (event: CalendarEvent) => {
    setModalConfig({
      isOpen: true,
      type: 'danger',
      title: '¿Eliminar evento?',
      message: `¿Estás seguro de que deseas eliminar el evento "${event.title}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      onConfirm: () => {
        onUpdate({ ...data, events: data.events.filter(e => e.id !== event.id) });
        setModalConfig(p => ({ ...p, isOpen: false }));
        showNotification("Evento eliminado", "error");
      }
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = editingEventId || `e_${Date.now()}`;
    const eventData: CalendarEvent = { id: newId, moduleId: evModule, type: evType, title: evTitle, startDate: evStart, endDate: evEnd, description: evDesc, location: evLocation, time: evTime };
    const updatedEvents = editingEventId 
        ? data.events.map(ev => ev.id === editingEventId ? eventData : ev)
        : [...data.events, eventData];
    onUpdate({ ...data, events: updatedEvents });
    showNotification(editingEventId ? "Evento actualizado" : "Evento creado");
    resetEventForm();
  };

  const commGroups = getGroupedCommunications();
  const eventGroups = getGroupedEvents();

  const TabButton = ({ id, label, icon: Icon }: { id: AdminTab, label: string, icon: any }) => {
    const hasUnread = id === 'communication' && (data.communications || []).some(m => m.receiverId === currentTeacherId && !m.isRead);
    return (
        <button onClick={() => onTabChange(id)} className={`flex items-center gap-2 px-6 py-3 font-medium transition-all duration-200 border-b-2 relative ${activeTab === id ? 'text-emerald-700 border-emerald-700 bg-emerald-50/50' : 'text-gray-500 border-transparent hover:text-emerald-600 hover:bg-emerald-50'}`}>
            <Icon className="w-4 h-4" /> {label} {hasUnread && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse border border-white"></span>}
        </button>
    );
  };

  const canEditEvent = (ev: CalendarEvent) => {
      if (isSuperAdmin) return true;
      if (ev.moduleId === 'GLOBAL') return true;
      const mod = data.modules.find(m => m.id === ev.moduleId);
      return mod?.teacherName === currentTeacherName;
  };

  return (
    <div className="md:h-screen md:overflow-hidden min-h-screen bg-slate-50 font-sans text-slate-800 relative flex flex-col">
      {notification && <div className={`fixed top-4 right-4 z-[200] px-6 py-3 rounded-lg shadow-xl text-white font-bold animate-in slide-in-from-top-2 flex items-center gap-2 ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'}`}>{notification.message}</div>}
      
      {modalConfig.isOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-sm overflow-hidden animate-in zoom-in-95 border border-slate-200">
                  <div className={`p-6 flex flex-col items-center text-center border-b ${modalConfig.type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-white shadow-sm">
                          {modalConfig.type === 'danger' ? <Trash2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                      </div>
                      <h3 className="text-lg font-bold">{modalConfig.title}</h3>
                      <p className="text-sm mt-2 opacity-80">{modalConfig.message}</p>
                  </div>
                  <div className="p-4 bg-white flex gap-3">
                      <button onClick={() => setModalConfig(p => ({...p, isOpen: false}))} className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition">Cancelar</button>
                      <button onClick={modalConfig.onConfirm} className={`flex-1 py-3 px-4 font-bold rounded-xl text-white transition ${modalConfig.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>{modalConfig.confirmText}</button>
                  </div>
              </div>
          </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-4 w-full flex-none">
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200 overflow-hidden">
                {currentUser?.photoUrl ? (
                    <img src={currentUser.photoUrl} alt="Perfil" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                    <User className="w-5 h-5 text-emerald-700" />
                )}
             </div>
             <div className="hidden sm:block">
                <h1 className="text-lg font-black text-slate-800 leading-none">Panel de Gestión</h1>
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">
                    {isSuperAdmin ? currentTeacherName : `Docente: ${currentTeacherName}`}
                </p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative" ref={previewMenuRef}>
                <button onClick={() => setShowPreviewMenu(!showPreviewMenu)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200">Vista Previa <ChevronDown className="w-3 h-3"/></button>
                {showPreviewMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-emerald-100 p-2 z-[100]">
                        <button onClick={() => onPreview(CycleId.TSAF)} className="w-full text-left px-4 py-2 hover:bg-emerald-50 rounded-lg text-sm">Ver TSAF</button>
                        <button onClick={() => onPreview(CycleId.TSEAS)} className="w-full text-left px-4 py-2 hover:bg-emerald-50 rounded-lg text-sm">Ver TSEAS</button>
                    </div>
                )}
             </div>
             <button onClick={onLogout} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium"> <LogOut className="w-3 h-3" /> Salir </button>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 pb-4 md:overflow-hidden flex flex-col">
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 flex flex-col h-full overflow-hidden">
          <div className="flex border-b border-emerald-100 overflow-x-auto flex-none">
            <TabButton id="config" label="Curso" icon={Settings} />
            <TabButton id="team" label="Equipo Educativo" icon={Users} />
            <TabButton id="modules" label="Módulos" icon={Book} />
            <TabButton id="events" label="Eventos" icon={Calendar} />
            <TabButton id="communication" label="Comunicación" icon={MessageSquare} />
            {isSuperAdmin && <TabButton id="personalization" label="Personalización" icon={Palette} />}
          </div>

          <div className="flex-1 md:overflow-hidden overflow-auto relative p-4 flex flex-col">
            {activeTab === 'config' && (
                <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center items-center py-2 md:py-0 overflow-hidden">
                    <form onSubmit={handleUpdateConfig} className="bg-emerald-950 p-6 md:p-8 rounded-3xl shadow-2xl border border-emerald-800 w-full flex flex-col">
                        <div className="flex items-center justify-center gap-6 bg-emerald-900/50 p-4 rounded-xl border border-emerald-800 mb-8">
                             <div className="flex items-center gap-3">
                                <label className="text-emerald-100 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">INICIO DE CURSO:</label>
                                <input 
                                    type="date" 
                                    readOnly={!isSuperAdmin} 
                                    className={`bg-white text-black p-2 rounded-lg border border-emerald-700 text-[11px] font-bold outline-none focus:border-emerald-400 transition ${!isSuperAdmin ? 'pointer-events-none select-none appearance-none' : ''}`} 
                                    value={yearStart} 
                                    onChange={e => setYearStart(e.target.value)} 
                                />
                             </div>
                             <div className="w-px h-6 bg-emerald-800"></div>
                             <div className="flex items-center gap-3">
                                <label className="text-emerald-100 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">FIN DE CURSO:</label>
                                <input 
                                    type="date" 
                                    readOnly={!isSuperAdmin} 
                                    className={`bg-white text-black p-2 rounded-lg border border-emerald-700 text-[11px] font-bold outline-none focus:border-emerald-400 transition ${!isSuperAdmin ? 'pointer-events-none select-none appearance-none' : ''}`} 
                                    value={yearEnd} 
                                    onChange={e => setYearEnd(e.target.value)} 
                                />
                             </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
                            {trimesters.map(trim => (
                                <div key={trim.id} className="bg-emerald-900/30 p-3 rounded-xl border border-emerald-800">
                                    <h4 className="text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5"/> Trimestre {trim.id}</h4>
                                    <div className="flex items-center gap-1 bg-emerald-950/50 p-1.5 rounded-lg border border-emerald-800">
                                        <input 
                                            type="date" 
                                            readOnly={!isSuperAdmin} 
                                            className={`w-full bg-transparent text-white p-1 text-[10px] font-bold outline-none ${!isSuperAdmin ? 'pointer-events-none select-none appearance-none' : ''}`} 
                                            value={trim.startDate} 
                                            onChange={e => handleTrimesterChange(trim.id, 'startDate', e.target.value)} 
                                        />
                                        <span className="text-emerald-800 font-black text-xs">-</span>
                                        <input 
                                            type="date" 
                                            readOnly={!isSuperAdmin} 
                                            className={`w-full bg-transparent text-white p-1 text-[10px] font-bold outline-none ${!isSuperAdmin ? 'pointer-events-none select-none appearance-none' : ''}`} 
                                            value={trim.endDate} 
                                            onChange={e => handleTrimesterChange(trim.id, 'endDate', e.target.value)} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
                            <div className="bg-emerald-900/40 p-3 rounded-xl border border-emerald-800/60">
                                <h4 className="text-rose-400 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2"><TreePine className="w-3.5 h-3.5"/> Navidad</h4>
                                <div className="flex items-center gap-1 bg-emerald-950/50 p-1.5 rounded-lg border border-emerald-800/40">
                                    <input 
                                        type="date" 
                                        readOnly={!isSuperAdmin} 
                                        className={`w-full bg-transparent text-white p-1 text-[10px] font-bold outline-none ${!isSuperAdmin ? 'pointer-events-none select-none appearance-none' : ''}`} 
                                        value={xmasStart} 
                                        onChange={e => setXmasStart(e.target.value)} 
                                    />
                                    <span className="text-emerald-800 font-black text-xs">-</span>
                                    <input 
                                        type="date" 
                                        readOnly={!isSuperAdmin} 
                                        className={`w-full bg-transparent text-white p-1 text-[10px] font-bold outline-none ${!isSuperAdmin ? 'pointer-events-none select-none appearance-none' : ''}`} 
                                        value={xmasEnd} 
                                        onChange={e => setXmasEnd(e.target.value)} 
                                    />
                                </div>
                            </div>
                            <div className="bg-emerald-900/40 p-3 rounded-xl border border-emerald-800/60">
                                <h4 className="text-sky-400 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2"><VenetianMask className="w-3.5 h-3.5"/> Carnavales</h4>
                                <div className="flex items-center gap-1 bg-emerald-950/50 p-1.5 rounded-lg border border-emerald-800/40">
                                    <input 
                                        type="date" 
                                        readOnly={!isSuperAdmin} 
                                        className={`w-full bg-transparent text-white p-1 text-[10px] font-bold outline-none ${!isSuperAdmin ? 'pointer-events-none select-none appearance-none' : ''}`} 
                                        value={carnivalStart} 
                                        onChange={e => setCarnivalStart(e.target.value)} 
                                    />
                                    <span className="text-emerald-800 font-black text-xs">-</span>
                                    <input 
                                        type="date" 
                                        readOnly={!isSuperAdmin} 
                                        className={`w-full bg-transparent text-white p-1 text-[10px] font-bold outline-none ${!isSuperAdmin ? 'pointer-events-none select-none appearance-none' : ''}`} 
                                        value={carnivalEnd} 
                                        onChange={e => setCarnivalEnd(e.target.value)} 
                                    />
                                </div>
                            </div>
                            <div className="bg-emerald-900/40 p-3 rounded-xl border border-emerald-800/60">
                                <h4 className="text-amber-400 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2"><Sun className="w-3.5 h-3.5"/> Semana Santa</h4>
                                <div className="flex items-center gap-1 bg-emerald-950/50 p-1.5 rounded-lg border border-emerald-800/40">
                                    <input 
                                        type="date" 
                                        readOnly={!isSuperAdmin} 
                                        className={`w-full bg-transparent text-white p-1 text-[10px] font-bold outline-none ${!isSuperAdmin ? 'pointer-events-none select-none appearance-none' : ''}`} 
                                        value={easterStart} 
                                        onChange={e => setEasterStart(e.target.value)} 
                                    />
                                    <span className="text-emerald-800 font-black text-xs">-</span>
                                    <input 
                                        type="date" 
                                        readOnly={!isSuperAdmin} 
                                        className={`w-full bg-transparent text-white p-1 text-[10px] font-bold outline-none ${!isSuperAdmin ? 'pointer-events-none select-none appearance-none' : ''}`} 
                                        value={easterEnd} 
                                        onChange={e => setEasterEnd(e.target.value)} 
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="pt-2">
                          <button type="submit" disabled={!isSuperAdmin} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-emerald-500 transition-all active:scale-[0.98] border border-emerald-400/30 disabled:opacity-50">
                              Actualizar Cronograma Completo
                          </button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'team' && (
                <div className="max-w-4xl mx-auto w-full h-full flex flex-col overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b flex flex-wrap justify-between items-center rounded-t-2xl gap-4 shrink-0">
                        <h3 className="font-bold flex items-center gap-2 text-slate-800"><Users className="w-5 h-5 text-emerald-600"/> Equipo Educativo</h3>
                        {isSuperAdmin && (
                        <form onSubmit={handleAddTeacher} className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                            <div className="flex gap-2 flex-1">
                                <input 
                                    type="text" 
                                    placeholder="Nombre..." 
                                    className="w-full md:w-48 px-4 py-2 rounded-lg border text-sm bg-white text-slate-800 outline-none focus:border-emerald-500" 
                                    value={newTeacherFirstName} 
                                    onChange={e => setNewTeacherFirstName(e.target.value)} 
                                    required
                                />
                                <input 
                                    type="text" 
                                    placeholder="Apellidos..." 
                                    className="w-full md:w-80 px-4 py-2 rounded-lg border text-sm bg-white text-slate-800 outline-none focus:border-emerald-500" 
                                    value={newTeacherLastName} 
                                    onChange={e => setNewTeacherLastName(e.target.value)} 
                                    required
                                />
                            </div>
                            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition"><Plus className="w-4 h-4"/> Añadir</button>
                        </form>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {sortedTeachers.map(t => {
                              const canEdit = isSuperAdmin || t.id === currentTeacherId;
                              return (
                              <div key={t.id} className="p-4 bg-white border border-slate-100 rounded-xl flex items-center justify-between shadow-sm transition-all hover:border-emerald-300">
                                  <div className="flex items-center gap-3 min-w-0">
                                      {t.photoUrl ? (
                                          <img 
                                              src={t.photoUrl} 
                                              alt={t.name} 
                                              className="w-8 h-8 rounded-full object-cover border border-emerald-100 shrink-0" 
                                              referrerPolicy="no-referrer" 
                                          />
                                      ) : (
                                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0">{t.name.charAt(0)}</div>
                                      )}
                                      <span className="font-bold text-slate-700 text-sm truncate">{t.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                      {canEdit && (
                                      <button onClick={() => handleOpenEditTeacher(t)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Editar docente">
                                          <Edit className="w-4 h-4"/>
                                      </button>
                                      )}
                                      {isSuperAdmin && (
                                      <button onClick={() => confirmDeleteTeacher(t.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Eliminar docente">
                                          <Trash2 className="w-4 h-4"/>
                                      </button>
                                      )}
                                  </div>
                              </div>
                          )})}
                        </div>
                    </div>

                    {editingTeacher && (
                      <div className="fixed inset-0 z-[160] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                          <div className="bg-white rounded-3xl w-full max-sm overflow-hidden shadow-2xl animate-in zoom-in-95 border border-slate-200">
                              <div className="bg-slate-50 p-5 border-b flex justify-between items-center">
                                  <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">Editar Datos Docente</h3>
                                  <button onClick={() => setEditingTeacher(null)}><X className="w-4 h-4 text-slate-400"/></button>
                              </div>
                              <form onSubmit={handleSaveTeacherChanges} className="p-6 space-y-4">
                                  <div className="flex flex-col items-center gap-4 py-2">
                                      <div className="relative group">
                                          <div className="w-24 h-24 rounded-full border-4 border-emerald-100 overflow-hidden bg-slate-100 flex items-center justify-center shadow-inner relative">
                                              {editTeacherPhoto ? (
                                                  <img src={editTeacherPhoto} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                              ) : (
                                                  <User className="w-10 h-10 text-slate-300" />
                                              )}
                                              {isWebcamActive && (
                                                  <video ref={webcamVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover z-20" />
                                              )}
                                          </div>
                                          {!isWebcamActive && (
                                              <div className="absolute -bottom-1 -right-1 flex gap-1">
                                                  <button 
                                                      type="button"
                                                      onClick={() => fileInputRef.current?.click()}
                                                      className="p-2 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition transform hover:scale-110"
                                                      title="Subir foto"
                                                  >
                                                      <Upload className="w-3 h-3" />
                                                  </button>
                                                  <button 
                                                      type="button"
                                                      onClick={startWebcam}
                                                      className="p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-110"
                                                      title="Usar cámara"
                                                  >
                                                      <Camera className="w-3 h-3" />
                                                  </button>
                                              </div>
                                          )}
                                      </div>
                                      
                                      {isWebcamActive && (
                                          <div className="flex gap-2">
                                              <button type="button" onClick={capturePhoto} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition flex items-center gap-2">
                                                  <Camera className="w-3 h-3"/> Capturar
                                              </button>
                                              <button type="button" onClick={stopWebcam} className="bg-slate-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-600 transition flex items-center gap-2">
                                                  Cancelar
                                              </button>
                                          </div>
                                      )}
                                      
                                      <input 
                                          type="file" 
                                          ref={fileInputRef} 
                                          className="hidden" 
                                          accept="image/*" 
                                          onChange={handleFileUpload} 
                                      />
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nombre</label>
                                          <input 
                                              className="w-full p-3 rounded-xl border-2 border-slate-100 text-sm font-bold bg-white text-slate-800 focus:border-emerald-500 outline-none transition" 
                                              value={editTeacherFirstName} 
                                              onChange={e => setEditTeacherFirstName(e.target.value)} 
                                              required
                                          />
                                      </div>
                                      <div>
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Apellidos</label>
                                          <input 
                                              className="w-full p-3 rounded-xl border-2 border-slate-100 text-sm font-bold bg-white text-slate-800 focus:border-emerald-500 outline-none transition" 
                                              value={editTeacherLastName} 
                                              onChange={e => setEditTeacherLastName(e.target.value)} 
                                              required
                                          />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Contraseña Personal</label>
                                      <div className="relative">
                                          <input 
                                              type={showEditPassword ? "text" : "password"}
                                              className="w-full p-3 pl-10 pr-12 rounded-xl border-2 border-slate-100 text-sm font-bold bg-white text-slate-800 focus:border-emerald-500 outline-none transition" 
                                              placeholder="Definir contraseña..."
                                              value={editTeacherPassword} 
                                              onChange={e => setEditTeacherPassword(e.target.value)} 
                                              required
                                          />
                                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                          <button 
                                            type="button"
                                            onClick={() => setShowEditPassword(!showEditPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
                                            title={showEditPassword ? "Ocultar" : "Ver"}
                                          >
                                            {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                          </button>
                                      </div>
                                      <p className="text-[9px] text-slate-400 mt-1">Esta clave será necesaria para el Acceso Docente.</p>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email Corporativo</label>
                                          <input 
                                              className="w-full p-3 rounded-xl border-2 border-slate-100 text-sm font-bold bg-white text-slate-800 focus:border-emerald-500 outline-none transition" 
                                              placeholder="ejemplo@cifpfelomonzon.es"
                                              value={editTeacherEmail} 
                                              onChange={e => setEditTeacherEmail(e.target.value)} 
                                          />
                                      </div>
                                      <div>
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Teléfono</label>
                                          <input 
                                              className="w-full p-3 rounded-xl border-2 border-slate-100 text-sm font-bold bg-white text-slate-800 focus:border-emerald-500 outline-none transition" 
                                              placeholder="Número de contacto..."
                                              value={editTeacherPhone} 
                                              onChange={e => setEditTeacherPhone(e.target.value)} 
                                          />
                                      </div>
                                  </div>
                                  <div className="pt-2">
                                      <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-emerald-700 transition" disabled={isWebcamActive}>
                                          Guardar Cambios
                                      </button>
                                  </div>
                              </form>
                          </div>
                      </div>
                    )}
                </div>
            )}

            {activeTab === 'modules' && (
                <div className="h-full overflow-y-auto space-y-4 pr-2 custom-scrollbar pb-8">
                    <div className="flex justify-center gap-2 sticky top-0 bg-white/90 backdrop-blur-sm py-4 z-10">
                        <button onClick={() => setActiveCycleTab(CycleId.TSAF)} className={`px-8 py-2 rounded-full font-bold transition-all shadow-sm ${activeCycleTab === CycleId.TSAF ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>TSAF</button>
                        <button onClick={() => setActiveCycleTab(CycleId.TSEAS)} className={`px-8 py-2 rounded-full font-bold transition-all shadow-sm ${activeCycleTab === CycleId.TSEAS ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>TSEAS</button>
                    </div>

                    <div className="px-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">1er Curso</div>
                            <div className="flex-1 h-px bg-slate-200"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {visibleModules.filter(m => m.year === 1).map(m => {
                                const moduleTeacher = data.teachers.find(t => t.name === m.teacherName);
                                return (
                                <div key={m.id} className="p-3 border-2 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:shadow-md bg-blue-50/40 border-blue-100 hover:border-blue-300">
                                    <div className="flex gap-3 items-center min-w-0">
                                        {moduleTeacher?.photoUrl ? (
                                            <img 
                                                src={moduleTeacher.photoUrl} 
                                                alt={m.teacherName} 
                                                className="w-8 h-8 rounded-full object-cover border border-blue-200 shrink-0 shadow-sm" 
                                                referrerPolicy="no-referrer" 
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white shrink-0 shadow-sm bg-blue-600 text-xs">1º</div>
                                        )}
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-slate-800 leading-tight text-xs truncate" title={m.name}>{m.name}</h4>
                                            <p className="text-[10px] text-slate-500 truncate">Docente: <span className="font-bold text-blue-700">{m.teacherName}</span></p>
                                        </div>
                                    </div>
                                    {(isSuperAdmin || m.teacherName === currentTeacherName) && (
                                    <button onClick={() => openEditModule(m)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition shrink-0" title="Configurar Módulo">
                                        <Edit className="w-4 h-4"/>
                                    </button>
                                    )}
                                </div>
                            )})}
                        </div>
                    </div>

                    <div className="px-4 mt-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">2º Curso</div>
                            <div className="flex-1 h-px bg-slate-200"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {visibleModules.filter(m => m.year === 2).map(m => {
                                const moduleTeacher = data.teachers.find(t => t.name === m.teacherName);
                                return (
                                <div key={m.id} className="p-3 border-2 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:shadow-md bg-emerald-50/40 border-emerald-100 hover:border-emerald-300">
                                    <div className="flex gap-3 items-center min-w-0">
                                        {moduleTeacher?.photoUrl ? (
                                            <img 
                                                src={moduleTeacher.photoUrl} 
                                                alt={m.teacherName} 
                                                className="w-8 h-8 rounded-full object-cover border border-emerald-200 shrink-0 shadow-sm" 
                                                referrerPolicy="no-referrer" 
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white shrink-0 shadow-sm bg-emerald-600 text-xs">2º</div>
                                        )}
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-slate-800 leading-tight text-xs truncate" title={m.name}>{m.name}</h4>
                                            <p className="text-[10px] text-slate-500 truncate">Docente: <span className="font-bold text-emerald-700">{m.teacherName}</span></p>
                                        </div>
                                    </div>
                                    {(isSuperAdmin || m.teacherName === currentTeacherName) && (
                                    <button onClick={() => openEditModule(m)} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-xl transition shrink-0" title="Configurar Módulo">
                                        <Edit className="w-4 h-4"/>
                                    </button>
                                    )}
                                </div>
                            )})}
                        </div>
                    </div>
                </div>
            )}

            {editingModule && (
                <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 border border-slate-200">
                        <div className="bg-slate-50 p-6 border-b flex justify-between items-center">
                            <h3 className="font-black text-slate-800 uppercase tracking-tight">Configuración del Módulo</h3>
                            <button onClick={() => setEditingModule(null)}><X className="w-5 h-5 text-slate-400"/></button>
                        </div>
                        <form onSubmit={handleSaveModuleChanges} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {isSuperAdmin && (
                                <>
                                    <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nombre del módulo</label><input className="w-full p-4 rounded-xl border-2 border-slate-100 text-sm font-bold bg-white text-slate-800 focus:border-emerald-500 outline-none transition" value={editModName} onChange={e => setEditModName(e.target.value)} /></div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Asignar Docente</label>
                                        <select className="w-full p-4 rounded-xl border-2 border-slate-100 text-sm font-bold bg-white text-slate-800 focus:border-emerald-500 outline-none" value={editModTeacher} onChange={e => setEditModTeacher(e.target.value)}>
                                            <option value="Docente por asignar">Docente por asignar</option>
                                            {sortedTeachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                        </select>
                                    </div>
                                </>
                            )}
                            {!isSuperAdmin && (
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Módulo Seleccionado</p>
                                    <p className="text-sm font-bold text-slate-800">{editModName}</p>
                                </div>
                            )}
                            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">URL Programación (PDF)</label><input className="w-full p-4 rounded-xl border-2 border-slate-100 text-xs font-medium bg-white text-slate-800 focus:border-emerald-500 outline-none" value={editModPdf} onChange={e => setEditModPdf(e.target.value)} placeholder="https://..." /></div>
                            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">URL Evaluación (PDF)</label><input className="w-full p-4 rounded-xl border-2 border-slate-100 text-xs font-medium bg-white text-slate-800 focus:border-emerald-500 outline-none" value={editModEval} onChange={e => setEditModEval(e.target.value)} placeholder="https://..." /></div>
                        </form>
                        <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
                             <button onClick={() => setEditingModule(null)} className="px-6 py-2 rounded-xl text-slate-500 font-bold text-sm">Cancelar</button>
                             <button onClick={handleSaveModuleChanges} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-emerald-700 transition">Guardar cambios</button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'events' && (
                <div className="flex-1 overflow-y-auto relative custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 p-1 min-h-0">
                        <div className="space-y-6 pb-12">
                            <h3 className="font-black text-slate-800 uppercase tracking-tighter text-xl mb-6">Listado de Eventos</h3>
                            {eventGroups.map(([groupName, groupEvents]) => (
                                <div key={groupName} className="bg-white border-2 border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                                    <button 
                                        onClick={() => setExpandedEventGroup(expandedEventGroup === groupName ? null : groupName)}
                                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition"
                                    >
                                        <h4 className="font-black text-xs uppercase tracking-widest text-emerald-800 flex items-center gap-3">
                                            <Book className="w-4 h-4"/> {groupName} 
                                            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px]">{groupEvents.length}</span>
                                        </h4>
                                        {expandedEventGroup === groupName ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
                                    </button>
                                    {expandedEventGroup === groupName && (
                                        <div className="p-4 space-y-3">
                                            {groupEvents.sort((a,b) => b.startDate.localeCompare(a.startDate)).map(ev => {
                                                const editable = canEditEvent(ev);
                                                return (
                                                <div key={ev.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-emerald-300 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-3 h-10 rounded-full shrink-0 ${EVENT_COLORS[ev.type]}`}></div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 text-sm leading-tight">{ev.title}</h4>
                                                            <p className="text-[10px] text-slate-400 font-black uppercase mt-1">
                                                                {new Date(ev.startDate).toLocaleDateString()} al {new Date(ev.endDate).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {editable && (
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEditEvent(ev)} className="p-2 text-slate-400 hover:text-emerald-600 transition event-edit-btn" title="Editar evento"><Edit className="w-4 h-4"/></button>
                                                        <button onClick={() => confirmDeleteEvent(ev)} className="p-2 text-slate-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4"/></button>
                                                    </div>
                                                    )}
                                                </div>
                                            )})}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <div className="space-y-4 h-fit lg:sticky lg:top-0">
                            {(!isSuperAdmin && myAllowedModules.length === 0) && (
                                <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl flex items-start gap-3 animate-pulse">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div className="text-xs text-amber-800 font-medium">
                                        <strong>Sin módulos asignados:</strong> No tienes módulos bajo tu nombre en el sistema. Solo podrás gestionar eventos de tipo "GLOBAL". Contacta con el administrador.
                                    </div>
                                </div>
                            )}
                            <form ref={eventFormRef} id="event-form" onSubmit={handleFormSubmit} className="bg-white border-2 border-emerald-100 rounded-3xl p-6 space-y-4 shadow-xl">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-black text-emerald-800 uppercase tracking-tighter text-lg">{editingEventId ? 'Modificar Evento' : 'Nuevo Evento'}</h4>
                                    {editingEventId && (
                                        <button type="button" onClick={resetEventForm} className="text-slate-400 hover:text-red-500 transition px-2 py-1 rounded-lg hover:bg-red-50 flex items-center gap-1 text-[10px] uppercase font-bold">
                                            <X className="w-3 h-3" /> Cancelar
                                        </button>
                                    )}
                                </div>
                                <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Módulo asociado</label>
                                    <select required className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-100 text-sm font-bold text-slate-800 outline-none focus:border-emerald-500" value={evModule} onChange={e => setEvModule(e.target.value)}>
                                        <option value="">Seleccionar...</option>
                                        <option value="GLOBAL">--- Festivos / Libre disposición ---</option>
                                        {myAllowedModules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Tipo de evento</label>
                                    <select className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-100 text-sm font-bold text-slate-800 outline-none" value={evType} onChange={e => setEvType(e.target.value as EventType)}>
                                        {Object.entries(EVENT_LABELS)
                                          .filter(([k]) => {
                                            // Si no es superadmin y no tiene módulos, solo puede elegir HOLIDAY
                                            if (!isSuperAdmin && myAllowedModules.length === 0) {
                                              return k === EventType.HOLIDAY;
                                            }
                                            return true; 
                                          })
                                          .map(([k,l]) => <option key={k} value={k}>{l}</option>)}
                                    </select>
                                </div>
                                <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Título</label><input required className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-100 text-sm font-bold text-slate-800 outline-none" value={evTitle} onChange={e => setEvTitle(e.target.value)} placeholder="UT1: Introducción..." /></div>
                                
                                {/* Diseño Vertical de Fechas: Una debajo de la otra ocupando el 100% de ancho */}
                                <div className="space-y-4">
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Fecha de Inicio</label>
                                        <input 
                                            type="date" 
                                            required 
                                            className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-100 text-sm font-bold text-slate-800 focus:border-emerald-500 transition-colors outline-none" 
                                            value={evStart} 
                                            onChange={e => setEvStart(e.target.value)} 
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Fecha de Fin</label>
                                        <input 
                                            type="date" 
                                            required 
                                            className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-100 text-sm font-bold text-slate-800 focus:border-emerald-500 transition-colors outline-none" 
                                            value={evEnd} 
                                            onChange={e => setEvEnd(e.target.value)} 
                                        />
                                    </div>
                                </div>
                                
                                <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Descripción</label><textarea className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-100 text-sm font-medium text-slate-800 min-h-[100px] resize-none" value={evDesc} onChange={e => setEvDesc(e.target.value)} placeholder="Detalles..." /></div>
                                <button type="submit" className="w-full bg-emerald-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-emerald-800 transition transform active:scale-95">{editingEventId ? 'Guardar Cambios' : 'Crear Evento'}</button>
                                {editingEventId && <button onClick={resetEventForm} type="button" className="w-full text-slate-400 font-bold text-[10px] uppercase">Cancelar edición</button>}
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'communication' && (
                <div className="w-full h-full flex flex-col md:grid md:grid-cols-[1fr_2fr] gap-8 overflow-hidden">
                    <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 h-fit shadow-lg sticky top-0 z-10">
                        <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-emerald-100 rounded-2xl text-emerald-700"><Send className="w-6 h-6"/></div><h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Nueva Comunicación</h3></div>
                        <form onSubmit={handleSendCommunication} className="space-y-6">
                            <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Destinatario</label><select required className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:ring-4 focus:ring-emerald-100 outline-none text-sm font-bold text-slate-800" value={msgReceiverId} onChange={e => setMsgReceiverId(e.target.value)}><option value="">-- Elige un docente --</option>{data.teachers.filter(t => t.id !== currentTeacherId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                            <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Mensaje / Petición</label><textarea required className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:ring-4 focus:ring-emerald-100 outline-none text-sm font-medium text-slate-800 min-h-[150px] resize-none" placeholder="Escribe aquí..." value={msgContent} onChange={e => setMsgContent(e.target.value)} /></div>
                            <button type="submit" className="w-full bg-emerald-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-emerald-800 transition transform active:scale-95 flex items-center justify-center gap-2"><Send className="w-4 h-4"/> Enviar Mensaje</button>
                        </form>
                    </div>

                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex items-center justify-between mb-6 shrink-0"><h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3"><MessageSquare className="w-6 h-6 text-emerald-600" /> Histórico agrupado</h3></div>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-12">
                            {commGroups.length === 0 ? <div className="text-center py-20 opacity-30"><MessageSquare className="w-12 h-12 mx-auto mb-4"/><p className="font-black uppercase text-xs tracking-widest">Sin mensajes registrados</p></div> : (
                                commGroups.map(group => (
                                    <div key={group.key} className="bg-white border-2 border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                                        <button onClick={() => toggleCommGroup(group.key)} className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition group">
                                            <div className="flex items-center gap-3"><h4 className="text-emerald-800 font-black text-xs uppercase tracking-widest flex items-center gap-2"><Calendar className="w-4 h-4"/> {group.label}</h4><span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">{group.messages.length}</span></div>
                                            {expandedCommGroup === group.key ? <ChevronUp className="w-5 h-5 text-slate-400"/> : <ChevronDown className="w-5 h-5 text-slate-400"/>}
                                        </button>
                                        {expandedCommGroup === group.key && (
                                          <div className="p-4 space-y-4 bg-white">
                                            {group.messages.map(msg => (
                                              <MessageCard 
                                                key={msg.id} 
                                                msg={msg} 
                                                currentTeacherId={currentTeacherId || ''} 
                                                isSuperAdmin={isSuperAdmin}
                                                teachers={data.teachers} 
                                                communications={data.communications}
                                                replyingToId={replyingToId}
                                                setReplyingToId={setReplyingToId}
                                                replyContent={replyContent}
                                                setReplyContent={setReplyContent}
                                                handleSendCommunication={handleSendCommunication}
                                                toggleMsgRead={toggleMsgRead}
                                                onDeleteMessage={handleDeleteMessage}
                                                getRepliesForMessage={getRepliesForMessage}
                                              />
                                            ))}
                                          </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'personalization' && isSuperAdmin && (
                <div className="max-w-4xl mx-auto w-full h-full flex flex-col items-center justify-start py-2 overflow-hidden">
                    <div className="bg-white p-6 rounded-3xl shadow-xl border border-emerald-100 w-full max-w-xl flex flex-col max-h-[calc(100vh-180px)]">
                      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="flex flex-col items-center gap-4 p-6 bg-slate-50 rounded-3xl border-4 border-dashed border-emerald-100/50">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Logotipo Actual del Centro</label>
                          
                          <div className="relative group">
                            <div className="w-44 h-44 bg-white rounded-3xl shadow-2xl border-4 border-white flex items-center justify-center overflow-hidden p-4 relative">
                              <img 
                                src={draftLogo || DEFAULT_LOGO} 
                                alt="Logo del Centro" 
                                className="w-full h-full object-contain" 
                                referrerPolicy="no-referrer" 
                              />
                              
                              {isWebcamActive && isCapturingLogo && (
                                  <video ref={webcamVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover z-20" />
                              )}

                              {/* Indicador de logo personalizado */}
                              {!isWebcamActive && data.centerLogo && (
                                <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg z-10 animate-pulse">
                                  <CheckCircle className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                            
                            {!isWebcamActive && (
                              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                <input type="file" ref={logoFileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                <button 
                                  onClick={() => logoFileInputRef.current?.click()}
                                  className="bg-emerald-600 text-white p-3 rounded-xl shadow-xl hover:bg-emerald-500 transition transform hover:scale-105 active:scale-95 flex items-center gap-2"
                                  title="Subir archivo"
                                >
                                  <Upload className="w-3.5 h-3.5" /> 
                                  <span className="text-[9px] font-black uppercase tracking-widest">Subir</span>
                                </button>
                                <button 
                                  onClick={() => { setIsCapturingLogo(true); startWebcam(); }}
                                  className="bg-blue-600 text-white p-3 rounded-xl shadow-xl hover:bg-blue-500 transition transform hover:scale-105 active:scale-95 flex items-center gap-2"
                                  title="Usar cámara"
                                >
                                  <Camera className="w-3.5 h-3.5" />
                                  <span className="text-[9px] font-black uppercase tracking-widest">Cámara</span>
                                </button>
                              </div>
                            )}
                            {isWebcamActive && isCapturingLogo && (
                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                                    <button onClick={() => { setIsCapturingLogo(false); stopWebcam(); }} className="bg-slate-800 text-white p-2.5 rounded-lg shadow-lg hover:bg-slate-700 transition">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={capturePhoto} className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-lg hover:bg-emerald-500 transition font-black uppercase tracking-widest text-[9px] flex items-center gap-2">
                                        <Camera className="w-3.5 h-3.5" /> Capturar
                                    </button>
                                </div>
                            )}
                          </div>
                          
                          <div className="mt-6 text-center space-y-1">
                            <p className="text-[9px] text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                              El logo se verá en la <span className="font-bold text-emerald-600">pantalla de inicio</span> y el <span className="font-bold text-emerald-600">acceso para docentes</span>.
                            </p>
                            <p className="text-[8px] text-slate-400 italic">Formato recomendado: PNG transparente.</p>
                          </div>
                        </div>

                        {data.centerLogo && !isWebcamActive && (
                          <button 
                            onClick={() => {
                                setModalConfig({
                                    isOpen: true, type: 'danger', title: '¿Restablecer logotipo?', message: 'Se eliminará el logo personalizado y se volverá al logo por defecto del centro.', confirmText: 'Restablecer',
                                    onConfirm: () => {
                                        onUpdate({ ...data, centerLogo: undefined });
                                        setModalConfig(p => ({...p, isOpen: false}));
                                        showNotification("Logotipo restablecido");
                                    }
                                });
                            }}
                            className="w-full py-3 text-rose-500 font-black uppercase tracking-widest text-[9px] hover:bg-rose-50 rounded-xl transition-all flex items-center justify-center gap-2 border border-transparent hover:border-rose-100"
                          >
                            <RefreshCw className="w-3 h-3" /> Restablecer logo original
                          </button>
                        )}

                        {/* SECCIÓN DE PERFIL DE ADMINISTRADOR */}
                        <div className="mt-6 pt-6 border-t border-slate-100 space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                <User className="w-4 h-4 text-emerald-600" />
                                <h4 className="text-[11px] font-black uppercase tracking-tighter text-slate-800">Perfil del Administrador General</h4>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50">
                                <div className="relative group shrink-0">
                                    <div className="w-24 h-24 rounded-full bg-white shadow-xl border-4 border-white flex items-center justify-center overflow-hidden relative">
                                        {draftAdminPhoto ? (
                                            <img src={draftAdminPhoto} alt="Admin" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                            <div className="bg-emerald-100 w-full h-full flex items-center justify-center">
                                                <User className="w-8 h-8 text-emerald-600 opacity-30" />
                                            </div>
                                        )}
                                        {isWebcamActive && isCapturingAdminPhoto && (
                                            <video ref={webcamVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover z-20" />
                                        )}
                                    </div>
                                    
                                    {!isWebcamActive && (
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                            <input type="file" ref={adminPhotoFileInputRef} className="hidden" accept="image/*" onChange={handleAdminPhotoUpload} />
                                            <button onClick={() => adminPhotoFileInputRef.current?.click()} className="bg-emerald-600 text-white p-2 rounded-lg shadow-lg hover:bg-emerald-500 transition"><Upload className="w-3 h-3" /></button>
                                            <button onClick={() => { setIsCapturingAdminPhoto(true); startWebcam(); }} className="bg-blue-600 text-white p-2 rounded-lg shadow-lg hover:bg-blue-500 transition"><Camera className="w-3 h-3" /></button>
                                        </div>
                                    )}
                                    {isWebcamActive && isCapturingAdminPhoto && (
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-30">
                                            <button onClick={() => { setIsCapturingAdminPhoto(false); stopWebcam(); }} className="bg-slate-800 text-white p-2 rounded-lg shadow-lg"><X className="w-3 h-3" /></button>
                                            <button onClick={capturePhoto} className="bg-emerald-600 text-white px-3 py-2 rounded-lg shadow-lg text-[9px] font-black uppercase"><Camera className="w-3 h-3" /></button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 w-full space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Nombre Display</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all"
                                            value={draftAdminName}
                                            onChange={(e) => setDraftAdminName(e.target.value)}
                                            placeholder="Nombre del SuperAdmin..."
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Clave de Acceso</label>
                                        <div className="relative">
                                            <input 
                                                type={showAdminPassword ? "text" : "password"} 
                                                className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all pr-12"
                                                value={draftAdminPass}
                                                onChange={(e) => setDraftAdminPass(e.target.value)}
                                                placeholder="Contraseña del SuperAdmin..."
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowAdminPassword(!showAdminPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 p-1"
                                            >
                                                {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3 pt-6 border-t border-slate-100 pb-4">
                          <button 
                              onClick={handleCancelPersonalization}
                              className="flex-1 py-3 px-4 bg-slate-100 h-12 hover:bg-slate-200 text-slate-600 font-black uppercase tracking-widest text-[9px] rounded-xl transition-all"
                          >
                              Descartar
                          </button>
                          <button 
                              onClick={handleSavePersonalization}
                              className="flex-[2] py-3 px-4 bg-emerald-600 h-12 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                          >
                              <Save className="w-4 h-4" /> Guardar Cambios
                          </button>
                        </div>
                      </div>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};