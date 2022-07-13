export const Stats = ({
  stats,
}: {
  stats: { header: string; value: string }[]
}) => {
  return (
    <div className="flex w-fit rounded-lg bg-dark-6 py-2 text-[10px]">
      {stats?.map((stat, i) => (
        <div key={stat.header}>
          <div
            key={stat.header}
            className="flex w-[90px] flex-col items-center gap-[1px] bg-medium-4"
          >
            <div>{stat.header}</div>
            <div className="text-light-0">{stat.value}</div>
          </div>
          {i < stats.length - 1 && (
            <div className="h-40px my-[2px] w-[1px] bg-medium-4"></div>
          )}
        </div>
      ))}
    </div>
  )
}
