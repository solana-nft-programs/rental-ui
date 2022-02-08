import React from 'react'
import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { StyledContainer } from 'common/StyledContainer'
import { useError } from 'providers/ErrorProvider'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useWallet } from '@solana/wallet-adapter-react'
import { Header, StyledTab } from 'common/Header'
import { useUserTokenData } from 'providers/TokenDataProvider'
import { useRouter } from 'next/router'
import Colors from 'common/colors'
import { NFT } from 'common/NFT'
import { firstParam } from 'common/utils'

export const TokensOuter = styled.div`
  display: flex;
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

  .qr-code {
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

function Profile() {
  const [error, setError] = useError()
  const wallet = useWallet()
  const router = useRouter()
  const { addressId } = router.query
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<string>('wallet')
  const [issueId, setIssueId] = useState(null)

  const { tokenDatas, address, setAddress, refreshing } = useUserTokenData()
  useEffect(() => {
    if (addressId) {
      setAddress(firstParam(addressId))
    }
    if (wallet && wallet.connected && wallet.publicKey) {
      setAddress(wallet.publicKey.toBase58())
      router.push(
        `/${wallet.publicKey.toBase58()}${
          new URLSearchParams(window.location.search).get('cluster')
            ? `?cluster=${new URLSearchParams(window.location.search).get(
                'cluster'
              )}`
            : ''
        }`
      )
      setTab('wallet')
    }
  }, [wallet.connected, addressId])

  return (
    <>
      <Header
        loading={loading || refreshing || false}
        tabs={
          <>
            <StyledTab
              selected={tab === 'wallet'}
              className="tab"
              disabled={!addressId}
              onClick={() => {
                if (!addressId) return
                setTab('wallet')
                router.push(`${location.pathname}${location.search}#wallet`)
              }}
            >
              Wallet
            </StyledTab>
            <div className="vline"></div>
            <StyledTab
              selected={tab === 'manage'}
              disabled={true}
              className="tab"
              onClick={() => {}}
            >
              Manage
            </StyledTab>
            <div className="vline"></div>
            <StyledTab
              selected={tab === 'loan'}
              disabled={true}
              className="tab"
              onClick={() => {}}
            >
              Loan
            </StyledTab>
            <div className="vline"></div>
            <StyledTab
              selected={tab === 'print'}
              disabled={true}
              className="tab"
              onClick={() => {}}
            >
              Print
            </StyledTab>
            <div className="vline"></div>
            <StyledTab
              selected={tab === 'rent'}
              disabled={true}
              className="tab"
              onClick={() => {}}
            >
              Rent
            </StyledTab>
          </>
        }
      />

      <StyledContainer style={{ marginTop: '120px' }}>
        <div style={{ position: 'relative' }}>
          {error}
          {
            {
              wallet: (
                <>
                  <TokensOuter>
                    {tokenDatas &&
                      tokenDatas.map((tokenData) => (
                        <NFT
                          key={tokenData?.tokenAccount?.pubkey.toBase58()}
                          // @ts-ignore
                          tokenData={tokenData}
                          setIssueId={setIssueId}
                        ></NFT>
                      ))}
                  </TokensOuter>
                </>
              ),
            }[tab]
          }
        </div>
      </StyledContainer>
      <div style={{ marginTop: '100px' }} />
    </>
  )
}

export default Profile
