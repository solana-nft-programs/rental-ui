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
import { Tooltip } from './Tooltip'
import { asWallet } from './Wallets'

type Props = {
  homeButton?: boolean
  tabs?: {
    disabled?: boolean
    name: string
    anchor: string
    tooltip?: string
  }[]
  loading?: boolean
}

export const HeaderSlim: React.FC<Props> = ({
  tabs,
  loading,
  homeButton,
}: Props) => {
  const router = useRouter()
  const { host } = router.query
  const wallet = useWallet()
  const walletModal = useWalletModal()
  const { config } = useProjectConfig()
  const { secondaryConnection, environment } = useEnvironmentCtx()
  const [tab, setTab] = useState<string>('browse')

  useEffect(() => {
    const anchor = router.asPath.split('#')[1]
    if (anchor !== tab) setTab(anchor || 'browse')
  }, [router.asPath, tab])

  return (
    <div className="w-full px-4 py-4">
      <div className="flex min-h-[72px] flex-wrap items-center justify-center gap-4 rounded-xl bg-white bg-opacity-5 py-4 px-8 lg:justify-between">
        <div className="flex w-56 items-center gap-5">
          <div className="flex items-center">
            <img
              alt="Cardinal logo"
              className="inline-block h-6"
              src="/cardinal-crosshair.svg"
            />
            <span className="ml-2 text-2xl text-white">Cardinal</span>
          </div>
          {(homeButton ||
            (config.name !== 'default' && !host?.includes(config.name))) && (
            <div
              className={`cursor-pointer text-center text-light-0 opacity-80 transition-opacity hover:opacity-100`}
              onClick={() => {
                router.push(`/${location.search}`)
              }}
            >
              Marketplace
            </div>
          )}
        </div>
        <div className="relative">
          {tabs && (
            <div className="mt-1 flex justify-center rounded-xl">
              {tabs.map(({ disabled, name, anchor, tooltip }) => (
                <Tooltip key={anchor} title={tooltip || ''}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-20 text-center text-light-0 lg:w-28
                      ${
                        tab === anchor
                          ? 'cursor-pointer opacity-100'
                          : disabled
                          ? 'cursor-default opacity-20'
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
                    <div
                      className={`h-1 w-1 rounded-full ${
                        tab === anchor ? 'bg-light-0' : ''
                      }`}
                    ></div>
                  </div>
                </Tooltip>
              ))}
              <div className="absolute -right-10 top-1 h-5 w-5">
                <LoadingPulse loading={loading ?? false} />
              </div>
            </div>
          )}
        </div>
        <div className="flex w-56 justify-end">
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
    </div>
  )
}
