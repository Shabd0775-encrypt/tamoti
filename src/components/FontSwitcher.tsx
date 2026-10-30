// TEMPORARY: a small bar for trying typefaces in three roles: the headings,
// the brush face for the name, and the body text. Each choice sets a data-
// attribute on <html> that tokens.css picks up. Kept in the address
// (?heading=gilda&brush=kaushan&body=jost) and remembered.
// Delete this once the type is chosen.

import { useEffect, useState } from 'react'

const roles = {
  heading: {
    label: 'Headings',
    options: {
      cormorant: 'Cormorant Garamond',
      mincho: 'Shippori Mincho',
      marcellus: 'Marcellus',
      gilda: 'Gilda Display',
    },
  },
  brush: {
    label: 'Name',
    options: { yuji: 'Yuji Syuku', kurenaido: 'Zen Kurenaido', kaushan: 'Kaushan Script', none: 'Same as headings' },
  },
  body: {
    label: 'Body',
    options: { zenkaku: 'Zen Kaku Gothic New', jost: 'Jost' },
  },
} as const

type Role = keyof typeof roles
type Choice = Record<Role, string>

function initial(): Choice {
  const params = new URLSearchParams(window.location.search)
  const pick = (role: Role) => {
    const choices = Object.keys(roles[role].options)
    let saved: string | null = null
    try {
      saved = localStorage.getItem(`look-${role}`)
    } catch {
      // Storage can be blocked; fall back to the recommended choice.
    }
    return choices.find((c) => c === params.get(role)) ?? choices.find((c) => c === saved) ?? choices[0]
  }
  return { heading: pick('heading'), brush: pick('brush'), body: pick('body') }
}

export function FontSwitcher() {
  const [choice, setChoice] = useState(initial)

  useEffect(() => {
    const root = document.documentElement
    for (const role of Object.keys(roles) as Role[]) {
      const first = Object.keys(roles[role].options)[0]
      if (choice[role] === first) delete root.dataset[role]
      else root.dataset[role] = choice[role]
    }
  }, [choice])

  const choose = (role: Role, value: string) => {
    setChoice((c) => ({ ...c, [role]: value }))
    try {
      localStorage.setItem(`look-${role}`, value)
    } catch {
      // Not remembered; that's fine.
    }
  }

  return (
    <div className="font-switcher">
      {(Object.keys(roles) as Role[]).map((role) => (
        <div key={role} role="group" aria-label={roles[role].label}>
          <span className="switcher-label">{roles[role].label}</span>
          {Object.entries(roles[role].options).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={choice[role] === value} onClick={() => choose(role, value)}>
              {label}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
