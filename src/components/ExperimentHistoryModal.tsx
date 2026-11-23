import React, { useState } from 'react';
import { ExperimentRun } from '../types.ts';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';
import {
  History,
  X,
  Trash2,
  ArrowUpRight,
  RotateCcw,
  Sparkles,
  UserCheck,
  Columns2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ExperimentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ExperimentRun[];
  onLoadRun: (run: ExperimentRun) => void;
  onDeleteRun: (id: string) => void;
  onClearAll: () => void;
}

export const ExperimentHistoryModal: React.FC<ExperimentHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onLoadRun,
  onDeleteRun,
  onClearAll,
}) => {
  const [selectedRun, setSelectedRun] = useState<ExperimentRun | null>(null);
  const [compareRunA, setCompareRunA] = useState<ExperimentRun | null>(null);
  const [compareRunB, setCompareRunB] = useState<ExperimentRun | null>(null);
  const [isCompareMode, setIsCompareMode] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={18} className="text-zinc-700" />
            <h3 className="font-bold text-zinc-900 text-sm md:text-base">
              سجل التجارب السابقة (Experiment History)
            </h3>
            <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full font-mono">
              {history.length} تجربة
            </span>
          </div>

          <div className="flex items-center gap-2">
            {history.length >= 2 && (
              <button
                type="button"
                onClick={() => {
                  setIsCompareMode(!isCompareMode);
                  if (!isCompareMode) {
                    setCompareRunA(history[0]);
                    setCompareRunB(history[1]);
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition ${
                  isCompareMode
                    ? 'border-zinc-900 bg-zinc-900 text-white'
                    : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <Columns2 size={13} />
                <span>{isCompareMode ? 'إنهاء المقارنة' : 'مقارنة تجربتين جنب لجنب'}</span>
              </button>
            )}

            {history.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('هل أنت متأكد من مسح سجل التجارب بالكامل؟')) {
                    onClearAll();
                  }
                }}
                className="text-xs text-rose-600 hover:text-rose-800 p-1.5 cursor-pointer"
                title="مسح كل السجل"
              >
                <Trash2 size={15} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        {isCompareMode ? (
          /* Compare Mode */
          <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between text-xs bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
              <span className="font-bold text-zinc-800">وضع مقارنة تجربتين (Side-by-Side Comparison):</span>
              <span className="text-zinc-500">اختر التجربة لكل عمود لمقارنة المخرجات والتقييمات</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden">
              {/* Column A */}
              <div className="border border-zinc-200 rounded-xl flex flex-col overflow-hidden bg-white">
                <div className="p-3 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-800">التجربة (أ):</span>
                  <select
                    value={compareRunA?.id || ''}
                    onChange={(e) => {
                      const found = history.find((h) => h.id === e.target.value);
                      if (found) setCompareRunA(found);
                    }}
                    className="p-1 text-xs border border-zinc-200 rounded bg-white text-zinc-800 max-w-[200px]"
                  >
                    {history.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.promptName || 'بدون اسم'} (v{h.promptVersion}) - {h.brief.brandName || 'براند'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="p-4 overflow-y-auto flex-1 text-xs space-y-3">
                  {compareRunA ? (
                    <>
                      <div className="text-[11px] text-zinc-500 pb-2 border-b border-zinc-100 flex items-center justify-between">
                        <span>البراند: {compareRunA.brief.brandName || 'غير محدد'}</span>
                        <span>{compareRunA.engine}</span>
                      </div>
                      {compareRunA.aiEvaluation && (
                        <div className="p-2 bg-zinc-50 border border-zinc-200 rounded text-zinc-800 font-bold">
                          تقييم الذكاء الاصطناعي: {compareRunA.aiEvaluation.overallWeightedScore} / 10
                        </div>
                      )}
                      <div className="leading-relaxed whitespace-pre-wrap">
                        <MarkdownRenderer content={compareRunA.output} />
                      </div>
                    </>
                  ) : (
                    <div className="text-zinc-400 text-center py-10">اختر تجربة للمقارنة</div>
                  )}
                </div>
              </div>

              {/* Column B */}
              <div className="border border-zinc-200 rounded-xl flex flex-col overflow-hidden bg-white">
                <div className="p-3 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-800">التجربة (ب):</span>
                  <select
                    value={compareRunB?.id || ''}
                    onChange={(e) => {
                      const found = history.find((h) => h.id === e.target.value);
                      if (found) setCompareRunB(found);
                    }}
                    className="p-1 text-xs border border-zinc-200 rounded bg-white text-zinc-800 max-w-[200px]"
                  >
                    {history.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.promptName || 'بدون اسم'} (v{h.promptVersion}) - {h.brief.brandName || 'براند'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="p-4 overflow-y-auto flex-1 text-xs space-y-3">
                  {compareRunB ? (
                    <>
                      <div className="text-[11px] text-zinc-500 pb-2 border-b border-zinc-100 flex items-center justify-between">
                        <span>البراند: {compareRunB.brief.brandName || 'غير محدد'}</span>
                        <span>{compareRunB.engine}</span>
                      </div>
                      {compareRunB.aiEvaluation && (
                        <div className="p-2 bg-zinc-50 border border-zinc-200 rounded text-zinc-800 font-bold">
                          تقييم الذكاء الاصطناعي: {compareRunB.aiEvaluation.overallWeightedScore} / 10
                        </div>
                      )}
                      <div className="leading-relaxed whitespace-pre-wrap">
                        <MarkdownRenderer content={compareRunB.output} />
                      </div>
                    </>
                  ) : (
                    <div className="text-zinc-400 text-center py-10">اختر تجربة للمقارنة</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Normal History List and Detail view */
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Left/Sidebar list */}
            <div className="w-full md:w-80 border-b md:border-b-0 md:border-l border-zinc-200 overflow-y-auto p-3 space-y-2 bg-zinc-50/50">
              {history.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 text-xs">
                  لا توجد تجارب مسجلة حتى الآن.
                </div>
              ) : (
                history.map((run) => {
                  const isSelected = selectedRun?.id === run.id;
                  return (
                    <button
                      key={run.id}
                      type="button"
                      onClick={() => setSelectedRun(run)}
                      className={`w-full text-right p-3 rounded-xl border transition text-xs cursor-pointer ${
                        isSelected
                          ? 'border-zinc-900 bg-white shadow-xs'
                          : 'border-zinc-200/80 bg-white/70 hover:bg-white hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-zinc-900 truncate">
                          {run.promptName || 'تجربة بدون اسم'}
                        </span>
                        <span className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded font-mono text-zinc-600">
                          v{run.promptVersion}
                        </span>
                      </div>

                      <div className="text-[11px] text-zinc-500 truncate mb-1">
                        البراند: <strong>{run.brief.brandName || 'غير محدد'}</strong>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span>{run.engine}</span>
                        {run.aiEvaluation ? (
                          <span className="text-emerald-700 font-bold">
                            ★ {run.aiEvaluation.overallWeightedScore}
                          </span>
                        ) : run.humanEvaluation ? (
                          <span className="text-zinc-700 font-bold">
                            بشري: {run.humanEvaluation.score}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Main Details Panel */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {selectedRun ? (
                <div className="space-y-4 text-xs">
                  {/* Top Bar for Selected Run */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm md:text-base font-bold text-zinc-900">
                          {selectedRun.promptName || 'تجربة بدون اسم'}
                        </h4>
                        <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded font-mono">
                          v{selectedRun.promptVersion}
                        </span>
                        <span className="text-xs bg-zinc-900 text-white px-2 py-0.5 rounded">
                          {selectedRun.engine}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1">
                        التاريخ:{' '}
                        {new Date(selectedRun.timestamp).toLocaleDateString('ar-EG', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onLoadRun(selectedRun);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw size={13} />
                        <span>استرجاع هذه التجربة في مساحة العمل</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('هل أنت متأكد من حذف هذه التجربة من السجل؟')) {
                            onDeleteRun(selectedRun.id);
                            setSelectedRun(null);
                          }
                        }}
                        className="text-rose-600 hover:text-rose-800 p-1.5 cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Client Brief Summary */}
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
                    <span className="font-bold text-zinc-800">بيانات وموجز العميل المستخدم:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-zinc-600 pt-1">
                      <div>
                        <strong>البراند:</strong> {selectedRun.brief.brandName || '-'}
                      </div>
                      <div>
                        <strong>السوق:</strong> {selectedRun.brief.country || '-'}
                      </div>
                      <div>
                        <strong>المجال:</strong> {selectedRun.brief.industry || '-'}
                      </div>
                      <div>
                        <strong>الجمهور:</strong> {selectedRun.brief.targetAudience || '-'}
                      </div>
                      <div>
                        <strong>الهدف:</strong> {selectedRun.brief.marketingObjective || '-'}
                      </div>
                      <div>
                        <strong>اللهجة:</strong> {selectedRun.brief.languageDialect || '-'}
                      </div>
                    </div>
                    {selectedRun.brief.clientBrief && (
                      <div className="text-[11px] text-zinc-700 bg-white p-2 rounded border border-zinc-200 mt-1 whitespace-pre-wrap">
                        {selectedRun.brief.clientBrief}
                      </div>
                    )}
                  </div>

                  {/* System Prompt used */}
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
                    <span className="font-bold text-zinc-800">الـ System Prompt المستخدم في التجربة:</span>
                    <div className="text-[11px] text-zinc-700 font-mono bg-white p-2.5 rounded border border-zinc-200 line-clamp-4 whitespace-pre-wrap" dir="auto">
                      {selectedRun.systemPrompt}
                    </div>
                  </div>

                  {/* AI Evaluation overview if present */}
                  {selectedRun.aiEvaluation && (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="font-bold text-emerald-950">
                          التقييم بالذكاء الاصطناعي: {selectedRun.aiEvaluation.overallWeightedScore} / 10
                        </span>
                        <div className="text-[11px] text-emerald-800 mt-0.5">
                          {selectedRun.aiEvaluation.overallSummary}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Human Evaluation if present */}
                  {selectedRun.humanEvaluation && (
                    <div className="p-3 bg-zinc-100 border border-zinc-200 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="font-bold text-zinc-900">
                          التقييم البشري: {selectedRun.humanEvaluation.score} / 10
                        </span>
                        <span className="mr-2 text-[11px] px-2 py-0.5 rounded bg-zinc-200 text-zinc-700 font-medium">
                          {selectedRun.humanEvaluation.status === 'approved' ? 'معتمد' : selectedRun.humanEvaluation.status === 'rejected' ? 'مرفوض' : 'معلق'}
                        </span>
                        {selectedRun.humanEvaluation.feedback && (
                          <div className="text-[11px] text-zinc-600 mt-0.5">
                            "{selectedRun.humanEvaluation.feedback}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Output Render */}
                  <div>
                    <h5 className="font-bold text-zinc-900 mb-2">المخرجات المولدة (Output):</h5>
                    <div className="p-4 bg-[#FCFCFB] border border-zinc-200 rounded-xl leading-relaxed" dir="auto">
                      <MarkdownRenderer content={selectedRun.output} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-24 text-center text-zinc-400 text-xs">
                  اختر تجربة من القائمة الجانبية لعرض تفاصيلها ومخرجاتها وتقييماتها.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-zinc-100 bg-zinc-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-100 cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
