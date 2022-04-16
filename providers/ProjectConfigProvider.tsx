import {
  getNameEntryData,
  tryGetProfile,
} from '@cardinal/namespaces-components'
import type { PublicKey } from '@solana/web3.js'
import { Connection } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { tryPublicKey } from 'api/utils'
import type { ProjectConfig } from 'config/config'
import { projectConfigs } from 'config/config'
import type { NextPageContext } from 'next'
import type { ReactChild } from 'react'
import React, { useContext, useState } from 'react'

import { ENVIRONMENTS } from './EnvironmentProvider'

export const getInitialProps = async ({
  ctx,
}: {
  ctx: NextPageContext
}): Promise<{ config: ProjectConfig }> => {
  const projectParams =
    ctx.query.collection || ctx.req?.headers.host || ctx.query.host
  const project =
    projectParams &&
    (typeof projectParams === 'string' ? projectParams : projectParams[0])
      ?.split('.')[0]
      ?.replace('dev-', '')

  const cluster = (ctx.query.cluster || ctx.req?.headers.host)?.includes('dev')
    ? 'devnet'
    : ctx.query.cluster || process.env.BASE_CLUSTER
  const foundEnvironment = ENVIRONMENTS.find((e) => e.label === cluster)!
  const overrideCollection = foundEnvironment.override
    ? new Connection(foundEnvironment.override)
    : new Connection(foundEnvironment.value, { commitment: 'recent' })

  const namespaceName = 'twitter'
  let publicKey
  let nameEntryData
  if (project) {
    const profile = await tryGetProfile(project)
    try {
      publicKey = tryPublicKey(project)
      if (!publicKey) {
        nameEntryData = await getNameEntryData(
          overrideCollection,
          namespaceName,
          profile?.username || project
        )
        publicKey = tryPublicKey(project) || nameEntryData?.owner
      }
    } catch (e) {
      console.log('Failed to get name entry: ', e)
    }
  }
  const config = project
    ? projectConfigs[project] || projectConfigs['default']!
    : projectConfigs['default']!

  return {
    config: publicKey
      ? {
          ...projectConfigs['default']!,
          issuer: { publicKeyString: publicKey.toString() },
        }
      : config,
  }
}

export const filterTokens = (
  filters: { type: string; value: string }[],
  tokens: TokenData[],
  issuer?: PublicKey | null
): TokenData[] => {
  return tokens.filter((token) => {
    let filtered = false
    if (filters.length > 0 || issuer) {
      filters.forEach((configFilter) => {
        if (
          configFilter.type === 'creators' &&
          !token?.metadata?.data?.properties?.creators?.some(
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
      token?.metadata?.data &&
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
  setProjectConfig: (s: string) => void
}

const ProjectConfigValues: React.Context<ProjectConfigValues> =
  React.createContext<ProjectConfigValues>({
    config: projectConfigs['portals']!,
    setProjectConfig: () => {},
  })

export function ProjectConfigProvider({
  children,
  defaultConfig,
}: {
  children: ReactChild
  defaultConfig: ProjectConfig
}) {
  const [config, setConfig] = useState<ProjectConfig>(defaultConfig)
  return (
    <ProjectConfigValues.Provider
      value={{
        config: config,
        setProjectConfig: (project: string) => {
          if (projectConfigs[project]) {
            setConfig(projectConfigs[project]!)
          }
        },
      }}
    >
      {children}
    </ProjectConfigValues.Provider>
  )
}

export function useProjectConfig(): ProjectConfigValues {
  return useContext(ProjectConfigValues)
}
