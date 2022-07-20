import { css } from '@emotion/react'
import { GlyphPlus } from 'assets/GlyphPlus'
import { MoneyGlow } from 'assets/MoneyGlow'
import { RentGlow } from 'assets/RentGlow'
import { WalletGlow } from 'assets/WalletGlow'
import { Card } from 'common/Card'
import { FooterSlim } from 'common/FooterSlim'
import { Glow } from 'common/Glow'
import { HeaderSlim } from 'common/HeaderSlim'
import { Stats } from 'common/Stats'
import type { ProjectConfig } from 'config/config'
import { projectConfigs } from 'config/config'
import { queryId, useGlobalStats } from 'hooks/useGlobalStats'
import { useRouter } from 'next/router'
import { lighten, transparentize } from 'polished'

export const Collections = () => {
  const router = useRouter()
  const stats = useGlobalStats()

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
        <HeaderSlim />
        <div className="flex flex-wrap justify-between gap-10 px-16 py-28">
          <Glow angle={130} scale={1.5}>
            <div className="flex flex-col gap-2">
              <div className="text-5xl text-light-0">Marketplace</div>
              <div className="text-lg text-medium-3">
                Let your NFTs generate revenue and RENT
                <br /> NFTs temporarily!
              </div>
            </div>
          </Glow>
          <div className="flex flex-col items-end justify-end gap-5 ">
            <div className="flex items-center gap-6">
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
                <GlyphPlus />
              </div>
            </div>
            <div className="flex w-fit gap-3 rounded-xl border-[2px] border-border p-4">
              <div className="flex gap-2">
                <div className="text-medium-3">Total rentals</div>
                <div className="text-light-0">
                  {stats.data &&
                  stats.data[queryId('global', true)]?.aggregate.count ? (
                    stats.data[queryId('global', true)]!.aggregate.count
                  ) : (
                    <div className="mt-[1px] h-5 w-12 animate-pulse rounded-md bg-border" />
                  )}
                </div>
              </div>
              <div className="w-[2px] bg-border"></div>
              <div className="flex gap-2">
                <div className="text-medium-3">Listed rentals</div>
                <div className="text-light-0">
                  {stats.data &&
                  stats.data[queryId('global', false)]?.aggregate.count ? (
                    stats.data[queryId('global', false)]!.aggregate.count
                  ) : (
                    <div className="mt-[1px] h-5 w-12 animate-pulse rounded-md bg-border" />
                  )}
                </div>
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
                  className="bg-opacity-1 cursor-pointer transition-colors"
                  css={css`
                    &:hover {
                      background: ${transparentize(
                        0.7,
                        lighten(0.07, config.colors.main)
                      )};
                    }
                  `}
                  onClick={() =>
                    router.push(`/${config.name}${location.search}`)
                  }
                >
                  <Card
                    badges={config.badges}
                    hero={
                      <div
                        className="flex h-full w-full items-center justify-center p-12"
                        css={css`
                          background: ${lighten(0.07, config.colors.main)};
                        `}
                      >
                        <img
                          className="max-h-full rounded-xl"
                          src={config.logoImage}
                          alt={config.name}
                        />
                      </div>
                    }
                    header={config.displayName}
                    content={
                      <Stats
                        stats={[
                          {
                            header: 'Total rentals',
                            value:
                              stats.data &&
                              stats.data[queryId(config.name, true)]?.aggregate
                                .count !== undefined ? (
                                stats.data[
                                  queryId(config.name, true)
                                ]!.aggregate.count.toString()
                              ) : (
                                <div className="mt-1 h-5 w-12 animate-pulse rounded-md bg-border" />
                              ),
                          },
                          {
                            header: 'Listed rentals',
                            value:
                              stats.data &&
                              stats.data[queryId(config.name, false)]?.aggregate
                                .count !== undefined ? (
                                stats.data[
                                  queryId(config.name, false)
                                ]!.aggregate.count.toString()
                              ) : (
                                <div className="mt-1 h-5 w-12 animate-pulse rounded-md bg-border" />
                              ),
                          },
                        ]}
                      />
                    }
                  ></Card>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="my-40 px-2 md:px-12">
        <div className="my-12 flex items-center justify-center text-4xl text-light-0">
          How it Works
        </div>
        <div className="grid w-full grid-cols-1 flex-wrap gap-4 px-10 md:grid-cols-3">
          {[
            {
              icon: <WalletGlow />,
              header: 'Connect wallet',
              description:
                'Connect the Solana wallet of your choice by clicking the wallet icon in the top right corner',
            },
            {
              icon: <RentGlow />,
              header: 'Rent NFT',
              description:
                'Browse the collection and buy the NFT you want in a few clicks',
            },
            {
              icon: <MoneyGlow />,
              header: 'Generate revenue',
              description:
                'Set time based expiry or rate at which users can pay your to hold your NFT until it is securely returned back to you',
            },
          ].map(({ icon, header, description }) => (
            <div
              key={header}
              className="min-h-80 flex flex-col items-center rounded-3xl bg-dark-6 py-12 px-4 xl:px-24"
            >
              <Glow blur={20} scale={3}>
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl p-3"
                  css={css`
                    background: linear-gradient(
                      180deg,
                      rgba(184, 95, 255, 0.25) 0%,
                      rgba(184, 95, 255, 0) 100%
                    );
                    box-shadow: 0px 0px 0px 3px rgba(255, 255, 255, 0.1) inset;
                  `}
                >
                  {icon}
                </div>
              </Glow>
              <div className="my-4 text-3xl text-light-0">{header}</div>
              <div className="text-center text-medium-3">{description}</div>
            </div>
          ))}
        </div>
      </div>
      <FooterSlim />
    </div>
  )
}
