import React, { useState } from 'react';
import { EngineId, EngineType } from '../types.ts';
import { ENGINE_LIST } from '../utils/storage.ts';
import {
  Save,
  PlusCircle,
  Trash2,
  FolderOpen,
  Copy,
  Check,
  FileCode,
  Sparkles,
} from 'lucide-react';

interface Stage1Props {
  engineId: EngineId;
  engine: EngineType;
  onSwitchEngine: (engineId: EngineId) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  promptNotes: string;
  setPromptNotes: (notes: string) => void;
  promptName: string;
  setPromptName: (name: string) => void;
  promptVersion: string;
  activePromptId: string | null;
  hasUnsavedChanges: boolean;
  onSavePrompt: () => void;
  onSaveNewVersion: () => void;
  onOpenSavedModal: () => void;
  onNext: () => void;
}

export const Stage1PromptEditor: React.FC<Stage1Props> = ({
  engineId,
  engine,
  onSwitchEngine,
  systemPrompt,
  setSystemPrompt,
  promptNotes,
  setPromptNotes,
  promptName,
  setPromptName,
  promptVersion,
  activePromptId,
  hasUnsavedChanges,
  onSavePrompt,
  onSaveNewVersion,
  onOpenSavedModal,
  onNext,
}) => {
  const [copied, setCopied] = useState(false);
  const [showInspirations, setShowInspirations] = useState(false);

  const handleCopy = async () => {
    if (!systemPrompt) return;
    try {
      await navigator.clipboard.writeText(systemPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleClear = () => {
    if (systemPrompt && !confirm('هل أنت متأكد من مسح محرر البرومبت لهذا المحرك بالكامل؟')) {
      return;
    }
    setSystemPrompt('');
  };

  // Optional quick prompt skeletons
  const quickTemplates: { title: string; prompt: string }[] = [
    {
      title: 'قالب استراتيجية براند عربية',
      prompt: `أنت خبير استراتيجي أول في بناء العلامات التجارية للشركات في الوطن العربي.
مهمتك: صياغة استراتيجية براند متماسكة وعملية بناءً على موجز العميل (Client Brief).

يجب أن تتضمن مخرجاتك الأقسام التالية بوضوح وبنود منظمة:
1. Strategy Overview (نظرة عامة على الاستراتيجية)
2. Brand Positioning (تموضع العلامة التجارية)
3. Target Audience (الجمهور المستهدف وشخصية العميل)
4. Brand Voice (نبرة وصوت البراند)
5. Marketing Objectives (الأهداف التسويقية)
6. Content Pillars (ركائز المحتوى الأساسية)
7. Recommendations (التوصيات وخطة التنفيذ)
8. Missing Information (المعلومات الناقصة التي تحتاجها الحملة)

التزم بنبرة تسويقية محترفة وواقعية وتجنب العموميات.`,
    },
    {
      title: 'قالب أفكار حملات إبداعية',
      prompt: `أنت مدير إبداعي (Creative Director) في وكالة إعلانية رائدة.
مهمتك: توليد 3 أفكار حملات تسويقية غير تقليدية ومبنية على بصيرة حقيقية (Consumer Insight) مستخرجة من موجز العميل.

لكل فكرة اذكر:
- الاسم الإبداعي للحملة (Big Idea)
- البصيرة النفسية للعميل (Insight)
- فكرة الفيديو الإعلاني الرئيسي (Hero Video Hook)
- الزوايا الإعلانية عبر منصات التواصل (Social Angles)
- الدعوة لإتخاذ إجراء (CTA) المبتكرة`,
    },
    {
      title: 'قالب كاتب نصوص إعلانية محلي',
      prompt: `أنت كاتب محتوى إعلاني (Copywriter) محترف وخبير في سيكولوجيا الشراء والتأثير.
مهمتك: كتابة نصوص إعلانية جذابة ومباشرة بناءً على موجز العميل والجمهور المستهدف.

المخرجات المطلوبة:
1. 3 خيارات عناوين Hook تخطف الانتباه
2. نص إعلاني رئيسي بصيغة المشكلة والحل (PAS Framework)
3. 3 خيارات لزر الدعوة لاتخاذ إجراء (Call to Action)
احرص على استخدام اللهجة المحددة في موجز العميل بطلاقة وعفوية.`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 md:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Engine Selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="block text-sm font-semibold text-zinc-900">
                اختيار المحرك التسويقي (Engine Selector)
              </label>
              <p className="text-xs text-zinc-500 mt-0.5">
                لكل محرك برومبت ومسودات ومكتبة خاصة به مستقلة تماماً ومحفوظة بمعزل عن المحركات الأخرى
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded border border-zinc-200 font-semibold">
              المحرك الحالي: {engine}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ENGINE_LIST.map((item) => {
              const isSelected = engineId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSwitchEngine(item.id)}
                  className={`text-right p-3.5 rounded-lg border transition-all text-xs md:text-sm cursor-pointer ${
                    isSelected
                      ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-900'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-800'
                  }`}
                >
                  <div className="font-semibold flex items-center justify-between">
                    <span>{item.label}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  <div
                    className={`text-xs mt-1 leading-relaxed ${
                      isSelected ? 'text-zinc-300' : 'text-zinc-500'
                    }`}
                  >
                    {item.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prompt Meta / Identity Row */}
        <div className="pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-zinc-500 font-medium">اسم برومبت {engine}:</span>
            <input
              type="text"
              value={promptName}
              onChange={(e) => setPromptName(e.target.value)}
              placeholder="مثال: استراتيجية إطلاق منتج جديد"
              className="px-2.5 py-1 border border-zinc-200 rounded text-zinc-800 text-xs md:text-sm focus:outline-none focus:border-zinc-600 bg-zinc-50/50 min-w-[220px]"
            />
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-xs font-mono">
              الإصدار: v{promptVersion}
            </span>
            {hasUnsavedChanges && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                مسودة غير محفوظة
              </span>
            )}
            {activePromptId && !hasUnsavedChanges && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                محفوظ في المكتبة
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSavedModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition text-xs font-medium cursor-pointer"
            >
              <FolderOpen size={14} />
              <span>مكتبة برومبتات {engine}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowInspirations(!showInspirations)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition text-xs font-medium cursor-pointer"
            >
              <Sparkles size={14} className="text-amber-600" />
              <span>قوالب استرشادية</span>
            </button>
          </div>
        </div>

        {/* Optional templates drawer */}
        {showInspirations && (
          <div className="mt-4 p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-xs space-y-2">
            <div className="flex items-center justify-between font-semibold text-zinc-800 mb-1">
              <span>نماذج استرشادية اختيارية (انقر لتطبيق القالب في محرر {engine}):</span>
              <button
                type="button"
                onClick={() => setShowInspirations(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {quickTemplates.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSystemPrompt(t.prompt);
                    setShowInspirations(false);
                  }}
                  className="text-right p-2.5 bg-white border border-zinc-200 rounded hover:border-zinc-400 text-zinc-800 transition cursor-pointer"
                >
                  <div className="font-semibold text-zinc-900 mb-1">{t.title}</div>
                  <div className="text-[11px] text-zinc-500 line-clamp-2">{t.prompt}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main System Prompt Editor Card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 md:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <FileCode size={18} className="text-zinc-700" />
              <label htmlFor="system-prompt" className="text-sm md:text-base font-bold text-zinc-900">
                محرر System Prompt لمحرّك ({engine})
              </label>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              التعليمات التأسيسية الخاصة بمحرك ({engine}). التعديل هنا ينطبق حصرياً على هذا المحرك دون غيره.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!systemPrompt}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded hover:bg-zinc-50 disabled:opacity-40 cursor-pointer"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={!systemPrompt}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 hover:text-rose-800 border border-rose-100 rounded hover:bg-rose-50 disabled:opacity-40 cursor-pointer"
            >
              <Trash2 size={13} />
              <span>مسح</span>
            </button>
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            id="system-prompt"
            rows={14}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder={`اكتب الـ System Prompt الخاص بمحرك ${engine} هنا بحرية كاملة...
(مثال: أنت مستشار تسويقي معتمد، مهمتك إعداد مخرجات متخصصة وفق الأقسام التالية...)`}
            className="w-full p-4 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 leading-relaxed font-sans bg-[#FCFCFB] transition resize-y"
            dir="auto"
          />
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1 px-1">
            <span>يدعم الكتابة باللغة العربية والإنجليزية • برومبت معزول لمحرك {engine}</span>
            <span>عدد الأحرف: {systemPrompt.length.toLocaleString()}</span>
          </div>
        </div>

        {/* Optional Notes Field */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-zinc-700 mb-1">
            ملاحظات توثيقية حول هدف وسياق هذا البرومبت (اختياري):
          </label>
          <input
            type="text"
            value={promptNotes}
            onChange={(e) => setPromptNotes(e.target.value)}
            placeholder="مثال: تم إعداد هذا البرومبت لاختبار قدرة المحرك على استخراج الزوايا النفسية لجمهور الخليج"
            className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-600 bg-zinc-50/50"
          />
        </div>

        {/* Bottom Actions Bar */}
        <div className="pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSavePrompt}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs md:text-sm font-medium hover:bg-zinc-800 transition shadow-sm cursor-pointer"
            >
              <Save size={15} />
              <span>حفظ البرومبت (Save)</span>
            </button>

            <button
              type="button"
              onClick={onSaveNewVersion}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-300 text-zinc-800 rounded-lg text-xs md:text-sm font-medium hover:bg-zinc-50 transition cursor-pointer"
            >
              <PlusCircle size={15} />
              <span>حفظ كإصدار جديد (Save as New Version)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-zinc-800 text-white rounded-lg text-xs md:text-sm font-medium hover:bg-zinc-900 transition cursor-pointer"
          >
            <span>المتابعة إلى إدخال البيانات</span>
            <span>←</span>
          </button>
        </div>
      </div>
    </div>
  );
};
