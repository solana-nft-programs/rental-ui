import { AccountConnect } from '@cardinal/namespaces-components'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { GlyphWallet } from 'assets/GlyphWallet'
import { useRouter } from 'next/router'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useEffect, useState } from 'react'

import { ButtonSmall } from './ButtonSmall'
import { LoadingPulse } from './LoadingPulse'
import { asWallet } from './Wallets'

type Props = {
  tabs?: { disabled?: boolean; name: string; anchor: string }[]
  loading?: boolean
}

export const HeaderSlim: React.FC<Props> = ({ tabs, loading }: Props) => {
  const router = useRouter()
  const { host } = router.query
  const wallet = useWallet()
  const walletModal = useWalletModal()
  const { config, setProjectConfig } = useProjectConfig()
  const { secondaryConnection, environment } = useEnvironmentCtx()
  const [tab, setTab] = useState<string>('wallet')

  useEffect(() => {
    const anchor = router.asPath.split('#')[1]
    if (anchor !== tab) setTab(anchor || 'wallet')
  }, [router.asPath, tab])

  return (
    <div className="w-full px-4 py-4">
      <div className="flex min-h-[72px] items-center justify-between rounded-xl bg-white bg-opacity-5 py-4 px-8">
        <div className="flex items-center gap-5">
          <div className="flex items-center">
            <img
              alt="Cardinal logo"
              className="inline-block h-6"
              src="./cardinal-crosshair.svg"
            />
            <span className="ml-2 text-2xl text-white">Cardinal</span>
          </div>
          {config.name !== 'default' && !host?.includes(config.name) && (
            <div
              className={`cursor-pointer text-center text-light-0 opacity-80 transition-opacity hover:opacity-100`}
              onClick={() => {
                const { cluster } = router.query
                if (false) {
                  router.push(`/${location.search}#browse`)
                } else {
                  setProjectConfig('default')
                  router.push(
                    `${location.pathname}${
                      cluster ? `?cluster=${cluster}` : ''
                    }`
                  )
                }
              }}
            >
              Marketplace
            </div>
          )}
        </div>
        <div className="absolute left-1/2 w-screen -translate-x-1/2 md:w-auto">
          {tabs && (
            <div className="mt-1 flex justify-start rounded-xl">
              {tabs.map(({ disabled, name, anchor }) => (
                <div key={anchor} className="flex flex-col items-center">
                  <div
                    className={`w-28 text-center text-light-0
                      ${
                        tab === anchor
                          ? 'cursor-pointer opacity-100'
                          : disabled
                          ? 'opacity-20'
                          : 'cursor-pointer opacity-100 transition-opacity hover:opacity-100'
                      }`}
                    onClick={() => {
                      if (disabled) return
                      setTab(anchor)
                      router.push(
                        `${location.pathname}${location.search}#${anchor}`
                      )
                    }}
                  >
                    {name}
                  </div>
                  {tab === anchor && (
                    <div className="h-1 w-1 rounded-full bg-light-0"></div>
                  )}
                </div>
              ))}
              <div className="absolute -right-10 top-1 h-5 w-5">
                <LoadingPulse loading={loading ?? false} />
              </div>
            </div>
          )}
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
