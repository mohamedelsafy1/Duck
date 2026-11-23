import React, { useState } from 'react';
import { MarkdownRenderer } from '../MarkdownRenderer.tsx';
import {
  FileText,
  Target,
  Users,
  Compass,
  Smile,
  ShieldCheck,
  Columns3,
  Lightbulb,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  LayoutTemplate,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface StrategyBoardProps {
  strategyText: string;
}

export const StrategyBoard: React.FC<StrategyBoardProps> = ({ strategyText }) => {
  const [viewMode, setViewMode] = useState<'board' | 'document'>('board');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (!strategyText || !strategyText.trim()) return null;

  // Extract structured sections using regular expressions on markdown headers
  const extractSection = (headingRegex: RegExp): string => {
    const lines = strategyText.split('\n');
    let capturing = false;
    const captured: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isHeader = /^#{1,4}\s+/.test(line) || /^\*\*[^*]+\*\*:?\s*$/.test(line);

      if (isHeader) {
        const clean = line.replace(/^#{1,4}\s+/, '').replace(/^\*\*|\*\*$/g, '').trim();
        if (headingRegex.test(clean)) {
          capturing = true;
          continue;
        } else if (capturing) {
          // Reached next section
          break;
        }
      } else if (capturing) {
        captured.push(line);
      }
    }

    return captured.join('\n').trim();
  };

  // Extract sections
  const brandOverview = extractSection(/(?:نظرة عامة|ملخص الاستراتيجية|Brand Overview|Executive Summary)/i);
  const businessObjectives = extractSection(/(?:أهداف الأعمال|أهداف التسويق|Business.*Objectives|Marketing Objectives)/i);
  const targetAudience = extractSection(/(?:الجمهور المستهدف|احتياجات|شريحة العملاء|Target Audience|Pain Points)/i);
  const positioning = extractSection(/(?:تموضع|عرض القيمة|Positioning|Value Proposition)/i);
  const personalityTone = extractSection(/(?:شخصية البراند|نبرة الصوت|Tone of Voice|Brand Personality)/i);
  const messagingPillars = extractSection(/(?:ركائز الرسائل|رسائل البراند|Messaging Pillars)/i);
  const differentiation = extractSection(/(?:التمايز التنافسي|الميزة التنافسية|Competitive Differentiation)/i);
  const contentPillars = extractSection(/(?:استراتيجية المحتوى|ركائز المحتوى|Content Strategy|Content Pillars)/i);
  const recommendations = extractSection(/(?:التوصيات|خطة العمل|Recommendations|Action Plan)/i);

  const sectionsConfig = [
    {
      id: 'overview',
      title: 'نظرة عامة على البراند (Brand Overview)',
      content: brandOverview,
      icon: Compass,
      color: 'border-blue-200 bg-blue-50/40 text-blue-900',
      badge: 'الأساس الاستراتيجي',
    },
    {
      id: 'positioning',
      title: 'تموضع البراند وعرض القيمة (Positioning & Value Proposition)',
      content: positioning,
      icon: Target,
      color: 'border-emerald-200 bg-emerald-50/40 text-emerald-900',
      badge: 'جوهر التمايز',
    },
    {
      id: 'audience',
      title: 'الجمهور المستهدف ونقاط الألم (Audience & Pain Points)',
      content: targetAudience,
      icon: Users,
      color: 'border-purple-200 bg-purple-50/40 text-purple-900',
      badge: 'سيكولوجيا العميل',
    },
    {
      id: 'personality',
      title: 'شخصية ونبرة صوت البراند (Brand Voice & Personality)',
      content: personalityTone,
      icon: Smile,
      color: 'border-amber-200 bg-amber-50/40 text-amber-900',
      badge: 'الأسلوب واللغة',
    },
    {
      id: 'objectives',
      title: 'الأهداف التسويقية والتجارية (Marketing Objectives)',
      content: businessObjectives,
      icon: ShieldCheck,
      color: 'border-zinc-200 bg-zinc-50/50 text-zinc-900',
      badge: 'مؤشرات النجاح',
    },
    {
      id: 'pillars',
      title: 'ركائز المحتوى الموصى بها (Content Strategy & Pillars)',
      content: contentPillars,
      icon: Columns3,
      color: 'border-indigo-200 bg-indigo-50/40 text-indigo-900',
      badge: 'محاور النشر',
    },
    {
      id: 'differentiation',
      title: 'التمايز التنافسي (Competitive Differentiation)',
      content: differentiation,
      icon: Sparkles,
      color: 'border-teal-200 bg-teal-50/40 text-teal-900',
      badge: 'نقطة التفوق',
    },
    {
      id: 'recommendations',
      title: 'التوصيات الاستراتيجية للتنفيذ (Strategic Recommendations)',
      content: recommendations,
      icon: Lightbulb,
      color: 'border-rose-200 bg-rose-50/40 text-rose-900',
      badge: 'خطة التحرك',
    },
  ];

  // Check if at least 2 structured sections were extracted
  const validSections = sectionsConfig.filter((s) => s.content && s.content.length > 20);
  const canShowBoard = validSections.length >= 2;

  return (
    <div className="space-y-4">
      {/* View Switcher Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3 text-xs">
        <div className="flex items-center gap-2 text-zinc-600 font-medium">
          <BookOpen size={15} className="text-zinc-800" />
          <span>لوحة استراتيجية البراند التفاعلية (Interactive Strategy Board)</span>
        </div>

        <div className="flex items-center gap-2">
          {canShowBoard && (
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'board'
                  ? 'bg-zinc-900 text-white font-medium'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              <LayoutTemplate size={13} />
              <span>لوحة الاستراتيجية المهيكلة</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setViewMode('document')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'document' || !canShowBoard
                ? 'bg-zinc-900 text-white font-medium'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            <FileText size={13} />
            <span>عرض المستند الكامل</span>
          </button>
        </div>
      </div>

      {/* Board Mode */}
      {viewMode === 'board' && canShowBoard ? (
        <div className="space-y-4">
          {/* Highlight Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {validSections.map((sec) => {
              const Icon = sec.icon;
              const isExpanded = expandedSection === sec.id;

              return (
                <div
                  key={sec.id}
                  className="p-5 bg-white border border-zinc-200 rounded-xl space-y-3 shadow-xs hover:border-zinc-300 transition flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-800">
                          <Icon size={16} />
                        </div>
                        <h4 className="font-bold text-zinc-900 text-sm">{sec.title}</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-600">
                        {sec.badge}
                      </span>
                    </div>

                    <div
                      className={`text-zinc-700 text-xs leading-relaxed ${
                        isExpanded ? '' : 'line-clamp-6'
                      }`}
                      dir="auto"
                    >
                      <MarkdownRenderer content={sec.content} />
                    </div>
                  </div>

                  {sec.content.length > 300 && (
                    <button
                      type="button"
                      onClick={() => setExpandedSection(isExpanded ? null : sec.id)}
                      className="text-zinc-500 hover:text-zinc-900 text-[11px] font-medium flex items-center gap-1 pt-2 border-t border-zinc-100 cursor-pointer self-start"
                    >
                      <span>{isExpanded ? 'عرض أقل' : 'عرض التفاصيل الكاملة لهذا القسم'}</span>
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Document Markdown View */
        <div className="p-5 bg-[#FCFCFB] border border-zinc-200 rounded-xl text-zinc-900 text-sm leading-relaxed" dir="auto">
          <MarkdownRenderer content={strategyText} />
        </div>
      )}
    </div>
  );
};
