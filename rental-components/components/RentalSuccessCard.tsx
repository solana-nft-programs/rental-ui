import { DisplayAddress, useAddressName } from '@cardinal/namespaces-components'
import type { TokenData } from 'api/api'
import { GlyphCheck } from 'assets/GlyphCheck'
import { Glow } from 'common/Glow'
import { Pill } from 'common/Pill'
import { rentalExpirationWithExtension } from 'common/RentalSummary'
import { ShareTwitterButton } from 'common/ShareTwitterButton'
import { getQueryParam, transactionUrl } from 'common/utils'
import { useWalletId } from 'hooks/useWalletId'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useModal } from 'providers/ModalProvider'
import { useUTCNow } from 'providers/UTCNowProvider'
import { FaTwitter } from 'react-icons/fa'
import { PoweredByFooter } from 'rental-components/common/PoweredByFooter'

export type RentalSuccessCardProps = {
  tokenData: TokenData
  extensionSeconds?: number
  txid: string
}

export const RentalSuccessCard = ({
  tokenData,
  extensionSeconds,
  txid,
}: RentalSuccessCardProps) => {
  const { connection, environment } = useEnvironmentCtx()
  const walletId = useWalletId()
  const { durationSeconds } = tokenData.timeInvalidator?.parsed || {}
  const { UTCNow } = useUTCNow()
  const { displayName: issuerName, loadingName } = useAddressName(
    connection,
    tokenData.tokenManager?.parsed.issuer
  )

  return (
    <div className="relative rounded-lg bg-dark-6 p-8">
      <div className="absolute right-12 top-6 text-5xl">🎉</div>
      <div className="absolute left-8 top-[40%] text-5xl">🎉</div>
      <div className="absolute right-4 top-[60%] text-6xl">🎉</div>
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
      <div className="mb-4 text-center text-lg text-medium-4">
        You&apos;ve rented {tokenData.metadata?.data.name}
      </div>
      <div
        className={`mb-4 flex w-full justify-center gap-4 overflow-x-auto pb-6`}
      >
        <div className="relative w-3/4 lg:w-1/2">
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
        </div>
      </div>
      {durationSeconds && (
        <div className="mb-8 px-8 text-center text-base text-medium-3">
          <div className="flex justify-center gap-1">
            <div>Rented by: </div>
            {walletId && (
              <DisplayAddress dark connection={connection} address={walletId} />
            )}
          </div>
          <div className="flex justify-center gap-1">
            <div>Expires at: </div>
            {rentalExpirationWithExtension(tokenData, extensionSeconds, UTCNow)}
          </div>
        </div>
      )}
      <div className="flex justify-center">
        <ShareTwitterButton
          className="px-8"
          tokenData={tokenData}
          issuerName={issuerName}
          disabled={loadingName}
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

export const useRentalSuccessCard = () => {
  const { showModal } = useModal()
  return {
    showModal: (params: RentalSuccessCardProps) =>
      showModal(<RentalSuccessCard {...params} />),
  }
}