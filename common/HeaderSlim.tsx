import { AccountConnect } from '@cardinal/namespaces-components'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { GlyphWallet } from 'assets/GlyphWallet'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'

import { ButtonSmall } from './ButtonSmall'
import { asWallet } from './Wallets'

export const HeaderSlim = () => {
  const wallet = useWallet()
  const walletModal = useWalletModal()
  const { secondaryConnection, environment } = useEnvironmentCtx()

  return (
    <div className="w-full px-4 py-4">
      <div className="flex min-h-[72px] justify-between rounded-xl bg-white bg-opacity-5 py-4 px-8">
        <div className="flex items-center">
          <img
            alt="Cardinal logo"
            className="inline-block h-6"
            src="./cardinal-crosshair.svg"
          />
          <span className="ml-2 text-2xl text-white">Cardinal</span>
        </div>
        {wallet.connected && wallet.publicKey ? (
          <AccountConnect
            dark={true}
            connection={secondaryConnection}
            environment={environment.label}
            handleDisconnect={() => wallet.disconnect()}
            wallet={asWallet(wallet)}
          />
        ) : (
          <ButtonSmall onClick={() => walletModal.setVisible(true)}>
            <>
              <GlyphWallet />
              <>Connect wallet</>
            </>
          </ButtonSmall>
        )}
      </div>
    </div>
  )
}
