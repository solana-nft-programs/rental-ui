import type { TokenData } from 'api/api'
import { GlyphCheck } from 'assets/GlyphCheck'
import { Glow } from 'common/Glow'
import { Pill } from 'common/Pill'
import {
  ShareTwitterButton,
  shareTwitterListedLink,
} from 'common/ShareTwitterButton'
import { getQueryParam, transactionUrl } from 'common/utils'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { FaTwitter } from 'react-icons/fa'
import { PoweredByFooter } from 'rental-components/common/PoweredByFooter'

import type { TxResult } from './RentalIssueCard'

export type RentalIssueSuccessCard = {
  tokenDatas: TokenData[]
  txResults: TxResult[]
}

export const RentalIssueSuccessCard = ({
  tokenDatas,
  txResults,
}: RentalIssueSuccessCard) => {
  const { environment } = useEnvironmentCtx()
  const { config } = useProjectConfig()
  return (
    <div className="relative rounded-lg bg-dark-6 p-8">
      <div className="absolute right-12 top-6 text-5xl">🎉</div>
      <div className="absolute left-8 top-[40%] z-10 text-5xl">🎉</div>
      <div className="absolute right-4 top-[60%] z-10 text-6xl">🎉</div>
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
        <Glow
          color="secondary"
          blur={5}
          scale={15}
          opacity={1}
          className="rounded-full"
        >
          <GlyphCheck />
        </Glow>
      </div>
      <div className="text-center text-2xl text-light-0">Congratulations!</div>
      <div className="mb-6 text-center text-lg text-medium-4">
        You&apos;ve listed{' '}
        {tokenDatas.length > 1
          ? `(${tokenDatas.length})`
          : tokenDatas[0]
          ? tokenDatas[0].metadata?.data.name
          : ''}
      </div>
      <div
        className={
          `flex w-full gap-4 overflow-x-auto pb-12 ` +
          (tokenDatas.length <= 2 ? 'justify-center' : '')
        }
      >
        {txResults.map(({ tokenData, txid }, i) => (
          <div
            key={i}
            className="relative w-1/2 flex-shrink-0 rounded-lg bg-medium-4"
          >
            {tokenData.metadata && tokenData.metadata.data && (
              <img
                className="rounded-lg"
                src={
                  getQueryParam(tokenData.metadata?.data?.image, 'uri') ||
                  tokenData.metadata.data.image
                }
                alt={tokenData.metadata.data.name}
              />
            )}
            {txid && (
              <a
                href={transactionUrl(txid, environment.label)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Pill
                  className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 border-[1px] border-border"
                  onClick={() => {}}
                >
                  View TX
                </Pill>
              </a>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-center">
        <ShareTwitterButton
          className="px-8"
          shareLink={shareTwitterListedLink(txResults, config)}
        >
          <div
            style={{ gap: '5px' }}
            className="flex items-center justify-center text-base"
          >
            <FaTwitter />
            Share on Twitter!
          </div>
        </ShareTwitterButton>
      </div>
      <PoweredByFooter />
    </div>
  )
}
