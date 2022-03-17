import type { AppProps } from 'next/app'
import './styles.css'
import 'antd/dist/antd.css'
import '../styles/globals.css'
import { getWalletAdapters } from '@solana/wallet-adapter-wallets'
import { WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { TokenAccountsProvider } from 'providers/TokenDataProvider'
import { WalletIdentityProvider } from '@cardinal/namespaces-components'
import { NextPageContext } from 'next'

import 'tailwindcss/tailwind.css'
import { EnvironmentProvider } from 'providers/EnvironmentProvider'
import { RentalModalProvider } from 'rental-components/RentalModalProvider'
import { PaymentMintsProvider } from 'providers/PaymentMintsProvider'
import { UTCNowProvider } from 'providers/UTCNowProvider'
import { QRCodeProvider } from 'rental-components/QRCodeProvider'
import { ManagedTokensProvider } from 'providers/ManagedTokensProvider'
import { IssuedTokensProvider } from 'providers/IssuedTokensProvider'
import { RentalExtensionModalProvider } from 'rental-components/RentalExtensionModalProvider'
import { ProjectConfigProvider } from 'providers/ProjectConfigProvider'
import { ProjectConfig, projectConfigs } from 'config/config'

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

App.getInitialProps = async ({ ctx }: { ctx: NextPageContext }) => {
  const projectParams = ctx.query.project || ctx.req?.headers.host
  const project =
    projectParams &&
    (typeof projectParams == 'string' ? projectParams : projectParams[0])
      ?.split('.')[0]
      ?.replace('dev-', '')

  const config = project ? projectConfigs[project] : projectConfigs['default']!
  return {
    config: config,
  }
}

export default App
