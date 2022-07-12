import { CONFIG } from './Color'

export const Stats = ({
  stats,
}: {
  stats: { header: string; value: string }[]
}) => {
  return (
    <div
      className="flex w-fit rounded-lg py-2 text-[10px]"
      style={{
        background: CONFIG.colors['dark-6'],
      }}
    >
      {stats?.map((stat, i) => (
        <div key={stat.header}>
          <div
            key={stat.header}
            className="flex w-[90px] flex-col items-center gap-[1px]"
          >
            <div style={{ color: CONFIG.colors['medium-4'] }}>
              {stat.header}
            </div>
            <div style={{ color: CONFIG.colors['light-0'] }}>{stat.value}</div>
          </div>
          {i < stats.length - 1 && (
            <div
              className="h-40px my-[2px] w-[1px]"
              style={{ background: CONFIG.colors['medium-4'] }}
            ></div>
          )}
        </div>
      ))}
    </div>
  )
}
