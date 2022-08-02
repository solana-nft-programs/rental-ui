import type { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { getTokenManagersByState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import { Connection } from '@solana/web3.js'
import { getTokenDatas } from 'apis/api'
import { firstParam } from 'common/utils'
import { projectConfigs } from 'config/config'
import type { NextApiRequest, NextApiResponse } from 'next'
import { ENVIRONMENTS } from 'providers/EnvironmentProvider'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    cluster: clusterParam,
    collection: collectionParam,
    state: stateParam,
  } = req.query
  const foundEnvironment = ENVIRONMENTS.find(
    (e) => e.label === firstParam(clusterParam) ?? 'mainnet'
  )

  if (!foundEnvironment)
    return res.status(400).json({ error: 'Invalid cluster' })

  let state: TokenManagerState | undefined
  try {
    state = parseInt(firstParam(stateParam)) as TokenManagerState
  } catch (e) {
    console.log('Invalid state')
  }
  const connection = new Connection(foundEnvironment!.primary)
  const tokenManagerDatas = await getTokenManagersByState(
    connection,
    state ?? null
  )

  const config =
    projectConfigs[firstParam(collectionParam)] || projectConfigs['default']!

  const tokenDatas = await getTokenDatas(
    connection,
    tokenManagerDatas,
    config.filter,
    firstParam(clusterParam)
  )
  res.status(200).json({ data: tokenDatas })
}
