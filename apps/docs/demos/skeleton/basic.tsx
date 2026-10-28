import { useState } from 'react'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@fish-admin/react'

export default function SkeletonBasic() {
  const [loading, setLoading] = useState(true)

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <Button size="sm" variant="outline" onClick={() => setLoading((current) => !current)}>
          {loading ? 'Load card' : 'Show skeleton'}
        </Button>
        <span className="fish-demo-muted">
          {loading ? 'The placeholder mirrors the loaded card.' : 'Content replaces every block.'}
        </span>
      </div>
      <div className="fish-demo-w-72" aria-busy={loading}>
        {loading ? (
          <Card>
            <CardHeader>
              <Skeleton style={{ height: 16, width: '55%' }} />
              <Skeleton style={{ height: 12, width: '80%' }} />
            </CardHeader>
            <CardContent className="fish-demo-stack" style={{ gap: 8 }}>
              <Skeleton style={{ height: 12 }} />
              <Skeleton style={{ height: 12 }} />
              <Skeleton style={{ height: 12, width: '70%' }} />
            </CardContent>
            <CardFooter>
              <Skeleton style={{ height: 32, width: 104, borderRadius: 8 }} />
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Deploy preview</CardTitle>
              <CardDescription>Build 4812 passed every check on October 27, 2026.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="fish-demo-muted" style={{ margin: 0 }}>
                api · web · docs · 4 targets
              </p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="outline">
                Open preview
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
