import React, { useState } from 'react';
import { ContentDeliverable, ContentFormatType } from '../../types.ts';
import { MarkdownRenderer } from '../MarkdownRenderer.tsx';
import {
  PenTool,
  Copy,
  Check,
  Edit2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Image as ImageIcon,
  Film,
  Download,
  Loader2,
  Save,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface Stage5Props {
  deliverables: ContentDeliverable[];
  onUpdateDeliverableContent: (id: string, newContent: string) => void;
  onToggleDeliverableApproved: (id: string) => void;
  onRegenerateDeliverable: (id: string) => Promise<void>;
  onGenerateAllPendingDeliverables: () => Promise<void>;
  onBackToFormats: () => void;
  isGeneratingBatch: boolean;
  regeneratingId: string | null;
  selectedModelName?: string;
}

export const Stage5ContentProductionView: React.FC<Stage5Props> = ({
  deliverables,
  onUpdateDeliverableContent,
  onToggleDeliverableApproved,
  onRegenerateDeliverable,
  onGenerateAllPendingDeliverables,
  onBackToFormats,
  isGeneratingBatch,
  regeneratingId,
  selectedModelName,
}) => {
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string>(
    deliverables[0]?.id || ''
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formatFilter, setFormatFilter] = useState<'all' | ContentFormatType>('all');

  const activeDeliverable =
    deliverables.find((d) => d.id === selectedDeliverableId) || deliverables[0];

  const handleStartEdit = () => {
    if (!activeDeliverable) return;
    setEditBuffer(activeDeliverable.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!activeDeliverable) return;
    onUpdateDeliverableContent(activeDeliverable.id, editBuffer);
    setIsEditing(false);
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const formatIcon = (fmt: ContentFormatType) => {
    switch (fmt) {
      case 'carousel':
        return <Layers size={14} className="text-blue-600" />;
      case 'static_post':
        return <ImageIcon size={14} className="text-emerald-600" />;
      case 'video_script':
        return <Film size={14} className="text-purple-600" />;
    }
  };

  const formatLabel = (fmt: ContentFormatType) => {
    switch (fmt) {
      case 'carousel':
        return 'كاروسيل (Carousel)';
      case 'static_post':
        return 'بوست ثابت (Static Post)';
      case 'video_script':
        return 'سكريبت فيديو (Video Script)';
    }
  };

  const filteredDeliverables = deliverables.filter(
    (d) => formatFilter === 'all' || d.format === formatFilter
  );

  const completedCount = deliverables.filter((d) => d.status === 'completed').length;
  const approvedCount = deliverables.filter((d) => d.isApproved).length;
  const pendingCount = deliverables.filter((d) => d.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <PenTool size={20} className="text-zinc-800" />
              <h3 className="text-lg font-bold text-zinc-900">
                المرحلة 5: صناعة وتوليد المحتوى التنفيذي (Content Production)
              </h3>
              {selectedModelName && (
                <span className="text-[11px] bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded border border-zinc-200 font-mono">
                  النموذج: {selectedModelName}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              مساحة العمل التنفيذية المخصصة لمراجعة، تعديل، واعتماد كل مخرج تسويقي بشكل مستقل.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={onGenerateAllPendingDeliverables}
                disabled={isGeneratingBatch}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 disabled:opacity-50 transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {isGeneratingBatch ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-zinc-300" />
                    <span>جارٍ توليد المخرجات...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>توليد المتبقي ({pendingCount})</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onBackToFormats}
              className="px-3.5 py-2 border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              ← تعديل القوالب
            </button>
          </div>
        </div>

        {/* Status Metrics Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-zinc-600">
            <span>
              إجمالي المخرجات: <strong className="text-zinc-900">{deliverables.length}</strong>
            </span>
            <span>•</span>
            <span>
              المكتملة: <strong className="text-emerald-700">{completedCount}</strong>
            </span>
            <span>•</span>
            <span>
              المعتمدة: <strong className="text-zinc-900">{approvedCount}</strong>
            </span>
          </div>

          {/* Format Filter Pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-400">تصفية العرض:</span>
            {(['all', 'carousel', 'static_post', 'video_script'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setFormatFilter(fmt)}
                className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                  formatFilter === fmt
                    ? 'bg-zinc-900 text-white font-medium'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {fmt === 'all'
                  ? 'الكل'
                  : fmt === 'carousel'
                  ? 'كاروسيل'
                  : fmt === 'static_post'
                  ? 'بوست'
                  : 'فيديو'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Production Workspace: Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Sidebar: Deliverables Navigator (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-2xl p-3 space-y-2 max-h-[750px] overflow-y-auto shadow-xs">
          <div className="px-2 py-1 text-xs font-bold text-zinc-800 border-b border-zinc-100 pb-2">
            قائمة المخرجات ({filteredDeliverables.length}):
          </div>

          {filteredDeliverables.map((item, idx) => {
            const isSelected = activeDeliverable?.id === item.id;
            const isRegeneratingThis = regeneratingId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedDeliverableId(item.id);
                  setIsEditing(false);
                }}
                className={`w-full text-right p-3 rounded-xl border transition-all text-xs cursor-pointer flex flex-col gap-1.5 ${
                  isSelected
                    ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900 shadow-xs'
                    : 'border-zinc-200/80 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <div className="flex items-center gap-1.5 font-bold text-zinc-900 truncate">
                    {formatIcon(item.format)}
                    <span className="truncate">{item.ideaTitle}</span>
                  </div>

                  <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                    #{String(idx + 1).padStart(2, '0')}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-500 w-full pt-1 border-t border-zinc-100">
                  <span>{formatLabel(item.format)}</span>

                  <div className="flex items-center gap-1.5">
                    {item.isEdited && (
                      <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px] font-medium">
                        معدل يدوياً
                      </span>
                    )}

                    {item.isApproved ? (
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">
                        معتمد ✓
                      </span>
                    ) : item.status === 'generating' || isRegeneratingThis ? (
                      <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded text-[9px] font-medium flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin" />
                        توليد...
                      </span>
                    ) : item.status === 'completed' ? (
                      <span className="px-1.5 py-0.2 bg-zinc-200 text-zinc-700 rounded text-[9px]">
                        جاهز
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded text-[9px]">
                        معلق
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right/Main Content Display (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-5">
          {activeDeliverable ? (
            <div className="space-y-4">
              {/* Deliverable Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {formatIcon(activeDeliverable.format)}
                    <h4 className="font-bold text-base text-zinc-900">
                      {activeDeliverable.ideaTitle}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                      {formatLabel(activeDeliverable.format)}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    آخر تحديث: {new Date(activeDeliverable.updatedAt).toLocaleTimeString('ar-EG')}
                  </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Copy */}
                  <button
                    type="button"
                    onClick={() => handleCopy(activeDeliverable.content, activeDeliverable.id)}
                    className="px-3 py-1.5 border border-zinc-200 rounded-xl text-xs text-zinc-700 hover:bg-zinc-50 transition flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === activeDeliverable.id ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                    <span>{copiedId === activeDeliverable.id ? 'تم النسخ' : 'نسخ المحتوى'}</span>
                  </button>

                  {/* Toggle Edit */}
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Save size={14} />
                      <span>حفظ التعديل</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="px-3 py-1.5 border border-zinc-200 rounded-xl text-xs text-zinc-700 hover:bg-zinc-50 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 size={13} />
                      <span>تعديل يدوي</span>
                    </button>
                  )}

                  {/* Regenerate this output specifically */}
                  <button
                    type="button"
                    onClick={() => onRegenerateDeliverable(activeDeliverable.id)}
                    disabled={regeneratingId === activeDeliverable.id}
                    className="px-3 py-1.5 border border-zinc-200 rounded-xl text-xs text-zinc-700 hover:bg-zinc-50 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    title="إعادة توليد هذا المخرج فقط دون المساس بباقي المخرجات"
                  >
                    {regeneratingId === activeDeliverable.id ? (
                      <Loader2 size={13} className="animate-spin text-zinc-500" />
                    ) : (
                      <RefreshCw size={13} />
                    )}
                    <span>إعادة التوليد</span>
                  </button>

                  {/* Mark as Approved */}
                  <button
                    type="button"
                    onClick={() => onToggleDeliverableApproved(activeDeliverable.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeDeliverable.isApproved
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-900 text-white hover:bg-zinc-800'
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    <span>{activeDeliverable.isApproved ? 'معتمد ✓' : 'اعتماد'}</span>
                  </button>
                </div>
              </div>

              {/* Status and Loading Indicator */}
              {regeneratingId === activeDeliverable.id ? (
                <div className="py-20 text-center space-y-3">
                  <Loader2 size={32} className="animate-spin text-zinc-700 mx-auto" />
                  <p className="text-xs font-bold text-zinc-800">
                    جارٍ إعادة توليد محتوى {formatLabel(activeDeliverable.format)}...
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    يتم الحفاظ على كافة المخرجات الأخرى وتعديلاتها دون أي مساس.
                  </p>
                </div>
              ) : isEditing ? (
                /* Inline Editor */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>محرر النصوص المباشر (يمكنك تعديل أي جزء من النص أو الصياغة):</span>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      إلغاء التحرير
                    </button>
                  </div>
                  <textarea
                    rows={18}
                    value={editBuffer}
                    onChange={(e) => setEditBuffer(e.target.value)}
                    className="w-full p-4 border border-zinc-300 rounded-xl text-xs text-zinc-900 font-sans focus:outline-none focus:ring-1 focus:ring-zinc-900 leading-relaxed bg-[#FCFCFB]"
                    dir="auto"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-1.5 text-xs text-zinc-600 hover:text-zinc-800 cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="px-5 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 cursor-pointer"
                    >
                      حفظ التعديلات
                    </button>
                  </div>
                </div>
              ) : activeDeliverable.content ? (
                /* Editorial Rendered Output */
                <div className="p-5 bg-[#FCFCFB] border border-zinc-200/80 rounded-2xl text-xs md:text-sm leading-relaxed" dir="auto">
                  <MarkdownRenderer content={activeDeliverable.content} />
                </div>
              ) : (
                <div className="py-20 text-center space-y-3">
                  <AlertTriangle size={32} className="text-zinc-300 mx-auto" />
                  <p className="text-xs text-zinc-500">المحتوى قيد التوليد أو لم يبدأ بعد.</p>
                  <button
                    type="button"
                    onClick={() => onRegenerateDeliverable(activeDeliverable.id)}
                    className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 cursor-pointer"
                  >
                    بدء التوليد لهذا المخرج
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-24 text-center text-zinc-400 text-xs">
              اختر أحد المخرجات من القائمة الجانبية لعرضه وتعديله.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
