import type { Badge } from 'config/config'

export type Props = {
  header?: string | JSX.Element
  subHeader?: string | JSX.Element
  badge?: Badge
  hero?: JSX.Element
  content?: JSX.Element
  placeholder?: boolean
}

export const Card: React.FC<Props> = ({
  header,
  subHeader,
  badge,
  hero,
  content,
  placeholder,
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
        {placeholder ? (
          <div className="h-full w-[280px] animate-pulse bg-border"></div>
        ) : (
          hero
        )}
      </div>
      {header && (
        <div className="text-lg text-white">
          {placeholder ? (
            <div className="h-6 w-[65%] animate-pulse rounded-md bg-border"></div>
          ) : (
            header
          )}
        </div>
      )}
      {subHeader && (
        <div className="text-lg text-primary">
          {placeholder ? (
            <div className="h-6 w-[40%] animate-pulse rounded-md bg-border"></div>
          ) : (
            subHeader
          )}
        </div>
      )}
      {content && (
        <div>
          {placeholder ? (
            <div className="h-8 w-full animate-pulse rounded-md bg-border"></div>
          ) : (
            content
          )}
        </div>
      )}
    </div>
  )
}
