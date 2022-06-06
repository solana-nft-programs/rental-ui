import './styles.css'
import 'antd/dist/antd.css'
import '../styles/globals.css'
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

export const queryClient = new QueryClient()

export const DEBUG = false

const App = ({
  Component,
  pageProps,
  config,
}: AppProps & { config: ProjectConfig }) => (
  <EnvironmentProvider>
    <WalletProvider wallets={getWalletAdapters()} autoConnect>
      <WalletIdentityProvider>
        <ProjectConfigProvider defaultConfig={config}>
          <QRCodeProvider>
            <UTCNowProvider>
              <RentalModalProvider>
                <RentalExtensionModalProvider>
                  <RentalRateModalProvider>
                    <WalletModalProvider>
                      <QueryClientProvider client={queryClient}>
                        <>
                          <ToastContainer />
                          <Component {...pageProps} />
                          {DEBUG && (
                            <ReactQueryDevtools initialIsOpen={false} />
                          )}
                        </>
                      </QueryClientProvider>
                    </WalletModalProvider>
                  </RentalRateModalProvider>
                </RentalExtensionModalProvider>
              </RentalModalProvider>
            </UTCNowProvider>
          </QRCodeProvider>
        </ProjectConfigProvider>
      </WalletIdentityProvider>
    </WalletProvider>
  </EnvironmentProvider>
)

App.getInitialProps = getInitialProps

export default App
