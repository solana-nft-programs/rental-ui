import './styles.css'
import 'antd/dist/antd.css'
import '../styles/globals.css'
import 'tailwindcss/tailwind.css'

import { WalletIdentityProvider } from '@cardinal/namespaces-components'
import { WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { getWalletAdapters } from '@solana/wallet-adapter-wallets'
import type { ProjectConfig } from 'config/config'
import LogRocket from 'logrocket'
import type { AppProps } from 'next/app'
import { EnvironmentProvider } from 'providers/EnvironmentProvider'
import { IssuedTokensProvider } from 'providers/IssuedTokensProvider'
import { ManagedTokensProvider } from 'providers/ManagedTokensProvider'
import { PaymentMintsProvider } from 'providers/PaymentMintsProvider'
import { ProjectConfigProvider } from 'providers/ProjectConfigProvider'
import { TokenAccountsProvider } from 'providers/TokenDataProvider'
import { UTCNowProvider } from 'providers/UTCNowProvider'
import { QRCodeProvider } from 'rental-components/QRCodeProvider'
import { RentalExtensionModalProvider } from 'rental-components/RentalExtensionModalProvider'
import { RentalModalProvider } from 'rental-components/RentalModalProvider'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const setupLogRocketReact = require('logrocket-react')

require('@solana/wallet-adapter-react-ui/styles.css')

// Logrocket: only initialize when in the browser
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
  LogRocket.init('wuxy5s/remi-coin')
  // plugins should also only be initialized when in the browser
  setupLogRocketReact(LogRocket)
}

const App = ({
  Component,
  pageProps,
}: AppProps & { config: ProjectConfig }) => (
  <EnvironmentProvider>
    <WalletProvider wallets={getWalletAdapters()}>
      <WalletIdentityProvider>
        <ProjectConfigProvider>
          <PaymentMintsProvider>
            <QRCodeProvider>
              <UTCNowProvider>
                <TokenAccountsProvider>
                  <ManagedTokensProvider>
                    <IssuedTokensProvider>
                      <RentalModalProvider>
                        <RentalExtensionModalProvider>
                          <WalletModalProvider>
                            <Component {...pageProps} />
                          </WalletModalProvider>
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

export default App
