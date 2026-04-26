import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { audio } = body;

    if (!audio || typeof audio !== 'string') {
      return NextResponse.json(
        { success: false, error: 'فایل صوتی الزامی است' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const response = await zai.audio.asr.create({
      file_base64: audio,
    });

    const transcribedText = response?.text || response?.results?.[0]?.text || '';

    if (!transcribedText) {
      return NextResponse.json(
        { success: false, error: 'متنی از فایل صوتی استخراج نشد' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      text: transcribedText,
    });
  } catch (error) {
    console.error('[Voice Transcribe API Error]', error);
    return NextResponse.json(
      { success: false, error: 'خطا در پردازش فایل صوتی. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}
