import React from 'react';
import { DatasetStatsResponse } from '../../types.ts';
import {
  Database,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Copy,
  ShieldAlert,
  BarChart3,
  Globe2,
  Briefcase,
  Layers,
  Target,
  Sparkles,
  ArrowUpRight,
  BookmarkCheck,
} from 'lucide-react';

interface DatasetOverviewSectionProps {
  stats: DatasetStatsResponse | null;
  onNavigateToImport: () => void;
  onNavigateToRecords: (filterKey?: string, filterValue?: string) => void;
}

export const DatasetOverviewSection: React.FC<DatasetOverviewSectionProps> = ({
  stats,
  onNavigateToImport,
  onNavigateToRecords,
}) => {
  if (!stats) {
    return (
      <div className="p-8 text-center text-zinc-500 text-xs">
        جارٍ تحميل إحصائيات قاعدة البيانات...
      </div>
    );
  }

  const kpis = [
    {
      label: 'إجمالي السجلات (Total)',
      value: stats.totalRecords,
      desc: 'سجلات البيانات المخزنة فعلياً',
      icon: Database,
      color: 'text-zinc-900 bg-zinc-100 border-zinc-200',
      action: () => onNavigateToRecords(),
    },
    {
      label: 'محتوى تسويقي (Content)',
      value: stats.marketingContentCount ?? (stats.totalRecords - (stats.marketingReferenceCount || 0)),
      desc: 'نصوص تسويقية كاملة للأمثلة',
      icon: Layers,
      color: 'text-teal-900 bg-teal-50 border-teal-200',
      action: () => onNavigateToRecords('recordPurpose', 'marketing_content'),
    },
    {
      label: 'مراجع تسويقية (References)',
      value: stats.marketingReferenceCount ?? 0,
      desc: 'دراسات حالة ومفاهيم مرجعية',
      icon: BookmarkCheck,
      color: 'text-purple-900 bg-purple-50 border-purple-200',
      action: () => onNavigateToRecords('recordPurpose', 'marketing_reference'),
    },
    {
      label: 'في انتظار المراجعة (Pending)',
      value: stats.pendingReview,
      desc: 'سجلات غير معتمدة تتطلب تدقيقاً بشرياً',
      icon: Clock,
      color: 'text-amber-800 bg-amber-50 border-amber-200',
      action: () => onNavigateToRecords('reviewStatus', 'pending'),
    },
    {
      label: 'معتمدة للاستخدام (Approved)',
      value: stats.approved,
      desc: 'سجلات اجتازت المراجعة البشرية',
      icon: CheckCircle2,
      color: 'text-emerald-800 bg-emerald-50 border-emerald-200',
      action: () => onNavigateToRecords('reviewStatus', 'approved'),
    },
    {
      label: 'مرفوضة (Rejected)',
      value: stats.rejected,
      desc: 'مستبعدة مع ذكر أسباب الرفض',
      icon: XCircle,
      color: 'text-rose-800 bg-rose-50 border-rose-200',
      action: () => onNavigateToRecords('reviewStatus', 'rejected'),
    },
    {
      label: 'ملاحظات الجودة (Quality Issues)',
      value: stats.qualityIssuesCount,
      desc: 'سجلات تفتقر لمصدر أو جودة منخفضة',
      icon: AlertTriangle,
      color: 'text-orange-800 bg-orange-50 border-orange-200',
      action: () => onNavigateToRecords('qualityIssues', 'true'),
    },
    {
      label: 'تراخيص غير محددة (Unknown License)',
      value: stats.unknownLicenseCount,
      desc: 'تتطلب تحديد حقوق إعادة الاستخدام',
      icon: ShieldAlert,
      color: 'text-purple-800 bg-purple-50 border-purple-200',
      action: () => onNavigateToRecords('licenseStatus', 'unknown'),
    },
  ];

  const renderDistributionBar = (title: string, data: Record<string, number>, icon: any) => {
    const Icon = icon;
    const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((acc, curr) => acc + curr[1], 0) || 1;

    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs">
            <Icon size={15} className="text-zinc-600" />
            <span>{title}</span>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono font-medium">
            {entries.length} فئات
          </span>
        </div>

        {entries.length === 0 ? (
          <div className="text-[11px] text-zinc-400 py-3 text-center">لا توجد بيانات كافية</div>
        ) : (
          <div className="space-y-2">
            {entries.slice(0, 5).map(([key, count]) => {
              const pct = Math.round((count / total) * 100);
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-700 truncate max-w-[180px]">{key}</span>
                    <span className="text-zinc-500 font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-900 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <button
              key={i}
              type="button"
              onClick={k.action}
              className={`p-4 rounded-xl border text-right transition hover:shadow-xs cursor-pointer flex flex-col justify-between space-y-2 ${k.color}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] font-semibold opacity-90 truncate">{k.label}</span>
                <Icon size={15} className="shrink-0" />
              </div>
              <div className="text-2xl font-bold font-mono tracking-tight">{k.value}</div>
              <p className="text-[10px] opacity-75 line-clamp-1">{k.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Empty State Banner if 0 records */}
      {stats.totalRecords === 0 && (
        <div className="bg-white border border-dashed border-zinc-300 rounded-2xl p-8 md:p-12 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
            <Database size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-900">قاعدة بيانات التسويق فارغة</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              ابدأ باستيراد أول ملف حملات أو منشورات تسويقية (CSV، JSONL، أو أرشيف ZIP). ستخضع كافة السجلات لمعاينة وفحص دقيق قبل اعتمادها.
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToImport}
            className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition cursor-pointer"
          >
            استيراد بيانات جديدة الآن ←
          </button>
        </div>
      )}

      {/* Distributions Breakdown */}
      {stats.totalRecords > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <BarChart3 size={15} className="text-zinc-600" />
              <span>توزيعات السجلات الفعلية المخزنة (Live Distributions)</span>
            </h4>
            <span className="text-[11px] text-zinc-400">تحديث لحظي من قاعدة البيانات</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {renderDistributionBar('حسب السوق والدولة (Country)', stats.distributions.countries, Globe2)}
            {renderDistributionBar('حسب قطاع الصناعة (Industry)', stats.distributions.industries, Briefcase)}
            {renderDistributionBar('حسب اللهجة واللغة (Dialect)', stats.distributions.dialects, Globe2)}
            {renderDistributionBar('حسب صيغة وقالب المحتوى (Type)', stats.distributions.contentTypes, Layers)}
            {renderDistributionBar('حسب الهدف التسويقي (Objective)', stats.distributions.objectives, Target)}
            {renderDistributionBar('حسب تصنيف السوق (Market Tier)', stats.distributions.marketTiers, Sparkles)}
          </div>
        </div>
      )}

      {/* Operational Principles Card */}
      <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-600 space-y-2">
        <div className="font-bold text-zinc-900 flex items-center gap-1.5">
          <ShieldAlert size={14} className="text-zinc-700" />
          <span>مبادئ موثوقية وجودة البيانات في Duckprompts:</span>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px] text-zinc-600 pt-1">
          <li>• كل سجل مستورد يبدأ بحالة "في انتظار المراجعة" غير معتمد.</li>
          <li>• الاعتماد يعني اجتياز فحص المحتوى ولا يعني ترخيصاً قانونياً تلقائياً.</li>
          <li>• المحتوى المتاح للعامة لا يُفترض قانونياً إمكانية إعادة استخدامه دون تصريح.</li>
          <li>• الاقتراحات الذكية (AI Suggestions) تحفظ مع درجة ثقتها بشكل منفصل عن الحقائق.</li>
          <li>• يتم فحص التكرارات ببصمة SHA-256 للمحتوى وروابط المصادر بدقة.</li>
          <li>• استبعاد أو تخطي التكرارات يتم بشفافية وبدون حذف أو تعديل صامت.</li>
        </ul>
      </div>
    </div>
  );
};
