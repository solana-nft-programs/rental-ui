import {
  unissueToken,
  withResetExpiration,
  withReturn,
} from '@cardinal/token-manager'
import {
  InvalidationType,
  TokenManagerState,
} from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import styled from '@emotion/styled'
import Tooltip from '@mui/material/Tooltip'
import { useWallet } from '@solana/wallet-adapter-react'
import { Transaction } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { metadataUrl, pubKeyUrl } from 'common/utils'
import type { ProjectConfig } from 'config/config'
import { lighten } from 'polished'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { getLink, useProjectConfig } from 'providers/ProjectConfigProvider'
import { useState } from 'react'
import { AiOutlineDatabase } from 'react-icons/ai'
import { BsArrowReturnLeft } from 'react-icons/bs'
import { FaEllipsisH, FaLink } from 'react-icons/fa'
import { FiExternalLink, FiSend } from 'react-icons/fi'
import { IoAddSharp, IoClose, IoQrCodeOutline } from 'react-icons/io5'
import { getColorByBgColor } from 'rental-components/common/Button'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'
import { useQRCode } from 'rental-components/QRCodeProvider'
import { useRentalModal } from 'rental-components/RentalModalProvider'
import { useRentalRateModal } from 'rental-components/RentalRateModalProvider'

import { NFTOverlay } from './NFTOverlay'
import { notify } from './Notification'
import { Popover, PopoverItem } from './Popover'
import { executeTransaction } from './Transactions'
import { asWallet } from './Wallets'

export const TokensOuter = styled.div`
  display: flex;
  align-items: flex-start;
  max-width: 1480px;
  flex-wrap: wrap;
  margin: 0px auto;
  padding-bottom: 60px;
  gap: 20px;

  @media (max-width: 1224px) {
    justify-content: center;
  }
`

export function NFTPlaceholder() {
  const { config } = useProjectConfig()
  return (
    <div className="w-[280px]">
      <div
        className="flex h-[280px] w-full animate-pulse items-center justify-center rounded-t-md p-0"
        style={{ background: lighten(0.04, config.colors.main) }}
      ></div>
      <div
        style={{ background: lighten(0.07, config.colors.main) }}
        className={`flex min-h-[82px] w-[280px] flex-col gap-3 rounded-b-md p-3`}
      >
        <div
          className="h-5 w-2/3 animate-pulse rounded-md"
          style={{ background: lighten(0.1, config.colors.main) }}
        ></div>
        <div
          className="h-5 w-1/3 animate-pulse rounded-md"
          style={{ background: lighten(0.1, config.colors.main) }}
        ></div>
      </div>
    </div>
  )
}

export const elligibleForRent = (
  config: ProjectConfig,
  tokenData: TokenData
): boolean => {
  return (
    !config.disableListing &&
    !tokenData.tokenManager &&
    tokenData.tokenAccount?.account.data.parsed.info.state !== 'frozen' &&
    !!tokenData.editionData &&
    (!tokenData.mint || !!tokenData.mint.freezeAuthority)
  )
}

interface NFTProps {
  tokenData: TokenData
  onClick?: () => void
}

