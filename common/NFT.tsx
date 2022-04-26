import { unissueToken } from '@cardinal/token-manager'
import { useWallet } from '@solana/wallet-adapter-react'
import { Popover, Tooltip } from 'antd'
import type { TokenData } from 'api/api'
import { executeTransaction } from 'common/Transactions'
import { pubKeyUrl } from 'common/utils'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import React from 'react'
import { FaEllipsisH } from 'react-icons/fa'
import { FiExternalLink, FiSend } from 'react-icons/fi'
import { IoClose, IoQrCodeOutline } from 'react-icons/io5'
import { useQRCode } from 'rental-components/QRCodeProvider'
import { useRentalModal } from 'rental-components/RentalModalProvider'

import {
  DisabledEllipsisStyle,
  EllipsisStyle,
  MediaOuterStyle,
  QRCodeStyle,
  TokenMetadataStyle,
  UnissueStyle,
} from './CustomStyles'
import { NFTOverlay } from './NFTOverlay'
import { asWallet } from './Wallets'

interface NFTProps {
  tokenData: TokenData
  hideQRCode?: boolean
  className?: string
}

export function NFT({ tokenData, hideQRCode, className }: NFTProps) {
  const ctx = useEnvironmentCtx()
  const wallet = useWallet()
  const { show } = useQRCode()
  const rentalModal = useRentalModal()
  const { config } = useProjectConfig()
  // const [showPopover, setShowPopover] = useState(false)

  const {
    tokenAccount,
    metadata,
    tokenManager,
    timeInvalidator,
    useInvalidator,
  } = tokenData

  const elligibleForRent =
    !config.disableListing &&
    !tokenManager &&
    tokenAccount?.account.data.parsed.info.state !== 'frozen' &&
    tokenData.editionData

  return (
    <TokenMetadataStyle className={`${className}`}>
      {wallet &&
        wallet.connected &&
        (!tokenManager ? (
          elligibleForRent ? (
            <Popover
              placement="bottomLeft"
              zIndex={10}
              content={
                <div>
                  <div className="cursor-pointer">
                    <a
                      className="flex items-center gap-2.5"
                      href={pubKeyUrl(
                        tokenAccount?.account.data.parsed.info.mint,
                        ctx.environment.label
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                      <FiExternalLink />
                    </a>
                    <div
                      className="flex items-center gap-2.5 opacity-100 hover:text-[#1890ff]"
                      onClick={() => {
                        rentalModal.show(
                          asWallet(wallet),
                          ctx.connection,
                          ctx.environment.label,
                          tokenData,
                          config.rentalCard
                        )
                      }}
                    >
                      Rent
                      <FiSend />
                    </div>
                  </div>
                </div>
              }
              trigger="click"
            >
              <EllipsisStyle className="h-[35px] w-[35px]">
                <FaEllipsisH />
              </EllipsisStyle>
            </Popover>
          ) : (
            <Tooltip
              placement="topLeft"
              title={
                config.disableListing
                  ? 'Self listing is currently disabled'
                  : 'Not elligible for rent'
              }
            >
              <DisabledEllipsisStyle className="h-[35px] w-[35px]">
                <FaEllipsisH />
              </DisabledEllipsisStyle>
            </Tooltip>
          )
        ) : tokenManager.parsed.issuer.toString() ===
            wallet.publicKey?.toString() && hideQRCode ? (
          <UnissueStyle>
            <div
              onClick={async () =>
                tokenData?.tokenManager &&
                executeTransaction(
                  ctx.connection,
                  asWallet(wallet),
                  await unissueToken(
                    ctx.connection,
                    asWallet(wallet),
                    tokenData?.tokenManager?.parsed.mint
                  ),
                  {
                    silent: true,
                  }
                )
              }
            >
              <IoClose />
            </div>
          </UnissueStyle>
        ) : (
          !hideQRCode && (
            <QRCodeStyle className="h-[35px] w-[35px]">
              <div
                onClick={() =>
                  show(
                    ctx.connection,
                    asWallet(wallet),
                    tokenData,
                    ctx.environment.label
                  )
                }
              >
                <IoQrCodeOutline />
              </div>
            </QRCodeStyle>
          )
        ))}
      <MediaOuterStyle className="h-full">
        {tokenManager && (
          <NFTOverlay
            state={tokenManager?.parsed.state}
            expiration={
              timeInvalidator?.parsed?.expiration?.toNumber() || undefined
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
          />
        )}
        {metadata && metadata.data && (
          <img
            className="h-[200px] rounded-xl object-contain sm:h-[175px] md:h-[150px] lg:h-[175px] xl:h-[190px] 2xl:h-[240px]"
            src={metadata.data.image}
            // src={customImageUri || metadata.data.image}
            alt={metadata.data.name}
          />
        )}
      </MediaOuterStyle>
    </TokenMetadataStyle>
  )
}
