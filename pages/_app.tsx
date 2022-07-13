import './styles.css'
import '@cardinal/namespaces-components/dist/esm/styles.css'
import 'tailwindcss/tailwind.css'

import { WalletIdentityProvider } from '@cardinal/namespaces-components'
import { WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { getWalletAdapters } from '@solana/wallet-adapter-wallets'
import { ToastContainer } from 'common/Notification'
import type { ProjectConfig } from 'config/config'
import type { AppProps } from 'next/app'
import { EnvironmentProvider } from 'providers/EnvironmentProvider'
import {
  getInitialProps,
  ProjectConfigProvider,
} from 'providers/ProjectConfigProvider'
import { UTCNowProvider } from 'providers/UTCNowProvider'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { QRCodeProvider } from 'rental-components/QRCodeProvider'
import { RentalExtensionModalProvider } from 'rental-components/RentalExtensionModalProvider'
import { RentalModalProvider } from 'rental-components/RentalModalProvider'
import { RentalRateModalProvider } from 'rental-components/RentalRateModalProvider'

require('@solana/wallet-adapter-react-ui/styles.css')

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

export const DEBUG = false

const App = ({
  Component,
  pageProps,
  config,
  cluster,
}: AppProps & { config: ProjectConfig; cluster: string }) => (
  <EnvironmentProvider defaultCluster={cluster}>
    <UTCNowProvider>
      <WalletProvider wallets={getWalletAdapters()} autoConnect>
        <WalletIdentityProvider>
          <ProjectConfigProvider defaultConfig={config}>
            <QueryClientProvider client={queryClient}>
              <QRCodeProvider>
                <RentalModalProvider>
                  <RentalExtensionModalProvider>
                    <RentalRateModalProvider>
                      <WalletModalProvider>
                        <>
                          <ToastContainer />
                          <Component {...pageProps} />
                          {DEBUG && (
                            <ReactQueryDevtools initialIsOpen={false} />
                          )}
                        </>
                      </WalletModalProvider>
                    </RentalRateModalProvider>
                  </RentalExtensionModalProvider>
                </RentalModalProvider>
              </QRCodeProvider>
            </QueryClientProvider>
          </ProjectConfigProvider>
        </WalletIdentityProvider>
      </WalletProvider>
    </UTCNowProvider>
  </EnvironmentProvider>
)

App.getInitialProps = getInitialProps

export default App
