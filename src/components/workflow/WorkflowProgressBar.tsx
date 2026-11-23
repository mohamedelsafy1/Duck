import React from 'react';
import { Check, Lock, ChevronLeft, Sparkles, FileText, Lightbulb, CheckSquare, LayoutGrid, PenTool, RotateCcw, Cpu } from 'lucide-react';

interface WorkflowProgressBarProps {
  currentStage: number; // 1 to 5
  strategyApproved: boolean;
  ideasApproved: boolean;
  formatsConfirmed: boolean;
  productionCompleted: boolean;
  onSelectStage: (stage: number) => void;
  onResetWorkflow?: () => void;
  selectedModelName?: string;
  projectName?: string;
}

export const WORKFLOW_STAGES = [
  {
    number: 1,
    title: 'استراتيجية البراند',
    sub: 'Brand Strategy',
    icon: FileText,
    desc: 'بناء واعتماد التموضع والركائز التسويقية',
  },
  {
    number: 2,
    title: 'توليد أفكار المحتوى',
    sub: 'Content Ideas',
    icon: Lightbulb,
    desc: 'ابتكار أفكار إبداعية استناداً للاستراتيجية',
  },
  {
    number: 3,
    title: 'تصفية واعتماد الأفكار',
    sub: 'Idea Selection',
    icon: CheckSquare,
    desc: 'مراجعة واعتماد الأفكار المختارة للتنفيذ',
  },
  {
    number: 4,
    title: 'تحديد قوالب التنفيذ',
    sub: 'Format Selection',
    icon: LayoutGrid,
    desc: 'اختيار صيغة كل فكرة (كاروسيل، بوست، سكريبت)',
  },
  {
    number: 5,
    title: 'صناعة المحتوى',
    sub: 'Content Production',
    icon: PenTool,
    desc: 'كتابة وتوليد المخرجات النهائية والتعديل عليها',
  },
];

