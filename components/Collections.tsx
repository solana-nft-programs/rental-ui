import { TokensOuter } from 'common/NFT'
import { NFTPlaceholder } from 'common/NFTPlaceholder'
import { projectConfigs } from 'config/config'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import React from 'react'

export const Collections = ({ setTab }: { setTab: (s: string) => void }) => {
  const { setProjectConfig } = useProjectConfig()
  return (
    <div className="container mx-auto">
      <TokensOuter>
        {!projectConfigs ? (
          <>
            <NFTPlaceholder />
            <NFTPlaceholder />
            <NFTPlaceholder />
            <NFTPlaceholder />
            <NFTPlaceholder />
            <NFTPlaceholder />
          </>
        ) : projectConfigs ? (
          Object.entries(projectConfigs).map(
            ([k, config]) =>
              k !== 'default' && (
                <div
                  key={k}
                  className={`flex h-[200px] w-[200px] cursor-pointer items-center justify-center bg-[#282A2E] p-5`}
                  onClick={() => {
                    setProjectConfig(k)
                  }}
                >
                  <img src={config.logoImage} alt={config.name} />
                </div>
              )
          )
        ) : (
          <div className="white flex w-full flex-col items-center justify-center gap-1">
            <div className="text-white">No configs!</div>
          </div>
        )}
      </TokensOuter>
    </div>
  )
}
