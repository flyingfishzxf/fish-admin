import { useState } from 'react'

import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@fish-admin/react'

export default function CardHeaderAction() {
  const [enabled, setEnabled] = useState(false)

  return (
    <Card className="fish-demo-w-72">
      <CardHeader>
        <CardTitle>Two-factor authentication</CardTitle>
        <CardDescription>Require a one-time code when members sign in.</CardDescription>
        <CardAction>
          <Badge variant={enabled ? 'secondary' : 'outline'}>
            {enabled ? 'Enabled' : 'Recommended'}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="fish-demo-muted" style={{ margin: 0 }} aria-live="polite">
          {enabled
            ? 'Members confirm each sign-in with their authenticator app.'
            : 'Sign-in currently needs only a password.'}
        </p>
      </CardContent>
      <CardFooter style={{ gap: '0.5rem' }}>
        <Button
          size="sm"
          variant={enabled ? 'outline' : 'default'}
          onClick={() => setEnabled((value) => !value)}
        >
          {enabled ? 'Turn off' : 'Enable 2FA'}
        </Button>
        <span className="fish-demo-muted">Policy updated 2026-09-12</span>
      </CardFooter>
    </Card>
  )
}
