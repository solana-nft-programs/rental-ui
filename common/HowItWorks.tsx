import { css } from '@emotion/react'
import { MoneyGlow, MoneyGlowSecondary } from 'assets/MoneyGlow'
import { RentGlow, RentGlowSecondary } from 'assets/RentGlow'
import { WalletGlow, WalletGlowSecondary } from 'assets/WalletGlow'

import { Glow } from './Glow'

export const HowItWorks = () => {
  return (
    <div className="my-24 px-8 md:px-16">
      {/* <div className="my-12 flex items-center justify-center text-4xl text-light-0">
        How It Works
      </div> */}
      {/* <div className="mx-auto my-24 h-[2px] w-[90%] rounded-lg bg-border"></div> */}
      <div className="mb-10">
        <div className="mb-6 flex justify-center text-center text-4xl text-light-0">
          Renting a Token
        </div>
        <div className="grid w-full grid-cols-1 flex-wrap gap-4  md:grid-cols-3">
          {[
            {
              icon: <RentGlow />,
              header: 'Rent an NFT',
              description:
                'Browse our various collections and rent an NFT at its specified rate in just a few clicks',
            },
            {
              icon: <MoneyGlow />,
              header: 'Access Utility',
              description:
                'Given that the actual NFT sits in your wallet while rented, you can access any utility it provides',
            },
            {
              icon: <WalletGlow />,
              header: 'Extend Duration',
              description:
                "Some rentals are extendable! In many cases, you can optionally pay to extend the rental's duration",
            },
          ].map(({ icon, header, description }) => (
            <div
              key={header}
              className="min-h-80 flex flex-col items-center rounded-3xl bg-white bg-opacity-5 py-12 px-4 xl:px-24"
            >
              <Glow blur={20} scale={3} color={'glow'}>
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
              <div className="my-4 text-center text-3xl text-light-0">
                {header}
              </div>
              <div className="text-center text-medium-3">{description}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-6 mt-20 flex justify-center text-center text-4xl text-light-0">
          Listing a Token
        </div>
        <div className="grid w-full grid-cols-1 flex-wrap gap-4  md:grid-cols-3">
          {[
            {
              icon: <RentGlowSecondary />,
              header: 'List your NFT',
              description:
                'Specify a price and rental parameters like expiration, duration or rate and list your NFT for rent',
            },
            {
              icon: <MoneyGlowSecondary />,
              header: 'Earn Passive Income',
              description:
                'Users can pay to hold your NFT until it is securely returned back to you at the end of the rental period',
            },
            {
              icon: <WalletGlowSecondary />,
              header: 'Automatic Relisting',
              description:
                'Rentals are automatically relisted by default until a lister-specified max expiration is reached.',
            },
          ].map(({ icon, header, description }) => (
            <div
              key={header}
              className="min-h-80 flex flex-col items-center rounded-3xl bg-white bg-opacity-5 py-12 px-4 xl:px-24"
            >
              <Glow blur={20} scale={3} color={'accent'}>
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl p-3"
                  css={css`
                    background: linear-gradient(
                      180deg,
                      rgba(251, 192, 147, 0.25) 0%,
                      rgba(184, 95, 255, 0) 100%
                    );
                    box-shadow: 0px 0px 0px 3px rgba(255, 255, 255, 0.1) inset;
                  `}
                >
                  {icon}
                </div>
              </Glow>
              <div className="my-4 text-center text-3xl text-light-0">
                {header}
              </div>
              <div className="text-center text-medium-3">{description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
