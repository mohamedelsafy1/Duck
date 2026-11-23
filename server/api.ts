import express, { Request, Response } from 'express';
import { getGeminiClient, isApiKeyConfigured } from './geminiClient.ts';
import { Type } from '@google/genai';
import {
  getAllDatasetRecords,
  persistConfirmedImport,
  updateDatasetRecord,
  bulkReviewRecords,
  deleteDatasetRecords,
  calculateDatasetStats,
  queryDatasetRecords,
  getAllImportBatches,
  computeFingerprint,
  queryEligibleRecordsForEngine,
  getApprovedReferencesForBrief,
} from './datasetStore.ts';
import {
  parseCSV,
  parseJSONL,
  inspectAndExtractZip,
  processImportValidation,
  mapRawRecordToCanonical,
  isPlaceholderText,
  evaluateQuality,
} from './fileParser.ts';
import { MarketingDatasetRecord, ImportBatchRecord } from '../src/types.ts';

// Helper to build human references section for AI Generation
function buildHumanReferenceSection(
  brief: any,
  contentTypePreference?: string
): {
  promptSection: string;
  count: number;
  sampleTitles: string[];
} {
  const { contentExamples, referenceCases } = getApprovedReferencesForBrief(
    { ...brief, contentType: contentTypePreference },
    { limitContent: 3, limitReference: 2 }
  );

  const totalCount = contentExamples.length + referenceCases.length;
  if (totalCount === 0) {
    return { promptSection: '', count: 0, sampleTitles: [] };
  }

  const sections: string[] = [];
  const sampleTitles: string[] = [];

  if (contentExamples.length > 0) {
    sections.push('--- نماذج محتوى تسويقي بشري معتمد (Approved Human Marketing Copy Examples) ---');
    contentExamples.forEach((c, i) => {
      const title = c.brandName ? `${c.brandName} (${c.dialect || c.country || ''})` : `نموذج #${i + 1}`;
      sampleTitles.push(title);
      sections.push(
        `[مرجع بشري #${i + 1}: ${title} | القالب: ${c.contentType || 'محتوى'} | الهدف: ${c.marketingObjective || 'تسويق'}]\n` +
        `نص المحتوى الأصلي:\n"${c.content}"\n` +
        (c.reviewerNotes ? `ملاحظات مراجع الجودة: ${c.reviewerNotes}\n` : '')
      );
    });
  }

  if (referenceCases.length > 0) {
    sections.push('--- دراسات حالة ومفاهيم تسويقية مرجعية (Approved Marketing Reference Case Studies) ---');
    referenceCases.forEach((r, i) => {
      const title = r.sourceTitle || r.brandName || `دراسة حالة #${i + 1}`;
      sampleTitles.push(title);
      sections.push(
        `[دراسة مرجعية #${i + 1}: ${title} | المجال: ${r.industry || 'عام'}]\n` +
        `الملخص الاستراتيجي: ${r.contentSummary || r.content}\n` +
        (r.sourcePlatform || r.sourceUrl ? `المصدر: ${r.sourcePlatform || r.sourceUrl}\n` : '')
      );
    });
  }

  const promptSection = `
=== مراجع بشرية معتمدة من قاعدة البيانات (Approved Human References Injected) ===
تنبيه للموديل: تم تفعيل خيار الاستعانة بالمراجع البشرية المعتمدة.
- استخدم نماذج المحتوى البشري أعلاه كمعيار (Benchmark) للنبرة، وعمق اللهجة، والجاذبية وصياغة الخطافات (Hooks).
- استخدم دراسات الحالة المرجعية كمصدر إلهام للمفاهيم والاستراتيجيات دون نسخ النص حرفياً.

${sections.join('\n\n')}
`;

  return { promptSection, count: totalCount, sampleTitles };
}

export const VALID_MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];
export const DEFAULT_MODEL = 'gemini-3.8-flash';

export function resolveAndValidateModel(modelInput?: any): { valid: boolean; model: string; error?: string } {
  if (!modelInput || typeof modelInput !== 'string' || modelInput.trim() === '') {
    return { valid: true, model: DEFAULT_MODEL };
  }
  const clean = modelInput.trim();
  if (!VALID_MODELS.includes(clean)) {
    return {
      valid: false,
      model: clean,
      error: `النموذج المحدد "${clean}" غير مدعوم أو غير صالح. النماذج المدعومة حالياً هي: ${VALID_MODELS.join(', ')}`,
    };
  }
  return { valid: true, model: clean };
}

