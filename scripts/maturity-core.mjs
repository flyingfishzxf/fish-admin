const EVIDENCE_KEYS = ['test', 'axe', 'visual', 'demo', 'docs']

export function evaluateComponent({
  entry,
  hasTest,
  hasAxe,
  hasVisualLight,
  hasVisualDark,
  hasDemo,
  hasDocs,
}) {
  const evidence = {
    test: hasTest,
    axe: hasAxe,
    visual: { light: hasVisualLight, dark: hasVisualDark },
    demo: hasDemo,
    docs: hasDocs,
  }
  const problems = []
  if (!hasDocs) problems.push('missing docs page')
  if (!hasDemo) problems.push('missing demo')
  if (entry.status === 'stable') {
    if (!hasTest) problems.push('missing test')
    if (!hasAxe) problems.push('missing axe coverage')
    if (!hasVisualLight || !hasVisualDark) problems.push('missing visual baseline')
    if (!entry.since) problems.push('missing since')
  }
  if (entry.status === 'beta' && !entry.statusReason) problems.push('missing status reason')
  if (!['stable', 'beta'].includes(entry.status)) problems.push('invalid status')
  return {
    id: entry.id,
    name: entry.name,
    category: entry.category,
    status: entry.status,
    since: entry.since ?? null,
    statusReason: entry.statusReason ?? null,
    evidence,
    problems,
  }
}

export function summarize(components) {
  return {
    total: components.length,
    stable: components.filter((item) => item.status === 'stable').length,
    beta: components.filter((item) => item.status === 'beta').length,
    missingTest: components.filter((item) => !item.evidence.test).length,
    missingVisual: components.filter(
      (item) => !item.evidence.visual.light || !item.evidence.visual.dark,
    ).length,
    missingDemo: components.filter((item) => !item.evidence.demo).length,
    betaWithoutReason: components.filter((item) => item.status === 'beta' && !item.statusReason)
      .length,
  }
}

export { EVIDENCE_KEYS }
