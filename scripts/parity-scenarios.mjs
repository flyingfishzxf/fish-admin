#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ACTIONS = new Set([
  'click',
  'fill',
  'press',
  'pressKey',
  'expectText',
  'expectNotText',
  'expectTargetText',
  'expectVisible',
  'expectHidden',
  'expectCount',
  'expectState',
])

const STATES = new Set(['expanded', 'selected', 'checked', 'disabled'])
const SCOPES = new Set(['demo', 'page'])

function validateTarget(target, label, action, problems) {
  if (!target || typeof target !== 'object') {
    problems.push(`${label}: ${action} needs a target`)
    return
  }
  if (target.css !== undefined) {
    if (action !== 'expectCount') {
      problems.push(`${label}: css targets are only allowed for expectCount`)
    }
    if (typeof target.css !== 'string' || target.css.trim() === '') {
      problems.push(`${label}: css must be a non-empty string`)
    }
  } else if (typeof target.role !== 'string' || target.role.trim() === '') {
    problems.push(`${label}: target needs role or css`)
  }
  if (target.name !== undefined && typeof target.name !== 'string') {
    problems.push(`${label}: name must be a string`)
  }
  if (target.exact !== undefined && typeof target.exact !== 'boolean') {
    problems.push(`${label}: exact must be a boolean`)
  }
  if (target.scope !== undefined && !SCOPES.has(target.scope)) {
    problems.push(`${label}: unknown scope ${target.scope}`)
  }
}

export function validateScenario(scenario, component) {
  const problems = []

  if (scenario.version !== 1) problems.push('version must be 1')
  if (!component) {
    problems.push(`${scenario.component}: unknown component`)
    return problems
  }
  const demoId = typeof scenario.demo === 'string' ? `${component.id}/${scenario.demo}` : ''
  if (!demoId || !component.demos.includes(demoId)) {
    problems.push(`${scenario.demo} is not a demo of ${component.id}`)
  }
  if (!['light', 'dark'].includes(scenario.appearance)) {
    problems.push(`unknown appearance ${scenario.appearance}`)
  }
  if (!Array.isArray(scenario.steps) || scenario.steps.length === 0) {
    problems.push('steps must be a non-empty array')
    return problems
  }

  scenario.steps.forEach((step, index) => {
    const label = `steps[${index}]`
    if (!step || typeof step !== 'object' || !ACTIONS.has(step.action)) {
      problems.push(`${label}: unknown action ${step?.action}`)
      return
    }

    switch (step.action) {
      case 'click':
      case 'fill':
      case 'press':
      case 'expectTargetText':
      case 'expectVisible':
      case 'expectHidden':
      case 'expectCount':
      case 'expectState':
        validateTarget(step.target, label, step.action, problems)
        break
      case 'pressKey':
        if (typeof step.key !== 'string' || step.key.trim() === '') {
          problems.push(`${label}: pressKey needs a key`)
        }
        break
      case 'expectText':
      case 'expectNotText':
        if (typeof step.text !== 'string' || step.text.trim() === '') {
          problems.push(`${label}: ${step.action} needs text`)
        }
        break
      default:
        break
    }

    if (step.action === 'fill' && typeof step.value !== 'string') {
      problems.push(`${label}: fill needs a value`)
    }
    if (step.action === 'press' && (typeof step.key !== 'string' || step.key.trim() === '')) {
      problems.push(`${label}: press needs a key`)
    }
    if (step.action === 'expectTargetText' && typeof step.text !== 'string') {
      problems.push(`${label}: expectTargetText needs text`)
    }
    if (step.action === 'expectCount' && (!Number.isInteger(step.count) || step.count < 0)) {
      problems.push(`${label}: expectCount needs a non-negative count`)
    }
    if (step.action === 'expectState') {
      if (!STATES.has(step.state)) problems.push(`${label}: unknown state ${step.state}`)
      if (typeof step.value !== 'boolean')
        problems.push(`${label}: expectState needs a boolean value`)
    }
  })

  return problems
}

export function validateScenarioSet(pilot, components, scenarios) {
  const problems = []
  const componentsById = new Map(components.map((component) => [component.id, component]))
  const pilotIds = new Set(pilot.components)

  for (const scenario of scenarios) {
    if (!pilotIds.has(scenario.component)) {
      problems.push(`${scenario.component}: not a pilot component`)
      continue
    }
    const component = componentsById.get(scenario.component)
    problems.push(
      ...validateScenario(scenario, component).map(
        (problem) => `${scenario.component}: ${problem}`,
      ),
    )
  }

  for (const id of pilot.components) {
    const count = scenarios.filter((scenario) => scenario.component === id).length
    if (count !== 1) problems.push(`${id}: expected one scenario, found ${count}`)
  }

  return problems
}

function readJson(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`parity-scenarios: ${path.relative(process.cwd(), file)} is missing`)
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function main() {
  const root = process.cwd()
  const pilot = readJson(path.join(root, 'parity/pilot.json'))
  const contract = readJson(path.join(root, 'parity/contract/components.json'))
  const directory = path.join(root, 'parity/scenarios')
  const files = fs
    .readdirSync(directory)
    .filter((file) => file.endsWith('.json'))
    .sort()
  const scenarios = files.map((file) => readJson(path.join(directory, file)))

  const problems = validateScenarioSet(pilot, contract.components, scenarios)
  if (problems.length > 0) {
    for (const problem of problems) console.error(`parity-scenarios: ${problem}`)
    process.exitCode = 1
    return
  }

  console.log(
    `parity-scenarios: ${scenarios.length} scenarios match ${pilot.components.length} pilots`,
  )
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
