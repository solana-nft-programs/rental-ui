import React from 'react'
import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { StyledContainer } from 'common/StyledContainer'
import { useError } from 'providers/ErrorProvider'
import { useWallet } from '@solana/wallet-adapter-react'
import { Header } from 'common/Header'
import { useUserTokenData } from 'providers/TokenDataProvider'
import { useRouter } from 'next/router'
import Colors from 'common/colors'
import { firstParam, camelCase } from 'common/utils'
import { Manage } from 'components/Manage'
import { Browse } from 'components/Browse'
import { Wallet } from 'components/Wallet'
import { useProjectConfigData } from 'providers/ProjectConfigProvider'
import Head from 'next/head'

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
  const [error, _setError] = useError()
  const wallet = useWallet()
  const router = useRouter()
  const { addressId } = router.query
  const [loading, _setLoading] = useState(false)
  const [tab, setTab] = useState<string>('wallet')
  const { projectName, colors } = useProjectConfigData()

  useEffect(() => {
    const anchor = router.asPath.split('#')[1]
    if (anchor != tab) setTab(anchor || 'wallet')
  }, [router.asPath])

  useEffect(() => {
    if (colors) {
      Colors.background = colors.main
    }
  }, [colors])

  const { tokenDatas, setAddress, loaded, refreshing, refreshTokenAccounts } =
    useUserTokenData()
  useEffect(() => {
    if (addressId) {
      setAddress(firstParam(addressId))
    }
    if (wallet && wallet.connected && wallet.publicKey) {
      setAddress(wallet.publicKey.toBase58())
      router.push(
        `/${wallet.publicKey.toBase58()}${window.location.search ?? ''}`
      )
      setTab('wallet')
    }
  }, [wallet.connected, addressId])

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: Colors.background }}
    >
      <Head>
        <title>{camelCase(projectName)}</title>
      </Head>
      <Header
        loading={loading || refreshing || false}
        tabs={[
          { name: 'Wallet', anchor: 'wallet' },
          { name: 'Manage', anchor: 'manage' },
          { name: 'Browse', anchor: 'browse' },
        ]}
      />
      <StyledContainer style={{ paddingTop: '120px' }}>
        <div style={{ position: 'relative' }}>
          {error}
          {
            {
              wallet: <Wallet />,
              manage: <Manage />,
              browse: <Browse />,
            }[tab || 'wallet']
          }
        </div>
      </StyledContainer>
      <div style={{ marginTop: '100px' }} />
    </div>
  )
}

export default Profile
