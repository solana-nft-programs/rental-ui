import { NFTPlaceholder } from 'common/NFTPlaceholder'
import type { ProjectConfig } from 'config/config'
import { projectConfigs } from 'config/config'
import { lighten } from 'polished'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import React from 'react'

export const Collections = ({ setTab }: { setTab: (s: string) => void }) => {
  const { setProjectConfig } = useProjectConfig()

  const categories = Object.entries(projectConfigs).reduce(
    (acc, [k, config]) => {
      if (config.name === 'default' || config.name === 'vault') return acc
      return {
        ...acc,
        [config.type]: [...(acc[config.type] || []), config],
      }
    },
    {} as { [type: string]: ProjectConfig[] }
  )

  return (
    <div className="container mx-auto px-5">
      {!projectConfigs ? (
        <div className="grid grid-cols-4 flex-wrap gap-4">
          <NFTPlaceholder />
          <NFTPlaceholder />
          <NFTPlaceholder />
          <NFTPlaceholder />
          <NFTPlaceholder />
          <NFTPlaceholder />
        </div>
      ) : projectConfigs ? (
        Object.entries(categories).map(([type, configs]) => (
          <div key={type}>
            <div className="mt-10 mb-5 text-lg font-semibold text-white">
              {/* {type} */}
            </div>
            <div className="grid grid-cols-1 flex-wrap gap-4 md:grid-cols-3 lg:grid-cols-4">
              {configs.map((config) => (
                <div
                  key={config.name}
                  style={{ background: lighten(0.07, config.colors.main) }}
                  className={`flex h-[200px] min-w-[200px] cursor-pointer items-center justify-center rounded-xl p-10 shadow-2xl transition-all duration-200 hover:scale-[1.02]`}
                  onClick={() => {
                    setProjectConfig(config.name)
                  }}
                >
                  <img
                    className="max-h-full"
                    src={config.logoImage}
                    alt={config.name}
                  />
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="white flex w-full flex-col items-center justify-center gap-1">
          <div className="text-white">No configs!</div>
        </div>
      )}
    </div>
  )
}
