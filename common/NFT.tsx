import React from 'react'
import Colors from 'common/colors'
import { getQueryParam, pubKeyUrl } from 'common/utils'
import styled from '@emotion/styled'
import { TokenData } from 'api/api'
import { Popover, Tooltip } from 'antd'
import { FaEllipsisH } from 'react-icons/fa'
import { FiSend } from 'react-icons/fi'
import { useRentalModal } from 'rental-components/RentalModalProvider'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { asWallet } from './Wallets'
import { IoQrCodeOutline } from 'react-icons/io5'
import { FiExternalLink } from 'react-icons/fi'
import { useQRCode } from 'rental-components/QRCodeProvider'
import { NFTOverlay } from './NFTOverlay'
import { useProjectConfigData } from 'providers/ProjectConfigProvider'

export const TokensOuter = styled.div`
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  max-width: 880px;
  margin: 10px auto;
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
    // background: rgba(100, 100, 100);
    background: ${Colors.navBg};
    &:hover {
      // background: rgba(120, 120, 120);
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
  const { colors } = useProjectConfigData()  
  
  const {
    tokenAccount,
    metadata,
    tokenManager,
    timeInvalidator,
    useInvalidator,
  } = tokenData
  const customImageUri =
    tokenManager && getQueryParam(metadata?.data?.image, 'uri')

  const elligibleForRent =
    !tokenManager && tokenAccount?.account.data.parsed.info.state !== 'frozen'

  return (
    <TokenMetadata>
      {wallet &&
        wallet.connected &&
        (!tokenManager ? (
          elligibleForRent ? (
            <Popover
              placement="bottomLeft"
              zIndex={10}
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
                      onClick={() => {
                        rentalModal.show(
                          asWallet(wallet),
                          ctx.connection,
                          ctx.environment.label,
                          tokenData
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
            <Tooltip placement="topLeft" title="This item is not elligible">
              <div id="disabled-ellipsis">
                <FaEllipsisH />
              </div>
            </Tooltip>
          )
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
        {metadata &&
          metadata.data &&
          (metadata.data.animation_url ? (
            // @ts-ignore
            <video
              id="media"
              auto-rotate-delay="0"
              auto-rotate="true"
              auto-play="true"
              src={metadata.data.animation_url}
              // @ts-ignore
            />
          ) : (
            <img
              id="media"
              src={customImageUri || metadata.data.image}
              alt={metadata.data.name}
            />
          ))}
      </div>
    </TokenMetadata>
  )
}
