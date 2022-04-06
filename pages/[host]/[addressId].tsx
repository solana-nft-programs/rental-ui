import { useWallet } from '@solana/wallet-adapter-react'
import { Header } from 'common/Header'
import { StyledContainer } from 'common/StyledContainer'
import { camelCase, firstParam } from 'common/utils'
import { Browse } from 'components/Browse'
import { Manage } from 'components/Manage'
import { Wallet } from 'components/Wallet'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useError } from 'providers/ErrorProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useUserTokenData } from 'providers/TokenDataProvider'
import React, { useEffect, useState } from 'react'

function Profile() {
  const { config } = useProjectConfig()
  const [error, _setError] = useError()
  const wallet = useWallet()
  const router = useRouter()
  const { addressId } = router.query
  const [tab, setTab] = useState<string>('wallet')

  useEffect(() => {
    const anchor = router.asPath.split('#')[1]
    if (anchor !== tab) setTab(anchor || 'wallet')
  }, [router, tab])

  const { setAddress, loaded, refreshing } = useUserTokenData()
  useEffect(() => {
    if (addressId) {
      setAddress(firstParam(addressId))
    }
    if (wallet && wallet.connected && wallet.publicKey) {
      setAddress(wallet.publicKey.toBase58())
      router.push(`/${wallet.publicKey.toBase58()}${window.location.search}`)
      setTab('wallet')
    }
  }, [wallet.publicKey, addressId])

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: config.colors.main }}
    >
      <Head>
        <title>{camelCase(config.name)}</title>
      </Head>
      <Header
        loading={loaded && refreshing}
        tabs={[
          { name: 'Wallet', anchor: 'wallet' },
          { name: 'Manage', anchor: 'manage', disabled: config.disableListing },
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
