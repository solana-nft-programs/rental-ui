import { css } from '@emotion/react'
import { Plus } from 'assets/plus'
import { WalletGlyph } from 'assets/wallet'
import { ButtonSmall } from 'common/ButtonSmall'
import { Glow } from 'common/Glow'
import type { ProjectConfig } from 'config/config'
import { projectConfigs } from 'config/config'
import { lighten } from 'polished'
import { useProjectConfig } from 'providers/ProjectConfigProvider'

export const Collections = () => {
  const { setProjectConfig } = useProjectConfig()

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
    <div className="bg-[#0B0B0B]">
      <div
        css={css`
          background: linear-gradient(180deg, #140a51 0%, #0b0b0b 100%);
        `}
      >
        <div className="w-full px-4 py-4">
          <div className="flex justify-between rounded-xl bg-white bg-opacity-5 py-4 px-8">
            <div className="flex items-center">
              <img
                alt="Cardinal logo"
                className="inline-block h-6"
                src="./cardinal-crosshair.svg"
              />
              <span className="ml-2 text-2xl text-white">Cardinal</span>
            </div>
            <ButtonSmall>
              <>
                <WalletGlyph />
                <>Connect wallet</>
              </>
            </ButtonSmall>
          </div>
        </div>
        <div className="flex justify-between px-10 py-28">
          <Glow angle={130}>
            <div className="flex flex-col gap-2">
              <div className="text-5xl text-light-0">Marketplace</div>
              <div className="text-lg text-medium-3">
                Let your NFTs generate revenue and RENT
                <br /> NFTs temporarily!
              </div>
            </div>
          </Glow>
          <div className="flex flex-col items-end justify-end gap-3 ">
            <div className="flex items-center gap-4">
              <div className="text-lg text-medium-3">
                Are you a product owner?
              </div>
              <div
                className="flex cursor-pointer items-center gap-1 rounded-lg bg-primary p-3 text-light-0 transition-colors hover:bg-primary-hover"
                onClick={() => {
                  window.open('https://forms.gle/7K1EQ9SWGE93sWHUA')
                }}
              >
                <>Add your collection</>
                <Plus />
              </div>
            </div>
            <div className="flex w-fit gap-3 rounded-xl border-[2px] border-border p-4">
              <div>
                <span className="text-medium-3">Volume </span>
                <span className="text-light-0">1,234 USDC</span>
              </div>
              <div className="w-[2px] bg-border"></div>
              <div>
                <span className="text-medium-3">Total rentals </span>
                <span className="text-light-0">1,244</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-10 md:px-0">
        {Object.entries(categories).map(([type, configs], i) => (
          <div key={type}>
            {i > 0 && (
              <div className="mx-auto mt-10 mb-10 h-[2px] w-[90%] rounded-lg bg-border"></div>
            )}
            <div className="grid grid-cols-1 flex-wrap gap-4 md:grid-cols-3 lg:grid-cols-4">
              {configs.map((config) => (
                <div
                  key={config.name}
                  style={{ background: lighten(0.07, config.colors.main) }}
                  className={`flex h-[300px] min-w-[200px] cursor-pointer items-center justify-center rounded-xl p-10 shadow-2xl transition-all duration-200 hover:scale-[1.02]`}
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
        ))}
      </div>
    </div>
  )
}
