import { css } from '@emotion/react'
import { GlyphPlus } from 'assets/GlyphPlus'
import { queryId, useGlobalStats } from 'hooks/useGlobalStats'

import { HeaderSlim } from './HeaderSlim'

export const RentalHero = () => {
  const stats = useGlobalStats()
  return (
    <div
      className="relative z-0"
      css={css`
        background: linear-gradient(180deg, #140a51 0%, #0b0b0b 100%);
      `}
    >
      <div className="blur-4xl absolute left-8 top-52 -z-10 h-[120px] w-[400px] -rotate-[60deg] bg-glow blur-[100px]" />
      <div className="blur-4xl absolute -right-20 top-72 -z-10 h-[100px] w-[550px] -rotate-[60deg] bg-glow blur-[120px]" />
      <HeaderSlim />
      <div className="flex flex-wrap justify-between gap-10 px-8 py-24 text-sm md:px-16">
        <div className="flex flex-col gap-2">
          <div className="text-5xl text-light-0">NFT Rental Marketplace</div>
          <div className="text-lg text-medium-3">
            The first NFT Rental Marketplace on Solana. <br />
            Hold the <b>actual NFT</b> and access its utility for the duration
            rented.
          </div>
        </div>
        <div className="flex flex-col items-end justify-end gap-5 ">
          <div className="flex items-center gap-2 lg:gap-6">
            <div className="text-lg text-medium-3">
              Are you a collection owner?
            </div>
            <div
              className="flex cursor-pointer items-center gap-1 rounded-lg bg-primary p-3 text-light-0 transition-colors hover:bg-primary-hover"
              onClick={() => {
                window.open('https://forms.gle/63hjWaSdSzbGmXzJ6')
              }}
            >
              <>Add your collection</>
              <GlyphPlus />
            </div>
          </div>
          <div className="flex w-fit gap-3 rounded-xl border-[2px] border-border p-4">
            <div className="flex items-center gap-2">
              <div className="text-medium-3">Total rentals</div>
              <div className="text-light-0">
                {stats.isFetching ? (
                  <div className="mt-[1px] h-5 w-12 animate-pulse rounded-md bg-border" />
                ) : stats.data &&
                  stats.data[queryId('global', true)]?.aggregate.count ? (
                  stats.data[
                    queryId('global', true)
                  ]!.aggregate.count.toLocaleString('en-US')
                ) : (
                  '65k+'
                )}
              </div>
            </div>
            <div className="w-[2px] bg-border"></div>
            <div className="flex items-center gap-2">
              <div className="text-medium-3">Listed rentals</div>
              <div className="text-light-0">
                {stats.isFetching ? (
                  <div className="mt-[1px] h-5 w-12 animate-pulse rounded-md bg-border" />
                ) : stats.data &&
                  stats.data[queryId('global', false)]?.aggregate.count ? (
                  stats.data[
                    queryId('global', false)
                  ]!.aggregate.count.toLocaleString('en-US')
                ) : (
                  '15k+'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
