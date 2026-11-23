import React, { useState } from 'react';
import { EngineType, ClientBrief, ReferenceExample, SUPPORTED_AI_MODELS } from '../types.ts';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Cpu,
  FileText,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Clock,
  Zap,
} from 'lucide-react';

interface Stage3Props {
  engine: EngineType;
  promptName: string;
  promptVersion: string;
  systemPrompt: string;
  brief: ClientBrief;
  referenceExamples: ReferenceExample[];
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  isExecuting: boolean;
  executionError: string | null;
  onExecute: () => void;
  onBack: () => void;
  onGoToResults: () => void;
  hasLastOutput: boolean;
  lastExecutionDuration?: number;
}

export const Stage3RunExperiment: React.FC<Stage3Props> = ({
  engine,
  promptName,
  promptVersion,
  systemPrompt,
  brief,
  referenceExamples,
  selectedModel,
  setSelectedModel,
  isExecuting,
  executionError,
  onExecute,
  onBack,
  onGoToResults,
  hasLastOutput,
  lastExecutionDuration,
}) => {
  const activeExamplesCount = referenceExamples.filter((e) => e.enabled).length;

  return (
    <div className="space-y-6">
      {/* Top Pre-flight Overview */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 md:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
        <div>
          <h3 className="text-base font-bold text-zinc-900">
            مراجعة محددات التجربة قبل الإطلاق (Experiment Pre-flight)
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            ملخص شامل للمدخلات التي ستُرسل إلى النموذج الذكي. تأكد من اكتمال البرومبت وموجز العميل.
          </p>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-500 font-medium">
              <Layers size={14} />
              <span>المحرك التسويقي</span>
            </div>
            <div className="font-bold text-zinc-900 text-sm">{engine}</div>
            <div className="text-[11px] text-zinc-500">
              {promptName || 'بدون اسم'} (v{promptVersion})
            </div>
          </div>

          <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-500 font-medium">
              <FileText size={14} />
              <span>البراند والسوق المستهدف</span>
            </div>
            <div className="font-bold text-zinc-900 text-sm truncate">
              {brief.brandName || 'براند غير محدد'}
            </div>
            <div className="text-[11px] text-zinc-500 truncate">
              {brief.country || 'السوق العام'} {brief.industry ? `• ${brief.industry}` : ''}
            </div>
          </div>

          <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-500 font-medium">
              <BookOpen size={14} />
              <span>الأمثلة المرجعية المفعلة</span>
            </div>
            <div className="font-bold text-zinc-900 text-sm">
              {activeExamplesCount} من {referenceExamples.length}
            </div>
            <div className="text-[11px] text-zinc-500">
              {activeExamplesCount > 0 ? 'مضمنة في سياق الطلب' : 'لا توجد أمثلة ممررة'}
            </div>
          </div>

          <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-500 font-medium">
              <Cpu size={14} />
              <span>حجم الـ System Prompt</span>
            </div>
            <div className="font-bold text-zinc-900 text-sm">
              {systemPrompt.trim().length.toLocaleString()} حرف
            </div>
            <div className="text-[11px] text-zinc-500">
              {systemPrompt.trim().length === 0 ? (
                <span className="text-rose-600 font-semibold">تحذير: البرومبت فارغ!</span>
              ) : (
                'جاهز للإرسال كـ Instruction'
              )}
            </div>
          </div>
        </div>

        {/* Model Selection */}
        <div className="pt-3 border-t border-zinc-100">
          <label className="block text-xs font-semibold text-zinc-800 mb-2">
            اختيار النموذج الذكي (Model Selection):
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SUPPORTED_AI_MODELS.map((m) => {
              const isSelected = selectedModel === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedModel(m.id)}
                  className={`text-right p-3.5 rounded-lg border transition text-xs cursor-pointer ${
                    isSelected
                      ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                      : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm">{m.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded ${
                        isSelected ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {m.badge}
                    </span>
                  </div>
                  <p
                    className={`leading-relaxed text-[11px] ${
                      isSelected ? 'text-zinc-300' : 'text-zinc-500'
                    }`}
                  >
                    {m.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Input Preview Accordion / Inspection */}
        <div className="pt-3 border-t border-zinc-100">
          <div className="text-xs font-semibold text-zinc-700 mb-2">
            معاينة نص الطلب الفعلي الذي سيُرسل:
          </div>
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs text-zinc-700 font-mono space-y-2 max-h-48 overflow-y-auto" dir="auto">
            <div>
              <strong className="text-zinc-900 font-sans">[System Instruction]:</strong>{' '}
              {systemPrompt.trim() ? systemPrompt : '(فارغ - يرجى كتابة برومبت في المرحلة الأولى)'}
            </div>
            <div className="pt-2 border-t border-zinc-200">
              <strong className="text-zinc-900 font-sans">[User Content]:</strong>
              <div className="whitespace-pre-wrap mt-1">
                {brief.brandName ? `اسم البراند: ${brief.brandName}\n` : ''}
                {brief.country ? `السوق: ${brief.country}\n` : ''}
                {brief.clientBrief ? `موجز العميل: ${brief.clientBrief}\n` : ''}
                {activeExamplesCount > 0 ? `+ ${activeExamplesCount} مثال مرجعي` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Execution Trigger Box */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 md:p-8 text-center space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h4 className="text-lg md:text-xl font-bold text-zinc-900 mb-1">
            بدء التجربة المباشرة
          </h4>
          <p className="text-xs md:text-sm text-zinc-500 max-w-lg mx-auto">
            Execute Prompt — "تشغيل البرومبت على البيانات المدخلة."
          </p>
        </div>

        {/* Prominent Execute Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onExecute}
            disabled={isExecuting || !systemPrompt.trim()}
            className="w-full sm:w-auto min-w-[280px] px-8 py-3.5 bg-zinc-900 text-white rounded-xl text-base font-bold hover:bg-zinc-800 disabled:opacity-40 transition shadow-md hover:shadow-lg flex items-center justify-center gap-3 mx-auto cursor-pointer"
          >
            {isExecuting ? (
              <>
                <Loader2 size={20} className="animate-spin text-zinc-300" />
                <span>جارٍ تشغيل التجربة واستدعاء النموذج...</span>
              </>
            ) : (
              <>
                <Play size={18} fill="currentColor" />
                <span>تشغيل البرومبت (Execute Prompt)</span>
              </>
            )}
          </button>

          {!systemPrompt.trim() && (
            <p className="text-xs text-rose-600 mt-2">
              يرجى كتابة System Prompt في المرحلة الأولى قبل التشغيل.
            </p>
          )}
        </div>

        {/* Error notification */}
        {executionError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs md:text-sm text-rose-800 text-right flex items-start gap-3 max-w-2xl mx-auto">
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-rose-600" />
            <div className="space-y-1">
              <div className="font-bold">فشل تشغيل التجربة:</div>
              <div className="leading-relaxed">{executionError}</div>
              <div className="text-[11px] text-rose-600 mt-1">
                تأكد من تهيئة مفتاح GEMINI_API_KEY في ملف البيئة أو لوحة الإعدادات.
              </div>
            </div>
          </div>
        )}

        {/* Last Run Success Bar */}
        {hasLastOutput && !isExecuting && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs md:text-sm text-emerald-900 text-right flex items-center justify-between gap-3 max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">اكتمل التوليد بنجاح!</span>
                {lastExecutionDuration && (
                  <span className="text-xs text-emerald-700 mr-2">
                    (استغرق { (lastExecutionDuration / 1000).toFixed(2) } ثانية)
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onGoToResults}
              className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 transition cursor-pointer"
            >
              عرض النتيجة والتقييم ←
            </button>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-zinc-300 text-zinc-700 rounded-lg text-xs md:text-sm font-medium hover:bg-zinc-50 transition cursor-pointer"
        >
          <span>→</span>
          <span>العودة لإدخال البيانات</span>
        </button>

        {hasLastOutput && (
          <button
            type="button"
            onClick={onGoToResults}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-zinc-900 text-white rounded-lg text-xs md:text-sm font-medium hover:bg-zinc-800 transition cursor-pointer"
          >
            <span>الانتقال لمراجعة النتائج والتقييم</span>
            <span>←</span>
          </button>
        )}
      </div>
    </div>
  );
};
