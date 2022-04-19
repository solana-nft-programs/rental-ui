import { unissueToken } from '@cardinal/token-manager'
import styled from '@emotion/styled'
import { useWallet } from '@solana/wallet-adapter-react'
import { Popover, Tooltip } from 'antd'
import type { TokenData } from 'api/api'
import Colors from 'common/colors'
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

import { NFTOverlay } from './NFTOverlay'
import { asWallet } from './Wallets'

export const TokensOuter = styled.div`
  display: flex;
  align-items: flex-start;
  max-width: 1480px;
  flex-wrap: wrap;
  margin: 10px auto;
  padding-bottom: 60px;
  gap: 20px;

  @media (max-width: 1224px) {
    justify-content: center;
  }
`

export const TokenMetadata = styled.div`
  text-align: center;
  position: relative;
  display: inline-block;
  border-radius: 10px;
  width: 280px;
  background-color: ${Colors.tokenBackground};
  padding: 15px 0px;
  z-index: 0;

  #ellipsis {
    color: ${Colors.white};
    z-index: 1;
    top: 6px;
    right: 10px;
    position: absolute;
    font-size: 20px;
    border-radius: 50%;
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;

    transition: 0.2s all;
    background: ${Colors.navBg};
    &:hover {
      background: ${Colors.background};
    }
  }

  #disabled-ellipsis {
    color: ${Colors.lightGray};
    z-index: 1;
    top: 6px;
    right: 10px;
    position: absolute;
    font-size: 20px;
    border-radius: 50%;
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;

    transition: 0.2s all;
    // background: rgba(100, 100, 100);
    background: ${Colors.background};
  }

  .qr-code {
    color: white;
    z-index: 5;
    top: 6px;
    right: 10px;
    position: absolute;
    font-size: 15px;
    border-radius: 50%;
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;

    transition: 0.2s all;
    // background: rgba(100, 100, 100);
    background: ${Colors.navBg};
    &:hover {
      // background: rgba(120, 120, 120);
      background: ${Colors.background};
    }
  }

  .unissue {
    color: white;
    z-index: 5;
    top: 5px;
    right: 5px;
    position: absolute;
    font-size: 18px;
    border-radius: 50%;
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;

    transition: 0.2s all;
    // background: rgba(100, 100, 100);
    background: ${Colors.navBg};
    &:hover {
      // background: rgba(120, 120, 120);
      background: ${Colors.background};
    }
  }

  #header {
    background: rgba(0, 0, 0, 0.4);
    z-index: 1;
    padding: 12px;
    position: absolute;
    top: -50px;
    width: 100%;
    transition: 0.2s all;
  }

  &:hover {
    cursor: pointer;

    #header {
      top: 0;
    }
  }

  #name {
    font-size: 14px;
  }

  #media-outer {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 280px;
    max-width: 100%;
    #media {
      object-fit: contain;
      max-width: 250px;
      height: 100%;
      --poster-color: transparent;
    }
  }
`

interface NFTProps {
  tokenData: TokenData
  hideQRCode?: boolean
}

export function NFT({ tokenData, hideQRCode }: NFTProps) {
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
  // const customImageUri =
  //   tokenManager && getQueryParam(metadata?.data?.image, 'uri')

  const elligibleForRent =
    !config.disableListing &&
    !tokenManager &&
    tokenAccount?.account.data.parsed.info.state !== 'frozen' &&
    tokenData.editionData

  return (
    <TokenMetadata>
      {wallet &&
        wallet.connected &&
        (!tokenManager ? (
          elligibleForRent ? (
            <Popover
              placement="bottomLeft"
              zIndex={10}
              // visible={showPopover}
              content={
                <div id="context-menu">
                  <div
                    style={{
                      cursor: 'pointer',
                    }}
                  >
                    <a
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
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
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        opacity: 1,
                      }}
                      className="hover:text-[#1890ff]"
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
              <div id="ellipsis">
                <FaEllipsisH />
              </div>
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
              <div id="disabled-ellipsis">
                <FaEllipsisH />
              </div>
            </Tooltip>
          )
        ) : tokenManager.parsed.issuer.toString() ===
            wallet.publicKey?.toString() && hideQRCode ? (
          <div
            className="unissue"
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
        ) : (
          !hideQRCode && (
            <div
              className="qr-code"
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
          )
        ))}
      <div id="media-outer">
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
            id="media"
            src={metadata.data.image}
            // src={customImageUri || metadata.data.image}
            alt={metadata.data.name}
          />
        )}
      </div>
    </TokenMetadata>
  )
}
