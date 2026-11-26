import { useEffect, useState } from 'react'

import { SITES } from './config/sites'
import { COPY, type Lang } from './content'

const STORAGE_KEY = 'fish-admin-landing-lang'

type CardId = 'reactDocs' | 'vueDocs' | 'reactDemo' | 'vueDemo'

function readLang(): Lang {
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'en' || saved === 'zh') return saved
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

function Arrow() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M7 17 17 7M9 7h8v8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function CardIcon({ id }: { id: CardId }) {
  const common = {
    'aria-hidden': true,
    className: 'size-5',
    fill: 'none',
    viewBox: '0 0 24 24',
  } as const
  if (id === 'reactDocs') {
    return (
      <svg {...common}>
        <path
          d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21.5v-16Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
        <path d="M5 18.5A2.5 2.5 0 0 1 7.5 16H19" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    )
  }
  if (id === 'vueDocs') {
    return (
      <svg {...common}>
        <path
          d="m12 4 8 14H4L12 4Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
        <path
          d="m12 10 4 8H8l4-8Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
      </svg>
    )
  }
  if (id === 'reactDemo') {
    return (
      <svg {...common}>
        <rect height="14" rx="2" stroke="currentColor" strokeWidth="1.6" width="18" x="3" y="5" />
        <path d="M3 9h18M8 5v4" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <rect height="16" rx="2" stroke="currentColor" strokeWidth="1.6" width="18" x="3" y="4" />
      <path d="M7 9h4v4H7zM15 9h2M15 13h2M7 17h10" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export default function App() {
  const [lang, setLang] = useState<Lang>(readLang)
  const copy = COPY[lang]

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
    window.localStorage.setItem(STORAGE_KEY, lang)
  }, [lang])

  const cards: Array<{
    id: CardId
    label: string
    title: string
    description: string
    meta: string
    href: string
  }> = [
    {
      id: 'reactDocs',
      label: copy.componentsLabel,
      title: copy.cards.reactDocs.title,
      description: copy.cards.reactDocs.description,
      meta: copy.cards.reactDocs.meta,
      href: lang === 'zh' ? SITES.reactDocs.zhComponents : SITES.reactDocs.components,
    },
    {
      id: 'vueDocs',
      label: copy.componentsLabel,
      title: copy.cards.vueDocs.title,
      description: copy.cards.vueDocs.description,
      meta: copy.cards.vueDocs.meta,
      href: lang === 'zh' ? SITES.vueDocs.zhComponents : SITES.vueDocs.components,
    },
    {
      id: 'reactDemo',
      label: copy.templateLabel,
      title: copy.cards.reactDemo.title,
      description: copy.cards.reactDemo.description,
      meta: copy.cards.reactDemo.meta,
      href: SITES.reactDemo,
    },
    {
      id: 'vueDemo',
      label: copy.templateLabel,
      title: copy.cards.vueDemo.title,
      description: copy.cards.vueDemo.description,
      meta: copy.cards.vueDemo.meta,
      href: SITES.vueDemo,
    },
  ]

  return (
    <div className="landing min-h-dvh">
      <a className="skip-link" href="#main">
        {copy.skip}
      </a>

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <a className="flex items-center gap-2.5 font-semibold tracking-tight" href="#top">
            <span className="brand-mark" aria-hidden="true">
              F
            </span>
            <span>{copy.brand}</span>
          </a>
          <nav className="flex items-center gap-1 text-sm" aria-label={copy.brand}>
            <a className="nav-link hidden sm:inline-flex" href={SITES.reactDocs.home}>
              {copy.navDocs}
            </a>
            <a className="nav-link hidden sm:inline-flex" href={SITES.vueDocs.home}>
              {copy.navVue}
            </a>
            <a
              className="nav-link hidden sm:inline-flex"
              href={SITES.github}
              rel="noreferrer"
              target="_blank"
            >
              {copy.navGithub}
            </a>
            <div
              aria-label={lang === 'en' ? 'Language' : '语言'}
              className="ml-2 inline-flex rounded-full border border-border bg-card p-0.5"
              role="group"
            >
              {(['en', 'zh'] as const).map((value) => (
                <button
                  aria-pressed={lang === value}
                  className={`lang-button ${lang === value ? 'lang-button--active' : ''}`}
                  key={value}
                  onClick={() => setLang(value)}
                  type="button"
                >
                  {value === 'en' ? 'EN' : '中文'}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="hero" id="top">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-5 pt-14 pb-16 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-20 lg:pb-24">
            <div>
              <p className="eyebrow">{copy.eyebrow}</p>
              <h1 className="mt-5 text-4xl leading-[1.06] font-semibold tracking-[-0.035em] text-balance sm:text-5xl lg:text-6xl">
                {copy.title}
                <br />
                <span className="accent-text">{copy.titleAccent}</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                {copy.intro}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a className="button button--primary" href={SITES.reactDocs.components}>
                  {copy.ctaPrimary}
                  <Arrow />
                </a>
                <a className="button button--ghost" href={SITES.vueDocs.components}>
                  {copy.ctaSecondary}
                  <Arrow />
                </a>
              </div>
              <p className="mt-5 text-xs text-muted-foreground">{copy.heroNote}</p>
            </div>

            <div className="hero-visual" aria-hidden="true">
              <div className="frame frame--back">
                <div className="frame__bar">
                  <span className="frame__dot" />
                  <span className="frame__dot" />
                  <span className="frame__dot" />
                  <span className="frame__label">Vue 3.5</span>
                </div>
                <img alt="" src="/screenshots/vue-dashboard.png" />
              </div>
              <div className="frame frame--front">
                <div className="frame__bar">
                  <span className="frame__dot" />
                  <span className="frame__dot" />
                  <span className="frame__dot" />
                  <span className="frame__label">React 19</span>
                </div>
                <img alt="" src="/screenshots/react-dashboard.png" />
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-6xl px-5 pb-14 sm:px-8">
            <dl className="stats">
              {copy.stats.map((stat) => (
                <div className="stat" key={stat.label}>
                  <dt className="stat__label">{stat.label}</dt>
                  <dd className="stat__value">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{copy.stackTitle}</h2>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">{copy.stackNote}</p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {cards.map((card, index) => (
              <a className={`stack-card stack-card--${card.id}`} href={card.href} key={card.id}>
                <div className="stack-card__top">
                  <span className="stack-card__icon">
                    <CardIcon id={card.id} />
                  </span>
                  <span className="stack-card__index">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <p className="stack-card__label">{card.label}</p>
                <h3 className="stack-card__title">{card.title}</h3>
                <p className="stack-card__description">{card.description}</p>
                <div className="stack-card__footer">
                  <span className="stack-card__meta">{card.meta}</span>
                  <span className="stack-card__open">
                    {copy.open}
                    <Arrow />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="install-band">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {copy.installTitle}
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
                {copy.installNote}
              </p>
              <p className="security-note">{copy.security}</p>
            </div>
            <div className="grid gap-4">
              <a
                className="code-row"
                href="https://www.npmjs.com/package/@fish-admin/react"
                rel="noreferrer"
                target="_blank"
              >
                <span className="code-row__stack">React</span>
                <code>npm install @fish-admin/react</code>
                <span className="code-row__version">0.2.3</span>
              </a>
              <a
                className="code-row"
                href="https://www.npmjs.com/package/@fish-admin/vue"
                rel="noreferrer"
                target="_blank"
              >
                <span className="code-row__stack">Vue</span>
                <code>npm install @fish-admin/vue</code>
                <span className="code-row__version">1.0.1</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5 font-semibold tracking-tight">
              <span className="brand-mark" aria-hidden="true">
                F
              </span>
              {copy.brand}
            </div>
            <p className="mt-3 max-w-xs text-xs leading-5 text-muted-foreground">
              {copy.footerNote}
            </p>
          </div>
          <div>
            <p className="footer-heading">{copy.footerDocs}</p>
            <a className="footer-link" href={SITES.reactDocs.home}>
              React docs
            </a>
            <a className="footer-link" href={SITES.vueDocs.home}>
              Vue docs
            </a>
          </div>
          <div>
            <p className="footer-heading">{copy.footerTemplates}</p>
            <a className="footer-link" href={SITES.reactDemo}>
              React template
            </a>
            <a className="footer-link" href={SITES.vueDemo}>
              Vue template
            </a>
          </div>
          <div>
            <p className="footer-heading">{copy.footerRepo}</p>
            <a className="footer-link" href={SITES.github} rel="noreferrer" target="_blank">
              GitHub
            </a>
            <a
              className="footer-link"
              href="https://www.npmjs.com/package/@fish-admin/react"
              rel="noreferrer"
              target="_blank"
            >
              npm
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
