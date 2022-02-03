import type { AppProps } from 'next/app'
import './styles.css'
import { getWalletAdapters } from '@solana/wallet-adapter-wallets'
import { WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'

import 'tailwindcss/tailwind.css'
import { EnvironmentContextProvider } from 'providers/EnvironmentProvider'

require('@solana/wallet-adapter-react-ui/styles.css')

const App = ({ Component, pageProps }: AppProps) => (
  <EnvironmentContextProvider>
    <WalletProvider wallets={getWalletAdapters()}>
      <WalletModalProvider>
        <Component {...pageProps} />
      </WalletModalProvider>
    </WalletProvider>
  </EnvironmentContextProvider>
)

export default App
