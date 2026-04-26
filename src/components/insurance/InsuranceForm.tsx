'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Calculator,
  Car,
  MapPin,
  Calendar,
  Ruler,
  Banknote,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { motion } from '@/lib/framer-compat';
import type { InsuranceCategory } from './types';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface PersonalInfo {
  holderName: string;
  holderPhone: string;
  holderNationalId: string;
  holderEmail: string;
}

interface InsuranceFormProps {
  category: InsuranceCategory;
  personalInfo: PersonalInfo;
  setPersonalInfo: (info: PersonalInfo) => void;
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  onCalculatePrice: () => void;
  onBack: () => void;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helper: Is Vehicle Category?                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function isVehicleCategory(slug: string) {
  return slug === 'third-party-auto' || slug === 'body-insurance' || slug === 'motorcycle-insurance';
}

function isTravelCategory(slug: string) {
  return slug === 'travel-insurance';
}

function isHealthCategory(slug: string) {
  return slug === 'health-insurance';
}

function isFireCategory(slug: string) {
  return slug === 'fire-insurance';
}

function isLifeOrLiabilityCategory(slug: string) {
  return slug === 'life-insurance' || slug === 'liability-insurance';
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Vehicle Section                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function VehicleSection({
  category,
  formData,
  setFormData,
}: {
  category: InsuranceCategory;
  formData: Record<string, any>;
  setFormData: (d: Record<string, any>) => void;
}) {
  const vehicleLabel = category.slug === 'motorcycle-insurance'
    ? 'موتورسیکلت' // i18n
    : 'خودرو'; // i18n

  const years = Array.from({ length: 25 }, (_, i) => 1380 + i).reverse();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Car className="h-4 w-4 text-gold" />
        <h4 className="text-sm font-bold text-foreground">
          {/* i18n */}اطلاعات {vehicleLabel}
        </h4>
      </div>

      {/* Vehicle Type */}
      {category.subtypes && category.subtypes.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {/* i18n */}نوع {vehicleLabel}
          </Label>
          <Select
            value={formData.vehicleType || ''}
            onValueChange={(v) => setFormData({ ...formData, vehicleType: v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`انتخاب نوع ${vehicleLabel}`} />
            </SelectTrigger>
            <SelectContent>
              {category.subtypes.map((st) => (
                <SelectItem key={st} value={st}>
                  {st}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Vehicle Model */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          {/* i18n */}مدل {vehicleLabel}
        </Label>
        <Input
          placeholder={`مثلاً پژو ۲۰۶`}
          value={formData.vehicleModel || ''}
          onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
          className="text-sm"
        />
      </div>

      {/* Year */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          {/* i18n */}سال ساخت
        </Label>
        <Select
          value={formData.vehicleYear || ''}
          onValueChange={(v) => setFormData({ ...formData, vehicleYear: v })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="انتخاب سال" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Plate Number */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          {/* i18n */}پلاک {vehicleLabel}
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="حروف"
            value={formData.plateLetters || ''}
            onChange={(e) => setFormData({ ...formData, plateLetters: e.target.value })}
            className="flex-1 text-sm"
            maxLength={3}
          />
          <Input
            placeholder="اعداد"
            value={formData.plateNumbers || ''}
            onChange={(e) => setFormData({ ...formData, plateNumbers: e.target.value.replace(/[^0-9]/g, '') })}
            className="flex-1 text-sm"
            maxLength={7}
          />
        </div>
      </div>

      {/* Third Party Insurance */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          {/* i18n */}بیمه شخص ثالث معتبر دارد؟
        </Label>
        <RadioGroup
          value={formData.hasThirdParty || ''}
          onValueChange={(v) => setFormData({ ...formData, hasThirdParty: v })}
          className="flex gap-6"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="third-party-yes" />
            <Label htmlFor="third-party-yes" className="text-sm cursor-pointer">
              {/* i18n */}بله
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="third-party-no" />
            <Label htmlFor="third-party-no" className="text-sm cursor-pointer">
              {/* i18n */}خیر
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Health/Travel Section                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function HealthTravelSection({
  category,
  formData,
  setFormData,
}: {
  category: InsuranceCategory;
  formData: Record<string, any>;
  setFormData: (d: Record<string, any>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="h-4 w-4 text-gold" />
        <h4 className="text-sm font-bold text-foreground">
          {/* i18n */}{isTravelCategory(category.slug) ? 'اطلاعات سفر' : 'اطلاعات بیمه'}
        </h4>
      </div>

      {isTravelCategory(category.slug) && (
        <>
          {/* Travel Date */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              <Calendar className="inline h-3 w-3 ml-1" />
              {/* i18n */}تاریخ سفر
            </Label>
            <Input
              type="date"
              value={formData.travelDate || ''}
              onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
              className="text-sm"
            />
          </div>

          {/* Destination */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              <MapPin className="inline h-3 w-3 ml-1" />
              {/* i18n */}مقصد
            </Label>
            <Select
              value={formData.destination || ''}
              onValueChange={(v) => setFormData({ ...formData, destination: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="انتخاب مقصد" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="turkey">ترکیه</SelectItem>
                <SelectItem value="uae">امارات</SelectItem>
                <SelectItem value="thailand">تایلند</SelectItem>
                <SelectItem value="malaysia">مالزی</SelectItem>
                <SelectItem value="europe">اروپا</SelectItem>
                <SelectItem value="other">سایر کشورها</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Duration */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          {/* i18n */}مدت بیمه
        </Label>
        <Select
          value={formData.duration || ''}
          onValueChange={(v) => setFormData({ ...formData, duration: v })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="انتخاب مدت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">۱ ماه (۴ هفته)</SelectItem>
            <SelectItem value="3months">۳ ماه</SelectItem>
            <SelectItem value="6months">۶ ماه</SelectItem>
            <SelectItem value="1year">۱ سال</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Fire/Life/Liability Section                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PropertySection({
  category,
  formData,
  setFormData,
}: {
  category: InsuranceCategory;
  formData: Record<string, any>;
  setFormData: (d: Record<string, any>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Banknote className="h-4 w-4 text-gold" />
        <h4 className="text-sm font-bold text-foreground">
          {/* i18n */}{isFireCategory(category.slug) ? 'اطلاعات ملک' : 'اطلاعات بیمه‌نامه'}
        </h4>
      </div>

      {isFireCategory(category.slug) && (
        <>
          {/* Property Address */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              <MapPin className="inline h-3 w-3 ml-1" />
              {/* i18n */}آدرس ملک
            </Label>
            <Input
              placeholder="آدرس کامل ملک مورد بیمه"
              value={formData.propertyAddress || ''}
              onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
              className="text-sm"
            />
          </div>

          {/* Area */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              <Ruler className="inline h-3 w-3 ml-1" />
              {/* i18n */}متراژ (متر مربع)
            </Label>
            <Input
              type="number"
              placeholder="مثلاً ۱۰۰"
              value={formData.area || ''}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              className="text-sm"
            />
          </div>
        </>
      )}

      {/* Coverage Amount */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          <Banknote className="inline h-3 w-3 ml-1" />
          {/* i18n */}مبلغ مورد نظر (تومان)
        </Label>
        <Input
          type="number"
          placeholder="مثلاً ۵۰۰,۰۰۰,۰۰۰"
          value={formData.coverageAmount || ''}
          onChange={(e) => setFormData({ ...formData, coverageAmount: e.target.value })}
          className="text-sm"
        />
        <p className="text-[10px] text-muted-foreground">
          {/* i18n */}حداقل مبلغ پوشش را وارد کنید
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function InsuranceForm({
  category,
  personalInfo,
  setPersonalInfo,
  formData,
  setFormData,
  onCalculatePrice,
  onBack,
}: InsuranceFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!personalInfo.holderName.trim()) errs.holderName = 'نام گیرنده الزامی است'; // i18n
    if (!personalInfo.holderPhone.trim()) errs.holderPhone = 'شماره موبایل الزامی است'; // i18n
    if (!personalInfo.holderNationalId.trim()) errs.holderNationalId = 'کد ملی الزامی است'; // i18n
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onCalculatePrice();
    }
  };

  const categoryLabel = category.name;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {/* i18n */}فرم درخواست {categoryLabel}
          </h2>
          <p className="text-xs text-muted-foreground">
            {/* i18n */}اطلاعات خود را وارد کنید تا بهترین طرح بیمه نمایش داده شود
          </p>
        </div>
      </div>

      {/* Personal Info Card */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gold/10 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gold">۱</span>
            </div>
            {/* i18n */}اطلاعات گیرنده بیمه
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Holder Name */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {/* i18n */}نام گیرنده بیمه *
            </Label>
            <Input
              placeholder="نام و نام خانوادگی"
              value={personalInfo.holderName}
              onChange={(e) => setPersonalInfo({ ...personalInfo, holderName: e.target.value })}
              className={`text-sm ${errors.holderName ? 'border-destructive' : ''}`}
            />
            {errors.holderName && (
              <p className="text-[10px] text-destructive">{errors.holderName}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {/* i18n */}شماره موبایل *
            </Label>
            <Input
              type="tel"
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              value={personalInfo.holderPhone}
              onChange={(e) => setPersonalInfo({ ...personalInfo, holderPhone: e.target.value })}
              className={`text-sm ${errors.holderPhone ? 'border-destructive' : ''}`}
              dir="ltr"
            />
            {errors.holderPhone && (
              <p className="text-[10px] text-destructive">{errors.holderPhone}</p>
            )}
          </div>

          {/* National ID */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {/* i18n */}کد ملی *
            </Label>
            <Input
              placeholder="کد ملی ۱۰ رقمی"
              value={personalInfo.holderNationalId}
              onChange={(e) => setPersonalInfo({ ...personalInfo, holderNationalId: e.target.value.replace(/[^0-9]/g, '') })}
              className={`text-sm ${errors.holderNationalId ? 'border-destructive' : ''}`}
              maxLength={10}
              dir="ltr"
            />
            {errors.holderNationalId && (
              <p className="text-[10px] text-destructive">{errors.holderNationalId}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {/* i18n */}ایمیل (اختیاری)
            </Label>
            <Input
              type="email"
              placeholder="example@email.com"
              value={personalInfo.holderEmail}
              onChange={(e) => setPersonalInfo({ ...personalInfo, holderEmail: e.target.value })}
              className="text-sm"
              dir="ltr"
            />
          </div>
        </CardContent>
      </Card>

      {/* Category-specific Section */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gold/10 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gold">۲</span>
            </div>
            {/* i18n */}اطلاعات تکمیلی
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isVehicleCategory(category.slug) && (
            <VehicleSection
              category={category}
              formData={formData}
              setFormData={setFormData}
            />
          )}

          {(isTravelCategory(category.slug) || isHealthCategory(category.slug)) && (
            <HealthTravelSection
              category={category}
              formData={formData}
              setFormData={setFormData}
            />
          )}

          {isFireCategory(category.slug) && (
            <PropertySection
              category={category}
              formData={formData}
              setFormData={setFormData}
            />
          )}

          {isLifeOrLiabilityCategory(category.slug) && (
            <PropertySection
              category={category}
              formData={formData}
              setFormData={setFormData}
            />
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        className="w-full bg-gold text-black hover:bg-gold/90 font-bold py-5 gap-2"
      >
        <Calculator className="h-4 w-4" />
        {/* i18n */}محاسبه قیمت
      </Button>
    </motion.div>
  );
}
