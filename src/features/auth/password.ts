export interface PasswordAnalysis {
  score: 0 | 1 | 2 | 3 | 4
  checks: {
    length: boolean
    lowercase: boolean
    uppercase: boolean
    number: boolean
    symbol: boolean
  }
}

export function analyzePassword(password: string): PasswordAnalysis {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }
  const passed = Object.values(checks).filter(Boolean).length

  let score: PasswordAnalysis['score'] = 0
  if (passed >= 2) score = 1
  if (passed >= 3) score = 2
  if (passed >= 4) score = 3
  if (passed >= 5 && password.length >= 10) score = 4

  return { score, checks }
}
