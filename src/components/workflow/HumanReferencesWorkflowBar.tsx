import React from 'react';
import {
  Sparkles,
  Database,
  ShieldCheck,
  Check,
  Info,
  ChevronLeft,
} from 'lucide-react';

interface HumanReferencesWorkflowBarProps {
  useHumanReferences: boolean;
  onToggleHumanReferences: (enabled: boolean) => void;
  lastReferencesUsed?: {
    count: number;
    sampleTitles: string[];
    usedAtStage?: string;
  };
  onOpenInspectModal: () => void;
}

export const HumanReferencesWorkflowBar: React.FC<HumanReferencesWorkflowBarProps> = ({
  useHumanReferences,
  onToggleHumanReferences,
  lastReferencesUsed,
  onOpenInspectModal,
}) => {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs mb-6">
      {/* Left / Start: Toggle Control & Explanation */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            checked={useHumanReferences}
            onChange={(e) => onToggleHumanReferences(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-700"></div>
          <span className="mr-2 text-xs font-bold text-zinc-900 flex items-center gap-1.5">
            <Database size={14} className={useHumanReferences ? 'text-purple-700' : 'text-zinc-400'} />
            <span>الاستعانة بالمراجع البشرية المعتمدة (Approved Human References)</span>
          </span>
        </label>

        {useHumanReferences ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <Sparkles size={11} />
            مفعّل: استلهام النبرة والخطافات دون نسخ حرفي
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
            معطل: اعتماد حصري على نموذج الذكاء الاصطناعي وموجز العميل
          </span>
        )}
      </div>

      {/* Right / End: Transparency indicator & Inspect button */}
      <div className="flex items-center gap-2 flex-wrap">
        {lastReferencesUsed && lastReferencesUsed.count > 0 && (
          <button
            type="button"
            onClick={onOpenInspectModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition cursor-pointer"
            title="انقر لمعاينة السجلات المعتمدة التي تم الاستناد إليها"
          >
            <ShieldCheck size={14} className="text-emerald-700" />
            <span>تم الاستناد إلى {lastReferencesUsed.count} مراجع بشرية</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenInspectModal}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-medium transition cursor-pointer"
        >
          <span>معاينة المراجع المؤهلة</span>
          <ChevronLeft size={13} className="text-zinc-400" />
        </button>
      </div>
    </div>
  );
};
