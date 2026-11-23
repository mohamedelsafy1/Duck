import React, { useState } from 'react';
import { EngineId, EngineType, PromptRecord, PromptVersionRecord } from '../types.ts';
import {
  FolderOpen,
  X,
  Trash2,
  ArrowUpRight,
  Copy,
  Check,
  Edit2,
  CopyPlus,
  RefreshCw,
  History,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface SavedPromptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  engineId: EngineId;
  engineName: EngineType;
  savedPrompts: PromptRecord[];
  currentDraftText: string;
  onSelectPrompt: (prompt: PromptRecord) => void;
  onSaveNewPrompt: (name: string, notes: string) => void;
  onOverwritePrompt: (id: string) => void;
  onRenamePrompt: (id: string, newName: string) => void;
  onDuplicatePrompt: (id: string) => void;
  onDeletePrompt: (id: string) => void;
  onRestoreVersion: (prompt: PromptRecord, version: PromptVersionRecord) => void;
}

export const SavedPromptsModal: React.FC<SavedPromptsModalProps> = ({
  isOpen,
  onClose,
  engineId,
  engineName,
  savedPrompts,
  currentDraftText,
  onSelectPrompt,
  onSaveNewPrompt,
  onOverwritePrompt,
  onRenamePrompt,
  onDuplicatePrompt,
  onDeletePrompt,
  onRestoreVersion,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState<string>('');

  const [expandedVersionsId, setExpandedVersionsId] = useState<string | null>(null);

  // New prompt creation inline form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptNotes, setNewPromptNotes] = useState('');

  if (!isOpen) return null;

  const handleCopy = async (p: PromptRecord) => {
    try {
      await navigator.clipboard.writeText(p.systemPrompt);
      setCopiedId(p.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartRename = (p: PromptRecord) => {
    setEditingId(p.id);
    setEditNameValue(p.name);
  };

  const handleConfirmRename = (id: string) => {
    if (!editNameValue.trim()) return;
    onRenamePrompt(id, editNameValue.trim());
    setEditingId(null);
  };

  const handleCreatePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptName.trim()) {
      alert('يرجى إدخال اسم للبرومبت.');
      return;
    }
    onSaveNewPrompt(newPromptName.trim(), newPromptNotes.trim());
    setNewPromptName('');
    setNewPromptNotes('');
    setShowCreateForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/45 backdrop-blur-xs">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 md:p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <FolderOpen size={18} className="text-zinc-800" />
              <h3 className="font-bold text-zinc-900 text-sm md:text-base">
                البرومبتات المحفوظة الخاصة بمحرك:
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 text-white font-mono text-xs font-semibold">
                {engineName}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              هذه المكتبة معزولة تماماً وتخص فقط محرك ({engineName}) ولا تظهر في المحركات الأخرى.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Top Action Bar inside modal */}
        <div className="p-3 md:px-5 border-b border-zinc-100 bg-white flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-zinc-500">
            عدد البرومبتات المحفوظة: <strong className="text-zinc-900">{savedPrompts.length}</strong>
          </span>

          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 font-medium transition cursor-pointer"
          >
            <Plus size={14} />
            <span>حفظ المسودة الحالية كبرومبت جديد</span>
          </button>
        </div>

        {/* Inline Create Form */}
        {showCreateForm && (
          <form
            onSubmit={handleCreatePromptSubmit}
            className="p-4 bg-zinc-50 border-b border-zinc-200 space-y-3 text-xs"
          >
            <div className="font-bold text-zinc-800">حفظ مسودة الـ System Prompt الحالية لهذا المحرك:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  اسم البرومبت:
                </label>
                <input
                  type="text"
                  value={newPromptName}
                  onChange={(e) => setNewPromptName(e.target.value)}
                  placeholder="مثال: استراتيجية إطلاق منتجات الرفاهية"
                  className="w-full p-2 border border-zinc-200 rounded-lg bg-white text-zinc-800 focus:outline-none focus:border-zinc-700"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  ملاحظات أو الهدف من البرومبت (اختياري):
                </label>
                <input
                  type="text"
                  value={newPromptNotes}
                  onChange={(e) => setNewPromptNotes(e.target.value)}
                  placeholder="مثال: مخصص للسوق السعودي والجمهور الشاب"
                  className="w-full p-2 border border-zinc-200 rounded-lg bg-white text-zinc-800 focus:outline-none focus:border-zinc-700"
                />
              </div>
            </div>

            <div className="text-[11px] text-zinc-500">
              سيتم حفظ محتوى الـ System Prompt المكتوب حالياً في المحرر (حجمه: {currentDraftText.length} حرف).
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1.5 text-zinc-600 hover:text-zinc-800 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 cursor-pointer"
              >
                تأكيد الحفظ
              </button>
            </div>
          </form>
        )}

        {/* Modal Body: List of prompts for this engine */}
        <div className="p-4 md:p-5 overflow-y-auto space-y-3.5 flex-1 text-xs">
          {savedPrompts.length === 0 ? (
            <div className="py-14 text-center text-zinc-400 space-y-2">
              <FolderOpen size={36} className="mx-auto text-zinc-300 stroke-[1.5]" />
              <p className="font-semibold text-zinc-600">لا توجد برومبتات محفوظة لمحرك ({engineName}) حتى الآن.</p>
              <p className="text-[11px] text-zinc-400 max-w-md mx-auto">
                اكتب الـ System Prompt الخاص بك في محرر هذا المحرك ثم اضغط "حفظ البرومبت" للاحتفاظ به بشكل مستقل.
              </p>
            </div>
          ) : (
            savedPrompts.map((p) => {
              const isExpanded = expandedVersionsId === p.id;
              const hasVersions = p.versions && p.versions.length > 1;

              return (
                <div
                  key={p.id}
                  className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3 transition hover:border-zinc-300 bg-white"
                >
                  {/* Title & Meta Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      {editingId === p.id ? (
                        <div className="flex items-center gap-1.5 flex-1 max-w-sm">
                          <input
                            type="text"
                            value={editNameValue}
                            onChange={(e) => setEditNameValue(e.target.value)}
                            className="p-1.5 border border-zinc-300 rounded text-xs text-zinc-900 w-full bg-white"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleConfirmRename(p.id)}
                            className="px-2 py-1 bg-zinc-900 text-white rounded text-[11px] font-medium cursor-pointer"
                          >
                            حفظ
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 bg-zinc-100 text-zinc-700 rounded text-[11px] cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="font-bold text-zinc-900 text-sm">
                            {p.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartRename(p)}
                            className="text-zinc-400 hover:text-zinc-700 p-0.5 cursor-pointer"
                            title="إعادة تسمية البرومبت"
                          >
                            <Edit2 size={12} />
                          </button>
                        </>
                      )}

                      <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded text-[10px] font-mono border border-zinc-200">
                        v{p.version}
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                      <Clock size={12} />
                      <span>
                        {new Date(p.updatedAt).toLocaleDateString('ar-EG', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Notes if present */}
                  {p.notes && (
                    <div className="text-[11px] text-zinc-600 bg-zinc-50 p-2 rounded border border-zinc-100">
                      <strong>ملاحظات:</strong> {p.notes}
                    </div>
                  )}

                  {/* Prompt Text Preview */}
                  <div
                    className="text-zinc-700 font-mono text-[11px] bg-zinc-50 p-3 rounded-lg border border-zinc-200 line-clamp-3 whitespace-pre-wrap leading-relaxed"
                    dir="auto"
                  >
                    {p.systemPrompt}
                  </div>

                  {/* Actions Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-100">
                    <div className="flex items-center gap-1.5">
                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف برومبت "${p.name}"؟`)) {
                            onDeletePrompt(p.id);
                          }
                        }}
                        className="text-rose-600 hover:text-rose-800 p-1.5 hover:bg-rose-50 rounded text-[11px] flex items-center gap-1 cursor-pointer"
                        title="حذف هذا البرومبت"
                      >
                        <Trash2 size={13} />
                        <span>حذف</span>
                      </button>

                      {/* Duplicate within engine */}
                      <button
                        type="button"
                        onClick={() => onDuplicatePrompt(p.id)}
                        className="text-zinc-600 hover:text-zinc-900 p-1.5 hover:bg-zinc-100 rounded text-[11px] flex items-center gap-1 cursor-pointer"
                        title="نسخ وتكرار هذا البرومبت داخل نفس المحرك"
                      >
                        <CopyPlus size={13} />
                        <span>تكرار</span>
                      </button>

                      {/* Overwrite with current draft */}
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              `هل تريد تحديث واستبدال محتوى برومبت "${p.name}" بالنص الحالي الموجود في المحرر؟`
                            )
                          ) {
                            onOverwritePrompt(p.id);
                          }
                        }}
                        className="text-zinc-600 hover:text-zinc-900 p-1.5 hover:bg-zinc-100 rounded text-[11px] flex items-center gap-1 cursor-pointer"
                        title="تحديث هذا البرومبت المحفوظ بمحتوى المسودة الحالية"
                      >
                        <RefreshCw size={13} />
                        <span>تحديث بالنص الحالي</span>
                      </button>

                      {/* Version history toggle */}
                      {hasVersions && (
                        <button
                          type="button"
                          onClick={() => setExpandedVersionsId(isExpanded ? null : p.id)}
                          className="text-zinc-600 hover:text-zinc-900 p-1.5 hover:bg-zinc-100 rounded text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <History size={13} />
                          <span>الإصدارات ({p.versions?.length})</span>
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(p)}
                        className="px-2.5 py-1 text-zinc-700 hover:bg-zinc-100 bg-zinc-50 border border-zinc-200 rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === p.id ? (
                          <Check size={12} className="text-emerald-600" />
                        ) : (
                          <Copy size={12} />
                        )}
                        <span>{copiedId === p.id ? 'تم النسخ' : 'نسخ النص'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectPrompt(p);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>تحميل في المحرر</span>
                        <ArrowUpRight size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Version History Drawer if expanded */}
                  {isExpanded && p.versions && (
                    <div className="mt-2 pt-2 border-t border-zinc-200 space-y-2 bg-zinc-50 p-3 rounded-lg">
                      <div className="font-semibold text-zinc-800 text-[11px]">
                        سجل إصدارات برومبت ({p.name}):
                      </div>
                      <div className="space-y-2">
                        {p.versions.map((ver, vIdx) => (
                          <div
                            key={vIdx}
                            className="p-2.5 bg-white border border-zinc-200 rounded flex items-start justify-between gap-3 text-[11px]"
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-zinc-900 font-mono">
                                  v{ver.version}
                                </span>
                                <span className="text-zinc-400">
                                  {new Date(ver.timestamp).toLocaleDateString('ar-EG', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              {ver.notes && (
                                <div className="text-zinc-500 text-[10px]">
                                  {ver.notes}
                                </div>
                              )}
                              <div className="text-zinc-700 font-mono line-clamp-2" dir="auto">
                                {ver.systemPrompt}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                onRestoreVersion(p, ver);
                                onClose();
                              }}
                              className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-800 rounded font-medium text-[11px] transition cursor-pointer shrink-0"
                            >
                              استرجاع هذا الإصدار
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between text-xs">
          <span className="text-zinc-400 text-[11px]">
            المحرك النشط: <strong className="text-zinc-700">{engineName}</strong>
          </span>

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
