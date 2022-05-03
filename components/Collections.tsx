import { useWallet } from '@solana/wallet-adapter-react'
import { Header } from 'common/Header'
import { NFTPlaceholder } from 'common/NFTPlaceholder'
import type { ProjectConfig } from 'config/config'
import { projectConfigs } from 'config/config'
import { lighten } from 'polished'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import React from 'react'

export const Collections = ({ setTab }: { setTab: (s: string) => void }) => {
  const { setProjectConfig, config } = useProjectConfig()
  const wallet = useWallet()

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
    <>
      <Header
        // loading={tokenManagers.loaded && tokenManagers.refreshing}
        tabs={[
          {
            name: 'Wallet',
            anchor: wallet.publicKey?.toBase58() || 'wallet',
            disabled: !wallet.connected,
          },
          {
            name: 'Manage',
            anchor: 'manage',
            disabled: !wallet.connected || config.disableListing,
          },
          { name: 'Browse', anchor: 'browse' },
        ]}
      />
      <div className="container mx-auto px-10 md:px-0">
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
          Object.entries(categories).map(([type, configs], i) => (
            <div key={type}>
              <div className="mt-10 mb-5 text-lg font-semibold text-white">
                {/* {type} */}
              </div>
              {i > 0 && (
                <div className="mx-auto mb-10 h-[2px] w-[90%] rounded-lg bg-gray-500 opacity-50"></div>
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
              </div>
            </div>
          ))
        ) : (
          <div className="white flex w-full flex-col items-center justify-center gap-1">
            <div className="text-white">No configs!</div>
          </div>
        )}
      </div>
    </>
  )
}
