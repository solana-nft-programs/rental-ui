import React from 'react'
import { notification } from 'antd'

export function notify({
  message,
  description,
  txid,
  type = 'info',
  placement = 'topRight',
}: {
  message: string
  description?: string | JSX.Element
  txid?: string
  type?: string
  placement?: string
}) {
  // @ts-ignore
  notification[type]({
    message: <span>{message}</span>,
    description: (
      <>
        <div>{description}</div>
        {txid && (
          <a
            rel="noreferrer"
            target="_blank"
            href={'https://explorer.solana.com/tx/' + txid}
          >
            View transaction {txid.slice(0, 8)}...{txid.slice(txid.length - 8)}
          </a>
        )}
      </>
    ),
    placement,
  })
}