export const WorkflowProgressBar: React.FC<WorkflowProgressBarProps> = ({
  currentStage,
  strategyApproved,
  ideasApproved,
  formatsConfirmed,
  productionCompleted,
  onSelectStage,
  onResetWorkflow,
  selectedModelName,
  projectName,
}) => {
  // Determine if a stage is unlocked
  const isStageUnlocked = (stageNum: number): boolean => {
    if (stageNum === 1) return true;
    if (stageNum === 2) return strategyApproved;
    if (stageNum === 3) return strategyApproved;
    if (stageNum === 4) return strategyApproved && ideasApproved;
    if (stageNum === 5) return strategyApproved && ideasApproved && formatsConfirmed;
    return false;
  };

  // Determine if a stage is completed & approved
  const isStageCompleted = (stageNum: number): boolean => {
    if (stageNum === 1) return strategyApproved;
    if (stageNum === 2) return ideasApproved;
    if (stageNum === 3) return ideasApproved;
    if (stageNum === 4) return formatsConfirmed;
    if (stageNum === 5) return productionCompleted;
    return false;
  };

  return (
    <div className="bg-white border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Top Control Bar with Model Badge and Reset Workflow Action */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-2 text-xs">
            {projectName && (
              <span className="font-bold text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-lg border border-zinc-200">
                مشروع: {projectName}
              </span>
            )}
            {selectedModelName && (
              <span className="inline-flex items-center gap-1.5 text-zinc-700 bg-white px-2.5 py-1 rounded-lg border border-zinc-200 text-[11px]">
                <Cpu size={12} className="text-zinc-500" />
                <span>النموذج المعتمد: <strong className="font-mono">{selectedModelName}</strong></span>
              </span>
            )}
          </div>

          {onResetWorkflow && (
            <button
              type="button"
              onClick={onResetWorkflow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 text-zinc-700 hover:text-rose-700 hover:border-rose-300 hover:bg-rose-50/70 transition text-xs font-semibold cursor-pointer shadow-2xs group"
              title="إعادة تعيين مسار العمل للبدء بخطة أو استراتيجية تسويقية جديدة"
            >
              <RotateCcw size={13} className="text-zinc-500 group-hover:text-rose-600 transition-transform group-hover:-rotate-45" />
              <span>إعادة تعيين سير العمل (Reset Workflow)</span>
            </button>
          )}
        </div>

        {/* Stages steps */}
        <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
          {WORKFLOW_STAGES.map((s, idx) => {
            const isActive = currentStage === s.number;
            const isCompleted = isStageCompleted(s.number);
            const isUnlocked = isStageUnlocked(s.number);
            const Icon = s.icon;

            return (
              <React.Fragment key={s.number}>
                <button
                  type="button"
                  onClick={() => {
                    if (isUnlocked) {
                      onSelectStage(s.number);
                    }
                  }}
                  disabled={!isUnlocked}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition shrink-0 ${
                    isActive
                      ? 'bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-900'
                      : isCompleted
                      ? 'bg-emerald-50 text-emerald-950 border border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                      : isUnlocked
                      ? 'bg-zinc-100/80 text-zinc-800 hover:bg-zinc-200 cursor-pointer border border-zinc-200'
                      : 'bg-zinc-50 text-zinc-400 border border-zinc-200/60 opacity-60 cursor-not-allowed'
                  }`}
                  title={
                    !isUnlocked
                      ? `هذه المرحلة مغلقة حتى يتم اعتماد المرحلة السابقة`
                      : s.desc
                  }
                >
                  {/* Step status circle */}
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isActive
                        ? 'bg-white text-zinc-900'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isUnlocked
                        ? 'bg-zinc-200 text-zinc-700'
                        : 'bg-zinc-200/70 text-zinc-400'
                    }`}
                  >
                    {isCompleted ? <Check size={13} strokeWidth={3} /> : !isUnlocked ? <Lock size={11} /> : s.number}
                  </span>

                  {/* Stage Text */}
                  <div className="text-right">
                    <div className="font-bold flex items-center gap-1.5 leading-tight">
                      <span>{s.title}</span>
                      {!isUnlocked && <Lock size={10} className="text-zinc-400" />}
                    </div>
                    <div
                      className={`text-[10px] hidden md:block font-mono mt-0.5 ${
                        isActive ? 'text-zinc-300' : isCompleted ? 'text-emerald-700' : 'text-zinc-400'
                      }`}
                    >
                      {s.sub}
                    </div>
                  </div>
                </button>

                {idx < WORKFLOW_STAGES.length - 1 && (
                  <div className="text-zinc-300 hidden lg:flex items-center select-none px-1">
                    <ChevronLeft size={16} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Informative Workflow Guidance Bar */}
        <div className="mt-2.5 pt-2 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-800">
              المرحلة الحالية ({currentStage}/5): {WORKFLOW_STAGES[currentStage - 1].title}
            </span>
            <span className="text-zinc-300">•</span>
            <span className="text-zinc-600">
              {currentStage === 1 &&
                (strategyApproved
                  ? 'تم اعتماد استراتيجية البراند بنجاح كمرجع رسمي للمراحل التالية.'
                  : 'مطلوب مراجعة الاستراتيجية وتأكيد اعتمادها ("مناسبة، نكمل") لفتح المراحل التالية.')}
              {currentStage === 2 &&
                (ideasApproved
                  ? 'تم اعتماد الأفكار المختارة.'
                  : 'اختر الأفكار التسويقية المناسبة أو اطلب أفكاراً إضافية ثم اضغط اعتماد.')}
              {currentStage === 3 &&
                (ideasApproved
                  ? 'تم اعتماد الأفكار وجاهزة لتحديد قوالب التنفيذ.'
                  : 'راجع الأفكار المختارة واعتمدها للانتقال لمرحلة تحديد قوالب التنفيذ.')}
              {currentStage === 4 &&
                (formatsConfirmed
                  ? 'تم تأكيد قوالب التنفيذ.'
                  : 'حدد القالب المطلوب لكل فكرة (كاروسيل، بوست، سكريبت) ثم اضغط بدء التنفيذ.')}
              {currentStage === 5 &&
                'المخرجات التنفيذية جاهزة. يمكنك مراجعتها، نسخها، أو تعديلها وإعادة توليدها.'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              مكتمل ومعتمد
            </span>
            <span className="inline-flex items-center gap-1 text-zinc-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-zinc-900"></span>
              قيد العمل
            </span>
            <span className="inline-flex items-center gap-1 text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-zinc-300"></span>
              مغلق
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
