import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

interface GoldAnalysis {
  type: string;
  karat: string;
  weightGrams: string;
  estimatedValueRial: string;
  description: string;
  confidence: number;
  tips: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body as { image?: string };

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { success: false, error: 'لطفاً یک تصویر معتبر ارسال کنید.' },
        { status: 400 }
      );
    }

    // Strip data URL prefix if present
    const base64 = image.replace(/^data:image\/\w+;base64,/, '');

    if (base64.length < 100) {
      return NextResponse.json(
        { success: false, error: 'تصویر ارسالی خیلی کوچک است.' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const prompt = `تو یک متخصص تشخیص و ارزیابی طلا و جواهرات با سال‌ها تجربه هستی. لطفاً این تصویر را با دقت تحلیل کن و اطلاعات زیر را به صورت JSON با کلیدهای انگلیسی برگردان:

{
  "type": "نوع جواهر (مثلاً انگشتر طلا، گردنبند، دستبند، سکه، گوشواره، پلاک، النگو و...)",
  "karat": "عیار طلا (مثلاً ۱۸، ۲۱، ۲۴ - فقط عدد فارسی)",
  "weightGrams": "وزن تقریبی به گرم (فقط عدد فارسی با ممیز)",
  "estimatedValueRial": "ارزش تقریبی به واحد طلایی (فقط عدد فارسی با جداکننده هزارگان)",
  "description": "توضیحات جزئیات طراحی و ظاهر به فارسی (حداقل ۲ سentence)",
  "confidence": "امتیاز اطمینان از تحلیل (عدد ۱ تا ۱۰۰)",
  "tips": ["نکته ۱ برای خریدار", "نکته ۲ برای خریدار", "نکته ۳ برای خریدار"]
}

نکات مهم:
- قیمت‌ها بر اساس قیمت روز طلا در بازار ایران محاسبه شود
- وزن و ارزش تخمینی هستند و باید واقع‌بینانه باشند
- عیار بر اساس ظاهر و رنگ طلای تصویر تخمین زده شود
- توضیحات باید دقیق و مفید باشد
- نکات باید کاربردی و برای خریدار مفید باشد
- فقط و فقط JSON خالص برگردان بدون هیچ متن اضافی`;

    const response = await zai.chat.completions.createVision({
      model: 'default',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64}`,
              },
            },
          ],
        },
      ],
    });

    const rawContent = response.choices?.[0]?.message?.content || '';

    // Try to extract JSON from the response
    let parsed: GoldAnalysis;

    try {
      // Try direct parse first
      parsed = JSON.parse(rawContent);
    } catch {
      // Try to find JSON block in the response
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try to find curly brace block
        const braceMatch = rawContent.match(/\{[\s\S]*\}/);
        if (braceMatch) {
          parsed = JSON.parse(braceMatch[0]);
        } else {
          throw new Error('Could not parse AI response');
        }
      }
    }

    // Validate and sanitize the parsed data
    const analysis: GoldAnalysis = {
      type: parsed.type || 'نامشخص',
      karat: parsed.karat || 'نامشخص',
      weightGrams: parsed.weightGrams || 'نامشخص',
      estimatedValueRial: parsed.estimatedValueRial || 'نامشخص',
      description: parsed.description || 'توضیحات در دسترس نیست.',
      confidence: Math.min(100, Math.max(1, parseInt(String(parsed.confidence)) || 50)),
      tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 5) : ['برای قیمت دقیق به طلافروشی مراجعه کنید.'],
    };

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('[Gold Scanner API Error]', error);

    // Fallback response on error
    const fallbackAnalysis: GoldAnalysis = {
      type: 'نامشخص',
      karat: 'نامشخص',
      weightGrams: 'نامشخص',
      estimatedValueRial: 'نامشخص',
      description: 'متأسفانه تحلیل تصویر با مشکل مواجه شد. لطفاً دوباره تلاش کنید یا تصویر واضح‌تری ارسال کنید.',
      confidence: 0,
      tips: [
        'تصویر باید واضح و با نور مناسب باشد',
        'جواهر باید کاملاً در تصویر قابل مشاهده باشد',
        'از زاویه مناسب عکس بگیرید',
      ],
    };

    return NextResponse.json(
      {
        success: true,
        analysis: fallbackAnalysis,
        warning: 'تحلیل کامل انجام نشد. نتایج تخمینی هستند.',
      },
      { status: 200 }
    );
  }
}
