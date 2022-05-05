import {
  ProfileSmall,
  useAddressName,
  useWalletIdentity,
} from '@cardinal/namespaces-components'
import type { Wallet } from '@saberhq/solana-contrib'
import { useWallet } from '@solana/wallet-adapter-react'
import type { Cluster } from '@solana/web3.js'
import { lighten } from 'polished'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import React from 'react'
import { FaPowerOff, FaTwitter } from 'react-icons/fa'

export const AccountPopover = () => {
  const { connection, environment, setEnvironment } = useEnvironmentCtx()
  const { config } = useProjectConfig()
  const wallet = useWallet()
  const { show } = useWalletIdentity()

  const { displayName, loadingName } = useAddressName(
    connection,
    wallet?.publicKey ?? undefined
  )
  if (!wallet.publicKey) return <></>
  return (
    <div className="w-screen max-w-[300px]">
      <div
        className="w-11/12 rounded-lg text-white md:w-full"
        style={{ background: lighten(0.07, config.colors.main) }}
      >
        <div className="flex items-center justify-between p-7 pb-0">
          <div className="grid gap-2 text-base">
            <div className="flex items-center">
              <ProfileSmall
                dark
                connection={connection}
                address={wallet.publicKey}
              />
            </div>
            {/* <span className="text-secondary">{environment.label}</span> */}
          </div>
          <div className="flex gap-3">
            {/* <MouseoverTooltip text="Copy Address">
              <Button
                variant="muted"
                icon
                onClick={() => {
                  copyToClipboard(publicKey.toString())
                  close?.()
                  notify({ message: 'Address copied to clipboard.' })
                }}
              >
                <FaCopy />
              </Button>
            </MouseoverTooltip>
            <MouseoverTooltip text="View on Explorer">
              <a
                href={`https://explorer.solana.com/address/${publicKey.toString()}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="muted" icon>
                  <FaExternalLinkAlt />
                </Button>
              </a>
            </MouseoverTooltip> */}
          </div>
        </div>
        <div className="flex flex-col gap-1 p-5">
          {wallet && (
            <MenuItem
              onClick={async () =>
                // TODO fix cluster including localnet and mainnet
                show(wallet as Wallet, connection, environment.label as Cluster)
              }
            >
              <FaTwitter />
              <span>
                {loadingName ? (
                  <div
                    className="animate h-4 w-24 animate-pulse"
                    style={{ background: lighten(0.1, config.colors.main) }}
                  />
                ) : displayName ? (
                  'Edit Twitter'
                ) : (
                  'Link Twitter'
                )}
              </span>
            </MenuItem>
          )}
          {/* {environment.label === 'mainnet' && (
            <MenuItem
              onClick={async () => {
                setEnvironment(ENVIRONMENTS.find((e) => e.label === 'devnet')!)
              }}
            >
              <FaGlobe />
              <span>Switch to Devnet</span>
            </MenuItem>
          )} */}
          <MenuItem onClick={() => wallet.disconnect()}>
            <FaPowerOff />
            <span>Disconnect</span>
          </MenuItem>
        </div>
      </div>
    </div>
  )
}

const MenuItem = ({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => Promise<void>
}) => (
  <div
    onClick={onClick}
    className="flex h-10 w-full cursor-pointer appearance-none items-center gap-3 rounded border-none bg-none p-3 text-base leading-4 outline-none hover:bg-gray-700"
  >
    {children}
  </div>
)
