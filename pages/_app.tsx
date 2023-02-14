import 'antd/dist/antd.dark.css'
import './styles.css'
import '@cardinal/namespaces-components/dist/esm/styles.css'
import 'tailwindcss/tailwind.css'

import * as amplitude from '@amplitude/analytics-browser'
import {
  IDENTITIES,
  WalletIdentityProvider,
} from '@cardinal/namespaces-components'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  BackpackWalletAdapter,
  BraveWalletAdapter,
  CoinbaseWalletAdapter,
  FractalWalletAdapter,
  GlowWalletAdapter,
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { ToastContainer } from 'common/Notification'
import type { ProjectConfig } from 'config/config'
import type { AppProps } from 'next/app'
import { EnvironmentProvider } from 'providers/EnvironmentProvider'
import { ModalProvider } from 'providers/ModalProvider'
import {
  getInitialProps,
  ProjectConfigProvider,
} from 'providers/ProjectConfigProvider'
import { SolanaAccountsProvider } from 'providers/SolanaAccountsProvider'
import { UTCNowProvider } from 'providers/UTCNowProvider'
import { useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import Head from 'next/head'

require('@solana/wallet-adapter-react-ui/styles.css')

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
})

const App = ({
  Component,
  pageProps,
  config,
  cluster,
}: AppProps & { config: ProjectConfig; cluster: string }) => {
  amplitude.init(
    process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY ??
      '5416da0efc30dc892889733916be497b'
  )

  const network = useMemo(() => {
    switch (cluster) {
      case 'mainnet':
        return WalletAdapterNetwork.Mainnet
      case 'devnet':
        return WalletAdapterNetwork.Devnet
      case 'testnet':
        return WalletAdapterNetwork.Testnet
      default:
        return WalletAdapterNetwork.Mainnet
    }
  }, [cluster])

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new BackpackWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new CoinbaseWalletAdapter(),
      new BraveWalletAdapter(),
      new SlopeWalletAdapter(),
      new FractalWalletAdapter(),
      new GlowWalletAdapter({ network }),
      new LedgerWalletAdapter(),
      new TorusWalletAdapter({ params: { network, showTorusButton: false } }),
    ],
    [network]
  )

  const identities = useMemo(
    () => [IDENTITIES['twitter'], IDENTITIES['discord'], IDENTITIES['github']],
    []
  )

  return (
    <EnvironmentProvider defaultCluster={cluster}>
      <UTCNowProvider>
        <SolanaAccountsProvider>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletIdentityProvider identities={identities}>
              <ProjectConfigProvider defaultConfig={config}>
                <QueryClientProvider client={queryClient}>
                  <ModalProvider>
                    <WalletModalProvider>
                      <>
                        <Head>
                          <title>Cardinal</title>
                        </Head>
                        <ToastContainer />
                        <Component {...pageProps} />
                        {<ReactQueryDevtools initialIsOpen={false} />}
                      </>
                    </WalletModalProvider>
                  </ModalProvider>
                </QueryClientProvider>
              </ProjectConfigProvider>
            </WalletIdentityProvider>
          </WalletProvider>
        </SolanaAccountsProvider>
      </UTCNowProvider>
    </EnvironmentProvider>
  )
}

App.getInitialProps = getInitialProps

export default App
