import { unissueToken } from '@cardinal/token-manager'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import styled from '@emotion/styled'
import { useWallet } from '@solana/wallet-adapter-react'
import type { TokenData } from 'api/api'
import Colors from 'common/colors'
import { pubKeyUrl } from 'common/utils'
import { lighten } from 'polished'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import React from 'react'
import { FaEllipsisH } from 'react-icons/fa'
import { FiExternalLink, FiSend } from 'react-icons/fi'
import { IoClose, IoQrCodeOutline } from 'react-icons/io5'
import { getColorByBgColor } from 'rental-components/common/Button'
import { useQRCode } from 'rental-components/QRCodeProvider'
import { useRentalModal } from 'rental-components/RentalModalProvider'

import { NFTOverlay } from './NFTOverlay'
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

export const TokenMetadata = styled.div<{ allBorderRadius?: boolean }>`
  text-align: center;
  position: relative;
  display: inline-block;
  border-radius: ${({ allBorderRadius }) =>
    allBorderRadius ? '10px' : '10px 10px 0 0'};
  width: 280px;
  background-color: ${Colors.tokenBackground};

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
      // max-width: 250px;
      height: 100%;
      --poster-color: transparent;
    }
  }
`

interface NFTProps {
  tokenData: TokenData
  hideQRCode?: boolean
  fullyRounded?: boolean
}

export function NFT({ tokenData, hideQRCode, fullyRounded }: NFTProps) {
  const ctx = useEnvironmentCtx()
  const wallet = useWallet()
  const { show } = useQRCode()
  const rentalModal = useRentalModal()
  const { config } = useProjectConfig()

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
    <TokenMetadata>
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
                View
                <FiExternalLink />
              </a>
            </PopoverItem>
            {!tokenManager && (
              <PopoverItem>
                <div
                  className={`${
                    elligibleForRent
                      ? 'cursor-pointer'
                      : 'cursor-default opacity-20'
                  } flex items-center justify-between gap-2`}
                  onClick={() => {
                    elligibleForRent &&
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
              </PopoverItem>
            )}
            {tokenManager?.parsed.issuer.toString() ===
              wallet.publicKey?.toString() && (
              <PopoverItem>
                <div
                  className="flex cursor-pointer items-center justify-between gap-2"
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
                  Delist
                  <IoClose />
                </div>
              </PopoverItem>
            )}
            {tokenManager &&
              tokenManager.parsed.state === TokenManagerState.Claimed && (
                <PopoverItem>
                  <div
                    className="flex cursor-pointer items-center justify-between gap-2"
                    onClick={() =>
                      show(
                        ctx.connection,
                        asWallet(wallet),
                        tokenData,
                        ctx.environment.label
                      )
                    }
                  >
                    Scan
                    <IoQrCodeOutline />
                  </div>
                </PopoverItem>
              )}
          </div>
        }
      >
        <div
          // TODO fix this color
          className={`absolute top-[8px] right-[8px] z-50 flex cursor-pointer items-center justify-center rounded-full p-2 text-xl text-white hover:bg-[${lighten(
            0.3,
            config.colors.main
          )}]`}
          style={{
            transition: '0.2s all',
            background: lighten(0.07, config.colors.main),
          }}
          key={tokenAccount?.pubkey.toString()}
        >
          <FaEllipsisH />
        </div>
      </Popover>
      <div id="media-outer" className="z-0">
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
            className={
              fullyRounded
                ? 'rounded-[10px]'
                : 'rounded-tr-[10px] rounded-tl-[10px]'
            }
          />
        )}
      </div>
    </TokenMetadata>
  )
}
