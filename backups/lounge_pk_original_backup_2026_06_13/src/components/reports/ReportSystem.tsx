// components/reports/ReportSystem.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flag, AlertTriangle, Shield, FileText, Users, Mic, 
  Music, Gift, MessageCircle, Clock, CheckCircle, XCircle,
  Eye, Download, BarChart3, TrendingUp, Calendar, Filter,
  Search, ChevronDown, ChevronUp, UserX, Ban
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface Report {
  id: string;
  type: 'user' | 'cover' | 'message' | 'comment' | 'gift';
  targetId: string;
  targetName: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
  evidence?: string[];
}

interface ReportStats {
  totalReports: number;
  pendingReports: number;
  resolvedToday: number;
  avgResolutionTime: number;
  topReasons: { reason: string; count: number }[];
  topReported: { name: string; count: number }[];
  reportsByDay: { date: string; count: number }[];
}

interface ReportSystemProps {
  currentUserId: string;
  currentUserRole: 'user' | 'moderator' | 'admin';
  onReportSubmitted: (report: Report) => void;
  onResolveReport: (reportId: string, resolution: string, action: string) => void;
}

// Datos de ejemplo (en producción vienen de Supabase)
const MOCK_REPORTS: Report[] = [
  {
    id: '1',
    type: 'user',
    targetId: 'user_123',
    targetName: 'Troll_Musical',
    reporterId: 'current_user',
    reporterName: 'Leo Vela',
    reason: 'Comportamiento inapropiado',
    description: 'Insultos repetidos en el chat durante la fiesta',
    status: 'pending',
    severity: 'medium',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    evidence: ['screenshot_1.png', 'screenshot_2.png'],
  },
  {
    id: '2',
    type: 'cover',
    targetId: 'cover_456',
    targetName: 'Mi cover de Despacito',
    reporterId: 'user_456',
    reporterName: 'Dj_Rayo',
    reason: 'Contenido inapropiado',
    description: 'La portada del cover contiene imágenes ofensivas',
    status: 'reviewing',
    severity: 'high',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    type: 'message',
    targetId: 'msg_789',
    targetName: 'Mensaje en #general',
    reporterId: 'user_789',
    reporterName: 'Reina_Melody',
    reason: 'Spam',
    description: 'Mensajes repetitivos de publicidad',
    status: 'resolved',
    severity: 'low',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    resolvedBy: 'admin_1',
    resolution: 'Advertencia emitida al usuario',
  },
];

const REPORT_REASONS = [
  { id: 'spam', label: '📢 Spam', description: 'Contenido publicitario o repetitivo' },
  { id: 'harassment', label: '😠 Acoso', description: 'Insultos, amenazas o comportamiento hostil' },
  { id: 'inappropriate', label: '🔞 Contenido inapropiado', description: 'Material ofensivo, violento o sexual' },
  { id: 'copyright', label: '©️ Infracción copyright', description: 'Contenido sin derechos de autor' },
  { id: 'impersonation', label: '🎭 Suplantación', description: 'Hacerse pasar por otra persona' },
  { id: 'cheating', label: '🎮 Trampas', description: 'Uso de hacks o exploits' },
  { id: 'other', label: '📝 Otro', description: 'Otro tipo de infracción' },
];

const SEVERITY_COLORS = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

const STATUS_COLORS = {
  pending: 'bg-yellow-500',
  reviewing: 'bg-blue-500',
  resolved: 'bg-green-500',
  dismissed: 'bg-gray-500',
};

