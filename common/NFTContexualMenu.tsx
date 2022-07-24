import {
  InvalidationType,
  TokenManagerState,
} from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { css } from '@emotion/react'
import Tooltip from '@mui/material/Tooltip'
import type { TokenData } from 'api/api'
import { metadataUrl, pubKeyUrl } from 'common/utils'
import { useHandleReturnRental } from 'handlers/useHandleReturnRental'
import { useHandleUnissueRental } from 'handlers/useHandleUnissueRental'
import { useWalletId } from 'hooks/useWalletId'
import { lighten } from 'polished'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { getLink, useProjectConfig } from 'providers/ProjectConfigProvider'
import { AiOutlineDatabase } from 'react-icons/ai'
import { BsArrowReturnLeft } from 'react-icons/bs'
import { FaEllipsisH, FaLink } from 'react-icons/fa'
import { FiExternalLink, FiSend } from 'react-icons/fi'
import { IoAddSharp, IoClose, IoQrCodeOutline } from 'react-icons/io5'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'
import { useRentalIssueCard } from 'rental-components/components/RentalIssueCard'
import { useRentalRateCard } from 'rental-components/components/RentalRateCard'
import { useScanCard } from 'rental-components/components/ScanCard'

import { elligibleForRent } from './NFT'
import { notify } from './Notification'
import { Popover, PopoverItem } from './Popover'

export const NFTContexualMenu = ({ tokenData }: { tokenData: TokenData }) => {
  const { environment } = useEnvironmentCtx()
  const { config } = useProjectConfig()
  const walletId = useWalletId()
  const scanCard = useScanCard()
  const rentalRateCard = useRentalRateCard()
  const rentalIssueCard = useRentalIssueCard()
  const handleReturnRental = useHandleReturnRental()
  const handleUnissueRental = useHandleUnissueRental()

  const { tokenManager, tokenAccount, recipientTokenAccount, timeInvalidator } =
    tokenData

  const confirmReturnConfig = (tokenData: TokenData) => {
    if (config.allowOneByCreators && tokenData.tokenManager) {
      const creatorConfig = config.allowOneByCreators.filter(
        (creator) =>
          creator.address === tokenData.tokenManager?.parsed.issuer.toString()
      )
      if (creatorConfig && creatorConfig[0]?.disableReturn) {
        return false
      }
    }
    return true
  }

  return (
    <Popover
      content={
        <div
          className="flex flex-col rounded-md px-1 py-1"
          css={css`
            background: ${lighten(0.07, config.colors.main)};
          `}
        >
          <PopoverItem>
            <a
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'white',
              }}
              href={pubKeyUrl(
                tokenManager?.parsed.mint ??
                  tokenAccount?.account.data.parsed.info.mint,
                environment.label
              )}
              target="_blank"
              rel="noreferrer"
            >
              <FiExternalLink />
              View
            </a>
          </PopoverItem>
          {environment.label !== 'devnet' && (
            <PopoverItem>
              <a
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: 'white',
                }}
                href={metadataUrl(
                  tokenManager?.parsed.mint ??
                    tokenAccount?.account.data.parsed.info.mint,
                  environment.label
                )}
                target="_blank"
                rel="noreferrer"
              >
                <AiOutlineDatabase />
                Metadata
              </a>
            </PopoverItem>
          )}
          {tokenManager &&
            tokenManager.parsed.state === TokenManagerState.Issued && (
              <PopoverItem>
                <a
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: 'white',
                  }}
                  href={getLink(
                    `/${
                      config.name
                    }/claim/${tokenData.tokenManager?.pubkey.toBase58()}`
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FaLink />
                  Claim Link
                </a>
              </PopoverItem>
            )}
          {!tokenManager && (
            <PopoverItem>
              <div
                className={`${
                  elligibleForRent(config, tokenData)
                    ? 'cursor-pointer'
                    : 'cursor-default opacity-20'
                } flex items-center gap-2`}
                onClick={(e) => {
                  e.stopPropagation()
                  elligibleForRent(config, tokenData) &&
                    rentalIssueCard.showModal({
                      tokenDatas: [tokenData],
                      rentalCardConfig: config.rentalCard,
                    })
                }}
              >
                <FiSend />
                Rent
              </div>
            </PopoverItem>
          )}
          {tokenManager &&
            tokenManager?.parsed.issuer.toString() === walletId?.toString() &&
            tokenManager.parsed.state !== TokenManagerState.Claimed && (
              <PopoverItem>
                <div
                  className="flex cursor-pointer items-center gap-2"
                  onClick={async (e) => {
                    e.stopPropagation()
                    handleUnissueRental.mutate({ tokenData })
                  }}
                >
                  <IoClose />
                  Delist
                </div>
              </PopoverItem>
            )}
          {tokenManager &&
            tokenManager.parsed.state === TokenManagerState.Claimed &&
            tokenData.recipientTokenAccount?.owner.toString() ===
              walletId?.toString() && (
              <PopoverItem>
                <div
                  className="flex cursor-pointer items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    scanCard.showModal({
                      tokenData,
                    })
                  }}
                >
                  <IoQrCodeOutline />
                  Scan
                </div>
              </PopoverItem>
            )}
          {recipientTokenAccount?.owner.toString() === walletId?.toString() &&
            tokenManager &&
            (tokenManager.parsed.invalidationType ===
              InvalidationType.Reissue ||
              tokenManager.parsed.invalidationType ===
                InvalidationType.Return) &&
            confirmReturnConfig(tokenData) && (
              <PopoverItem>
                <div
                  className="flex cursor-pointer items-center gap-2"
                  onClick={async (e) => {
                    e.stopPropagation()
                    handleReturnRental.mutate(
                      { tokenData },
                      {
                        onError: (e) =>
                          notify({
                            message: `Return failed: ${e}`,
                            type: 'error',
                          }),
                      }
                    )
                  }}
                >
                  <BsArrowReturnLeft />
                  Return
                </div>
              </PopoverItem>
            )}
          {recipientTokenAccount?.owner.toString() === walletId?.toString() &&
            timeInvalidator?.parsed?.extensionDurationSeconds &&
            tokenManager && (
              <PopoverItem>
                <div
                  className="flex cursor-pointer items-center justify-between gap-2"
                  onClick={async (e) => {
                    e.stopPropagation()
                    rentalRateCard.showModal({ tokenData, claim: false })
                  }}
                >
                  <IoAddSharp />
                  Add Duration
                </div>
              </PopoverItem>
            )}
        </div>
      }
    >
      <Tooltip placement="bottom-start" title="Quick Actions">
        <div
          className={`absolute top-[8px] right-[8px] z-20 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-white hover:bg-[${lighten(
            0.3,
            config.colors.main
          )}]`}
          style={{
            transition: '0.2s all',
            background: lighten(0.07, config.colors.main),
          }}
          key={tokenAccount?.pubkey.toString()}
        >
          {handleReturnRental.isLoading || handleUnissueRental.isLoading ? (
            <LoadingSpinner height="26px" />
          ) : (
            <FaEllipsisH />
          )}
        </div>
      </Tooltip>
    </Popover>
  )
}
