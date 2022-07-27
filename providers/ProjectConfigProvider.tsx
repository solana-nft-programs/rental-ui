import type { TokenData } from 'api/api'
import type { ProjectConfig } from 'config/config'
import { projectConfigs } from 'config/config'
import type { NextPageContext } from 'next'
import type { ReactChild } from 'react'
import React, { useContext, useState } from 'react'

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

  return {
    config: project
      ? projectConfigs[project] || projectConfigs['default']!
      : projectConfigs['default']!,
  }
}

export const filterTokens = (
  tokens: TokenData[],
  filter?: {
    type: 'creators' | 'symbol' | 'issuer' | 'state' | 'claimer' | 'owner'
    value: string[]
  },
  cluster?: string | undefined
): TokenData[] => {
  return tokens.filter((token) => {
    let filtered = false
    if (filter) {
      if (
        filter.type === 'creators' &&
        !token.metaplexData?.data?.data?.creators?.some(
          (creator) =>
            filter.value.includes(creator.address.toString()) &&
            ((cluster && cluster === 'devnet') || creator.verified)
        )
      ) {
        filtered = true
      } else if (
        filter.type === 'symbol' &&
        token.metadata?.data?.symbol !== filter.value
      ) {
        filtered = true
      } else if (
        filter.type === 'issuer' &&
        !filter.value.includes(
          token.tokenManager?.parsed.issuer.toString() ?? ''
        )
      ) {
        filtered = true
      } else if (
        filter.type === 'state' &&
        token.tokenManager?.parsed &&
        filter.value.includes(token.tokenManager?.parsed.state.toString())
      ) {
        filtered = true
      } else if (
        filter.type === 'claimer' &&
        token.recipientTokenAccount &&
        filter.value.includes(token.recipientTokenAccount.owner.toString())
      ) {
        filtered = true
      } else if (
        filter.type === 'owner' &&
        token.tokenAccount &&
        filter.value.includes(
          token.tokenAccount?.account.data.parsed.info.owner.toString()
        ) &&
        !token.tokenManager
      ) {
        filtered = true
      }
    }
    return (
      !!token?.metadata?.data &&
      Object.keys(token.metadata.data).length > 1 &&
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
  configFromToken: (tokenData?: TokenData) => ProjectConfig
}

const ProjectConfigValues: React.Context<ProjectConfigValues> =
  React.createContext<ProjectConfigValues>({
    config: projectConfigs['default']!,
    setProjectConfig: () => {},
    configFromToken: () => projectConfigs['default']!,
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
        configFromToken: (tokenData?: TokenData) =>
          (tokenData &&
            Object.values(projectConfigs).find(
              (c) => filterTokens([tokenData], c.filter).length > 0
            )) ??
          config,
      }}
    >
      {children}
    </ProjectConfigValues.Provider>
  )
}

export function useProjectConfig(): ProjectConfigValues {
  return useContext(ProjectConfigValues)
}
