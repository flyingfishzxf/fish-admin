import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Rate } from '@/components/enterprise/rate/rate'
import { Stepper } from '@/components/enterprise/stepper/stepper'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ProjectDetail } from '@/types'

import { updateProject } from '../api'

export function ProjectReviewTab({
  detail,
  canManage,
}: {
  detail: ProjectDetail
  canManage: boolean
}) {
  const { t } = useTranslation(['projects', 'common'])
  const queryClient = useQueryClient()
  const project = detail.project
  const [step, setStep] = useState(0)
  const [rating, setRating] = useState(project.rating ?? 0)
  const [notes, setNotes] = useState(project.retro ?? '')
  const [error, setError] = useState<string>()

  useEffect(() => {
    setRating(project.rating ?? 0)
    setNotes(project.retro ?? '')
  }, [project.rating, project.retro])

  const saveMutation = useMutation({
    mutationFn: () => updateProject(project.id, { rating, retro: notes }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      void queryClient.invalidateQueries({ queryKey: ['audit-events'] })
      toast.success(t('projects:detail.review.saved'))
      setError(undefined)
      setStep(2)
    },
    onError: () => toast.error(t('projects:detail.review.saveFailed')),
  })

  const steps = [
    { id: 'feedback', title: t('projects:detail.review.stepFeedback') },
    { id: 'rate', title: t('projects:detail.review.stepRate') },
    { id: 'notes', title: t('projects:detail.review.stepNotes') },
  ]

  function submit() {
    if (rating < 1 || rating > 5) {
      setError(t('projects:detail.review.ratingRequired'))
      setStep(1)
      return
    }
    saveMutation.mutate()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{t('projects:detail.review.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('projects:detail.review.description')}</p>
      </div>

      <Stepper
        steps={steps}
        current={step}
        onStepClick={(index) => setStep(index)}
        ariaLabel={t('projects:detail.review.stepsLabel')}
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          {step === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t('projects:detail.review.stepFeedback')}
              </p>
              <div className="space-y-1">
                <p className="text-sm font-medium">{t('projects:detail.review.ratingLabel')}</p>
                <Rate value={rating} readOnly ariaLabel={t('projects:detail.review.rating')} />
              </div>
              {notes ? (
                <p className="rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-wrap">{notes}</p>
              ) : null}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-2">
              <Label>{t('projects:detail.review.rating')}</Label>
              <Rate
                value={rating}
                onChange={(value) => {
                  setRating(value)
                  setError(undefined)
                }}
                ariaLabel={t('projects:detail.review.ratingLabel')}
                readOnly={!canManage}
              />
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-2">
              <Label htmlFor="retro-notes">{t('projects:detail.review.notes')}</Label>
              <Textarea
                id="retro-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={t('projects:detail.review.notesPlaceholder')}
                rows={5}
                disabled={!canManage}
              />
            </div>
          ) : null}

          <div className="flex flex-wrap justify-between gap-2 border-t pt-3">
            <Button
              variant="ghost"
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              disabled={step === 0}
            >
              {t('common:actions.back')}
            </Button>
            <div className="flex gap-2">
              {step < 2 ? (
                <Button onClick={() => setStep((current) => Math.min(2, current + 1))}>
                  {t('common:actions.next')}
                </Button>
              ) : null}
              {canManage ? (
                <Button onClick={submit} disabled={saveMutation.isPending}>
                  {t('projects:detail.review.save')}
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
