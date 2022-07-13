export const Card = ({
  header,
  subHeader,
  badge,
  hero,
  content,
}: {
  header: string
  subHeader?: string
  badge?: 'recent' | 'trending'
  hero?: JSX.Element
  content?: JSX.Element
}) => {
  return (
    <div
      className="relative flex w-[200px] flex-col rounded-lg bg-white bg-opacity-5 p-2"
      style={{
        border: '1px solid rgba(221, 218, 218, 0.2)',
      }}
    >
      {badge && (
        <div className="absolute right-4 top-4 rounded-md bg-dark-5 px-2 py-1 text-[8px]">
          {
            {
              recent: <span className="text-primary">👋 Recently listed</span>,
              trending: <span className="text-primary">🔥 Trending</span>,
            }[badge]
          }
        </div>
      )}
      <div className="mb-2 h-[182px] w-[182px] overflow-hidden rounded-lg">
        {hero}
      </div>
      <div className="text-xs text-white">{header}</div>
      <div className="text-xs text-primary">{subHeader}</div>
      <div className="mt-2">{content && content}</div>
    </div>
  )
}
