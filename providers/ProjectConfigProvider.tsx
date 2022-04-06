import type { TokenData } from 'api/api'
import type { ProjectConfig } from 'config/config'
import { projectConfigs } from 'config/config'
import { useRouter } from 'next/router'
import type { ReactChild } from 'react'
import React, { useContext } from 'react'

export const filterTokens = (
  filters: { type: string; value: string }[],
  tokens: TokenData[]
): TokenData[] => {
  if (filters.length > 0) {
    filters.forEach((configFilter) => {
      if (configFilter.type === 'creators') {
        tokens = tokens.filter(
          (token) =>
            token.metadata.data.properties &&
            token.metadata.data.properties.creators &&
            token.metadata.data.properties.creators.some(
              (creator: { address: string }) =>
                creator.address === configFilter.value
            )
        )
      } else if (configFilter.type === 'symbol') {
        tokens = tokens.filter(
          (token) => token.metadata.data.symbol === configFilter.value
        )
      }
    })
  }
  return tokens.filter(
    (token) =>
      token.metadata.data && Object.keys(token.metadata.data).length > 0
  )
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
  const projectParams = query.project || query.host
  const project =
    projectParams &&
    (typeof projectParams === 'string' ? projectParams : projectParams[0])
      ?.split('.')[0]
      ?.replace('dev-', '')
  const config =
    (project && projectConfigs[project]) || projectConfigs['portals']!

  return (
    <ProjectConfigValues.Provider
      value={{
        config: config,
      }}
    >
      {children}
    </ProjectConfigValues.Provider>
  )
}

export function useProjectConfig(): ProjectConfigValues {
  return useContext(ProjectConfigValues)
}
