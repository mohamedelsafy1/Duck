import React from 'react';
import { RotateCcw, AlertTriangle, ShieldCheck, BookmarkPlus, X } from 'lucide-react';

interface ResetWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: (saveToHistoryFirst: boolean) => void;
  projectName: string;
  selectedModelName: string;
  currentStage: number;
  hasStrategy: boolean;
  hasIdeas: boolean;
  hasDeliverables: boolean;
}

export const ResetWorkflowModal: React.FC<ResetWorkflowModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
  projectName,
  selectedModelName,
  currentStage,
  hasStrategy,
  hasIdeas,
  hasDeliverables,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-right" dir="rtl">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <RotateCcw size={18} />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 text-sm md:text-base">
                إعادة تعيين مسار العمل (Reset Workflow)
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                بدء استراتيجية أو فرضية تسويقية جديدة لنفس المشروع
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 md:p-6 space-y-4 text-xs">
          {/* Active Project & Model Context Chip */}
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 font-medium">المشروع الحالي:</span>
              <span className="font-bold text-zinc-900 truncate max-w-[180px]">{projectName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">النموذج:</span>
              <span className="bg-zinc-200/80 text-zinc-800 px-2 py-0.5 rounded text-[11px] font-mono font-semibold">
                {selectedModelName}
              </span>
            </div>
          </div>

          <p className="text-zinc-600 leading-relaxed">
            يتيح لك هذا الإجراء تفريغ مسودة العمل الحالية والبدء بخطة تسويقية جديدة من المرحلة الأولى دون الحاجة لإنشاء مشروع مكرر.
          </p>

          {/* Contrast Box: Cleared vs Preserved */}
          <div className="space-y-2.5">
            {/* Cleared Transient State */}
            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1.5">
              <div className="font-bold text-rose-900 flex items-center gap-1.5 text-xs">
                <AlertTriangle size={14} className="text-rose-600" />
                <span>سيتم تفريغ مسودة التنفيذ الحالية (Transient State):</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800 leading-relaxed pr-1">
                {hasStrategy && <li>مسودة استراتيجية البراند وإصداراتها في هذا المسار.</li>}
                {hasIdeas && <li>أفكار المحتوى وقوائم الاعتماد والقوالب المؤقتة.</li>}
                {hasDeliverables && <li>المخرجات التسويقية التنفيذية قيد الإنتاج.</li>}
                <li>حالات التحميل وأي أخطاء مؤقتة سابقة في هذا المسار.</li>
              </ul>
            </div>

            {/* Preserved Persistent Data */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                <ShieldCheck size={14} className="text-emerald-700" />
                <span>البيانات المحفوظة التي لن تُحذف وستبقى سليمة (Preserved):</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-800 leading-relaxed pr-1">
                <li>المشروع نفسه وموجز العميل بالكامل (Brand Brief).</li>
                <li>إعدادات المشروع والنموذج المختار ({selectedModelName}).</li>
                <li>البرومبتات المحفوظة في المكتبة وتاريخ إصداراتها.</li>
                <li>النتائج والخطط المحفوظة مسبقاً في سجل التجارب.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 md:p-5 border-t border-zinc-100 bg-zinc-50 flex flex-col sm:flex-row-reverse items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Save to history first, then reset */}
            {(hasStrategy || hasDeliverables) && (
              <button
                type="button"
                onClick={() => onConfirmReset(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition cursor-pointer shadow-xs"
                title="حفظ المسودة الحالية في السجل قبل إعادة التعيين لضمان عدم ضياعها"
              >
                <BookmarkPlus size={14} />
                <span>حفظ الخطة في السجل أولاً ثم التعيين</span>
              </button>
            )}

            {/* Reset directly */}
            <button
              type="button"
              onClick={() => onConfirmReset(false)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer shadow-xs"
            >
              <RotateCcw size={14} />
              <span>تأكيد والبدء من جديد</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 transition cursor-pointer"
          >
            إلغاء والعودة
          </button>
        </div>
      </div>
    </div>
  );
};
