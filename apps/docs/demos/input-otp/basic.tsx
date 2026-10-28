import { useState } from 'react'

import { InputOTP, InputOTPGroup, InputOTPSlot } from '@fish-admin/react'

export default function InputOtpBasic() {
  const [code, setCode] = useState('')
  const complete = code.length === 6

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-stack" style={{ gap: '0.4rem' }}>
        <span className="fish-demo-label">Verification code</span>
        <p className="fish-demo-muted" style={{ margin: 0 }}>
          Enter the six digits sent to ada@acme.dev.
        </p>
        <InputOTP
          maxLength={6}
          value={code}
          onChange={setCode}
          aria-label="Six-digit verification code"
        >
          <InputOTPGroup>
            {Array.from({ length: 6 }, (_, index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <p className="fish-demo-muted" aria-live="polite" style={{ margin: 0 }}>
          {complete ? 'Code complete — ready to verify.' : `${code.length} of 6 digits entered.`}
        </p>
      </div>
    </div>
  )
}
