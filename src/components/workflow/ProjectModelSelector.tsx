import React, { useState, useRef, useEffect } from 'react';
import { Project, AIModelOption, SUPPORTED_AI_MODELS } from '../../types.ts';
import {
  FolderOpen,
  ChevronDown,
  Cpu,
  Check,
  Plus,
  Sparkles,
  Zap,
  Globe,
  Settings,
} from 'lucide-react';

interface ProjectModelSelectorProps {
  projects: Project[];
  activeProject: Project;
  onSwitchProject: (projectId: string) => void;
  onOpenProjectBrief: () => void;
  onSelectModel: (modelId: string) => void;
  activeModelId: string;
}

export const ProjectModelSelector: React.FC<ProjectModelSelectorProps> = ({
  projects,
  activeProject,
  onSwitchProject,
  onOpenProjectBrief,
  onSelectModel,
  activeModelId,
}) => {
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        projectDropdownRef.current &&
        !projectDropdownRef.current.contains(e.target as Node)
      ) {
        setIsProjectDropdownOpen(false);
      }
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(e.target as Node)
      ) {
        setIsModelDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeModelMeta =
    SUPPORTED_AI_MODELS.find((m) => m.id === activeModelId) || SUPPORTED_AI_MODELS[0];

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs" dir="rtl">
      {/* 1. PROJECT SELECTOR DROPDOWN */}
      <div className="relative" ref={projectDropdownRef}>
        <button
          type="button"
          onClick={() => {
            setIsProjectDropdownOpen(!isProjectDropdownOpen);
            setIsModelDropdownOpen(false);
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 hover:border-zinc-300 rounded-xl font-semibold text-zinc-900 transition shadow-2xs hover:bg-zinc-50 cursor-pointer"
          title="تغيير المشروع الحالي أو مراجعة المشروعات المتاحة"
        >
          <FolderOpen size={14} className="text-zinc-600" />
          <div className="text-right leading-tight max-w-[140px] sm:max-w-[180px] truncate">
            <span className="truncate block font-bold">
              {activeProject?.name || activeProject?.brief?.brandName || 'مشروع بدون اسم'}
            </span>
          </div>
          {activeProject?.brief?.country && (
            <span className="hidden sm:inline-block text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.2 rounded border border-zinc-200">
              {activeProject.brief.country.split(' ')[0]}
            </span>
          )}
          <ChevronDown
            size={13}
            className={`text-zinc-400 transition-transform ${
              isProjectDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Project Dropdown Menu */}
        {isProjectDropdownOpen && (
          <div className="absolute top-full right-0 mt-1.5 w-72 sm:w-80 bg-white border border-zinc-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-3 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-800">اختيار المشروع (Projects)</span>
              <span className="text-[11px] text-zinc-500 font-mono">
                {projects.length} مشاريع متاحة
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
              {projects.map((proj) => {
                const isCurrent = proj.id === activeProject.id;
                return (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => {
                      onSwitchProject(proj.id);
                      setIsProjectDropdownOpen(false);
                    }}
                    className={`w-full text-right p-2.5 rounded-xl transition flex items-start justify-between gap-2 cursor-pointer ${
                      isCurrent
                        ? 'bg-zinc-900 text-white shadow-xs'
                        : 'hover:bg-zinc-100 text-zinc-800'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="font-bold text-xs truncate flex items-center gap-1.5">
                        <span className="truncate">{proj.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] bg-zinc-800 text-emerald-400 px-1.5 py-0.2 rounded shrink-0">
                            نشط
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-[11px] truncate ${
                          isCurrent ? 'text-zinc-300' : 'text-zinc-500'
                        }`}
                      >
                        {proj.brief?.industry || 'مجال عام'} • {proj.brief?.country || 'السوق العام'}
                      </div>
                      <div
                        className={`text-[10px] font-mono ${
                          isCurrent ? 'text-zinc-400' : 'text-zinc-400'
                        }`}
                      >
                        النموذج المختار: {proj.selectedModel}
                      </div>
                    </div>
                    {isCurrent && <Check size={15} className="text-emerald-400 mt-1 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="p-2 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsProjectDropdownOpen(false);
                  onOpenProjectBrief();
                }}
                className="w-full text-center py-1.5 px-3 rounded-lg text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Settings size={13} />
                <span>إدارة نماذج وبيانات المشاريع...</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. CONTROLLED AI MODEL SELECTOR FOR ACTIVE PROJECT */}
      <div className="relative" ref={modelDropdownRef}>
        <button
          type="button"
          onClick={() => {
            setIsModelDropdownOpen(!isModelDropdownOpen);
            setIsProjectDropdownOpen(false);
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-xl text-zinc-900 transition shadow-2xs hover:bg-zinc-100 cursor-pointer"
          title={`النموذج الذكي المخصص لمشروع ${activeProject?.name || ''}`}
        >
          <Cpu size={14} className="text-zinc-700" />
          <div className="text-right leading-tight">
            <span className="font-bold text-xs block text-zinc-900">
              {activeModelMeta.name}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
            {activeModelMeta.badge.split(' ')[0]}
          </span>
          <ChevronDown
            size={13}
            className={`text-zinc-400 transition-transform ${
              isModelDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Model Selection Dropdown */}
        {isModelDropdownOpen && (
          <div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-1.5 w-72 sm:w-80 bg-white border border-zinc-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-3 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-900">
                نموذج الذكاء الاصطناعي للمشروع (AI Model)
              </span>
              <span className="text-[10px] bg-zinc-200/80 text-zinc-700 px-2 py-0.5 rounded font-mono truncate max-w-[100px]">
                {activeProject?.name || 'المشروع'}
              </span>
            </div>

            <div className="p-2 space-y-1.5">
              {SUPPORTED_AI_MODELS.map((modelOpt) => {
                const isSelected = modelOpt.id === activeModelId;
                return (
                  <button
                    key={modelOpt.id}
                    type="button"
                    onClick={() => {
                      onSelectModel(modelOpt.id);
                      setIsModelDropdownOpen(false);
                    }}
                    className={`w-full text-right p-3 rounded-xl border transition text-xs cursor-pointer ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                        : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs">{modelOpt.name}</span>
                        {isSelected && <Check size={14} className="text-emerald-400" />}
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          isSelected
                            ? 'bg-zinc-800 text-zinc-200'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {modelOpt.badge}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] leading-relaxed ${
                        isSelected ? 'text-zinc-300' : 'text-zinc-500'
                      }`}
                    >
                      {modelOpt.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="p-2.5 bg-zinc-50 border-t border-zinc-100 text-[11px] text-zinc-500 text-center">
              * يتم حفظ اختيار النموذج مستقلاً لكل مشروع دون التأثير على المشروعات الأخرى.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
