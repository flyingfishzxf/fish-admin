import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import { analyzePassword } from '../password'

const LEVEL_KEYS = ['weak', 'fair', 'good', 'strong'] as const
const LEVEL_STYLES = ['bg-destructive', 'bg-amber-500', 'bg-chart-1', 'bg-emerald-500'] as const

export function PasswordStrength({ password }: { password: string }) {
  const { t } = useTranslation('auth')
  if (!password) return null

  const { score, checks } = analyzePassword(password)
  const level = LEVEL_KEYS[Math.min(score, LEVEL_KEYS.length) - 1] ?? 'weak'

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={cn(
              'h-1.5 flex-1 rounded-full bg-muted transition-colors',
              index < score && LEVEL_STYLES[score - 1],
            )}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground">{t(`passwordStrength.${level}`)}</span>
        <span className="inline-flex items-center gap-1">
          <Check
            className={cn(
              'size-3',
              checks.length ? 'text-emerald-600' : 'text-muted-foreground/40',
            )}
          />
          {t('passwordChecks.length')}
        </span>
        <span className="inline-flex items-center gap-1">
          <Check
            className={cn(
              'size-3',
              checks.lowercase && checks.number ? 'text-emerald-600' : 'text-muted-foreground/40',
            )}
          />
          {t('passwordChecks.mixed')}
        </span>
        <span className="inline-flex items-center gap-1">
          <Check
            className={cn(
              'size-3',
              checks.uppercase && checks.symbol ? 'text-emerald-600' : 'text-muted-foreground/40',
            )}
          />
          {t('passwordChecks.symbol')}
        </span>
      </div>
    </div>
  )
}
