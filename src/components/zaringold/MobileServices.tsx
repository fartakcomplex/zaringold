"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Operator {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  logo: React.ReactNode;
}

const chargeAmounts = [5000, 10000, 20000, 50000];

function toPersianNumber(num: number | string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

function MCILogo() {
  return (
    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
      style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)" }}>
      <span className="text-[#8B0000] text-xs font-black">MCI</span>
    </div>
  );
}

function IrancellLogo() {
  return (
    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
      style={{ background: "linear-gradient(135deg, #FF6B35, #FF4500)" }}>
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <circle cx="12" cy="12" r="2" fill="white" />
        <path d="M12 4C8 4 5 7 5 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 8C9.5 8 8 9.5 8 11.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function RightelLogo() {
  return (
    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
      style={{ background: "linear-gradient(135deg, #9B59B6, #6C3483)" }}>
      R
    </div>
  );
}

function TaliyaLogo() {
  return (
    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
      style={{ background: "linear-gradient(135deg, #1ABC9C, #16A085)" }}>
      T
    </div>
  );
}

export function MobileServices() {
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const operators: Operator[] = [
    { id: "mci", name: "همراه اول", nameEn: "MCI", color: "#FFD700", logo: <MCILogo /> },
    { id: "irancell", name: "ایرانسل", nameEn: "Irancell", color: "#FF6B35", logo: <IrancellLogo /> },
    { id: "rightel", name: "رایتل", nameEn: "Rightel", color: "#9B59B6", logo: <RightelLogo /> },
    { id: "taliya", name: "تالیا", nameEn: "Taliya", color: "#1ABC9C", logo: <TaliyaLogo /> },
  ];

  const handleCharge = async () => {
    if (!selectedOperator) {
      toast.error("لطفاً اپراتور را انتخاب کنید");
      return;
    }
    if (!phoneNumber || !/^09\d{9}$/.test(phoneNumber)) {
      toast.error("شماره تلفن نامعتبر است");
      return;
    }
    if (!selectedAmount) {
      toast.error("مبلغ شارژ را انتخاب کنید");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/services/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          operator: selectedOperator,
          amount: selectedAmount,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.data.message);
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("خطا در اتصال به سرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="services" className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold gold-gradient-text mb-4">
            خدمات موبایل
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            خرید سریع شارژ و بسته اینترنت با بهترین قیمت
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Operator Selection */}
          <Card className="border-border/50 bg-card/80">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-xl">📱</span>
                انتخاب اپراتور
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {operators.map((op) => (
                  <button
                    key={op.id}
                    onClick={() => setSelectedOperator(op.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                      selectedOperator === op.id
                        ? "border-gold bg-gold/10 shadow-lg shadow-gold/20"
                        : "border-border/50 hover:border-gold/30 hover:bg-gold/5"
                    }`}
                  >
                    {op.logo}
                    <div className="text-right">
                      <p className="font-semibold text-sm">{op.name}</p>
                      <p className="text-xs text-muted-foreground">{op.nameEn}</p>
                    </div>
                    {selectedOperator === op.id && (
                      <Check className="w-4 h-4 text-gold mr-auto" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Charge Form */}
          <Card className="border-border/50 bg-card/80">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-xl">⚡</span>
                خرید شارژ
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    شماره تلفن
                  </label>
                  <Input
                    type="tel"
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="text-left ltr font-mono"
                    dir="ltr"
                    maxLength={11}
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    مبلغ شارژ (تومان)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {chargeAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setSelectedAmount(amount)}
                        className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                          selectedAmount === amount
                            ? "border-gold bg-gold/15 text-gold"
                            : "border-border/50 hover:border-gold/30 text-muted-foreground"
                        }`}
                      >
                        {toPersianNumber(amount.toLocaleString())} تومان
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleCharge}
                  disabled={loading}
                  className="w-full bg-gradient-to-l from-gold-dark to-gold text-background font-bold hover:from-gold hover:to-gold-light transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      در حال پردازش...
                    </>
                  ) : (
                    "خرید شارژ"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
