import React, { useState } from 'react';
import {
  AIEvaluation,
  HumanEvaluation,
  EngineType,
  ClientBrief,
  ExperimentRun,
} from '../types.ts';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';
import {
  tryParseJSON,
  extractBrandStrategySections,
  BrandStrategySections,
} from '../utils/outputParser.ts';
import {
  Copy,
  Check,
  Download,
  Trash2,
  Sparkles,
  UserCheck,
  FileCode,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  HelpCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock,
  Layers,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

interface Stage4Props {
  output: string;
  setOutput: (output: string) => void;
  engine: EngineType;
  promptName: string;
  promptVersion: string;
  systemPrompt: string;
  brief: ClientBrief;
  durationMs?: number;
  tokensInfo?: { promptTokens?: number; candidatesTokens?: number; totalTokens?: number };
  aiEvaluation?: AIEvaluation;
  setAiEvaluation: (evalData: AIEvaluation | undefined) => void;
  humanEvaluation?: HumanEvaluation;
  setHumanEvaluation: (evalData: HumanEvaluation | undefined) => void;
  onSaveExperiment: () => void;
  onBackToRun: () => void;
}

export const Stage4Results: React.FC<Stage4Props> = ({
  output,
  setOutput,
  engine,
  promptName,
  promptVersion,
  systemPrompt,
  brief,
  durationMs,
  tokensInfo,
  aiEvaluation,
  setAiEvaluation,
  humanEvaluation,
  setHumanEvaluation,
  onSaveExperiment,
  onBackToRun,
}) => {
  const [viewMode, setViewMode] = useState<'formatted' | 'raw' | 'strategy' | 'json'>('formatted');
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // AI Evaluation states
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);

  // Human Evaluation local form state
  const [humanScore, setHumanScore] = useState<number>(humanEvaluation?.score ?? 8);
  const [humanFeedback, setHumanFeedback] = useState<string>(humanEvaluation?.feedback ?? '');
  const [humanStatus, setHumanStatus] = useState<'approved' | 'rejected' | 'pending'>(
    humanEvaluation?.status ?? 'pending'
  );
  const [humanSavedMsg, setHumanSavedMsg] = useState(false);

  // Parse tests
  const jsonTest = tryParseJSON(output);
  const strategySections = extractBrandStrategySections(output);

  // Copy output
  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveToHistory = () => {
    onSaveExperiment();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleClearResult = () => {
    if (confirm('هل أنت متأكد من مسح النتيجة الحالية؟')) {
      setOutput('');
      setAiEvaluation(undefined);
      setHumanEvaluation(undefined);
    }
  };

  // Run AI evaluation request
  const handleRunAiEvaluation = async () => {
    if (!output.trim()) return;
    setIsEvaluating(true);
    setEvalError(null);
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          clientBrief: brief,
          output,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل التقييم بالذكاء الاصطناعي');
      }

      setAiEvaluation(data);
    } catch (err: any) {
      console.error(err);
      setEvalError(err?.message || 'حدث خطأ أثناء إجراء التقييم بالذكاء الاصطناعي.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Save human evaluation
  const handleSaveHumanEvaluation = () => {
    const data: HumanEvaluation = {
      score: humanScore,
      feedback: humanFeedback,
      status: humanStatus,
      evaluatedAt: new Date().toISOString(),
    };
    setHumanEvaluation(data);
    setHumanSavedMsg(true);
    setTimeout(() => setHumanSavedMsg(false), 2500);
  };

  if (!output.trim()) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-8 md:p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
          <Eye size={24} />
        </div>
        <h3 className="text-base font-bold text-zinc-900">لا توجد نتائج لعرضها حالياً</h3>
        <p className="text-xs text-zinc-500 max-w-md mx-auto">
          يرجى تشغيل التجربة في المرحلة الثالثة لإرسال البرومبت وموجز العميل وتوليد النتائج هنا.
        </p>
        <button
          type="button"
          onClick={onBackToRun}
          className="px-5 py-2.5 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 transition cursor-pointer"
        >
          الانتقال إلى تشغيل التجربة ←
        </button>
      </div>
    );
  }

  // Criteria translation map
  const criteriaLabels: Record<string, { label: string; desc: string }> = {
    complianceWithPrompt: {
      label: 'الالتزام بالبرومبت (Compliance with Prompt)',
      desc: 'مدى تقيد المخرجات بالتعليمات والأقسام والشروط المنصوص عليها في الـ System Prompt.',
    },
    relevanceToBrief: {
      label: 'الملاءمة لموجز العميل (Relevance to Brief)',
      desc: 'مدى تلبية احتياجات العميل المحددة والسوق المستهدف والتحدي المطروح.',
    },
    marketingQuality: {
      label: 'الجودة التسويقية والإقناع (Marketing Quality)',
      desc: 'قوة الأفكار التسويقية، عمق التحليل، والقدرة على تحقيق أثر تجاري.',
    },
    originalityAndDiff: {
      label: 'الأصالة والتمايز (Originality & Differentiation)',
      desc: 'مدى ابتكار الأفكار وعدم تكرار النماذج النمطية المبتذلة.',
    },
    brandVoiceAndDialect: {
      label: 'نبرة البراند واللهجة (Brand Voice & Dialect)',
      desc: 'صحة النبرة واللهجة المطلوبة وتناغمها مع طبيعة الشريحة المستهدفة.',
    },
    clarityAndReadability: {
      label: 'الوضوح وسهولة القراءة (Clarity & Readability)',
      desc: 'سلاسة الصياغة، حسن تنظيم الأقسام، وبناء الجمل.',
    },
    accuracyNoUnsupportedClaims: {
      label: 'الدقة وتجنب الادعاءات غير المدعومة (Accuracy)',
      desc: 'خلو المخرجات من ادعاءات تسويقية مضللة أو معلومات خيالية غير واقعية.',
    },
  };

  return (
    <div className="space-y-8">
      {/* Result Display Box */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 md:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base md:text-lg text-zinc-900">
                مخرجات الذكاء الاصطناعي (Model Output)
              </span>
              <span className="text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded font-mono">
                {engine}
              </span>
            </div>
            <div className="text-xs text-zinc-500 mt-1 flex items-center gap-3">
              {durationMs && (
                <span>المدة: {(durationMs / 1000).toFixed(2)} ثانية</span>
              )}
              {tokensInfo?.totalTokens && (
                <span>Tokens: {tokensInfo.totalTokens.toLocaleString()}</span>
              )}
              <span>البراند: {brief.brandName || 'غير محدد'}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'تم النسخ' : 'نسخ النتيجة'}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveToHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
            >
              <Download size={14} />
              <span>{savedSuccess ? 'تم الحفظ في السجل!' : 'حفظ النتيجة في السجل'}</span>
            </button>

            <button
              type="button"
              onClick={handleClearResult}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition cursor-pointer"
              title="مسح النتيجة"
            >
              <Trash2 size={14} />
              <span>مسح</span>
            </button>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 text-xs">
          <span className="text-zinc-500 font-medium">نمط العرض:</span>
          <button
            type="button"
            onClick={() => setViewMode('formatted')}
            className={`px-3 py-1 rounded-md transition cursor-pointer ${
              viewMode === 'formatted'
                ? 'bg-zinc-900 text-white font-semibold'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            العرض المنسق (Formatted Markdown)
          </button>

          {strategySections && (
            <button
              type="button"
              onClick={() => setViewMode('strategy')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                viewMode === 'strategy'
                  ? 'bg-zinc-900 text-white font-semibold'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              هيكل الاستراتيجية المنظم (Strategy Organizer)
            </button>
          )}

          {jsonTest.isValid && (
            <button
              type="button"
              onClick={() => setViewMode('json')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                viewMode === 'json'
                  ? 'bg-zinc-900 text-white font-semibold'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              عرض JSON المهيكل
            </button>
          )}

          <button
            type="button"
            onClick={() => setViewMode('raw')}
            className={`px-3 py-1 rounded-md transition cursor-pointer ${
              viewMode === 'raw'
                ? 'bg-zinc-900 text-white font-semibold'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            النص الخام (Raw Output)
          </button>
        </div>

        {/* Main Content Area */}
        <div className="min-h-[280px]">
          {/* Formatted Markdown */}
          {viewMode === 'formatted' && (
            <div className="p-4 bg-[#FCFCFB] border border-zinc-100 rounded-lg text-zinc-900" dir="auto">
              <MarkdownRenderer content={output} />
            </div>
          )}

          {/* Raw Text Output */}
          {viewMode === 'raw' && (
            <div className="p-4 bg-zinc-900 text-zinc-100 rounded-lg text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto text-left" dir="ltr">
              {output}
            </div>
          )}

          {/* Structured JSON */}
          {viewMode === 'json' && jsonTest.isValid && (
            <pre className="p-4 bg-zinc-950 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto text-left" dir="ltr">
              <code>{JSON.stringify(jsonTest.data, null, 2)}</code>
            </pre>
          )}

          {/* Brand Strategy Organized View */}
          {viewMode === 'strategy' && strategySections && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                تم التعرف تلقائياً على بنود استراتيجية البراند من النص وتوزيعها على أقسام هيكلية مريحة للقراءة والمراجعة.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {strategySections.overview && (
                  <div className="p-4 bg-white border border-zinc-200 rounded-lg space-y-2">
                    <h4 className="text-xs font-bold text-zinc-900 pb-1.5 border-b border-zinc-100">
                      Strategy Overview (نظرة عامة على الاستراتيجية)
                    </h4>
                    <div className="text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap">
                      <MarkdownRenderer content={strategySections.overview} />
                    </div>
                  </div>
                )}

                {strategySections.positioning && (
                  <div className="p-4 bg-white border border-zinc-200 rounded-lg space-y-2">
                    <h4 className="text-xs font-bold text-zinc-900 pb-1.5 border-b border-zinc-100">
                      Brand Positioning (تموضع البراند)
                    </h4>
                    <div className="text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap">
                      <MarkdownRenderer content={strategySections.positioning} />
                    </div>
                  </div>
                )}

                {strategySections.targetAudience && (
                  <div className="p-4 bg-white border border-zinc-200 rounded-lg space-y-2">
                    <h4 className="text-xs font-bold text-zinc-900 pb-1.5 border-b border-zinc-100">
                      Target Audience (الجمهور المستهدف)
                    </h4>
                    <div className="text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap">
                      <MarkdownRenderer content={strategySections.targetAudience} />
                    </div>
                  </div>
                )}

                {strategySections.brandVoice && (
                  <div className="p-4 bg-white border border-zinc-200 rounded-lg space-y-2">
                    <h4 className="text-xs font-bold text-zinc-900 pb-1.5 border-b border-zinc-100">
                      Brand Voice (نبرة وصوت البراند)
                    </h4>
                    <div className="text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap">
                      <MarkdownRenderer content={strategySections.brandVoice} />
                    </div>
                  </div>
                )}

                {strategySections.marketingObjectives && (
                  <div className="p-4 bg-white border border-zinc-200 rounded-lg space-y-2">
                    <h4 className="text-xs font-bold text-zinc-900 pb-1.5 border-b border-zinc-100">
                      Marketing Objectives (الأهداف التسويقية)
                    </h4>
                    <div className="text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap">
                      <MarkdownRenderer content={strategySections.marketingObjectives} />
                    </div>
                  </div>
                )}

                {strategySections.contentPillars && (
                  <div className="p-4 bg-white border border-zinc-200 rounded-lg space-y-2">
                    <h4 className="text-xs font-bold text-zinc-900 pb-1.5 border-b border-zinc-100">
                      Content Pillars (ركائز المحتوى)
                    </h4>
                    <div className="text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap">
                      <MarkdownRenderer content={strategySections.contentPillars} />
                    </div>
                  </div>
                )}

                {strategySections.recommendations && (
                  <div className="p-4 bg-white border border-zinc-200 rounded-lg space-y-2 md:col-span-2">
                    <h4 className="text-xs font-bold text-zinc-900 pb-1.5 border-b border-zinc-100">
                      Recommendations (التوصيات وخطة العمل)
                    </h4>
                    <div className="text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap">
                      <MarkdownRenderer content={strategySections.recommendations} />
                    </div>
                  </div>
                )}

                {strategySections.missingInformation && (
                  <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-lg space-y-2 md:col-span-2">
                    <h4 className="text-xs font-bold text-rose-900 pb-1.5 border-b border-rose-100">
                      Missing Information (المعلومات الناقصة التي تحتاج لاستكمال)
                    </h4>
                    <div className="text-xs text-rose-800 leading-relaxed whitespace-pre-wrap">
                      <MarkdownRenderer content={strategySections.missingInformation} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RESULT EVALUATION SECTION */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 md:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
        <div>
          <h3 className="text-lg font-bold text-zinc-900">تقييم النتيجة (Result Evaluation)</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Evaluate Result — "تقييم جودة النتيجة وفق معايير محددة." يشمل التقييم الآلي والتقييم البشري المستقل.
          </p>
        </div>

        {/* Sub-section A: AI Evaluation */}
        <div className="p-5 bg-zinc-50/70 border border-zinc-200 rounded-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-zinc-800" />
                <h4 className="text-sm md:text-base font-bold text-zinc-900">
                  أ. التقييم بالذكاء الاصطناعي (AI Evaluation)
                </h4>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                فحص وتقييم النتيجة عبر نموذج Gemini مستقل ومقارنتها مع البرومبت وموجز العميل وفق 7 معايير تسويقية دقيقة.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunAiEvaluation}
              disabled={isEvaluating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium hover:bg-zinc-800 disabled:opacity-50 transition cursor-pointer"
            >
              {isEvaluating ? (
                <>
                  <Loader2 size={14} className="animate-spin text-zinc-300" />
                  <span>جارٍ إجراء التقييم الآلي...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>{aiEvaluation ? 'إعادة التقييم بالذكاء الاصطناعي' : 'تقييم بالذكاء الاصطناعي'}</span>
                </>
              )}
            </button>
          </div>

          {evalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
              <div>{evalError}</div>
            </div>
          )}

          {/* AI Eval Result Card */}
          {aiEvaluation && (
            <div className="space-y-4 pt-2">
              {/* Overall Score Badge */}
              <div className="p-4 bg-white border border-zinc-200 rounded-lg flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-zinc-900 text-white flex flex-col items-center justify-center">
                    <span className="text-xl font-bold leading-none">
                      {aiEvaluation.overallWeightedScore}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">من 10</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900">
                      الدرجة الإجمالية الموزونة (Overall Weighted Score)
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      تم الحساب البرمجي وفق أوزان نسبية للمعايير التسويقية السبعة
                    </div>
                  </div>
                </div>

                <div className="text-xs text-zinc-500 bg-zinc-50 p-2 rounded border border-zinc-200 max-w-md">
                  <div className="font-semibold text-zinc-800 mb-0.5">الملخص العام:</div>
                  <div className="text-zinc-600 leading-relaxed text-[11px]">
                    {aiEvaluation.overallSummary}
                  </div>
                </div>
              </div>

              {/* 7 Detailed Criteria */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
                {Object.entries(aiEvaluation.criteria).map(([key, item]) => {
                  const meta = criteriaLabels[key] || { label: key, desc: '' };
                  const scoreColor =
                    item.score >= 8
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : item.score >= 6
                      ? 'text-amber-700 bg-amber-50 border-amber-200'
                      : 'text-rose-700 bg-rose-50 border-rose-200';

                  return (
                    <div
                      key={key}
                      className="p-3.5 bg-white border border-zinc-200 rounded-lg space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-zinc-900">{meta.label}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${scoreColor}`}>
                            {item.score} / 10
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-600 leading-relaxed">
                          <strong>التقييم:</strong> {item.explanation}
                        </p>
                      </div>

                      {item.suggestion && (
                        <div className="mt-2 pt-2 border-t border-zinc-100 text-[11px] text-zinc-700 bg-zinc-50 p-2 rounded">
                          <strong className="text-zinc-900">💡 مقترح للتحسين:</strong> {item.suggestion}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Disclaimer */}
              <div className="text-[11px] text-zinc-400 text-center">
                * تنبيه: هذا التقييم ناتج عن تحليل ذكاء اصطناعي استرشادي لمقارنة المخرجات مع البرومبت وموجز العميل، وليس مقياساً موضوعياً لأداء الحملة الحقيقي في السوق.
              </div>
            </div>
          )}
        </div>

        {/* Sub-section B: Human Evaluation */}
        <div className="p-5 bg-zinc-50/70 border border-zinc-200 rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck size={18} className="text-zinc-800" />
            <h4 className="text-sm md:text-base font-bold text-zinc-900">
              ب. التقييم البشري المستقل (Human Evaluation)
            </h4>
          </div>
          <p className="text-xs text-zinc-500">
            سجّل تقييمك الخاص بنزاهة لمقارنته مع تقييم الذكاء الاصطناعي واعتماد النتيجة أو رفضها.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Score 0 to 10 */}
            <div>
              <label className="block font-semibold text-zinc-800 mb-2">
                الدرجة الإجمالية (0 إلى 10):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={humanScore}
                  onChange={(e) => setHumanScore(parseFloat(e.target.value))}
                  className="flex-1 accent-zinc-900 cursor-pointer"
                />
                <span className="font-bold text-sm bg-white border border-zinc-200 px-2.5 py-1 rounded w-12 text-center">
                  {humanScore}
                </span>
              </div>
            </div>

            {/* Approval Decision */}
            <div>
              <label className="block font-semibold text-zinc-800 mb-2">
                قرار الاعتماد (Approve / Reject):
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setHumanStatus('approved')}
                  className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    humanStatus === 'approved'
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:border-emerald-500'
                  }`}
                >
                  <ThumbsUp size={13} />
                  <span>اعتماد (Approve)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHumanStatus('rejected')}
                  className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    humanStatus === 'rejected'
                      ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:border-rose-500'
                  }`}
                >
                  <ThumbsDown size={13} />
                  <span>رفض (Reject)</span>
                </button>
              </div>
            </div>

            {/* Save Button & confirmation */}
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={handleSaveHumanEvaluation}
                className="w-full py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium hover:bg-zinc-800 transition cursor-pointer"
              >
                حفظ التقييم البشري
              </button>
              {humanSavedMsg && (
                <span className="text-[11px] text-emerald-600 text-center mt-1 font-semibold">
                  ✓ تم حفظ تقييمك البشري بنجاح
                </span>
              )}
            </div>
          </div>

          {/* Written Feedback */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              ملاحظات وتعليقات بشرية حول جودة المخرجات (اختياري):
            </label>
            <textarea
              rows={2}
              value={humanFeedback}
              onChange={(e) => setHumanFeedback(e.target.value)}
              placeholder="اكتب ملاحظاتك النقدية هنا (مثال: الأفكار ممتازة ولكن اللهجة تحتاج تبسيطاً أكبر لتلائم الجمهور العام)..."
              className="w-full p-2.5 border border-zinc-200 rounded-lg text-xs text-zinc-900 bg-white focus:outline-none focus:border-zinc-700 leading-relaxed"
              dir="auto"
            />
          </div>

          {/* Comparison summary if both exist */}
          {aiEvaluation && humanEvaluation && (
            <div className="p-3 bg-white border border-zinc-200 rounded-lg text-xs flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-zinc-800">مقارنة التقييمين:</span>
                <span className="text-zinc-600 mr-2">
                  الذكاء الاصطناعي: <strong>{aiEvaluation.overallWeightedScore} / 10</strong> | التقييم البشري: <strong>{humanEvaluation.score} / 10</strong> ({humanEvaluation.status === 'approved' ? 'معتمد' : humanEvaluation.status === 'rejected' ? 'مرفوض' : 'معلق'})
                </span>
              </div>
              <span className="text-zinc-400 text-[11px]">لا يتم تعديل البرومبت تلقائياً</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation bar */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBackToRun}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-zinc-300 text-zinc-700 rounded-lg text-xs md:text-sm font-medium hover:bg-zinc-50 transition cursor-pointer"
        >
          <span>→</span>
          <span>العودة لتشغيل التجربة</span>
        </button>

        <button
          type="button"
          onClick={handleSaveToHistory}
          className="inline-flex items-center gap-1.5 px-5 py-2 bg-zinc-900 text-white rounded-lg text-xs md:text-sm font-medium hover:bg-zinc-800 transition cursor-pointer"
        >
          <Download size={15} />
          <span>حفظ التجربة في السجل والمتابعة</span>
        </button>
      </div>
    </div>
  );
};
