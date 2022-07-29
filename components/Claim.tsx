import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { css } from '@emotion/react'
import { tryPublicKey } from 'api/utils'
import { GlyphQuestion } from 'assets/GlyphQuestion'
import { ButtonSmall } from 'common/ButtonSmall'
import { Card } from 'common/Card'
import { FooterSlim } from 'common/FooterSlim'
import { HeaderSlim } from 'common/HeaderSlim'
import { NFT } from 'common/NFT'
import { NFTClaimButton } from 'common/NFTClaimButton'
import { NFTHeader } from 'common/NFTHeader'
import { NFTIssuerInfo } from 'common/NFTIssuerInfo'
import { NFTRevokeButton } from 'common/NFTRevokeButton'
import { StyledBackground } from 'common/StyledBackground'
import { pubKeyUrl } from 'common/utils'
import ClaimQRCode from 'components/ClaimQRCode'
import { useOtp } from 'hooks/useOtp'
import { useTokenData } from 'hooks/useTokenData'
import { useRouter } from 'next/router'
import { transparentize } from 'polished'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useState } from 'react'
import { isMobile } from 'react-device-detect'
import { BiQr } from 'react-icons/bi'

function Claim() {
  const { config } = useProjectConfig()
  const router = useRouter()
  const { environment } = useEnvironmentCtx()
  const [showQRCode, setShowQRCode] = useState(false)
  const otpKeypair = useOtp()

  const { tokenManagerString, qrcode } = router.query
  const tokenManagerId = tryPublicKey(tokenManagerString)
  const tokenQuery = useTokenData(tokenManagerId ?? undefined)
  const tokenData = tokenQuery.data
  console.log(tokenData)
  return (
    <div className="flex h-screen flex-col">
      <HeaderSlim />
      <div className="mx-auto w-[500px] max-w-[86vw] flex-grow pt-[4vh] lg:pt-[10vh]">
        <div className="mb-6 text-center">
          <div className="mb-2 text-4xl">Claim Asset</div>
          <div className="text-xs font-extralight">
            <a
              href={pubKeyUrl(
                tokenData?.tokenManager?.parsed.mint,
                environment.label
              )}
              target="_blank"
              rel="noreferrer"
            >
              {(tokenManagerId &&
                tokenData?.tokenManager?.parsed.mint &&
                tokenData?.tokenManager?.parsed.mint.toString()) ||
                ''}
            </a>
          </div>
        </div>
        <div
          className="relative mx-auto flex w-fit flex-col items-center rounded-xl text-white"
          css={css`
            box-shadow: 0 0 80px 50px ${
              config.colors?.secondary
                ? transparentize(0.8, config.colors.secondary)
                : 'rgba(255, 255, 255, 0.3)'
            }};
          `}
        >
          {true && (
            <div
              className="absolute -right-5 -top-5 h-[10px] w-[10px] animate-ping rounded-full"
              css={css`
                background: ${config.colors.secondary};
              `}
            />
          )}
          <div className="">
            {!tokenQuery.isFetched ? (
              <Card skeleton header={<></>} subHeader={<></>} />
            ) : tokenData ? (
              <Card
                className="max-w-[400px]"
                hero={
                  tokenData &&
                  showQRCode &&
                  !isMobile &&
                  tokenData.tokenManager?.parsed.state !==
                    TokenManagerState.Claimed ? (
                    <ClaimQRCode tokenData={tokenData} keypair={otpKeypair} />
                  ) : (
                    <NFT tokenData={tokenData} />
                  )
                }
                header={<NFTHeader tokenData={tokenData} />}
                content={
                  {
                    [TokenManagerState.Initialized]: <></>,
                    [TokenManagerState.Issued]: (
                      <div className="flex w-full flex-row justify-between text-sm">
                        <NFTIssuerInfo tokenData={tokenData} />
                        {qrcode && !isMobile ? (
                          <ButtonSmall
                            className="my-auto inline-block flex-none text-xs"
                            onClick={() => setShowQRCode((v) => !v)}
                          >
                            <div className="flex items-center gap-1">
                              {showQRCode ? 'Hide' : 'Scan'}
                              <BiQr />
                            </div>
                          </ButtonSmall>
                        ) : (
                          <NFTClaimButton
                            tokenData={tokenData}
                            tokenDatas={[]}
                          />
                        )}
                      </div>
                    ),
                    [TokenManagerState.Claimed]: (
                      <div className="flex flex-row justify-between text-sm">
                        <NFTIssuerInfo tokenData={tokenData} />
                        <NFTRevokeButton tokenData={tokenData} />
                      </div>
                    ),
                    [TokenManagerState.Invalidated]: <></>,
                  }[tokenData?.tokenManager?.parsed.state as TokenManagerState]
                }
              />
            ) : (
              <Card
                hero={
                  <div className="flex h-full w-[280px] flex-col items-center justify-center">
                    <div className="scale-[1.5]">
                      <GlyphQuestion />
                    </div>
                    <div className="mt-10">Token not found</div>
                  </div>
                }
                header={<div className="m"></div>}
              />
            )}
          </div>
        </div>
        {/* {showQRCode && (
          <div
            className="mx-auto cursor-pointer px-10 pt-3 text-center text-xs text-medium-3"
            onClick={() => setShowQRCode && setShowQRCode(false)}
          >
            Hide QR Code
          </div>
        )} */}
        {tokenQuery.error && (
          <div className="mt-8 text-center text-xs text-medium-3">{`
            ${tokenQuery.error}`}</div>
        )}
        {qrcode && (
          <div className="mx-auto mt-6 py-3 px-10 text-center text-xs text-medium-3">
            Click the scan button to claim this NFT with your mobile wallet and
            be prepared to present it at the front desk.
          </div>
        )}
      </div>
      <FooterSlim />
      <StyledBackground colors={config.colors} />
    </div>
  )
}

export default Claim
