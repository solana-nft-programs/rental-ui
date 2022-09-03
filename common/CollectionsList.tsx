import { logEvent } from '@amplitude/analytics-browser'
import { css } from '@emotion/react'
import type { ProjectConfig } from 'config/config'
import { queryId, useGlobalStats } from 'hooks/useGlobalStats'
import { useRouter } from 'next/router'
import { transparentize } from 'polished'
import { useState } from 'react'
import { BiChevronDown } from 'react-icons/bi'

import { SocialIcon } from './Socials'

export const CollectionsList = ({ configs }: { configs: ProjectConfig[] }) => {
  const router = useRouter()
  const stats = useGlobalStats()
  const [sort, setSort] = useState<'total' | 'listed'>()

  return (
    <div className="w-full overflow-x-scroll overflow-y-scroll rounded-xl border border-border p-4">
      <div className="flex w-full min-w-fit flex-col">
        <div className="flex w-full gap-4 rounded-xl bg-dark-4 px-8 py-2">
          <div className="flex-[4]">Collection</div>
          <div
            className="flex flex-1 cursor-pointer items-center"
            onClick={() => setSort('total')}
          >
            <div>Total rentals</div>
            {sort === 'total' && <BiChevronDown />}
          </div>
          <div
            className="flex flex-1 cursor-pointer items-center"
            onClick={() => setSort('listed')}
          >
            <div>Listed rentals</div>
            {sort === 'listed' && <BiChevronDown />}
          </div>
          <div className="flex-1">Links</div>
        </div>
        <div className="flex flex-col">
          {configs
            .sort((a, b) =>
              stats.data && sort
                ? stats.data[queryId(a.name, sort === 'total')]!.aggregate
                    .count -
                  stats.data[queryId(b.name, sort === 'total')]!.aggregate.count
                : 0
            )
            .map((config) => (
              <div
                key={`${config.name}`}
                className="flex w-full cursor-pointer gap-4 rounded-xl border-b border-border px-8 py-4 md:flex-row"
                css={css`
                  &:hover {
                    background: ${transparentize(0.9, config.colors.glow)};
                  }
                `}
                onClick={() => {
                  logEvent('marketplace: click collection', {
                    id: config.name,
                    name: config.displayName,
                    type: config.type,
                  })
                  router.push(`/${config.name}${location.search}`)
                }}
              >
                <div className="min-w-fit flex-[4]">
                  <div className="flex items-center gap-5 md:flex-row">
                    <img
                      className={`h-full max-h-[50px] max-w-[150px] rounded-xl ${
                        config.logoPadding && 'p-3'
                      }`}
                      src={config.logoImage}
                      alt={config.name}
                    />
                    <div className="min-w-[100px]">{config.displayName}</div>
                  </div>
                </div>

                <div className="my-auto flex-1">
                  {stats.data &&
                  !!stats.data[queryId(config.name, true)]?.aggregate.count ? (
                    <div>
                      {stats.data[
                        queryId(config.name, true)
                      ]!.aggregate.count.toString()}
                    </div>
                  ) : (
                    <div className="mt-1 h-5 w-12 animate-pulse rounded-md bg-border" />
                  )}
                </div>
                <div className="my-auto flex-1">
                  {stats.data &&
                  !!stats.data[queryId(config.name, false)]?.aggregate.count ? (
                    <div>
                      {stats.data[
                        queryId(config.name, false)
                      ]!.aggregate.count.toString()}
                    </div>
                  ) : (
                    <div className="mt-1 h-5 w-12 animate-pulse rounded-md bg-border" />
                  )}
                </div>
                <div className="my-auto flex-1">
                  <div className="flex gap-4 text-light-0">
                    {config.socialLinks?.map(({ icon, link }, i) => {
                      return (
                        <a
                          key={i}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className={`cursor-pointer text-xl text-light-0 transition-all duration-300 hover:text-primary`}
                          css={css`
                            &:hover {
                              color: ${config.colors.accent} !important;
                            }
                          `}
                        >
                          <SocialIcon iconKey={icon} />
                        </a>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