export function createServerApp() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // Health check for API key configuration
  app.get('/api/health', (_req: Request, res: Response) => {
    const configured = isApiKeyConfigured();
    res.json({
      configured,
      message: configured
        ? 'تم الاتصال بواجهة برمجة تطبيقات Gemini بنجاح.'
        : 'مفتاح GEMINI_API_KEY غير مهيأ في متغيرات البيئة. يرجى ضبط المفتاح في لوحة الإعدادات أو ملف .env للمتابعة.',
    });
  });

  // Available AI models metadata endpoint
  app.get('/api/models', (_req: Request, res: Response) => {
    res.json({
      defaultModel: DEFAULT_MODEL,
      validModels: VALID_MODELS,
      models: [
        {
          id: 'gemini-3.8-flash',
          name: 'Gemini 3.8 Flash',
          desc: 'النموذج القياسي الموصى به: فائق السرعة، استيعاب استراتيجي عالي، وإنتاج نصوص تسويقية متقنة',
          badge: 'موصى به (Recommended)',
          available: isApiKeyConfigured(),
        },
        {
          id: 'gemini-3.1-flash-lite',
          name: 'Gemini 3.1 Flash Lite',
          desc: 'نموذج فائق الخفة والسرعة: مثالي للتجارب السريعة وتوليد الأفكار الفورية بأقل استهلاك',
          badge: 'خفيف وسريع',
          available: isApiKeyConfigured(),
        },
      ],
    });
  });

  // Stage 3: Run the experiment with user's exact system prompt & brief
  app.post('/api/generate', async (req: Request, res: Response) => {
    try {
      if (!isApiKeyConfigured()) {
        res.status(503).json({
          error: 'مفتاح Gemini API غير مهيأ في الخادم (GEMINI_API_KEY). يرجى إضافة المفتاح لتشغيل البرومبت الحقيقي.',
        });
        return;
      }

      const {
        systemPrompt,
        engine,
        brief,
        referenceExamples,
        model = 'gemini-3.8-flash',
      } = req.body;

      if (!systemPrompt || typeof systemPrompt !== 'string' || systemPrompt.trim() === '') {
        res.status(400).json({
          error: 'حقل System Prompt فارغ. يرجى كتابة أو اختيار برومبت أولاً قبل تشغيل التجربة.',
        });
        return;
      }

      const ai = getGeminiClient();

      // Format the user contents using only provided fields
      const briefParts: string[] = [];
      if (engine) briefParts.push(`نوع المحرك المطلوب: ${engine}`);
      if (brief?.brandName) briefParts.push(`اسم البراند: ${brief.brandName}`);
      if (brief?.country) briefParts.push(`الدولة والسوق المستهدف: ${brief.country}`);
      if (brief?.industry) briefParts.push(`المجال / الصناعة: ${brief.industry}`);
      if (brief?.targetAudience) briefParts.push(`الجمهور المستهدف: ${brief.targetAudience}`);
      if (brief?.marketingObjective) briefParts.push(`الهدف التسويقي: ${brief.marketingObjective}`);
      if (brief?.languageDialect) briefParts.push(`اللغة واللهجة المطلوبة: ${brief.languageDialect}`);
      if (brief?.clientBrief) briefParts.push(`موجز العميل (Client Brief):\n${brief.clientBrief}`);
      if (brief?.additionalContext) briefParts.push(`سياق أو ملاحظات إضافية:\n${brief.additionalContext}`);

      let userMessage = briefParts.length > 0
        ? `بيانات وموجز المشروع (Client Brief):\n${briefParts.join('\n\n')}`
        : 'قم بتنفيذ المهمة المطلوبة وفق تعليمات النظام.';

      // Append reference examples if selected
      if (Array.isArray(referenceExamples) && referenceExamples.length > 0) {
        const examplesText = referenceExamples
          .filter((ex) => ex && ex.content && ex.content.trim())
          .map((ex, idx) => `[المثال المرجعي #${idx + 1}: ${ex.title || 'بدون عنوان'}]\n${ex.content.trim()}`)
          .join('\n\n---\n\n');

        if (examplesText) {
          userMessage += `\n\n=== الأمثلة المرجعية وقاعدة المعرفة (Reference Examples) ===\n${examplesText}`;
        }
      }

      let usedHumanReferences = false;
      let injectedReferencesCount = 0;
      if (req.body.useHumanReferences) {
        const refData = buildHumanReferenceSection(brief);
        if (refData.promptSection) {
          userMessage += `\n\n${refData.promptSection}`;
          usedHumanReferences = true;
          injectedReferencesCount = refData.count;
        }
      }

      const modelCheck = resolveAndValidateModel(model);
      if (!modelCheck.valid) {
        res.status(400).json({ error: modelCheck.error });
        return;
      }
      const targetModel = modelCheck.model;

      const startTime = Date.now();
      const response = await ai.models.generateContent({
        model: targetModel,
        contents: userMessage,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
      });
      const durationMs = Date.now() - startTime;

      const outputText = response.text || '';

      res.json({
        output: outputText,
        durationMs,
        model: targetModel,
        usedHumanReferences,
        injectedReferencesCount,
        usage: response.usageMetadata
          ? {
              promptTokens: response.usageMetadata.promptTokenCount,
              candidatesTokens: response.usageMetadata.candidatesTokenCount,
              totalTokens: response.usageMetadata.totalTokenCount,
            }
          : undefined,
      });
    } catch (err: any) {
      console.error('Error generating content:', err);
      const errorMessage = err?.message || 'حدث خطأ غير متوقع أثناء الاتصال بالنموذج.';
      res.status(500).json({
        error: `فشل تشغيل التجربة: ${errorMessage}`,
      });
    }
  });

  // Stage 2: Client Brief Generator (توليد Brief تجريبي)
  app.post('/api/generate-briefs', async (req: Request, res: Response) => {
    try {
      if (!isApiKeyConfigured()) {
        res.status(503).json({
          error: 'مفتاح Gemini API غير مهيأ في الخادم (GEMINI_API_KEY). لا يمكن توليد نماذج Briefs تجريبية حقيقية بدونه.',
        });
        return;
      }

      const {
        country = 'Random',
        industry = 'Random',
        dialect = 'Automatic',
        count = 1,
      } = req.body;

      const validCount = Math.min(Math.max(Number(count) || 1, 1), 3);

      const ai = getGeminiClient();

      const promptInstructions = `
أنت خبير استراتيجي في التسويق الإقليمي.
مهمتك: توليد ${validCount} نموذج/نماذج Brief تجريبية واقعية ومميزة لشركات وعلامات تجارية في العالم العربي.

المحددات المطلوبة:
- الدولة/السوق: ${country === 'Random' ? 'اختر دولة عربية عشوائية متنوعة واقعية (مصر، السعودية، الإمارات، الكويت، البحرين... إلخ)' : country}
- المجال/الصناعة: ${industry === 'Random' ? 'اختر مجالاً تجارياً عشوائياً جذاباً ومبتكراً (مطاعم، قهوة مختصة، أزياء، رعاية صحية، تعليم، تجارة إلكترونية، عقارات، تطبيقات... إلخ)' : industry}
- اللهجة/اللغة: ${dialect === 'Automatic' ? 'حدد اللهجة الأنسب بناءً على بلد المشروع وجمهوره المستهدف (مثل: مصري عامي بسيط، خليجي بيضاء، سعودي نجد/حجازي)' : dialect}

المطلوب:
لكل نموذج Brief تجريبي، أنشئ بيانات تسويقية متكاملة ومقنعة تبدو وكأنها طلب حقيقي من عميل يسعى لحملة إبداعية أو إطلاق براند.
يجب أن تكون كل النماذج مختلفة ومتباينة تماماً.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptInstructions,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: 'قائمة بنماذج موجز العميل التجريبية',
            items: {
              type: Type.OBJECT,
              properties: {
                brandName: { type: Type.STRING, description: 'اسم البراند المقترح' },
                country: { type: Type.STRING, description: 'الدولة والسوق المستهدف' },
                industry: { type: Type.STRING, description: 'المجال أو الصناعة' },
                targetAudience: { type: Type.STRING, description: 'وصف دقيق للجمهور المستهدف وشريحة العملاء' },
                marketingObjective: { type: Type.STRING, description: 'الهدف التسويقي الأساسي من الحملة أو المحتوى' },
                languageDialect: { type: Type.STRING, description: 'اللغة واللهجة المطلوبة للنصوص' },
                clientBrief: { type: Type.STRING, description: 'شرح تفصيلي لموجز العميل، التحدي الحالي، وما يريده بالتحديد' },
                additionalContext: { type: Type.STRING, description: 'ملاحظات إضافية، الميزانية، قيود أو أسلوب مفضل' },
              },
              required: [
                'brandName',
                'country',
                'industry',
                'targetAudience',
                'marketingObjective',
                'languageDialect',
                'clientBrief',
                'additionalContext',
              ],
            },
          },
        },
      });

      const rawJson = response.text || '[]';
      let parsed = [];
      try {
        parsed = JSON.parse(rawJson);
      } catch (parseErr) {
        console.error('Failed to parse briefs json:', parseErr);
        res.status(500).json({ error: 'فشل في قراءة مخرجات توليد الـ Briefs بتنسيق JSON.' });
        return;
      }

      // Mark as synthetic
      const briefsWithTag = parsed.map((item: any, idx: number) => ({
        ...item,
        id: `synthetic-${Date.now()}-${idx}`,
        isSynthetic: true,
      }));

      res.json({ briefs: briefsWithTag });
    } catch (err: any) {
      console.error('Error in generate-briefs:', err);
      res.status(500).json({
        error: `فشل توليد نماذج Brief التجريبية: ${err?.message || 'خطأ غير معروف'}`,
      });
    }
  });

  // Stage 4: AI Evaluation (تقييم بالذكاء الاصطناعي)
  app.post('/api/evaluate', async (req: Request, res: Response) => {
    try {
      if (!isApiKeyConfigured()) {
        res.status(503).json({
          error: 'مفتاح Gemini API غير مهيأ في الخادم (GEMINI_API_KEY). يلزم وجود المفتاح لإجراء التقييم بالذكاء الاصطناعي.',
        });
        return;
      }

      const { systemPrompt, clientBrief, output } = req.body;

      if (!output || typeof output !== 'string' || output.trim() === '') {
        res.status(400).json({ error: 'لا يوجد ناتج لتقييمه. يرجى تشغيل التجربة والحصول على نتيجة أولاً.' });
        return;
      }

      const ai = getGeminiClient();

      const evaluationPrompt = `
أنت مدقق ومقيم جودة تسويقية خبير (Senior Creative & Strategic Marketing Director).
مهمتك تقييم ناتج ذكاء اصطناعي (Generated Output) بناءً على System Prompt المحدد وموجز العميل (Client Brief).

=== System Prompt المستخدم ===
${systemPrompt || '(غير محدد)'}

=== موجز العميل والمشروع (Client Brief) ===
${typeof clientBrief === 'object' ? JSON.stringify(clientBrief, null, 2) : String(clientBrief || '')}

=== الناتج المراد تقييمه (Generated Output) ===
${output}

قم بتقييم الناتج بنزاهة وصرامة على مقياس من 0 إلى 10 في كل معيار من المعايير السبعة التالية:
1. complianceWithPrompt (الالتزام بالبرومبت): مدى تقيد النموذج بتعليمات وهيكل البرومبت الأصلي.
2. relevanceToBrief (الملاءمة لموجز العميل): مدى تلبية احتياجات العميل المحددة في الموجز.
3. marketingQuality (الجودة التسويقية والإقناع): قوة الأفكار التسويقية ومدى جاذبيتها وإقناعها التجاري.
4. originalityAndDiff (الأصالة والتمايز): هل الأفكار مبتكرة وغير مكررة وتمنح البراند تميزاً واضحاً؟
5. brandVoiceAndDialect (نبرة البراند واللهجة): دقة النبرة المطلوبة وصحة اللهجة أو اللغة المستهدفة.
6. clarityAndReadability (الوضوح وسهولة القراءة): جودة التنسيق ووضوح الفقرات والعناوين وتسلسل الأفكار.
7. accuracyNoUnsupportedClaims (الدقة وتجنب الادعاءات غير المدعومة): خلو النص من هلوسات أو وعود خيالية غير قابلة للتطبيق.

لكل معيار:
- score: رقم صحيح أو عشري بين 0 و 10
- explanation: شرح مختصر ومحدد باللغة العربية (لهجة مصرية مهنية واضحة) بسبب هذه الدرجة
- suggestion: اقتراح عملي ومباشر لتطوير البرومبت أو النتيجة
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: evaluationPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              criteria: {
                type: Type.OBJECT,
                properties: {
                  complianceWithPrompt: {
                    type: Type.OBJECT,
                    properties: {
                      score: { type: Type.NUMBER, description: '0 to 10' },
                      explanation: { type: Type.STRING },
                      suggestion: { type: Type.STRING },
                    },
                    required: ['score', 'explanation', 'suggestion'],
                  },
                  relevanceToBrief: {
                    type: Type.OBJECT,
                    properties: {
                      score: { type: Type.NUMBER, description: '0 to 10' },
                      explanation: { type: Type.STRING },
                      suggestion: { type: Type.STRING },
                    },
                    required: ['score', 'explanation', 'suggestion'],
                  },
                  marketingQuality: {
                    type: Type.OBJECT,
                    properties: {
                      score: { type: Type.NUMBER, description: '0 to 10' },
                      explanation: { type: Type.STRING },
                      suggestion: { type: Type.STRING },
                    },
                    required: ['score', 'explanation', 'suggestion'],
                  },
                  originalityAndDiff: {
                    type: Type.OBJECT,
                    properties: {
                      score: { type: Type.NUMBER, description: '0 to 10' },
                      explanation: { type: Type.STRING },
                      suggestion: { type: Type.STRING },
                    },
                    required: ['score', 'explanation', 'suggestion'],
                  },
                  brandVoiceAndDialect: {
                    type: Type.OBJECT,
                    properties: {
                      score: { type: Type.NUMBER, description: '0 to 10' },
                      explanation: { type: Type.STRING },
                      suggestion: { type: Type.STRING },
                    },
                    required: ['score', 'explanation', 'suggestion'],
                  },
                  clarityAndReadability: {
                    type: Type.OBJECT,
                    properties: {
                      score: { type: Type.NUMBER, description: '0 to 10' },
                      explanation: { type: Type.STRING },
                      suggestion: { type: Type.STRING },
                    },
                    required: ['score', 'explanation', 'suggestion'],
                  },
                  accuracyNoUnsupportedClaims: {
                    type: Type.OBJECT,
                    properties: {
                      score: { type: Type.NUMBER, description: '0 to 10' },
                      explanation: { type: Type.STRING },
                      suggestion: { type: Type.STRING },
                    },
                    required: ['score', 'explanation', 'suggestion'],
                  },
                },
                required: [
                  'complianceWithPrompt',
                  'relevanceToBrief',
                  'marketingQuality',
                  'originalityAndDiff',
                  'brandVoiceAndDialect',
                  'clarityAndReadability',
                  'accuracyNoUnsupportedClaims',
                ],
              },
              overallSummary: {
                type: Type.STRING,
                description: 'ملخص عام وتقييم شامل للنتيجة في فقرة واحدة موجزة.',
              },
            },
            required: ['criteria', 'overallSummary'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');

      // Calculate weighted score in code using configurable weights
      // Weights:
      // complianceWithPrompt: 20%
      // relevanceToBrief: 20%
      // marketingQuality: 20%
      // originalityAndDiff: 15%
      // brandVoiceAndDialect: 10%
      // clarityAndReadability: 10%
      // accuracyNoUnsupportedClaims: 5%
      const weights: Record<string, number> = {
        complianceWithPrompt: 0.20,
        relevanceToBrief: 0.20,
        marketingQuality: 0.20,
        originalityAndDiff: 0.15,
        brandVoiceAndDialect: 0.10,
        clarityAndReadability: 0.10,
        accuracyNoUnsupportedClaims: 0.05,
      };

      let totalWeight = 0;
      let weightedSum = 0;

      for (const [key, weight] of Object.entries(weights)) {
        const item = parsed.criteria?.[key];
        if (item && typeof item.score === 'number') {
          weightedSum += item.score * weight;
          totalWeight += weight;
        }
      }

      const overallWeightedScore = totalWeight > 0 ? Number((weightedSum / totalWeight).toFixed(1)) : 0;

      res.json({
        criteria: parsed.criteria,
        overallSummary: parsed.overallSummary,
        overallWeightedScore,
        weights,
        evaluatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error in evaluate:', err);
      res.status(500).json({
        error: `فشل التقييم بالذكاء الاصطناعي: ${err?.message || 'خطأ غير معروف'}`,
      });
    }
  });

  // ==========================================
  // SEQUENTIAL APPROVAL MARKETING WORKFLOW ENDPOINTS
  // ==========================================

  // 1. Workflow Stage 1: Generate Brand Strategy (NO content ideas!)
  app.post('/api/workflow/generate-strategy', async (req: Request, res: Response) => {
    try {
      if (!isApiKeyConfigured()) {
        res.status(503).json({
          error: 'مفتاح Gemini API غير مهيأ في الخادم (GEMINI_API_KEY).',
        });
        return;
      }

      const { systemPrompt, brief, referenceExamples, model = 'gemini-3.8-flash' } = req.body;

      const ai = getGeminiClient();

      const briefParts: string[] = [];
      if (brief?.brandName) briefParts.push(`اسم البراند: ${brief.brandName}`);
      if (brief?.country) briefParts.push(`الدولة والسوق المستهدف: ${brief.country}`);
      if (brief?.industry) briefParts.push(`المجال / الصناعة: ${brief.industry}`);
      if (brief?.targetAudience) briefParts.push(`الجمهور المستهدف: ${brief.targetAudience}`);
      if (brief?.marketingObjective) briefParts.push(`الهدف التسويقي: ${brief.marketingObjective}`);
      if (brief?.languageDialect) briefParts.push(`اللغة واللهجة المطلوبة: ${brief.languageDialect}`);
      if (brief?.clientBrief) briefParts.push(`موجز العميل (Client Brief):\n${brief.clientBrief}`);
      if (brief?.additionalContext) briefParts.push(`سياق أو ملاحظات إضافية:\n${brief.additionalContext}`);

      let promptText = `أنت مستشار استراتيجي أول للعلامات التجارية في الشرق الأوسط.
مهمتك في هذه المرحلة الأولى: بناء استراتيجية متكاملة للعلامة التجارية استناداً لموجز العميل التالي.

تنبيه هام ومحوري:
- ركز حصرياً على استراتيجية البراند والتموضع والركائز التسويقية.
- لا تقم بتوليد أفكار لمنشورات أو حملات إعلانية تنفيذية في هذه المرحلة؛ سيتم ذلك في مرحلة لاحقة بعد اعتماد الاستراتيجية.
- نظم الاستراتيجية في بنود وأقسام واضحة:
  1. نظرة عامة على البراند (Brand Overview)
  2. أهداف الأعمال والتسويق (Business & Marketing Objectives)
  3. دراسة الجمهور المستهدف واحتياجاته ومخاوفه (Target Audience, Needs & Pain Points)
  4. تموضع العلامة التجارية وعرض القيمة الفريد (Brand Positioning & Value Proposition)
  5. شخصية ونبرة صوت البراند (Brand Personality & Tone of Voice)
  6. ركائز الرسائل التسويقية (Messaging Pillars)
  7. التمايز التنافسي (Competitive Differentiation)
  8. استراتيجية المحتوى وركائزه الأساسية المقترحة (Content Strategy & Recommended Content Pillars)
  9. توصيات استراتيجية للمراحل القادمة (Strategic Recommendations)

=== بيانات وموجز العميل ===
${briefParts.join('\n\n')}
`;

      if (Array.isArray(referenceExamples) && referenceExamples.length > 0) {
        const examplesText = referenceExamples
          .filter((ex) => ex && ex.content && ex.content.trim())
          .map((ex, idx) => `[مثال #${idx + 1}: ${ex.title || ''}]\n${ex.content.trim()}`)
          .join('\n\n');
        if (examplesText) {
          promptText += `\n\n=== أمثلة مرجعية ===\n${examplesText}`;
        }
      }

      let usedHumanReferences = false;
      let injectedReferencesCount = 0;
      let injectedReferencesSample: string[] = [];

      if (req.body.useHumanReferences) {
        const refData = buildHumanReferenceSection(brief);
        if (refData.promptSection) {
          promptText += `\n\n${refData.promptSection}`;
          usedHumanReferences = true;
          injectedReferencesCount = refData.count;
          injectedReferencesSample = refData.sampleTitles;
        }
      }

      const activeSysPrompt =
        systemPrompt && systemPrompt.trim().length > 0
          ? systemPrompt
          : 'أنت خبير استراتيجي في بناء العلامات التجارية وخطط التسويق المعتمدة في العالم العربي.';

      const modelCheck = resolveAndValidateModel(model);
      if (!modelCheck.valid) {
        res.status(400).json({ error: modelCheck.error });
        return;
      }
      const targetModel = modelCheck.model;

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: promptText,
        config: {
          systemInstruction: activeSysPrompt,
          temperature: 0.7,
        },
      });

      res.json({
        strategy: response.text || '',
        model: targetModel,
        usedHumanReferences,
        injectedReferencesCount,
        injectedReferencesSample,
      });
    } catch (err: any) {
      console.error('Error generating strategy:', err);
      res.status(500).json({
        error: `فشل توليد استراتيجية البراند: ${err?.message || 'خطأ غير معروف'}`,
      });
    }
  });

  // 2. Workflow Stage 1 Revision: Revise Brand Strategy based on user feedback
  app.post('/api/workflow/revise-strategy', async (req: Request, res: Response) => {
    try {
      if (!isApiKeyConfigured()) {
        res.status(503).json({
          error: 'مفتاح Gemini API غير مهيأ في الخادم (GEMINI_API_KEY).',
        });
        return;
      }

      const {
        systemPrompt,
        brief,
        previousStrategy,
        revisionReasons,
        customFeedback,
        model = 'gemini-3.8-flash',
      } = req.body;

      const ai = getGeminiClient();

      const reasonsText = Array.isArray(revisionReasons) && revisionReasons.length > 0
        ? revisionReasons.map((r) => `- ${r}`).join('\n')
        : 'طلب تعديل شامل';

      const promptText = `
أنت مستشار استراتيجي أول للعلامات التجارية.
قام المستخدم بمراجعة مسودة الاستراتيجية السابقة وطلب تعديلها بناءً على الملاحظات التالية.

=== أسباب التعديل المحددة من المستخدم ===
${reasonsText}

=== توجيهات وملاحظات إضافية من المستخدم ===
${customFeedback && customFeedback.trim() ? customFeedback.trim() : 'لا توجد ملاحظات إضافية'}

=== بيانات موجز العميل الأصلي ===
البراند: ${brief?.brandName || ''}
السوق: ${brief?.country || ''}
المجال: ${brief?.industry || ''}
الجمهور: ${brief?.targetAudience || ''}
الموجز: ${brief?.clientBrief || ''}
السياق الإضافي: ${brief?.additionalContext || ''}

=== مسودة الاستراتيجية السابقة التي تحتاج لتعديل ===
${previousStrategy}

المطلوب:
- أعد صياغة الاستراتيجية بالكامل لمعالجة كل نقطة من نقاط نقد المستخدم بدقة.
- حافظ على الجوانب السليمة والقوية التي لم يوجه المستخدم نقداً إليها.
- لا تولد أفكار محتوى تفصيلية أو إعلانات بعد؛ ركز على إحكام استراتيجية البراند لتكون جاهزة للاعتماد.
- التزم بالتنسيق المنظم والأقسام الواضحة.
`;

      let promptFullText = promptText;
      let usedHumanReferences = false;
      let injectedReferencesCount = 0;
      let injectedReferencesSample: string[] = [];

      if (req.body.useHumanReferences) {
        const refData = buildHumanReferenceSection(brief);
        if (refData.promptSection) {
          promptFullText += `\n\n${refData.promptSection}`;
          usedHumanReferences = true;
          injectedReferencesCount = refData.count;
          injectedReferencesSample = refData.sampleTitles;
        }
      }

      const activeSysPrompt =
        systemPrompt && systemPrompt.trim().length > 0
          ? systemPrompt
          : 'أنت خبير استراتيجي في بناء العلامات التجارية وإعادة صياغتها وفق متطلبات العملاء.';

      const modelCheck = resolveAndValidateModel(model);
      if (!modelCheck.valid) {
        res.status(400).json({ error: modelCheck.error });
        return;
      }
      const targetModel = modelCheck.model;

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: promptFullText,
        config: {
          systemInstruction: activeSysPrompt,
          temperature: 0.7,
        },
      });

      res.json({
        strategy: response.text || '',
        model: targetModel,
        usedHumanReferences,
        injectedReferencesCount,
        injectedReferencesSample,
      });
    } catch (err: any) {
      console.error('Error revising strategy:', err);
      res.status(500).json({
        error: `فشل إعادة صياغة الاستراتيجية: ${err?.message || 'خطأ غير معروف'}`,
      });
    }
  });

  // 3. Workflow Stage 2: Generate Content Ideas (uses Approved Strategy + Idea Generator prompt)
  app.post('/api/workflow/generate-ideas', async (req: Request, res: Response) => {
    try {
      if (!isApiKeyConfigured()) {
        res.status(503).json({
          error: 'مفتاح Gemini API غير مهيأ في الخادم (GEMINI_API_KEY).',
        });
        return;
      }

      const {
        systemPrompt,
        brief,
        approvedStrategy,
        count = 10,
        existingIdeaTitles = [],
        model = 'gemini-3.8-flash',
      } = req.body;

      const requestedCount = Math.min(Math.max(Number(count) || 10, 3), 30);
      const ai = getGeminiClient();

      const existingNotice = Array.isArray(existingIdeaTitles) && existingIdeaTitles.length > 0
        ? `\nتنبيه هام لمنع التكرار: توجد أفكار تم توليدها سابقاً بالعناوين التالية، يجب ألا تكرر أياً منها، وقدم أفكاراً جديدة ومتباينة كلياً:\n${existingIdeaTitles.map((t: string) => `- ${t}`).join('\n')}\n`
        : '';

      const promptText = `
أنت مدير إبداعي أول (Creative Director) متخصص في حملات التسويق والمحتوى الرقمي.
مهمتك: توليد ${requestedCount} فكرة محتوى تسويقية إبداعية ومتباينة تماماً، مستندة بدقة إلى "استراتيجية البراند المعتمدة" وموجز العميل أدناه.

=== استراتيجية البراند المعتمدة (المرجع الأساسي) ===
${approvedStrategy}

=== بيانات وموجز العميل ===
اسم البراند: ${brief?.brandName || ''}
السوق والدولة: ${brief?.country || ''}
المجال / الصناعة: ${brief?.industry || ''}
الجمهور المستهدف: ${brief?.targetAudience || ''}
اللهجة واللغة المطلوبة: ${brief?.languageDialect || ''}
الهدف التسويقي: ${brief?.marketingObjective || ''}
${existingNotice}

يجب أن تكون كل فكرة ذات زاوية إبداعية متميزة تخدم أهداف الاستراتيجية المعتمدة وتستند إلى بصيرة حقيقية للمستهلك (Consumer Insight).
قم بإرجاع النتيجة بتنسيق JSON متوافق مع المخطط المحدد.
`;

      let promptFullText = promptText;
      let usedHumanReferences = false;
      let injectedReferencesCount = 0;
      let injectedReferencesSample: string[] = [];

      if (req.body.useHumanReferences) {
        const refData = buildHumanReferenceSection(brief);
        if (refData.promptSection) {
          promptFullText += `\n\n${refData.promptSection}`;
          usedHumanReferences = true;
          injectedReferencesCount = refData.count;
          injectedReferencesSample = refData.sampleTitles;
        }
      }

      const activeSysPrompt =
        systemPrompt && systemPrompt.trim().length > 0
          ? systemPrompt
          : 'أنت مدير إبداعي استراتيجي لتوليد أفكار الحملات التسويقية.';

      const modelCheck = resolveAndValidateModel(model);
      if (!modelCheck.valid) {
        res.status(400).json({ error: modelCheck.error });
        return;
      }
      const targetModel = modelCheck.model;

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: promptFullText,
        config: {
          systemInstruction: activeSysPrompt,
          temperature: 0.8,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: 'قائمة بأفكار المحتوى التسويقية',
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: 'معرف فريد للفكرة مثل idea-1' },
                title: { type: Type.STRING, description: 'عنوان جذاب ومختصر للفكرة' },
                description: { type: Type.STRING, description: 'وصف تفصيلي للمفهوم الإبداعي للفكرة' },
                strategicPurpose: { type: Type.STRING, description: 'الهدف الاستراتيجي من هذه الفكرة ومواءمتها مع البراند' },
                audienceInsight: { type: Type.STRING, description: 'البصيرة النفسية للجمهور المستهدف التي تخاطبها الفكرة' },
                suggestedHook: { type: Type.STRING, description: 'زاوية أو خطاف البداية (Hook) لجذب الانتباه' },
                contentPillar: { type: Type.STRING, description: 'عمود أو ركيزة المحتوى التابعة لها' },
              },
              required: [
                'id',
                'title',
                'description',
                'strategicPurpose',
                'audienceInsight',
                'suggestedHook',
                'contentPillar',
              ],
            },
          },
        },
      });

      const parsed = JSON.parse(response.text || '[]');
      const formattedIdeas = parsed.map((item: any, idx: number) => ({
        ...item,
        id: item.id || `idea-${Date.now()}-${idx}`,
      }));

      res.json({
        ideas: formattedIdeas,
        model: targetModel,
        usedHumanReferences,
        injectedReferencesCount,
        injectedReferencesSample,
      });
    } catch (err: any) {
      console.error('Error generating ideas:', err);
      res.status(500).json({
        error: `فشل توليد أفكار المحتوى: ${err?.message || 'خطأ غير معروف'}`,
      });
    }
  });

  // 4. Workflow Stage 5: Produce Content Deliverable (Carousel, Static Post, Video Script)
  app.post('/api/workflow/produce-content', async (req: Request, res: Response) => {
    try {
      if (!isApiKeyConfigured()) {
        res.status(503).json({
          error: 'مفتاح Gemini API غير مهيأ في الخادم (GEMINI_API_KEY).',
        });
        return;
      }

      const {
        systemPrompt,
        brief,
        approvedStrategy,
        idea,
        format, // 'carousel' | 'static_post' | 'video_script'
        model = 'gemini-3.8-flash',
      } = req.body;

      const ai = getGeminiClient();

      let formatInstructions = '';
      if (format === 'carousel') {
        formatInstructions = `
نوع المخرج المطلوب: كاروسيل إنستغرام / لينكدإن (Carousel).
الهيكل المطلوب بدقة:
- شريحة 1 (الغلاف - Hook): عنوان رئيسي جذاب يخطف الانتباه، عنوان فرعي مثير للفضول، وتوجيه بصري للغلاف.
- الشرائح 2 إلى 6 (المحتوى التعليمي / السردي / التسويقي): لكل شريحة اذكر: (رقم الشريحة، هدف الشريحة، العنوان، النص الداعم، والتوجيه البصري Visual Direction).
- الشريحة الأخيرة (الختام والدعوة للإجراء CTA): دعوة واضحة لاتخاذ إجراء (حفظ، مشاركة، طلب، تعليق).
- اكتب أيضاً نص الكابشن المقترح للنشر على السوشيال ميديا مع الهاشتاجات المناسبة.
`;
      } else if (format === 'static_post') {
        formatInstructions = `
نوع المخرج المطلوب: بوست بصري ثابت (Static Social Media Post).
الهيكل المطلوب بدقة:
- النص البصري الرئيسي المكتوب على التصميم (Graphic Copy / Headline Hook).
- نص الكابشن الكامل للنشر (Post Caption) مستخدماً إطار PAS أو AIDA.
- الدعوة الصريحة لاتخاذ إجراء (Call to Action - CTA).
- التوجيه الفني والبصري المقترح للمصمم (Visual Direction / Art Direction).
- الهاشتاجات المقترحة وتوقيت النشر المفضل.
`;
      } else if (format === 'video_script') {
        formatInstructions = `
نوع المخرج المطلوب: سكريبت فيديو تيك توك / ريلز / إعلان (Video Script).
الهيكل المطلوب بدقة:
- المدة المقترحة (مثال: 30-45 ثانية).
- الهوك الافتتاحي (أول 3 ثوانٍ): ما يظهر على الشاشة وما يقال لجذب المشاهد ومنع التخطي.
- تفصيل المشاهد مشهداً بمشهد في جدول أو بنود واضحة:
  * رقم المشهد والوقت
  * المشهد البصري وحركة الكاميرا (Visual Action)
  * الكلام المنطوق / الفويس أوفر (Voiceover / Dialogue) باللهجة المطلوبة
  * النص الظاهر على الشاشة (On-Screen Text)
  * المؤثرات الصوتية والموسيقى (Sound Effects & Music)
- الخاتمة والدعوة لاتخاذ إجراء (CTA) القوية.
`;
      }

      let promptText = `
أنت كاتب محتوى تسويقي وإعلاني محترف (Senior Copywriter & Creative Content Producer).
مهمتك: صياغة محتوى تنفيذي متكامل وعالي الجودة للفكرة التسويقية التالية، مستنداً إلى "استراتيجية البراند المعتمدة" و"موجز العميل".

=== الفكرة التسويقية المختارة للتنفيذ ===
العنوان: ${idea?.title || ''}
الوصف والمفهوم: ${idea?.description || ''}
الهدف الاستراتيجي: ${idea?.strategicPurpose || ''}
بصيرة الجمهور: ${idea?.audienceInsight || ''}
الخطاف المقترح (Hook): ${idea?.suggestedHook || ''}
ركيزة المحتوى: ${idea?.contentPillar || ''}

=== موجز وبيانات العميل ===
اسم البراند: ${brief?.brandName || ''}
السوق والدولة: ${brief?.country || ''}
المجال: ${brief?.industry || ''}
الجمهور المستهدف: ${brief?.targetAudience || ''}
اللغة واللهجة المطلوبة: ${brief?.languageDialect || 'العربية'}

=== استراتيجية البراند المعتمدة (مرجع النبرة والتموضع) ===
${approvedStrategy}

=== متطلبات الصياغة وفق القالب المحدد ===
${formatInstructions}

اكتب المحتوى باللهجة والأسلوب المطلوبين بحرفية وإتقان، بحيث يكون جاهزاً تماماً للإنتاج والنشر دون الحاجة لتعديل أساسي.
`;

      let usedHumanReferences = false;
      let injectedReferencesCount = 0;
      let injectedReferencesSample: string[] = [];

      if (req.body.useHumanReferences) {
        const refData = buildHumanReferenceSection(brief, format);
        if (refData.promptSection) {
          promptText += `\n\n${refData.promptSection}`;
          usedHumanReferences = true;
          injectedReferencesCount = refData.count;
          injectedReferencesSample = refData.sampleTitles;
        }
      }

      const activeSysPrompt =
        systemPrompt && systemPrompt.trim().length > 0
          ? systemPrompt
          : 'أنت كاتب محتوى تسويقي متخصص في صياغة الكاروسيل والبوستات وسكريبتات الفيديو الإعلانية.';

      const modelCheck = resolveAndValidateModel(model);
      if (!modelCheck.valid) {
        res.status(400).json({ error: modelCheck.error });
        return;
      }
      const targetModel = modelCheck.model;

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: promptText,
        config: {
          systemInstruction: activeSysPrompt,
          temperature: 0.7,
        },
      });

      res.json({
        content: response.text || '',
        model: targetModel,
        usedHumanReferences,
        injectedReferencesCount,
        injectedReferencesSample,
      });
    } catch (err: any) {
      console.error('Error producing content deliverable:', err);
      res.status(500).json({
        error: `فشل صياغة المخرج التسويقي: ${err?.message || 'خطأ غير معروف'}`,
      });
    }
  });

  // 5. Query matching approved references for brief & format inspection
  app.post('/api/workflow/available-references', (req: Request, res: Response) => {
    try {
      const { brief, format } = req.body;
      const { contentExamples, referenceCases } = getApprovedReferencesForBrief(
        { ...brief, contentType: format },
        { limitContent: 6, limitReference: 4 }
      );
      res.json({
        total: contentExamples.length + referenceCases.length,
        contentExamples,
        referenceCases,
      });
    } catch (err: any) {
      console.error('Error querying available references:', err);
      res.status(500).json({ error: 'فشل استعلام المراجع المعتمدة.' });
    }
  });

  // ==========================================
  // DATASET MANAGER API ENDPOINTS
  // ==========================================

  // 1. Phase A: Parse and Validate Import File Preview
  app.post('/api/dataset/preview', async (req: Request, res: Response) => {
    try {
      const {
        fileContent,
        fileName = 'uploaded_data',
        fileFormat,
        isBase64 = false,
        customMappings = {},
        selectedFilesInZip,
      } = req.body;

      if (!fileContent && !req.body.rawRows) {
        res.status(400).json({ error: 'لم يتم استلام أي محتوى للملف.' });
        return;
      }

      let detectedFormat: 'csv' | 'jsonl' | 'zip' = fileFormat;
      if (!detectedFormat) {
        const lower = fileName.toLowerCase();
        if (lower.endsWith('.csv')) detectedFormat = 'csv';
        else if (lower.endsWith('.jsonl') || lower.endsWith('.ndjson')) detectedFormat = 'jsonl';
        else if (lower.endsWith('.zip')) detectedFormat = 'zip';
        else detectedFormat = 'csv';
      }

      let rawRows: Record<string, any>[] = [];
      let archiveFilesFound: any[] | undefined = undefined;
      const issues: any[] = [];

      if (detectedFormat === 'zip') {
        const buffer = isBase64
          ? Buffer.from(fileContent, 'base64')
          : Buffer.from(fileContent);

        const zipResult = await inspectAndExtractZip(buffer, selectedFilesInZip);
        archiveFilesFound = zipResult.filesFound;
        rawRows = zipResult.combinedRawRows.map((item) => item.row);
        issues.push(...zipResult.issues);
      } else if (detectedFormat === 'csv') {
        const text = isBase64 ? Buffer.from(fileContent, 'base64').toString('utf-8') : fileContent;
        rawRows = parseCSV(text);
      } else if (detectedFormat === 'jsonl') {
        const text = isBase64 ? Buffer.from(fileContent, 'base64').toString('utf-8') : fileContent;
        const result = parseJSONL(text);
        rawRows = result.records;
        issues.push(...result.errors);
      } else if (req.body.rawRows) {
        rawRows = req.body.rawRows;
      }

      const previewResponse = processImportValidation(
        rawRows,
        fileName,
        detectedFormat,
        customMappings,
        issues,
        archiveFilesFound
      );

      res.json(previewResponse);
    } catch (err: any) {
      console.error('Error previewing dataset import:', err);
      res.status(500).json({
        error: `فشل فحص ومعاينة الملف: ${err?.message || 'خطأ غير معروف'}`,
      });
    }
  });

  // 2. Phase B: Confirmed Import (Persist to database)
  app.post('/api/dataset/confirm-import', async (req: Request, res: Response) => {
    try {
      const {
        fileName,
        fileFormat = 'csv',
        rawRows,
        customMappings = {},
        skipDuplicates = true,
        excludeInvalid = true,
      } = req.body;

      if (!Array.isArray(rawRows) || rawRows.length === 0) {
        res.status(400).json({ error: 'لا توجد سجلات لتأكيد استيرادها.' });
        return;
      }

      const batchId = `batch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();

      const candidateRecords: MarketingDatasetRecord[] = [];
      let invalidCount = 0;

      for (let i = 0; i < rawRows.length; i++) {
        const raw = rawRows[i];
        const { record } = mapRawRecordToCanonical(raw, customMappings);

        // Detect purpose
        const hasMeaningfulContent = Boolean(
          record.content &&
          typeof record.content === 'string' &&
          record.content.trim().length >= 5 &&
          !isPlaceholderText(record.content)
        );

        const hasMeaningfulSummary = Boolean(
          record.contentSummary &&
          typeof record.contentSummary === 'string' &&
          record.contentSummary.trim().length >= 5 &&
          !isPlaceholderText(record.contentSummary)
        );

        const hasTraceableSource = Boolean(
          (record.sourceUrl && record.sourceUrl.trim().length > 3) ||
          (record.sourceId && record.sourceId.trim().length > 0) ||
          (record.sourcePlatform && record.sourcePlatform.trim().length > 0)
        );

        const overridePurpose = req.body.purposeOverrides?.[i] ?? req.body.purposeOverrides?.[raw.index ?? -1];
        const explicitPurpose: 'marketing_content' | 'marketing_reference' | undefined =
          overridePurpose ||
          (raw.recordPurpose === 'marketing_reference' || raw.recordPurpose === 'marketing_content' ? raw.recordPurpose : undefined) ||
          record.recordPurpose;

        const resolvedPurpose: 'marketing_content' | 'marketing_reference' =
          explicitPurpose ||
          (hasMeaningfulContent ? 'marketing_content' : (hasMeaningfulSummary && hasTraceableSource ? 'marketing_reference' : 'marketing_content'));

        let isValid = false;
        if (resolvedPurpose === 'marketing_content') {
          isValid = hasMeaningfulContent;
        } else {
          isValid = hasMeaningfulSummary && hasTraceableSource;
        }

        if (!isValid) {
          invalidCount++;
          if (excludeInvalid) continue;
        }

        let fp = '';
        if (resolvedPurpose === 'marketing_reference') {
          const fpText = (record.content && record.content.trim()) ||
            `${record.contentSummary?.trim() || ''}::${record.sourceUrl || record.sourceId || record.sourcePlatform || ''}`;
          fp = computeFingerprint(fpText);
        } else {
          fp = record.content ? computeFingerprint(record.content) : '';
        }

        record.recordPurpose = resolvedPurpose;
        const qualityScore = evaluateQuality(record);

        const fullRecord: MarketingDatasetRecord = {
          id: `rec-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          recordPurpose: resolvedPurpose,
          contentSummary: record.contentSummary || null,
          sourceId: record.sourceId || undefined,
          sourceUrl: record.sourceUrl || null,
          sourcePlatform: record.sourcePlatform || null,
          sourceTitle: record.sourceTitle || null,
          batchId,
          importedAt: now,
          contentFingerprint: fp,
          content: record.content || '',
          language: record.language || 'ar',
          country: record.country || 'غير محدد',
          dialect: record.dialect || 'غير محدد',
          industry: record.industry || 'غير محدد',
          contentType: record.contentType || 'غير محدد',
          marketingObjective: record.marketingObjective || 'غير محدد',
          contentPillar: record.contentPillar || null,
          brandName: record.brandName || null,
          publicationDate: record.publicationDate || null,
          sourceVerificationStatus: record.sourceVerificationStatus || 'unverified',
          licenseStatus: record.licenseStatus || 'unknown',
          licenseName: record.licenseName || null,
          permissionNotes: record.permissionNotes || null,
          dataQualityScore: qualityScore,
          classificationConfidence: record.classificationConfidence,
          humanReviewStatus: 'pending', // Starts strictly unapproved
          reviewerNotes: null,
          rejectionReason: null,
          reviewerId: null,
          reviewedAt: null,
          marketTier: record.marketTier || 'Unassigned',
          aiSuggestions: null,
          performanceMetrics: null,
          rawRecord: raw,
        };

        candidateRecords.push(fullRecord);
      }

      const batchRecord: ImportBatchRecord = {
        id: batchId,
        fileName: fileName || 'batch_upload',
        fileFormat: fileFormat as any,
        importedAt: now,
        importedBy: (req.headers['x-user-email'] as string) || 'local_user',
        totalDetected: rawRows.length,
        insertedCount: 0,
        skippedDuplicatesCount: 0,
        invalidCount,
        failedCount: 0,
        status: 'completed',
        notes: `تم الاستيراد مع ${candidateRecords.length} سجل مرشح.`,
      };

      const result = persistConfirmedImport(candidateRecords, batchRecord);

      res.json({
        success: true,
        batchId,
        totalDetected: rawRows.length,
        insertedCount: result.inserted,
        skippedDuplicatesCount: result.skipped,
        invalidCount,
        totalInDatabase: result.total,
        message: `تم حفظ ${result.inserted} سجلاً في قاعدة البيانات بنجاح (تم تخطي ${result.skipped} سجلاً مكرراً).`,
      });
    } catch (err: any) {
      console.error('Error confirming import:', err);
      res.status(500).json({
        error: `فشل تثبيت واستيراد السجلات في قاعدة البيانات: ${err?.message || 'خطأ غير معروف'}`,
      });
    }
  });

  // 3. Query Dataset Records (search, filters, pagination, sort)
  app.get('/api/dataset/records', (req: Request, res: Response) => {
    try {
      const filters = {
        searchQuery: req.query.searchQuery as string,
        recordPurpose: req.query.recordPurpose as string,
        country: req.query.country as string,
        dialect: req.query.dialect as string,
        industry: req.query.industry as string,
        contentType: req.query.contentType as string,
        marketingObjective: req.query.marketingObjective as string,
        marketTier: req.query.marketTier as string,
        reviewStatus: req.query.reviewStatus as string,
        sourceStatus: req.query.sourceStatus as string,
        licenseStatus: req.query.licenseStatus as string,
        batchId: req.query.batchId as string,
        sortBy: (req.query.sortBy as any) || 'importedAt',
        sortOrder: (req.query.sortOrder as any) || 'desc',
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
      };

      const result = queryDatasetRecords(filters);
      res.json(result);
    } catch (err: any) {
      console.error('Error querying dataset records:', err);
      res.status(500).json({ error: 'فشل جلب سجلات قاعدة البيانات.' });
    }
  });

  // 4. Dataset Overview Statistics
  app.get('/api/dataset/stats', (_req: Request, res: Response) => {
    try {
      const stats = calculateDatasetStats();
      res.json(stats);
    } catch (err: any) {
      console.error('Error calculating dataset stats:', err);
      res.status(500).json({ error: 'فشل حساب إحصائيات البيانات.' });
    }
  });

  // 5. Update Single Record (Review, edit metadata, notes)
  app.patch('/api/dataset/records/:id', (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const updates = req.body;

      if (updates.humanReviewStatus === 'rejected' && (!updates.rejectionReason || !updates.rejectionReason.trim())) {
        res.status(400).json({ error: 'سبب الرفض إلزامي عند رفض السجل.' });
        return;
      }

      if (updates.humanReviewStatus && !updates.reviewedAt) {
        updates.reviewedAt = new Date().toISOString();
        updates.reviewerId = (req.headers['x-user-email'] as string) || 'lead_reviewer';
      }

      const updated = updateDatasetRecord(id, updates);
      if (!updated) {
        res.status(404).json({ error: 'السجل غير موجود.' });
        return;
      }

      res.json({ success: true, record: updated });
    } catch (err: any) {
      console.error('Error updating dataset record:', err);
      res.status(500).json({ error: 'فشل تحديث بيانات السجل.' });
    }
  });

  // 6. Bulk Review Records (approve or reject with mandatory reason)
  app.post('/api/dataset/records/bulk-review', (req: Request, res: Response) => {
    try {
      const { ids, status, reason, notes } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ error: 'يرجى تحديد سجل واحد على الأقل للمراجعة.' });
        return;
      }

      if (status === 'rejected' && (!reason || !reason.trim())) {
        res.status(400).json({ error: 'يرجى تحديد سبب الرفض عند الرفض الجماعي.' });
        return;
      }

      const reviewerId = (req.headers['x-user-email'] as string) || 'lead_reviewer';
      const result = bulkReviewRecords(ids, status, reason, notes, reviewerId);
      res.json({ success: true, affected: result.affected });
    } catch (err: any) {
      console.error('Error in bulk review:', err);
      res.status(500).json({ error: 'فشل تطبيق المراجعة الجماعية.' });
    }
  });

  // 7. Delete Records
  app.delete('/api/dataset/records', (req: Request, res: Response) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ error: 'يرجى تحديد سجلات للحذف.' });
        return;
      }
      const result = deleteDatasetRecords(ids);
      res.json({ success: true, deleted: result.deleted });
    } catch (err: any) {
      console.error('Error deleting records:', err);
      res.status(500).json({ error: 'فشل حذف السجلات.' });
    }
  });

  // 8. AI-Assisted Classification Suggestions
  app.post('/api/dataset/records/:id/ai-classify', async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const allRecords = getAllDatasetRecords();
      const targetRecord = allRecords.find((r) => r.id === id);

      if (!targetRecord) {
        res.status(404).json({ error: 'السجل غير موجود.' });
        return;
      }

      if (!isApiKeyConfigured()) {
        res.status(503).json({ error: 'مفتاح Gemini API غير مهيأ للاقتراح الذكي.' });
        return;
      }

      const ai = getGeminiClient();
      const prompt = `
حلل المحتوى التسويقي التالي واقترح تصنيفات دقيقة باللغة العربية مع درجة ثقة (من 0.0 إلى 1.0):

المحتوى:
"""${targetRecord.content}"""

المطلوب إرجاع كائن JSON حصراً بالحقول التالية:
- country: الدولة أو السوق المستهدف
- countryConfidence: درجة الثقة
- dialect: اللهجة المستخدمة (مثل: مصري عامي، سعودي، خليجي، فصحى معاصرة)
- dialectConfidence: درجة الثقة
- industry: المجال أو الصناعة
- industryConfidence: درجة الثقة
- contentType: نوع القالب (مثل: بوست ثابت، كاروسيل، سكريبت فيديو، مقال)
- contentTypeConfidence: درجة الثقة
- marketingObjective: الهدف التسويقي المقدر
- objectiveConfidence: درجة الثقة
- marketTier: تصنيف السوق (Tier A، Tier B، Tier C)
- marketTierConfidence: درجة الثقة
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const aiSuggestions = {
        country: { value: parsed.country || 'غير محدد', confidence: Number(parsed.countryConfidence) || 0.8 },
        dialect: { value: parsed.dialect || 'غير محدد', confidence: Number(parsed.dialectConfidence) || 0.8 },
        industry: { value: parsed.industry || 'غير محدد', confidence: Number(parsed.industryConfidence) || 0.8 },
        contentType: { value: parsed.contentType || 'غير محدد', confidence: Number(parsed.contentTypeConfidence) || 0.8 },
        objective: { value: parsed.marketingObjective || 'غير محدد', confidence: Number(parsed.objectiveConfidence) || 0.8 },
        marketTier: { value: parsed.marketTier || 'Tier B', confidence: Number(parsed.marketTierConfidence) || 0.75 },
        model: 'gemini-3.8-flash',
        suggestedAt: new Date().toISOString(),
        isAccepted: false,
      };

      const updated = updateDatasetRecord(id, { aiSuggestions });
      res.json({ success: true, aiSuggestions, record: updated });
    } catch (err: any) {
      console.error('Error generating AI classification:', err);
      res.status(500).json({ error: `فشل التوليد الآلي للتصنيف: ${err?.message || 'خطأ'}` });
    }
  });

  // 9. Export Records (CSV or JSONL)
  app.get('/api/dataset/export', (req: Request, res: Response) => {
    try {
      const format = (req.query.format as string) === 'jsonl' ? 'jsonl' : 'csv';
      const onlyApproved = req.query.onlyApproved === 'true';

      const filters: any = {
        searchQuery: req.query.searchQuery as string,
        recordPurpose: req.query.recordPurpose as string,
        country: req.query.country as string,
        dialect: req.query.dialect as string,
        industry: req.query.industry as string,
        contentType: req.query.contentType as string,
        marketingObjective: req.query.marketingObjective as string,
        marketTier: req.query.marketTier as string,
        sourceStatus: req.query.sourceStatus as string,
        licenseStatus: req.query.licenseStatus as string,
        batchId: req.query.batchId as string,
        reviewStatus: onlyApproved ? 'approved' : (req.query.reviewStatus as string),
        page: 1,
        pageSize: 100000,
      };

      const { records } = queryDatasetRecords(filters);

      if (format === 'jsonl') {
        const jsonlContent = records.map((r) => JSON.stringify(r)).join('\n');
        res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="marketing_dataset_${onlyApproved ? 'approved_' : ''}${Date.now()}.jsonl"`
        );
        res.send(jsonlContent);
      } else {
        // CSV with UTF-8 BOM for Excel support
        const headers = [
          'id',
          'content',
          'country',
          'dialect',
          'industry',
          'contentType',
          'marketingObjective',
          'marketTier',
          'brandName',
          'sourceUrl',
          'sourceId',
          'sourceVerificationStatus',
          'licenseStatus',
          'humanReviewStatus',
          'dataQualityScore',
          'importedAt',
          'reviewedAt',
        ];

        const escapeCSV = (val: any) => {
          if (val === null || val === undefined) return '""';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        };

        const csvLines = [headers.join(',')];
        for (const r of records) {
          const row = [
            escapeCSV(r.id),
            escapeCSV(r.content),
            escapeCSV(r.country),
            escapeCSV(r.dialect),
            escapeCSV(r.industry),
            escapeCSV(r.contentType),
            escapeCSV(r.marketingObjective),
            escapeCSV(r.marketTier),
            escapeCSV(r.brandName),
            escapeCSV(r.sourceUrl),
            escapeCSV(r.sourceId),
            escapeCSV(r.sourceVerificationStatus),
            escapeCSV(r.licenseStatus),
            escapeCSV(r.humanReviewStatus),
            escapeCSV(r.dataQualityScore),
            escapeCSV(r.importedAt),
            escapeCSV(r.reviewedAt),
          ];
          csvLines.push(row.join(','));
        }

        const csvContent = '\uFEFF' + csvLines.join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="marketing_dataset_${onlyApproved ? 'approved_' : ''}${Date.now()}.csv"`
        );
        res.send(csvContent);
      }
    } catch (err: any) {
      console.error('Error exporting dataset:', err);
      res.status(500).json({ error: 'فشل تصدير البيانات.' });
    }
  });

  // 10. Get Import Batches History
  app.get('/api/dataset/batches', (_req: Request, res: Response) => {
    try {
      const batches = getAllImportBatches();
      res.json(batches);
    } catch (err: any) {
      console.error('Error fetching import batches:', err);
      res.status(500).json({ error: 'فشل جلب دفعات الاستيراد.' });
    }
  });

  // 11. Requirement 14: Clean server-side retrieval query interface for future RAG
  app.get('/api/dataset/retrieval-query', (req: Request, res: Response) => {
    try {
      const options = {
        country: req.query.country as string,
        dialect: req.query.dialect as string,
        industry: req.query.industry as string,
        contentType: req.query.contentType as string,
        objective: req.query.objective as string,
        minQualityScore: req.query.minQuality ? parseInt(req.query.minQuality as string) : 70,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 5,
      };

      const eligible = queryEligibleRecordsForEngine(options);
      res.json({
        eligibleCount: eligible.length,
        criteria: options,
        records: eligible,
      });
    } catch (err: any) {
      console.error('Error in retrieval query:', err);
      res.status(500).json({ error: 'فشل الاستعلام عن السجلات المؤهلة.' });
    }
  });

  return app;
}

