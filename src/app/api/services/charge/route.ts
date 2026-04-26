import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, operator, amount } = body;

    if (!phoneNumber || !operator || !amount) {
      return NextResponse.json(
        { success: false, error: "اطلاعات ناقص است" },
        { status: 400 }
      );
    }

    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        { success: false, error: "شماره تلفن نامعتبر است" },
        { status: 400 }
      );
    }

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      data: {
        orderId: `ORD-${Date.now()}`,
        phoneNumber,
        operator,
        amount,
        status: "success",
        message: `شارژ ${amount.toLocaleString("fa-IR")} تومان با موفقیت انجام شد`,
        transactionId: `TRX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "خطا در پردازش درخواست" },
      { status: 500 }
    );
  }
}
