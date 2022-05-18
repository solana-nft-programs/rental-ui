import { Connection } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { getTokenAccountsWithData } from 'api/api'
import { tryPublicKey } from 'api/utils'
import { firstParam } from 'common/utils'
import { projectConfigs } from 'config/config'
import type { NextApiRequest, NextApiResponse } from 'next'
import { ENVIRONMENTS } from 'providers/EnvironmentProvider'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { cluster: clusterParam, collection: collectionParam } = req.query
  const { account } = req.body
  const foundEnvironment = ENVIRONMENTS.find(
    (e) => e.label === firstParam(clusterParam) || 'mainnet'
  )
  if (!foundEnvironment)
    return res.status(400).json({ error: 'Invalid cluster' })

  const accountId = tryPublicKey(account)
  if (!accountId) return res.status(400).json({ error: 'Invalid account' })

  const connection = new Connection(foundEnvironment!.value)
  const config =
    projectConfigs[firstParam(collectionParam)] || projectConfigs['default']!

  let tokenDatas: TokenData[] = []
  try {
    tokenDatas = await getTokenAccountsWithData(
      connection,
      accountId.toString(),
      config.filter,
      foundEnvironment.label
    )
  } catch (e) {
    res.status(500).json({ error: 'Failed to get token accounts' })
  }

  const foundToken = tokenDatas.find((tk) => tk.timeInvalidator)

  if (!foundToken) {
    res.status(404).json({
      error: `No valid tokens found in wallet for config ${config.name}`,
    })
  }

  res.status(200).json({ transaction: '' })
}
