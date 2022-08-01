import 'antd/dist/antd.dark.css'
import './styles.css'
import '@cardinal/namespaces-components/dist/esm/styles.css'
import 'tailwindcss/tailwind.css'

import * as amplitude from '@amplitude/analytics-browser'
import { WalletIdentityProvider } from '@cardinal/namespaces-components'
import { WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { getWalletAdapters } from '@solana/wallet-adapter-wallets'
import { ToastContainer } from 'common/Notification'
import type { ProjectConfig } from 'config/config'
import type { AppProps } from 'next/app'
import { EnvironmentProvider } from 'providers/EnvironmentProvider'
import { ModalProvider } from 'providers/ModalProvider'
import {
  getInitialProps,
  ProjectConfigProvider,
} from 'providers/ProjectConfigProvider'
import { UTCNowProvider } from 'providers/UTCNowProvider'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'

require('@solana/wallet-adapter-react-ui/styles.css')

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

export const DEBUG = true

const App = ({
  Component,
  pageProps,
  config,
  cluster,
}: AppProps & { config: ProjectConfig; cluster: string }) => {
  amplitude.init('0ca91ed9b3a6cb48f89aa0fcebb2cdaf')
  return (
    <EnvironmentProvider defaultCluster={cluster}>
      <UTCNowProvider>
        <WalletProvider wallets={getWalletAdapters()} autoConnect>
          <WalletIdentityProvider>
            <ProjectConfigProvider defaultConfig={config}>
              <QueryClientProvider client={queryClient}>
                <ModalProvider>
                  <WalletModalProvider>
                    <>
                      <ToastContainer />
                      <Component {...pageProps} />
                      {DEBUG && <ReactQueryDevtools initialIsOpen={false} />}
                    </>
                  </WalletModalProvider>
                </ModalProvider>
              </QueryClientProvider>
            </ProjectConfigProvider>
          </WalletIdentityProvider>
        </WalletProvider>
      </UTCNowProvider>
    </EnvironmentProvider>
  )
}

App.getInitialProps = getInitialProps

export default App