export function NFT({ tokenData, onClick }: NFTProps) {
  const [loading, setLoading] = useState(false)
  const ctx = useEnvironmentCtx()
  const wallet = useWallet()
  const { show } = useQRCode()
  const rentalModal = useRentalModal()
  const { config } = useProjectConfig()
  const rentalRateModal = useRentalRateModal()

  const {
    tokenAccount,
    metadata,
    tokenManager,
    timeInvalidator,
    useInvalidator,
    recipientTokenAccount,
    metaplexData,
  } = tokenData

  const returnRental = async (tokenData: TokenData) => {
    if (!tokenData.tokenManager) throw new Error('Invalid token manager')
    if (!wallet.publicKey) throw new Error('Wallet not connected')

    const transaction = new Transaction()

    await withReturn(
      transaction,
      ctx.connection,
      asWallet(wallet),
      tokenData.tokenManager
    )

    if (tokenData.timeInvalidator) {
      await withResetExpiration(
        transaction,
        ctx.connection,
        asWallet(wallet),
        tokenData.tokenManager?.pubkey
      )
    }

    await executeTransaction(ctx.connection, asWallet(wallet), transaction, {
      silent: false,
      confirmOptions: {
        commitment: 'confirmed',
        maxRetries: 3,
      },
      notificationConfig: {},
    })
  }

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
    <div
      className="relative w-[280px] rounded-xl"
      style={{
        background: lighten(0.02, config.colors.main),
      }}
    >
      <Popover
        content={
          <div
            className="flex flex-col rounded-md px-1 py-1"
            style={{
              background: lighten(0.07, config.colors.main),
              color: getColorByBgColor(config.colors.main),
            }}
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
                  ctx.environment.label
                )}
                target="_blank"
                rel="noreferrer"
              >
                <FiExternalLink />
                View
              </a>
            </PopoverItem>
            {ctx.environment.label !== 'devnet' && (
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
                    ctx.environment.label
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  <AiOutlineDatabase />
                  Metadata
                </a>
              </PopoverItem>
            )}
            <PopoverItem>
              <a
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: 'white',
                }}
                href={getLink(
                  `/claim/${tokenData.tokenManager?.pubkey.toBase58()}`
                )}
                target="_blank"
                rel="noreferrer"
              >
                <FaLink />
                Claim Link
              </a>
            </PopoverItem>
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
                      rentalModal.show(
                        asWallet(wallet),
                        ctx.connection,
                        ctx.environment.label,
                        [tokenData],
                        config.rentalCard
                      )
                  }}
                >
                  <FiSend />
                  Rent
                </div>
              </PopoverItem>
            )}
            {tokenManager &&
              tokenManager?.parsed.issuer.toString() ===
                wallet.publicKey?.toString() &&
              tokenManager.parsed.state !== TokenManagerState.Claimed && (
                <PopoverItem>
                  <div
                    className="flex cursor-pointer items-center gap-2"
                    onClick={async (e) => {
                      e.stopPropagation()
                      if (!tokenData?.tokenManager) return
                      setLoading(true)
                      executeTransaction(
                        ctx.connection,
                        asWallet(wallet),
                        await unissueToken(
                          ctx.connection,
                          asWallet(wallet),
                          tokenData?.tokenManager?.parsed.mint
                        ),
                        {
                          notificationConfig: {},
                          silent: true,
                          callback: () => setLoading(false),
                        }
                      )
                    }}
                  >
                    <IoClose />
                    Delist
                  </div>
                </PopoverItem>
              )}
            {tokenManager &&
              tokenManager.parsed.state === TokenManagerState.Claimed && (
                <PopoverItem>
                  <div
                    className="flex cursor-pointer items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      show(
                        ctx.connection,
                        asWallet(wallet),
                        tokenData,
                        ctx.environment.label
                      )
                    }}
                  >
                    <IoQrCodeOutline />
                    Scan
                  </div>
                </PopoverItem>
              )}
            {recipientTokenAccount?.owner.toString() ===
              wallet.publicKey?.toString() &&
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
                      try {
                        await returnRental(tokenData)
                      } catch (e) {
                        notify({
                          message: `Return failed: ${e}`,
                          type: 'error',
                        })
                      }
                    }}
                  >
                    <BsArrowReturnLeft />
                    Return
                  </div>
                </PopoverItem>
              )}
            {recipientTokenAccount?.owner.toString() ===
              wallet.publicKey?.toString() &&
              timeInvalidator?.parsed?.extensionDurationSeconds &&
              tokenManager && (
                <PopoverItem>
                  <div
                    className="flex cursor-pointer items-center justify-between gap-2"
                    onClick={async (e) => {
                      e.stopPropagation()
                      rentalRateModal.show(
                        asWallet(wallet),
                        ctx.connection,
                        ctx.environment.label,
                        tokenData,
                        false
                      )
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
            {loading ? <LoadingSpinner height="26px" /> : <FaEllipsisH />}
          </div>
        </Tooltip>
      </Popover>
      <div
        className={`z-0 flex h-[280px] max-w-full cursor-pointer items-center justify-center`}
        onClick={() => {
          onClick ? onClick() : () => {}
        }}
      >
        {tokenManager && (
          <NFTOverlay
            state={tokenManager?.parsed.state}
            expiration={
              timeInvalidator?.parsed?.expiration?.toNumber() ||
              timeInvalidator?.parsed?.maxExpiration?.toNumber() ||
              undefined
            }
            durationSeconds={
              timeInvalidator?.parsed?.durationSeconds?.toNumber() || undefined
            }
            usages={useInvalidator?.parsed.usages.toNumber()}
            totalUsages={useInvalidator?.parsed.totalUsages?.toNumber()}
            lineHeight={14}
            stateChangedAt={
              tokenManager?.parsed.stateChangedAt?.toNumber() || undefined
            }
            additionalInvalidators={
              tokenManager?.parsed.invalidators.length === 1 &&
              tokenManager.parsed.invalidators[0]?.toString() ===
                tokenData?.recipientTokenAccount?.owner.toString()
                ? ['Staked']
                : []
            }
          />
        )}
        {metadata && metadata.data && (
          <img
            loading="lazy"
            src={metadata.data.image}
            // src={customImageUri || metadata.data.image}
            alt={metadata.data.name}
            className={`h-full rounded-t-xl object-contain`}
          />
        )}
      </div>
    </div>
  )
}
