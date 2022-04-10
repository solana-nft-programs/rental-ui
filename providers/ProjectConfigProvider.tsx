import { NameEntryData, tryGetProfile } from '@cardinal/namespaces-components'
import { getNameEntryData } from '@cardinal/namespaces-components'
import type { PublicKey } from '@solana/web3.js'
import { Connection } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { tryPublicKey } from 'api/utils'
import type { ProjectConfig } from 'config/config'
import { projectConfigs } from 'config/config'
import { useRouter } from 'next/router'
import type { ReactChild } from 'react'
import React, { useContext, useMemo, useState } from 'react'

import { useEnvironmentCtx } from './EnvironmentProvider'

export const filterTokens = (
  filters: { type: string; value: string }[],
  tokens: TokenData[],
  issuer?: PublicKey
): TokenData[] => {
  return tokens.filter((token) => {
    let filtered = false
    if (filters.length > 0 || issuer) {
      filters.forEach((configFilter) => {
        if (
          configFilter.type === 'creators' &&
          !token?.metadata?.data?.properties?.creators.some(
            (creator: { address: string }) =>
              creator.address === configFilter.value
          )
        ) {
          filtered = true
        } else if (
          configFilter.type === 'symbol' &&
          token.metadata?.data?.symbol !== configFilter.value
        ) {
          filtered = true
        }
      })
      if (issuer && !token.tokenManager?.parsed.issuer.equals(issuer)) {
        filtered = true
      }
    }
    return (
      token.metadata.data &&
      Object.keys(token.metadata.data).length > 0 &&
      !filtered
    )
  })
}

export function getLink(path: string, withParams = true) {
  return `${window.location.origin}${path}${
    withParams
      ? path.includes('?') && window.location.search
        ? `${window.location.search.replace('?', '&')}`
        : window.location.search ?? ''
      : ''
  }`
}

export interface ProjectConfigValues {
  config: ProjectConfig
}

const ProjectConfigValues: React.Context<ProjectConfigValues> =
  React.createContext<ProjectConfigValues>({
    config: projectConfigs['portals']!,
  })

export function ProjectConfigProvider({ children }: { children: ReactChild }) {
  const { query } = useRouter()
  const { environment, connection } = useEnvironmentCtx()
  const [nameEntryData, setNameEntryData] = useState<NameEntryData | undefined>(
    undefined
  )
  const projectParams = query.project || query.host
  const project =
    projectParams &&
    (typeof projectParams === 'string' ? projectParams : projectParams[0])
      ?.split('.')[0]
      ?.replace('dev-', '')
  const overrideCollection = environment.override
    ? new Connection(environment.override)
    : connection
  const namespaceName = 'twitter'

  const refreshNameEntryData = async () => {
    if (!project || !connection) return
    const profile = await tryGetProfile(project)
    try {
      const data = await getNameEntryData(
        overrideCollection,
        namespaceName,
        profile?.username || project
      )
      setNameEntryData(data)
    } catch (e) {
      setNameEntryData(undefined)
      console.log('Failed to get name entry: ', e)
    }
  }

  useMemo(async () => {
    refreshNameEntryData()
  }, [connection, namespaceName, project])

  const publicKey = tryPublicKey(project) || nameEntryData?.owner
  const config =
    (project && projectConfigs[project]) || projectConfigs['portals']!

  return (
    <ProjectConfigValues.Provider
      value={{
        config: publicKey
          ? {
              ...projectConfigs['default']!,
              issuer: { publicKey, nameEntryData },
            }
          : config,
      }}
    >
      {children}
    </ProjectConfigValues.Provider>
  )
}

export function useProjectConfig(): ProjectConfigValues {
  return useContext(ProjectConfigValues)
}
