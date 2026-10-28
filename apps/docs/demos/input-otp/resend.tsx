import { useState } from 'react'

import { Button, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@fish-admin/react'

const SLOTS = [0, 1, 2, 3, 4, 5]

export default function InputOtpResend() {
  const [code, setCode] = useState('')
  const [notice, setNotice] = useState('')
  const [completed, setCompleted] = useState('')

  const handleChange = (next: string) => {
    setCode(next)
    setNotice('')
    if (next.length < 6) setCompleted('')
  }

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-stack" style={{ gap: '0.4rem' }}>
        <span className="fish-demo-label">Check your email</span>
        <p className="fish-demo-muted" style={{ margin: 0 }}>
          A six-digit code was sent to ada@acme.dev. It expires in 10 minutes.
        </p>
        <InputOTP
          maxLength={6}
          value={code}
          onChange={handleChange}
          onComplete={(value) => setCompleted(String(value))}
          aria-label="Six-digit verification code"
        >
          <InputOTPGroup>
            {SLOTS.slice(0, 3).map((index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            {SLOTS.slice(3).map((index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <div className="fish-demo-row">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setCode('')
              setCompleted('')
              setNotice('A new code is on its way.')
            }}
          >
            Resend code
          </Button>
          <p className="fish-demo-muted" aria-live="polite" style={{ margin: 0 }}>
            {notice ||
              (completed
                ? `Code ${completed} accepted. Signing you in…`
                : 'Didn’t get it? Resend, or check your spam folder.')}
          </p>
        </div>
      </div>
    </div>
  )
}
