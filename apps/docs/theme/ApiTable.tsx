import { useLang } from '@rspress/core/runtime'

import api from '@docs/generated/api.json'
import { uiText } from '@docs/site'

type ApiProp = {
  name: string
  type: string
  required?: boolean
  defaultValue?: string | null
  description: string
}

type ApiComponent = {
  name: string
  exportName: string
  props: ApiProp[]
  events: ApiProp[]
  slots: string[]
  unresolved: string[]
}

export default function ApiTable({ component }: { component: string }) {
  const lang = useLang()
  const text = uiText(lang)
  const entry = (api.components as Record<string, ApiComponent>)[component]
  if (!entry) return <p className="fish-demo__placeholder">Unknown component: {component}</p>
  const rows = [...entry.props, ...entry.events]
  return (
    <div>
      <h3>
        {entry.name} <code>{entry.exportName}</code>
      </h3>
      {rows.length === 0 ? (
        <p className="fish-demo__placeholder">{text.apiNone}</p>
      ) : (
        <table className="fish-api">
          <thead>
            <tr>
              <th>{text.apiName}</th>
              <th>{text.apiType}</th>
              <th>{text.apiDefault}</th>
              <th>{text.apiRequired}</th>
              <th>{text.apiDescription}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((prop) => (
              <tr key={prop.name}>
                <td>
                  <code>{prop.name}</code>
                </td>
                <td>
                  <code>{prop.type}</code>
                </td>
                <td>{prop.defaultValue ? <code>{prop.defaultValue}</code> : '—'}</td>
                <td>{prop.required ? 'yes' : '—'}</td>
                <td>{prop.description || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {entry.slots.length > 0 ? (
        <p className="fish-api-note">Slots: {entry.slots.join(', ')}</p>
      ) : null}
      {entry.unresolved.length > 0 ? (
        <div className="fish-api-note">
          <strong>{text.apiUnresolved}</strong>
          <ul>
            {entry.unresolved.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
