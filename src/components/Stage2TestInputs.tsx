import React, { useState } from 'react';
import { ClientBrief, ReferenceExample, TestBriefTemplate } from '../types.ts';
import {
  DEFAULT_SAMPLE_BRIEFS,
  getAllBriefTemplates,
  saveCustomBriefTemplate,
  deleteCustomBriefTemplate,
  duplicateCustomBriefTemplate,
} from '../utils/storage.ts';
import {
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  Info,
  BookOpen,
  ArrowRight,
  Loader2,
  FileSpreadsheet,
  Check,
  Edit2,
  CopyPlus,
  Eraser,
  Globe,
  Tag,
  MessageSquare,
} from 'lucide-react';

interface Stage2Props {
  brief: ClientBrief;
  setBrief: React.Dispatch<React.SetStateAction<ClientBrief>>;
  referenceExamples: ReferenceExample[];
  setReferenceExamples: React.Dispatch<React.SetStateAction<ReferenceExample[]>>;
  onNext: () => void;
  onBack: () => void;
}

const COUNTRIES = ['Random', 'مصر (Egypt)', 'المملكة العربية السعودية (Saudi Arabia)', 'الكويت (Kuwait)', 'البحرين (Bahrain)', 'الإمارات العربية المتحدة (UAE)'];
const INDUSTRIES = ['Random', 'مطاعم وأغذية (Restaurants)', 'قهوة ومقاهي مختصة (Coffee)', 'أزياء وموضة (Fashion)', 'رعاية صحية وطبية (Healthcare)', 'تعليم وتدريب (Education)', 'تجارة إلكترونية (E-commerce)'];
const DIALECTS = ['Automatic', 'مصري عامي (Egyptian Arabic)', 'خليجي بيضاء (White Gulf Arabic)', 'سعودي (Saudi Arabic)', 'كويتي (Kuwaiti Arabic)'];

