import { useFrontmatter } from '@rspress/core/runtime'
import { HomeLayout as DefaultHomeLayout, type HomeLayoutProps } from '@rspress/core/theme-original'

export function HomeLayout(props: HomeLayoutProps) {
  const { frontmatter } = useFrontmatter()
  const title = frontmatter.hero?.name ?? 'FishAdmin UI'
  return (
    <main>
      <h1 className="fish-visually-hidden">{title}</h1>
      <DefaultHomeLayout {...props} />
    </main>
  )
}
