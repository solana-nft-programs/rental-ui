import { useWallet } from '@solana/wallet-adapter-react'
import { Footer } from 'common/Footer'
import { Browse } from 'components/Browse'
import { Collections } from 'components/Collections'
import { Manage } from 'components/Manage'
import { Wallet } from 'components/Wallet'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useEffect, useState } from 'react'

export default function Home() {
  const { config } = useProjectConfig()
  const wallet = useWallet()
  const router = useRouter()
  const [tab, setTab] = useState<string>()

  useEffect(() => {
    const anchor = router.asPath.split('#')[1]
    if (anchor !== tab) setTab(anchor || '')
  }, [router, tab])

  useEffect(() => {
    const { collection, host, cluster } = router.query
    if (
      config.name !== 'default' &&
      !host?.includes(config.name) &&
      collection !== config.name
    ) {
      router.push(
        `${location.pathname}?collection=${config.name}${
          cluster ? `&cluster=${cluster}` : ''
        }#${tab || 'browse'}`
      )
    }
  }, [config])

  useEffect(() => {
    if (wallet && wallet.connected && wallet.publicKey) {
      router.push(
        `${location.pathname}${location.search}${
          config.name !== 'default' ? `#${tab || 'browse'}` : ''
        }`
      )
    }
  }, [wallet.publicKey])

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: config.colors.main }}
    >
      <Head>
        <title>Cardinal</title>
        <link rel="icon" href="/favicon.ico" />

        <link
          href="https://fonts.googleapis.com/css2?family=Roboto&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Lato:wght@100&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Kanit:ital@0;1&family=Oswald:wght@200;300;400;500&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Karla:wght@600&display=swap"
          rel="stylesheet"
        />
      </Head>
      {config.name === 'default' ? (
        <Collections />
      ) : (
        <>
          <div style={{ minHeight: 'calc(100vh - 337px)' }}>
            {(() => {
              if (!tab) return <Browse />
              else {
                switch (tab) {
                  case 'browse':
                    return <Browse />
                  case 'manage':
                    return <Manage />
                  default:
                    return <Wallet />
                }
              }
            })()}
          </div>
          <Footer bgColor={config.colors.main} />
        </>
      )}
    </div>
  )
}
