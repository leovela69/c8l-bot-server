// app/admin/reports/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { CheckCircle, XCircle, Eye } from 'lucide-react';

export default function ReportsManagement() {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    const { data } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    setReports(data || []);
  }

  async function resolveReport(reportId: string, action: 'resolve' | 'dismiss') {
    await supabase
      .from('reports')
      .update({ status: action === 'resolve' ? 'resolved' : 'dismissed', resolved_at: new Date() })
      .eq('id', reportId);
    loadReports();
    setSelectedReport(null);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-[#D4AF37]">Reportes de usuarios</h1>
      <div className="space-y-3">
        {reports.map(report => (
          <div key={report.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-bold">Reportado por: {report.reporter_name}</p>
                <p className="text-sm text-gray-400">Motivo: {report.reason}</p>
                <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                <p className="text-xs text-gray-600 mt-2">{new Date(report.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelectedReport(report)} className="p-2 bg-gray-800 rounded hover:bg-gray-700"><Eye size={16} /></button>
                <button onClick={() => resolveReport(report.id, 'resolve')} className="p-2 bg-green-600 rounded hover:bg-green-700"><CheckCircle size={16} /></button>
                <button onClick={() => resolveReport(report.id, 'dismiss')} className="p-2 bg-red-600 rounded hover:bg-red-700"><XCircle size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}