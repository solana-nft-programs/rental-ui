import { Header } from 'common/Header'
import type { ProjectConfig } from 'config/config'
import { projectConfigs } from 'config/config'
import { lighten } from 'polished'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import React from 'react'
import { AiFillPlusCircle } from 'react-icons/ai'

export const Collections = () => {
  const { setProjectConfig, config } = useProjectConfig()

  const categories = Object.entries(projectConfigs).reduce(
    (acc, [, config]) => {
      if (config.hidden) return acc
      return {
        ...acc,
        [config.type]: [...(acc[config.type] || []), config],
      }
    },
    {} as { [type: string]: ProjectConfig[] }
  )

  return (
    <>
      <Header />
      <div className="container mx-auto mt-10 px-10 md:px-0">
        {Object.entries(categories).map(([type, configs], i) => (
          <div key={type}>
            {i > 0 && (
              <div className="mx-auto mt-10 mb-10 h-[2px] w-[90%] rounded-lg bg-gray-500 opacity-50"></div>
            )}
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
              {i === 0 && (
                <div
                  key={config.name}
                  style={{ background: lighten(0.07, 'rgb(26, 27, 32)') }}
                  className={`flex h-[200px] min-w-[200px] cursor-pointer flex-col items-center justify-center rounded-xl p-10 shadow-2xl transition-all duration-200 hover:scale-[1.02]`}
                  onClick={() => {
                    window.open('https://forms.gle/7K1EQ9SWGE93sWHUA')
                  }}
                >
                  <AiFillPlusCircle color="#E5E5E5" className="h-20 w-20" />
                  <p className="mt-2 text-white">Add Your Collection</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