export const Stage2TestInputs: React.FC<Stage2Props> = ({
  brief,
  setBrief,
  referenceExamples,
  setReferenceExamples,
  onNext,
  onBack,
}) => {
  // Test Brief Templates
  const [briefTemplates, setBriefTemplates] = useState<TestBriefTemplate[]>(() => getAllBriefTemplates());
  const [templateFilter, setTemplateFilter] = useState<'all' | 'egypt' | 'gulf' | 'custom'>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Custom Brief Editor Modal/Drawer
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TestBriefTemplate | null>(null);
  const [customForm, setCustomForm] = useState<Omit<TestBriefTemplate, 'id'>>({
    name: '',
    country: '',
    industry: '',
    languageDialect: '',
    brandName: '',
    targetAudience: '',
    marketingObjective: '',
    clientBrief: '',
    additionalContext: '',
    isDefault: false,
  });

  // Brief generator states
  const [showGenerator, setShowGenerator] = useState(false);
  const [genCountry, setGenCountry] = useState('Random');
  const [genIndustry, setGenIndustry] = useState('Random');
  const [genDialect, setGenDialect] = useState('Automatic');
  const [genCount, setGenCount] = useState<number>(1);
  const [isGeneratingBriefs, setIsGeneratingBriefs] = useState(false);
  const [generatedBriefs, setGeneratedBriefs] = useState<any[]>([]);
  const [generatorError, setGeneratorError] = useState<string | null>(null);

  // Reference example states
  const [newExampleTitle, setNewExampleTitle] = useState('');
  const [newExampleContent, setNewExampleContent] = useState('');
  const [showAddExample, setShowAddExample] = useState(false);

  // Notification message
  const [loadToast, setLoadToast] = useState<string | null>(null);

  const refreshTemplates = () => {
    setBriefTemplates(getAllBriefTemplates());
  };

  // Check if current form has meaningful data
  const hasExistingData = Boolean(
    brief.brandName.trim() || brief.clientBrief.trim() || brief.country.trim()
  );

  // Apply selected template into main form
  const handleApplyTemplate = (item: TestBriefTemplate) => {
    if (hasExistingData) {
      const confirmReplace = confirm(
        'النموذج يحتوي بالفعل على بيانات مدخلة. هل ترغب في استبدالها ببيانات هذا النموذج التجريبي؟'
      );
      if (!confirmReplace) return;
    }

    setBrief({
      brandName: item.brandName || '',
      country: item.country || '',
      industry: item.industry || '',
      targetAudience: item.targetAudience || '',
      marketingObjective: item.marketingObjective || '',
      languageDialect: item.languageDialect || '',
      clientBrief: item.clientBrief || '',
      additionalContext: item.additionalContext || '',
      isSynthetic: false,
    });
    setSelectedTemplateId(item.id);
    setLoadToast(`تم تحميل نموذج "${item.name}" في حقول البيانات.`);
    setTimeout(() => setLoadToast(null), 3000);
  };

  // Clear main form
  const handleClearForm = () => {
    if (hasExistingData && !confirm('هل أنت متأكد من مسح جميع حقول بيانات وموجز العميل؟')) {
      return;
    }
    setBrief({
      brandName: '',
      country: '',
      industry: '',
      targetAudience: '',
      marketingObjective: '',
      languageDialect: '',
      clientBrief: '',
      additionalContext: '',
      isSynthetic: false,
    });
    setSelectedTemplateId(null);
  };

  // Open custom modal for new
  const handleOpenNewCustom = () => {
    setEditingTemplate(null);
    setCustomForm({
      name: '',
      country: '',
      industry: '',
      languageDialect: '',
      brandName: '',
      targetAudience: '',
      marketingObjective: '',
      clientBrief: '',
      additionalContext: '',
      isDefault: false,
    });
    setShowCustomModal(true);
  };

  // Open custom modal for edit
  const handleOpenEditCustom = (t: TestBriefTemplate) => {
    setEditingTemplate(t);
    setCustomForm({
      name: t.name,
      country: t.country,
      industry: t.industry,
      languageDialect: t.languageDialect,
      brandName: t.brandName,
      targetAudience: t.targetAudience,
      marketingObjective: t.marketingObjective,
      clientBrief: t.clientBrief,
      additionalContext: t.additionalContext,
      isDefault: false,
    });
    setShowCustomModal(true);
  };

  // Save custom template
  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customForm.name.trim() || !customForm.brandName.trim()) {
      alert('يرجى إدخال اسم النموذج واسم البراند.');
      return;
    }

    const templateToSave: TestBriefTemplate = {
      ...customForm,
      id: editingTemplate ? editingTemplate.id : `custom-brief-${Date.now()}`,
      isDefault: false,
    };

    saveCustomBriefTemplate(templateToSave);
    refreshTemplates();
    setShowCustomModal(false);
  };

  // Delete custom template
  const handleDeleteCustom = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف النموذج التجريبي المخصص "${name}"؟`)) {
      deleteCustomBriefTemplate(id);
      refreshTemplates();
    }
  };

  // Duplicate template (works on default or custom)
  const handleDuplicateTemplate = (t: TestBriefTemplate) => {
    duplicateCustomBriefTemplate(t);
    refreshTemplates();
  };

  // AI Generator
  const handleGenerateBriefs = async () => {
    setIsGeneratingBriefs(true);
    setGeneratorError(null);
    try {
      const res = await fetch('/api/generate-briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: genCountry,
          industry: genIndustry,
          dialect: genDialect,
          count: genCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل توليد نماذج الـ Briefs');
      }

      if (Array.isArray(data.briefs) && data.briefs.length > 0) {
        setGeneratedBriefs(data.briefs);
      } else {
        throw new Error('لم يرجع الخادم أي نماذج');
      }
    } catch (err: any) {
      console.error(err);
      setGeneratorError(err?.message || 'حدث خطأ أثناء استدعاء واجهة توليد النماذج');
    } finally {
      setIsGeneratingBriefs(false);
    }
  };

  const applyGeneratedBrief = (item: any) => {
    if (hasExistingData) {
      const ok = confirm('النموذج يحتوي بالفعل على بيانات. هل ترغب في استبدالها؟');
      if (!ok) return;
    }
    setBrief({
      brandName: item.brandName || '',
      country: item.country || '',
      industry: item.industry || '',
      targetAudience: item.targetAudience || '',
      marketingObjective: item.marketingObjective || '',
      languageDialect: item.languageDialect || '',
      clientBrief: item.clientBrief || '',
      additionalContext: item.additionalContext || '',
      isSynthetic: true,
    });
    setSelectedTemplateId(null);
  };

  const handleAddExample = () => {
    if (!newExampleContent.trim()) return;
    const item: ReferenceExample = {
      id: `ex-${Date.now()}`,
      title: newExampleTitle.trim() || `مثال مرجعي #${referenceExamples.length + 1}`,
      content: newExampleContent.trim(),
      enabled: true,
    };
    setReferenceExamples([...referenceExamples, item]);
    setNewExampleTitle('');
    setNewExampleContent('');
    setShowAddExample(false);
  };

  const handleDeleteExample = (id: string) => {
    setReferenceExamples(referenceExamples.filter((ex) => ex.id !== id));
  };

  const toggleExample = (id: string) => {
    setReferenceExamples(
      referenceExamples.map((ex) => (ex.id === id ? { ...ex, enabled: !ex.enabled } : ex))
    );
  };

  // Filter templates
  const filteredTemplates = briefTemplates.filter((t) => {
    if (templateFilter === 'all') return true;
    if (templateFilter === 'egypt') return t.country.includes('مصر');
    if (templateFilter === 'gulf') {
      return (
        t.country.includes('السعودية') ||
        t.country.includes('البحرين') ||
        t.country.includes('الكويت') ||
        t.country.includes('الإمارات')
      );
    }
    if (templateFilter === 'custom') return !t.isDefault;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {loadToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-600" />
            <span className="font-semibold">{loadToast}</span>
          </div>
          <span className="text-[11px] text-emerald-700">يمكنك تعديل الحقول بالأسفل قبل التشغيل</span>
        </div>
      )}

      {/* SECTION 1: READY-TO-USE TEST BRIEF TEMPLATES (نماذج جاهزة للتجربة) */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 md:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-zinc-800" />
              <h3 className="text-base font-bold text-zinc-900">
                نماذج جاهزة للتجربة (Ready-to-Use Test Brief Templates)
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              نماذج اختبار متكاملة للأسواق المصرية والخليجية تتيح لك اختبار كل محرك فوراً بضغطة زر دون تعبئة يدوية.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenNewCustom}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-medium hover:bg-zinc-800 transition cursor-pointer"
            >
              <Plus size={14} />
              <span>+ إنشاء نموذج مخصص</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-zinc-500 text-[11px] font-medium ml-1">تصفية النماذج:</span>
          {[
            { id: 'all', label: `جميع النماذج (${briefTemplates.length})` },
            { id: 'egypt', label: '🇪🇬 السوق المصري' },
            { id: 'gulf', label: '🇸🇦 🇧🇭 🇰🇼 الأسواق الخليجية' },
            { id: 'custom', label: '⭐ نماذجي المخصصة' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTemplateFilter(f.id as any)}
              className={`px-3 py-1 rounded-md transition cursor-pointer text-xs ${
                templateFilter === f.id
                  ? 'bg-zinc-900 text-white font-medium'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {filteredTemplates.map((item) => {
            const isCurrentSelected = selectedTemplateId === item.id;
            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all text-xs flex flex-col justify-between bg-[#FCFCFB] ${
                  isCurrentSelected
                    ? 'border-zinc-900 ring-1 ring-zinc-900 shadow-xs'
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-1.5">
                    <div>
                      <h4 className="font-bold text-zinc-900 text-sm leading-snug">
                        {item.name}
                      </h4>
                      <div className="text-[11px] text-zinc-500 font-medium mt-0.5">
                        البراند: <strong>{item.brandName}</strong>
                      </div>
                    </div>

                    {!item.isDefault && (
                      <span className="px-1.5 py-0.5 bg-zinc-200 text-zinc-700 rounded text-[10px] font-medium shrink-0">
                        مخصص
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    <span className="px-2 py-0.5 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded">
                      {item.country}
                    </span>
                    <span className="px-2 py-0.5 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded">
                      {item.industry}
                    </span>
                    <span className="px-2 py-0.5 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded">
                      {item.languageDialect}
                    </span>
                  </div>

                  {/* Snippet */}
                  <div className="text-zinc-600 text-[11px] line-clamp-2 leading-relaxed bg-white p-2 rounded border border-zinc-100">
                    {item.clientBrief}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-3 pt-2.5 border-t border-zinc-200/70 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {!item.isDefault && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEditCustom(item)}
                          className="text-zinc-500 hover:text-zinc-800 p-1 rounded hover:bg-zinc-100 cursor-pointer"
                          title="تعديل هذا النموذج"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustom(item.id, item.name)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer"
                          title="حذف هذا النموذج"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDuplicateTemplate(item)}
                      className="text-zinc-500 hover:text-zinc-800 p-1 rounded hover:bg-zinc-100 cursor-pointer"
                      title="نسخ وتكرار هذا النموذج"
                    >
                      <CopyPlus size={13} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyTemplate(item)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                      isCurrentSelected
                        ? 'bg-zinc-900 text-white'
                        : 'bg-white border border-zinc-300 text-zinc-900 hover:bg-zinc-900 hover:text-white hover:border-zinc-900'
                    }`}
                  >
                    <CheckCircle2 size={13} />
                    <span>استخدام النموذج</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: CLIENT BRIEF GENERATOR ACCORDION */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={17} className="text-amber-600" />
              <h3 className="text-sm md:text-base font-bold text-zinc-900">
                أداة توليد موجز عميل افتراضي بالذكاء الاصطناعي (AI Brief Generator)
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              توليد سيناريوهات عشوائية جديدة تماماً عبر استدعاء نموذج Gemini على الخادم.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowGenerator(!showGenerator)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-800 hover:bg-zinc-50 transition text-xs font-medium cursor-pointer"
          >
            <span>{showGenerator ? 'إخفاء أداة التوليد' : 'توليد Brief تجريبي'}</span>
            {showGenerator ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {showGenerator && (
          <div className="mt-5 pt-5 border-t border-zinc-100 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  الدولة والسوق المستهدف:
                </label>
                <select
                  value={genCountry}
                  onChange={(e) => setGenCountry(e.target.value)}
                  className="w-full text-xs p-2 border border-zinc-200 rounded-lg bg-zinc-50/50 text-zinc-800 focus:outline-none focus:border-zinc-700"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c === 'Random' ? '🎲 عشوائي (Random)' : c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  المجال / الصناعة:
                </label>
                <select
                  value={genIndustry}
                  onChange={(e) => setGenIndustry(e.target.value)}
                  className="w-full text-xs p-2 border border-zinc-200 rounded-lg bg-zinc-50/50 text-zinc-800 focus:outline-none focus:border-zinc-700"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind === 'Random' ? '🎲 عشوائي (Random)' : ind}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  اللهجة والأسلوب:
                </label>
                <select
                  value={genDialect}
                  onChange={(e) => setGenDialect(e.target.value)}
                  className="w-full text-xs p-2 border border-zinc-200 rounded-lg bg-zinc-50/50 text-zinc-800 focus:outline-none focus:border-zinc-700"
                >
                  {DIALECTS.map((d) => (
                    <option key={d} value={d}>
                      {d === 'Automatic' ? '⚙️ تلقائي بحسب السوق' : d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  عدد النماذج:
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setGenCount(num)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                        genCount === num
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-zinc-500">
                سيتم إرسال الطلب لنموذج Gemini على الخادم لتوليد نماذج بيانات افتراضية متباينة
              </span>

              <button
                type="button"
                onClick={handleGenerateBriefs}
                disabled={isGeneratingBriefs}
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium hover:bg-zinc-800 disabled:opacity-50 transition cursor-pointer"
              >
                {isGeneratingBriefs ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>جارٍ إنشاء النماذج عبر Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>إنشاء النماذج</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {generatorError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <div className="font-semibold">فشل توليد الـ Briefs:</div>
                  <div className="mt-0.5">{generatorError}</div>
                </div>
              </div>
            )}

            {/* Generated Briefs List */}
            {generatedBriefs.length > 0 && (
              <div className="space-y-3 pt-3">
                <div className="text-xs font-bold text-zinc-800 flex items-center justify-between">
                  <span>النماذج المولدة حديثاً (بيانات اختبار افتراضية):</span>
                  <span className="text-[11px] text-zinc-500 font-normal">
                    انقر على زر الاستخدام لتعبئة النموذج الرئيسي أدناه
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {generatedBriefs.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2 text-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="font-bold text-zinc-900 text-sm">{item.brandName}</span>
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] rounded font-medium">
                            افتراضي
                          </span>
                        </div>

                        <div className="text-zinc-600 space-y-1 text-[11px]">
                          <div>
                            <strong className="text-zinc-700">السوق:</strong> {item.country} |{' '}
                            {item.industry}
                          </div>
                          <div>
                            <strong className="text-zinc-700">الجمهور:</strong> {item.targetAudience}
                          </div>
                          <div className="line-clamp-3 text-zinc-700 mt-1 bg-white p-2 rounded border border-zinc-200">
                            {item.clientBrief}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => applyGeneratedBrief(item)}
                        className="mt-3 w-full py-1.5 bg-white border border-zinc-300 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white text-zinc-800 rounded font-medium text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={13} />
                        <span>استخدام هذا النموذج في الاختبار</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 3: MAIN CLIENT BRIEF EDITABLE FORM */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 md:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-zinc-900">
              نموذج بيانات وموجز العميل النشط (Active Client Brief)
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              هذه البيانات سيتم تمريرها للنموذج عند تشغيل التجربة. يمكنك تعديل أي حقل بحرية.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {brief.isSynthetic && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded text-xs font-medium">
                <Info size={12} />
                <span>موجز افتراضي</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleClearForm}
              disabled={!hasExistingData}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 hover:text-rose-800 border border-rose-200 hover:bg-rose-50 rounded-lg transition disabled:opacity-40 cursor-pointer"
              title="مسح جميع الحقول"
            >
              <Eraser size={13} />
              <span>مسح الحقول</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs md:text-sm">
          {/* Brand Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              اسم البراند (Brand Name)
            </label>
            <input
              type="text"
              value={brief.brandName}
              onChange={(e) => setBrief({ ...brief, brandName: e.target.value })}
              placeholder="مثال: برجر المعلم / بُن وحكاية"
              className="w-full p-2.5 border border-zinc-200 rounded-lg text-zinc-900 text-xs md:text-sm focus:outline-none focus:border-zinc-700 bg-zinc-50/50"
            />
          </div>

          {/* Country / Market */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              الدولة والسوق المستهدف (Target Market)
            </label>
            <input
              type="text"
              value={brief.country}
              onChange={(e) => setBrief({ ...brief, country: e.target.value })}
              placeholder="مثال: مصر (القاهرة والجيزة) / السعودية (الرياض)"
              className="w-full p-2.5 border border-zinc-200 rounded-lg text-zinc-900 text-xs md:text-sm focus:outline-none focus:border-zinc-700 bg-zinc-50/50"
            />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              المجال / الصناعة (Industry)
            </label>
            <input
              type="text"
              value={brief.industry}
              onChange={(e) => setBrief({ ...brief, industry: e.target.value })}
              placeholder="مثال: مطاعم ومأكولات سريعة / أزياء شبابية"
              className="w-full p-2.5 border border-zinc-200 rounded-lg text-zinc-900 text-xs md:text-sm focus:outline-none focus:border-zinc-700 bg-zinc-50/50"
            />
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              الجمهور المستهدف (Target Audience)
            </label>
            <input
              type="text"
              value={brief.targetAudience}
              onChange={(e) => setBrief({ ...brief, targetAudience: e.target.value })}
              placeholder="مثال: شباب وطلاب من 18 إلى 30 سنة"
              className="w-full p-2.5 border border-zinc-200 rounded-lg text-zinc-900 text-xs md:text-sm focus:outline-none focus:border-zinc-700 bg-zinc-50/50"
            />
          </div>

          {/* Marketing Objective */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              الهدف التسويقي (Marketing Objective)
            </label>
            <input
              type="text"
              value={brief.marketingObjective}
              onChange={(e) => setBrief({ ...brief, marketingObjective: e.target.value })}
              placeholder="مثال: زيادة طلبات التوصيل / إطلاق منتج موسمي"
              className="w-full p-2.5 border border-zinc-200 rounded-lg text-zinc-900 text-xs md:text-sm focus:outline-none focus:border-zinc-700 bg-zinc-50/50"
            />
          </div>

          {/* Language and Dialect */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              اللغة واللهجة المطلوبة (Language & Dialect)
            </label>
            <input
              type="text"
              value={brief.languageDialect}
              onChange={(e) => setBrief({ ...brief, languageDialect: e.target.value })}
              placeholder="مثال: مصري عامي شبابي / سعودي أصيل طبيعي"
              className="w-full p-2.5 border border-zinc-200 rounded-lg text-zinc-900 text-xs md:text-sm focus:outline-none focus:border-zinc-700 bg-zinc-50/50"
            />
          </div>
        </div>

        {/* Client Brief Textarea */}
        <div>
          <label className="block text-xs font-semibold text-zinc-800 mb-1">
            موجز العميل وتفاصيل المشروع (Client Brief Details)
          </label>
          <textarea
            rows={5}
            value={brief.clientBrief}
            onChange={(e) => setBrief({ ...brief, clientBrief: e.target.value })}
            placeholder="اكتب هنا تفاصيل طلب العميل، ما هو التحدي التسويقي، ميزات المنتج، وما يريده بالضبط في هذا الإجراء..."
            className="w-full p-3 border border-zinc-200 rounded-lg text-xs md:text-sm text-zinc-900 focus:outline-none focus:border-zinc-700 bg-zinc-50/50 leading-relaxed"
            dir="auto"
          />
        </div>

        {/* Additional Context */}
        <div>
          <label className="block text-xs font-semibold text-zinc-800 mb-1">
            سياق إضافي أو قيود تسويقية (Additional Context)
          </label>
          <textarea
            rows={2}
            value={brief.additionalContext}
            onChange={(e) => setBrief({ ...brief, additionalContext: e.target.value })}
            placeholder="مثال: تجنب النبرة الرسمية الجافة، التركيز على القيمة مقابل السعر وخدمة التوصيل السريع..."
            className="w-full p-3 border border-zinc-200 rounded-lg text-xs md:text-sm text-zinc-900 focus:outline-none focus:border-zinc-700 bg-zinc-50/50 leading-relaxed"
            dir="auto"
          />
        </div>
      </div>

      {/* SECTION 4: REFERENCE EXAMPLES (KNOWLEDGE BASE) */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 md:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen size={17} className="text-zinc-700" />
              <h3 className="text-sm md:text-base font-bold text-zinc-900">
                الأمثلة المرجعية (Knowledge Base / Reference Examples)
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              الأمثلة المرجعية المستخدمة أثناء التوليد (يتم تمرير الأمثلة المفعلة فقط مباشرة في طلب النموذج).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddExample(!showAddExample)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-800 hover:bg-zinc-50 transition text-xs font-medium cursor-pointer"
          >
            <Plus size={14} />
            <span>إضافة مثال مرجعي جديد</span>
          </button>
        </div>

        {/* Add Example Form */}
        {showAddExample && (
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-3">
            <div className="text-xs font-bold text-zinc-800">إضافة مثال مرجعي جديد:</div>
            <div>
              <input
                type="text"
                value={newExampleTitle}
                onChange={(e) => setNewExampleTitle(e.target.value)}
                placeholder="عنوان المثال (مثال: نموذج منشور إنستغرام معتمد للبراند)"
                className="w-full p-2 text-xs border border-zinc-200 rounded bg-white text-zinc-900 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <textarea
                rows={4}
                value={newExampleContent}
                onChange={(e) => setNewExampleContent(e.target.value)}
                placeholder="الصق نص المثال أو النبرة النموذجية هنا..."
                className="w-full p-2 text-xs border border-zinc-200 rounded bg-white text-zinc-900 focus:outline-none focus:border-zinc-600 leading-relaxed"
                dir="auto"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddExample(false)}
                className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-800 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleAddExample}
                disabled={!newExampleContent.trim()}
                className="px-4 py-1.5 bg-zinc-900 text-white rounded text-xs font-medium hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
              >
                حفظ وإضافة المثال
              </button>
            </div>
          </div>
        )}

        {/* Examples List */}
        {referenceExamples.length === 0 ? (
          <div className="text-center py-6 text-zinc-400 text-xs border border-dashed border-zinc-200 rounded-lg">
            لا توجد أمثلة مرجعية مضافة حالياً. (إضافة الأمثلة اختياري وتساعد النموذج على محاكاة أسلوب معين).
          </div>
        ) : (
          <div className="space-y-2">
            {referenceExamples.map((ex) => (
              <div
                key={ex.id}
                className={`p-3 rounded-lg border transition text-xs flex items-start justify-between gap-3 ${
                  ex.enabled
                    ? 'bg-zinc-50/70 border-zinc-200 text-zinc-900'
                    : 'bg-zinc-100/50 border-zinc-200/50 text-zinc-400'
                }`}
              >
                <div className="flex items-start gap-2.5 flex-1">
                  <input
                    type="checkbox"
                    checked={ex.enabled}
                    onChange={() => toggleExample(ex.id)}
                    className="mt-1 cursor-pointer accent-zinc-900"
                    title={ex.enabled ? 'إلغاء التفعيل في هذا الاختبار' : 'تفعيل هذا المثال في الاختبار'}
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-zinc-900 mb-1 flex items-center gap-2">
                      <span>{ex.title}</span>
                      {ex.enabled ? (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-normal">
                          مفعل في الطلب
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-500 bg-zinc-200 px-1.5 py-0.2 rounded font-normal">
                          معطل
                        </span>
                      )}
                    </div>
                    <div className="text-zinc-600 whitespace-pre-wrap leading-relaxed line-clamp-3">
                      {ex.content}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteExample(ex.id)}
                  className="text-zinc-400 hover:text-rose-600 p-1 cursor-pointer"
                  title="حذف هذا المثال"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
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
          <span>العودة لإعداد البرومبت</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-1.5 px-5 py-2 bg-zinc-900 text-white rounded-lg text-xs md:text-sm font-medium hover:bg-zinc-800 transition cursor-pointer"
        >
          <span>المتابعة إلى تشغيل التجربة</span>
          <span>←</span>
        </button>
      </div>

      {/* Custom Brief Template Editor Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <h4 className="font-bold text-zinc-900 text-sm">
                {editingTemplate ? 'تعديل النموذج التجريبي المخصص' : 'إنشاء نموذج Brief تجريبي مخصص'}
              </h4>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustom} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    اسم النموذج (العنوان التعريفي): *
                  </label>
                  <input
                    type="text"
                    value={customForm.name}
                    onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                    placeholder="مثال: مطعم مشويات مصري - عرض الغداء"
                    className="w-full p-2 border border-zinc-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    اسم البراند: *
                  </label>
                  <input
                    type="text"
                    value={customForm.brandName}
                    onChange={(e) => setCustomForm({ ...customForm, brandName: e.target.value })}
                    placeholder="مثال: قصر الكبابجي"
                    className="w-full p-2 border border-zinc-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    الدولة والسوق المستهدف:
                  </label>
                  <input
                    type="text"
                    value={customForm.country}
                    onChange={(e) => setCustomForm({ ...customForm, country: e.target.value })}
                    placeholder="مثال: مصر (القاهرة والجيزة)"
                    className="w-full p-2 border border-zinc-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    المجال / الصناعة:
                  </label>
                  <input
                    type="text"
                    value={customForm.industry}
                    onChange={(e) => setCustomForm({ ...customForm, industry: e.target.value })}
                    placeholder="مثال: مطاعم ومأكولات شرقية"
                    className="w-full p-2 border border-zinc-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    الجمهور المستهدف:
                  </label>
                  <input
                    type="text"
                    value={customForm.targetAudience}
                    onChange={(e) => setCustomForm({ ...customForm, targetAudience: e.target.value })}
                    placeholder="مثال: موظفو الشركات والعائلات"
                    className="w-full p-2 border border-zinc-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    اللهجة المطلوبة:
                  </label>
                  <input
                    type="text"
                    value={customForm.languageDialect}
                    onChange={(e) => setCustomForm({ ...customForm, languageDialect: e.target.value })}
                    placeholder="مثال: مصري عامي بسيط وودود"
                    className="w-full p-2 border border-zinc-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  الهدف التسويقي:
                </label>
                <input
                  type="text"
                  value={customForm.marketingObjective}
                  onChange={(e) => setCustomForm({ ...customForm, marketingObjective: e.target.value })}
                  placeholder="مثال: زيادة مبيعات وجبة الغداء السريعة في أيام العمل"
                  className="w-full p-2 border border-zinc-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  موجز العميل (Client Brief): *
                </label>
                <textarea
                  rows={4}
                  value={customForm.clientBrief}
                  onChange={(e) => setCustomForm({ ...customForm, clientBrief: e.target.value })}
                  placeholder="اكتب هنا السيناريو التسويقي والتفاصيل التي ترغب في تضمينها..."
                  className="w-full p-2.5 border border-zinc-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  سياق إضافي أو قيود:
                </label>
                <textarea
                  rows={2}
                  value={customForm.additionalContext}
                  onChange={(e) => setCustomForm({ ...customForm, additionalContext: e.target.value })}
                  placeholder="ملاحظات أو توجيهات إضافية..."
                  className="w-full p-2.5 border border-zinc-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800"
                >
                  {editingTemplate ? 'حفظ التعديلات' : 'إضافة وحفظ النموذج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
