export interface BrandStrategySections {
  overview?: string;
  positioning?: string;
  targetAudience?: string;
  brandVoice?: string;
  marketingObjectives?: string;
  contentPillars?: string;
  recommendations?: string;
  missingInformation?: string;
  otherSections?: { title: string; content: string }[];
}

export function tryParseJSON(text: string): { isValid: boolean; data?: any } {
  const trimmed = text.trim();
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      const data = JSON.parse(trimmed);
      return { isValid: true, data };
    } catch {
      return { isValid: false };
    }
  }
  return { isValid: false };
}

export function extractBrandStrategySections(text: string): BrandStrategySections | null {
  if (!text || text.trim().length === 0) return null;

  // Section heading patterns (Arabic and English)
  const patterns: { key: keyof BrandStrategySections; regex: RegExp }[] = [
    {
      key: 'overview',
      regex: /^(?:#+\s*|\*{1,3}\s*)?(?:نظرة عامة على الاستراتيجية|ملخص الاستراتيجية|نظرة عامة|Strategy Overview|Executive Summary)[:\s*]*/i,
    },
    {
      key: 'positioning',
      regex: /^(?:#+\s*|\*{1,3}\s*)?(?:تموضع العلامة التجارية|تموضع البراند|التموضع التسويقي|Brand Positioning|Positioning)[:\s*]*/i,
    },
    {
      key: 'targetAudience',
      regex: /^(?:#+\s*|\*{1,3}\s*)?(?:الجمهور المستهدف|شريحة العملاء|الشرائح المستهدفة|Target Audience|Audience)[:\s*]*/i,
    },
    {
      key: 'brandVoice',
      regex: /^(?:#+\s*|\*{1,3}\s*)?(?:نبرة وصوت البراند|نبرة العلامة التجارية|نبرة الصوت والشخصية|Brand Voice|Tone of Voice)[:\s*]*/i,
    },
    {
      key: 'marketingObjectives',
      regex: /^(?:#+\s*|\*{1,3}\s*)?(?:الأهداف التسويقية|أهداف الحملة|الأهداف الاستراتيجية|Marketing Objectives|Goals)[:\s*]*/i,
    },
    {
      key: 'contentPillars',
      regex: /^(?:#+\s*|\*{1,3}\s*)?(?:ركائز المحتوى|أعمدة المحتوى|محاور المحتوى|Content Pillars|Content Themes)[:\s*]*/i,
    },
    {
      key: 'recommendations',
      regex: /^(?:#+\s*|\*{1,3}\s*)?(?:التوصيات|خطة العمل والتوصيات|التوصيات الاستراتيجية|Recommendations|Action Plan)[:\s*]*/i,
    },
    {
      key: 'missingInformation',
      regex: /^(?:#+\s*|\*{1,3}\s*)?(?:المعلومات الناقصة|بيانات غير متوفرة|معلومات مفقودة|Missing Information|Information Gaps)[:\s*]*/i,
    },
  ];

  // Split text by markdown headers or prominent breaks
  const lines = text.split('\n');
  const sections: BrandStrategySections = {};
  let currentKey: keyof BrandStrategySections | null = null;
  let currentBuffer: string[] = [];
  let foundRecognizedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let matchedKey: keyof BrandStrategySections | null = null;

    // Check if line looks like a header
    const isHeaderLine = /^#{1,4}\s+/.test(line) || /^\*\*[^*]+\*\*:?\s*$/.test(line);

    if (isHeaderLine) {
      const cleanLine = line.replace(/^#{1,4}\s+/, '').replace(/^\*\*|\*\*$/g, '').trim();
      for (const p of patterns) {
        if (p.regex.test(cleanLine)) {
          matchedKey = p.key;
          break;
        }
      }
    }

    if (matchedKey) {
      if (currentKey && currentBuffer.length > 0) {
        (sections as any)[currentKey] = currentBuffer.join('\n').trim();
      }
      currentKey = matchedKey;
      currentBuffer = [];
      foundRecognizedCount++;
    } else {
      if (currentKey) {
        currentBuffer.push(line);
      }
    }
  }

  if (currentKey && currentBuffer.length > 0) {
    (sections as any)[currentKey] = currentBuffer.join('\n').trim();
  }

  // Only return structured sections if at least 2 key strategy sections were recognized
  if (foundRecognizedCount >= 2) {
    return sections;
  }

  return null;
}
