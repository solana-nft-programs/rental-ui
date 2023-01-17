import * as amplitude from '@amplitude/analytics-browser'
import { AccountConnect, useAddressName } from '@cardinal/namespaces-components'
import * as Sentry from '@sentry/browser'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { GlyphWallet } from 'assets/GlyphWallet'
import { useTermsOfServiceModal } from 'components/modals/TermsOfServiceModal'
import { useRouter } from 'next/router'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useModal } from 'providers/ModalProvider'
import { useEffect, useState } from 'react'
import { LogoTitled } from 'rental-components/common/LogoTitled'

import { ButtonSmall } from './ButtonSmall'
import { Tooltip } from './Tooltip'
import { asWallet } from './Wallets'

type Props = {
  tabs?: {
    disabled?: boolean
    name: string
    anchor: string
    tooltip?: string
  }[]
  hideDashboard?: boolean
}

export const HeaderSlim: React.FC<Props> = ({ tabs, hideDashboard }: Props) => {
  const router = useRouter()
  const wallet = useWallet()
  const walletModal = useWalletModal()
  const termsOfServiceModal = useTermsOfServiceModal()
  const { secondaryConnection, environment } = useEnvironmentCtx()
  const { data: displayName } = useAddressName(
    secondaryConnection,
    wallet.publicKey ?? undefined
  )
  const { showModal, onDismiss } = useModal()
  const [tab, setTab] = useState<string>('browse')

  useEffect(() => {
    const anchor = router.asPath.split('#')[1]
    if (anchor !== tab) setTab(anchor || 'browse')
  }, [router.asPath, tab])

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      const userId = wallet.publicKey.toString()

      // amplitude setup
      amplitude.setUserId(userId)
      amplitude.setGroup('solana_primary_rpc', environment.primary)
      amplitude.setGroup('solana_secondary_rpc', environment.secondary ?? '')
      if (displayName) {
        const identify = new amplitude.Identify()
          .setOnce('handle', displayName[0])
          .setOnce('namespace', displayName[1])
        amplitude.identify(identify)
      }

      // sentry config
      Sentry.configureScope((scope) => {
        scope.setUser({
          username: displayName
            ? displayName.join('.')
            : wallet.publicKey?.toString(),
          wallet: wallet.publicKey?.toString(),
        })
        scope.setTag('solana_primary_rpc', environment.primary)
        scope.setTag('solana_secondary_rpc', environment.secondary)
        scope.setTag('wallet', wallet.publicKey?.toString())
        if (displayName) {
          scope.setTag('handle', displayName[0])
          scope.setTag('namespace', displayName[1])
        }
      })
    }
  }, [wallet.connected, wallet.publicKey?.toString(), displayName])

  return (
    <div className="w-full px-4 py-4">
      <div className="flex min-h-[72px] flex-wrap items-center justify-center gap-4 rounded-xl bg-white bg-opacity-5 py-4 px-8 md:justify-between">
        <div className="flex items-center gap-5">
          <div
            className="flex cursor-pointer items-center transition-opacity hover:opacity-60"
            onClick={() => {
              amplitude.logEvent('header: click tab', {
                name: 'home',
              })
              router.push(`/${location.search}`)
            }}
          >
            <LogoTitled className="inline-block h-6" />
          </div>
          {environment.label !== 'mainnet-beta' && (
            <div className="text-primary">{environment.label}</div>
          )}
        </div>
        <div className="relative lg:absolute lg:left-1/2 lg:-translate-x-1/2">
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
                        amplitude.logEvent('header: click tab', {
                          name: anchor,
                        })
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
            </div>
          )}
        </div>
        <div className="flex-5 flex items-center justify-end gap-6">
          {!hideDashboard && wallet.connected && (
            <Tooltip title="View and manage your rentals globally">
              <div
                className={`cursor-pointer text-center text-light-0 opacity-80 transition-opacity hover:opacity-100`}
                onClick={() => {
                  amplitude.logEvent('header: click tab', {
                    name: 'dashboard',
                  })
                  router.push(`/me${location.search}`)
                }}
              >
                Dashboard
              </div>
            </Tooltip>
          )}
          {wallet.connected && wallet.publicKey ? (
            <AccountConnect
              dark={true}
              connection={secondaryConnection}
              environment={environment.label}
              handleDisconnect={() => wallet.disconnect()}
              wallet={asWallet(wallet)}
            />
          ) : (
            <ButtonSmall
              className="text-xs"
              onClick={() =>
                termsOfServiceModal.showModal({
                  handleAccept: () => {
                    onDismiss()
                    walletModal.setVisible(true)
                  },
                })
              }
            >
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
