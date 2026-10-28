import { useState } from 'react'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Progress,
} from '@fish-admin/react'
import { Star } from 'lucide-react'

const TOTAL_TASKS = 20

export default function CardBasic() {
  const [completed, setCompleted] = useState(12)
  const [following, setFollowing] = useState(false)
  const percent = Math.round((completed / TOTAL_TASKS) * 100)

  return (
    <Card className="fish-demo-w-72">
      <CardHeader>
        <CardTitle>Atlas redesign</CardTitle>
        <CardDescription>Marketing site refresh for the Atlas launch.</CardDescription>
      </CardHeader>
      <CardContent style={{ display: 'grid', gap: '0.75rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <Badge variant="secondary">In progress</Badge>
          <span className="fish-demo-muted">
            {completed} / {TOTAL_TASKS} tasks
          </span>
        </div>
        <Progress value={percent} aria-label={`Atlas redesign ${percent}% complete`} />
        <p className="fish-demo-muted" style={{ margin: 0 }}>
          Due 2026-10-30 · Owner Design guild
        </p>
      </CardContent>
      <CardFooter style={{ gap: '0.5rem' }}>
        <Button
          size="sm"
          disabled={completed >= TOTAL_TASKS}
          onClick={() => setCompleted((count) => Math.min(TOTAL_TASKS, count + 1))}
        >
          Log a task
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-pressed={following}
          onClick={() => setFollowing((value) => !value)}
        >
          <Star size={16} />
          {following ? 'Following' : 'Follow'}
        </Button>
      </CardFooter>
    </Card>
  )
}
