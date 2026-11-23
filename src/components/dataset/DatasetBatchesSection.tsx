import React, { useState, useEffect } from 'react';
import { ImportBatchRecord } from '../../types.ts';
import { Archive, FileText, CheckCircle2, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

export const DatasetBatchesSection: React.FC = () => {
  const [batches, setBatches] = useState<ImportBatchRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dataset/batches');
      const data = await res.json();
      setBatches(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="font-bold text-zinc-900 text-sm md:text-base">
            سجل دفعات الاستيراد التاريخية (Import History & Provenance)
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            تتبع شامل لكل دفعة تم استيرادها، مع تفصيل السجلات المضافة والمكررة وغير الصالحة.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchBatches}
          className="p-2 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
          title="تحديث السجل"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold text-[11px]">
              <tr>
                <th className="p-3">معرف الدفعة (Batch ID)</th>
                <th className="p-3">اسم الملف والصيغة</th>
                <th className="p-3">تاريخ الاستيراد</th>
                <th className="p-3">المكتشف</th>
                <th className="p-3">أُضيفت</th>
                <th className="p-3">مكررات تم تخطيها</th>
                <th className="p-3">غير صالح</th>
                <th className="p-3">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-400">
                    جارٍ تحميل دفعات الاستيراد...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-400">
                    لا توجد دفعات استيراد مسجلة حتى الآن.
                  </td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-50/70 transition">
                    <td className="p-3 font-mono font-bold text-zinc-800 text-[11px]">
                      {b.id}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-zinc-900 truncate max-w-[200px]">
                        {b.fileName}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {b.fileFormat?.toUpperCase()}
                      </div>
                    </td>
                    <td className="p-3 text-[11px] text-zinc-500 whitespace-nowrap">
                      {new Date(b.importedAt).toLocaleString('ar-EG')}
                    </td>
                    <td className="p-3 font-mono font-bold text-zinc-900">
                      {b.totalDetected}
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-800">
                      +{b.insertedCount}
                    </td>
                    <td className="p-3 font-mono font-medium text-amber-800">
                      {b.skippedDuplicatesCount}
                    </td>
                    <td className="p-3 font-mono font-medium text-rose-800">
                      {b.invalidCount}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {b.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 size={12} />
                          مكتمل
                        </span>
                      ) : b.status === 'partial' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertTriangle size={12} />
                          استيراد جزئي
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          فشل
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
