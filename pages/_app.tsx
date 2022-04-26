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
import { IssuedTokensProvider } from 'providers/IssuedTokensProvider'
import { ManagedTokensProvider } from 'providers/ManagedTokensProvider'
import { PaymentMintsProvider } from 'providers/PaymentMintsProvider'
import {
  getInitialProps,
  ProjectConfigProvider,
} from 'providers/ProjectConfigProvider'
import { TokenAccountsProvider } from 'providers/TokenDataProvider'
import { UTCNowProvider } from 'providers/UTCNowProvider'
import { QRCodeProvider } from 'rental-components/QRCodeProvider'
import { RentalExtensionModalProvider } from 'rental-components/RentalExtensionModalProvider'
import { RentalModalProvider } from 'rental-components/RentalModalProvider'
import { RentalRateModalProvider } from 'rental-components/RentalRateModalProvider'

require('@solana/wallet-adapter-react-ui/styles.css')

const App = ({
  Component,
  pageProps,
  config,
}: AppProps & { config: ProjectConfig }) => (
  <EnvironmentProvider>
    <WalletProvider wallets={getWalletAdapters()}>
      <WalletIdentityProvider>
        <ProjectConfigProvider defaultConfig={config}>
          <PaymentMintsProvider>
            <QRCodeProvider>
              <UTCNowProvider>
                <TokenAccountsProvider>
                  <ManagedTokensProvider>
                    <IssuedTokensProvider>
                      <RentalModalProvider>
                        <RentalExtensionModalProvider>
                          <RentalRateModalProvider>
                            <WalletModalProvider>
                              <>
                                <ToastContainer />
                                <Component {...pageProps} />
                              </>
                            </WalletModalProvider>
                          </RentalRateModalProvider>
                        </RentalExtensionModalProvider>
                      </RentalModalProvider>
                    </IssuedTokensProvider>
                  </ManagedTokensProvider>
                </TokenAccountsProvider>
              </UTCNowProvider>
            </QRCodeProvider>
          </PaymentMintsProvider>
        </ProjectConfigProvider>
      </WalletIdentityProvider>
    </WalletProvider>
  </EnvironmentProvider>
)

App.getInitialProps = getInitialProps

export default App