export function ReportSystem({ currentUserId, currentUserRole, onReportSubmitted, onResolveReport }: ReportSystemProps) {
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'user' | 'cover' | 'message' | 'comment' | 'gift'>('user');
  const [targetId, setTargetId] = useState('');
  const [targetName, setTargetName] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<File[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewing' | 'resolved'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [stats, setStats] = useState<ReportStats>({
    totalReports: 0,
    pendingReports: 0,
    resolvedToday: 0,
    avgResolutionTime: 0,
    topReasons: [],
    topReported: [],
    reportsByDay: [],
  });
  const [resolutionAction, setResolutionAction] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  
  // Calcular estadísticas
  useEffect(() => {
    const pending = reports.filter(r => r.status === 'pending' || r.status === 'reviewing').length;
    const resolvedToday = reports.filter(r => 
      r.resolvedAt && new Date(r.resolvedAt).toDateString() === new Date().toDateString()
    ).length;
    
    const reasonCount: Record<string, number> = {};
    const reportedCount: Record<string, number> = {};
    const dayCount: Record<string, number> = {};
    
    reports.forEach(r => {
      reasonCount[r.reason] = (reasonCount[r.reason] || 0) + 1;
      reportedCount[r.targetName] = (reportedCount[r.targetName] || 0) + 1;
      const day = r.createdAt.toISOString().split('T')[0];
      dayCount[day] = (dayCount[day] || 0) + 1;
    });
    
    setStats({
      totalReports: reports.length,
      pendingReports: pending,
      resolvedToday,
      avgResolutionTime: 48, // Horas promedio (ejemplo)
      topReasons: Object.entries(reasonCount).map(([reason, count]) => ({ reason, count })).slice(0, 5),
      topReported: Object.entries(reportedCount).map(([name, count]) => ({ name, count })).slice(0, 5),
      reportsByDay: Object.entries(dayCount).map(([date, count]) => ({ date, count })),
    });
  }, [reports]);
  
  const submitReport = () => {
    if (!selectedReason || !description) return;
    
    const newReport: Report = {
      id: Date.now().toString(),
      type: reportType,
      targetId,
      targetName,
      reporterId: currentUserId,
      reporterName: 'Usuario Actual', // En producción, tomar del contexto
      reason: REPORT_REASONS.find(r => r.id === selectedReason)?.label || selectedReason,
      description,
      status: 'pending',
      severity: 'medium',
      createdAt: new Date(),
      evidence: evidence.map(e => URL.createObjectURL(e)),
    };
    
    setReports(prev => [newReport, ...prev]);
    onReportSubmitted(newReport);
    setShowReportModal(false);
    resetReportForm();
  };
  
  const resolveReport = (report: Report) => {
    if (!resolutionAction) return;
    
    const updatedReport = {
      ...report,
      status: (resolutionAction === 'dismiss' ? 'dismissed' : 'resolved') as 'dismissed' | 'resolved',
      resolvedAt: new Date(),
      resolvedBy: currentUserId,
      resolution: resolutionNote,
    };
    
    setReports(prev => prev.map(r => r.id === report.id ? updatedReport : r));
    onResolveReport(report.id, resolutionNote, resolutionAction);
    setSelectedReport(null);
    setResolutionAction('');
    setResolutionNote('');
  };
  
  const resetReportForm = () => {
    setSelectedReason('');
    setDescription('');
    setEvidence([]);
    setTargetId('');
    setTargetName('');
  };
  
  const filteredReports = reports.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterType !== 'all' && r.type !== filterType) return false;
    return true;
  });
  
  const canModerate = currentUserRole === 'moderator' || currentUserRole === 'admin';
  
  return (
    <div className="bg-black border-4 border-[#D4AF37] h-full flex flex-col">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-black text-[#D4AF37] flex items-center gap-2">
            <Shield size={18} /> CENTRO DE REPORTES
          </h3>
          <button
            onClick={() => setShowReportModal(true)}
            className="px-3 py-1 bg-[#D4AF37] text-black text-sm font-black rounded flex items-center gap-1"
          >
            <Flag size={14} /> REPORTAR
          </button>
        </div>
        
        {/* Filtros */}
        <div className="flex gap-2 mb-3">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'pending', label: 'Pendientes' },
            { id: 'reviewing', label: 'En revisión' },
            { id: 'resolved', label: 'Resueltos' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id as any)}
              className={`px-2 py-1 text-xs rounded transition-all ${
                filterStatus === f.id
                  ? 'bg-[#D4AF37] text-black'
                  : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        
        {/* Selector de tipo */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: '📋 Todos' },
            { id: 'user', label: '👤 Usuarios' },
            { id: 'cover', label: '🎤 Covers' },
            { id: 'message', label: '💬 Mensajes' },
            { id: 'gift', label: '🎁 Regalos' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setFilterType(t.id)}
              className={`px-2 py-1 text-xs rounded transition-all ${
                filterType === t.id
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-900 text-gray-500 hover:bg-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Estadísticas (solo para moderadores) */}
      {canModerate && (
        <div className="p-4 border-b border-gray-800 bg-gray-900/50">
          <h4 className="text-sm font-black text-[#D4AF37] mb-3 flex items-center gap-2">
            <BarChart3 size={14} /> ESTADÍSTICAS
          </h4>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-black p-2 rounded">
              <div className="text-xl font-black text-[#D4AF37]">{stats.totalReports}</div>
              <div className="text-[10px] text-gray-500">Total</div>
            </div>
            <div className="bg-black p-2 rounded">
              <div className="text-xl font-black text-yellow-500">{stats.pendingReports}</div>
              <div className="text-[10px] text-gray-500">Pendientes</div>
            </div>
            <div className="bg-black p-2 rounded">
              <div className="text-xl font-black text-green-500">{stats.resolvedToday}</div>
              <div className="text-[10px] text-gray-500">Hoy</div>
            </div>
            <div className="bg-black p-2 rounded">
              <div className="text-xl font-black text-blue-500">{stats.avgResolutionTime}h</div>
              <div className="text-[10px] text-gray-500">Tiempo medio</div>
            </div>
          </div>
          
          {/* Top razones */}
          <div className="mt-3 flex flex-wrap gap-2">
            {stats.topReasons.map(r => (
              <div key={r.reason} className="bg-black/50 px-2 py-1 rounded text-xs">
                {r.reason}: {r.count}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Lista de reportes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredReports.map(report => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            onClick={() => setSelectedReport(report)}
            className="bg-gray-900 p-3 rounded-lg cursor-pointer hover:bg-gray-800 transition-all"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${SEVERITY_COLORS[report.severity]}`} />
                <span className="font-bold text-white">
                  {report.type === 'user' && '👤 '}
                  {report.type === 'cover' && '🎤 '}
                  {report.type === 'message' && '💬 '}
                  {report.type === 'gift' && '🎁 '}
                  {report.targetName}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[report.status]} text-white`}>
                  {report.status === 'pending' ? 'Pendiente' :
                   report.status === 'reviewing' ? 'En revisión' :
                   report.status === 'resolved' ? 'Resuelto' : 'Desestimado'}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(report.createdAt).toLocaleDateString()}
              </div>
            </div>
            
            <div className="text-sm text-gray-400 mb-2">{report.reason}</div>
            <div className="text-xs text-gray-500 line-clamp-2">{report.description}</div>
            
            <div className="flex justify-between items-center mt-2 text-xs">
              <span className="text-gray-500">Reportado por: {report.reporterName}</span>
              {report.status === 'resolved' && report.resolution && (
                <span className="text-green-500">✓ Resuelto</span>
              )}
            </div>
          </motion.div>
        ))}
        
        {filteredReports.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Shield size={48} className="mx-auto mb-2 opacity-50" />
            No hay reportes que mostrar
          </div>
        )}
      </div>
      
      {/* Modal de reporte */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-gray-900 border-4 border-[#D4AF37] max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-black text-[#D4AF37] mb-4 flex items-center gap-2">
                <Flag size={20} /> REPORTAR CONTENIDO
              </h3>
              
              {/* Tipo de reporte */}
              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-2">Tipo de contenido</div>
                <div className="flex gap-2">
                  {[
                    { id: 'user', label: '👤 Usuario' },
                    { id: 'cover', label: '🎤 Cover' },
                    { id: 'message', label: '💬 Mensaje' },
                    { id: 'gift', label: '🎁 Regalo' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setReportType(t.id as any)}
                      className={`px-3 py-1 text-sm rounded transition-all ${
                        reportType === t.id
                          ? 'bg-[#D4AF37] text-black'
                          : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* ID/Nombre del objetivo */}
              <input
                type="text"
                placeholder={`ID o nombre del ${reportType === 'user' ? 'usuario' : reportType === 'cover' ? 'cover' : 'mensaje'}`}
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                className="w-full bg-black border-2 border-gray-700 p-3 text-white mb-4"
              />
              
              {/* Razón */}
              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-2">Motivo del reporte</div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {REPORT_REASONS.map(reason => (
                    <button
                      key={reason.id}
                      onClick={() => setSelectedReason(reason.id)}
                      className={`w-full text-left p-2 rounded transition-all ${
                        selectedReason === reason.id
                          ? 'bg-[#D4AF37]/20 border-l-4 border-[#D4AF37]'
                          : 'hover:bg-gray-800'
                      }`}
                    >
                      <div className="font-bold text-sm">{reason.label}</div>
                      <div className="text-xs text-gray-500">{reason.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Descripción */}
              <textarea
                placeholder="Describe detalladamente el problema..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-black border-2 border-gray-700 p-3 text-white mb-4"
              />
              
              {/* Evidencia */}
              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-2">Evidencia (opcional)</div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setEvidence(Array.from(e.target.files || []))}
                  className="w-full text-sm text-gray-500"
                />
                {evidence.length > 0 && (
                  <div className="mt-2 text-xs text-green-500">{evidence.length} archivo(s) seleccionado(s)</div>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={submitReport}
                  disabled={!selectedReason || !description || !targetName}
                  className="flex-1 py-3 bg-[#D4AF37] text-black font-black disabled:opacity-50"
                >
                  ENVIAR REPORTE
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-3 bg-gray-800 text-white font-black"
                >
                  CANCELAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modal de resolución (solo moderadores) */}
      <AnimatePresence>
        {selectedReport && canModerate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedReport(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-gray-900 border-4 border-[#D4AF37] max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-black text-[#D4AF37] mb-4">RESOLVER REPORTE</h3>
              
              <div className="mb-4 p-3 bg-black rounded">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Reportado por:</span>
                  <span className="text-sm font-bold">{selectedReport.reporterName}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Contenido:</span>
                  <span className="text-sm">{selectedReport.targetName}</span>
                </div>
                <div className="mb-2">
                  <span className="text-sm text-gray-400">Motivo:</span>
                  <p className="text-sm mt-1">{selectedReport.reason}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Descripción:</span>
                  <p className="text-sm mt-1">{selectedReport.description}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-2">Acción a tomar</div>
                <div className="flex gap-2">
                  {[
                    { id: 'warn', label: '⚠️ Advertir', color: 'bg-yellow-600' },
                    { id: 'mute', label: '🔇 Silenciar', color: 'bg-orange-600' },
                    { id: 'ban', label: '🚫 Banear', color: 'bg-red-600' },
                    { id: 'dismiss', label: '❌ Desestimar', color: 'bg-gray-600' },
                  ].map(a => (
                    <button
                      key={a.id}
                      onClick={() => setResolutionAction(a.id)}
                      className={`flex-1 py-2 text-xs font-black rounded transition-all ${
                        resolutionAction === a.id ? a.color : 'bg-gray-800 text-gray-400'
                      } text-white`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <textarea
                placeholder="Notas de resolución (opcional)"
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                rows={3}
                className="w-full bg-black border-2 border-gray-700 p-3 text-white mb-4"
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => resolveReport(selectedReport)}
                  disabled={!resolutionAction}
                  className="flex-1 py-3 bg-[#D4AF37] text-black font-black disabled:opacity-50"
                >
                  APLICAR RESOLUCIÓN
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="flex-1 py-3 bg-gray-800 text-white font-black"
                >
                  CANCELAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}