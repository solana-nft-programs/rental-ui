import type { Badge } from 'config/config'

export type Props = {
  header: string | JSX.Element
  subHeader?: string | JSX.Element
  badge?: Badge
  hero?: JSX.Element
  content?: JSX.Element
}

export const Card: React.FC<Props> = ({
  header,
  subHeader,
  badge,
  hero,
  content,
  ...props
}: Props) => {
  return (
    <div
      {...props}
      className="relative flex flex-col gap-2 rounded-lg border-[1px] border-border bg-white bg-opacity-5 p-4"
    >
      {badge && (
        <div className="absolute right-6 top-6 rounded-md bg-dark-5 px-2 py-1 text-sm">
          {
            {
              recent: <span className="text-primary">👋 Recently listed</span>,
              trending: <span className="text-primary">🔥 Trending</span>,
            }[badge]
          }
        </div>
      )}
      <div className="aspect-square w-full overflow-hidden rounded-lg">
        {hero}
      </div>
      <div className="text-lg text-white">{header}</div>
      {subHeader && <div className="text-lg text-primary">{subHeader}</div>}
      <div>{content && content}</div>
    </div>
  )
}
