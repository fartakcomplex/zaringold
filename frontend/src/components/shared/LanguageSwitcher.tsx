
import {Globe} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import {useTranslation, type Locale} from '@/lib/i18n';
import {cn} from '@/lib/utils';

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { t, locale, setLocale } = useTranslation();

  const handleSwitch = (newLocale: Locale) => {
    setLocale(newLocale);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative shrink-0', className)}
          aria-label={t('nav.language')}
        >
          <Globe className="size-5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-40">
        <DropdownMenuItem
          onClick={() => handleSwitch('fa')}
          className={cn(
            'flex items-center gap-2.5 cursor-pointer',
            locale === 'fa' && 'bg-[#D4AF37]/10 text-[#D4AF37]',
          )}
        >
          <span className="text-base">🇮🇷</span>
          <span className={cn('text-sm font-medium', locale === 'fa' && 'font-bold')}>
            {t('lang.fa')}
          </span>
          {locale === 'fa' && (
            <span className="ms-auto size-2 rounded-full bg-[#D4AF37]" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSwitch('en')}
          className={cn(
            'flex items-center gap-2.5 cursor-pointer',
            locale === 'en' && 'bg-[#D4AF37]/10 text-[#D4AF37]',
          )}
        >
          <span className="text-base">🇬🇧</span>
          <span className={cn('text-sm font-medium', locale === 'en' && 'font-bold')}>
            {t('lang.en')}
          </span>
          {locale === 'en' && (
            <span className="ms-auto size-2 rounded-full bg-[#D4AF37]" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
