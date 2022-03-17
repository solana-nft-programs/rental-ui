import { TokenData } from 'api/api'
import React, { useState, useContext, useEffect, ReactChild } from 'react'
import { useRouter } from 'next/router'
import { ProjectConfig, projectConfigs } from 'config/config'
export interface ProjectConfigValues {
  config: ProjectConfig
  setConfig: Function
}

const ProjectConfigValues: React.Context<ProjectConfigValues> =
  React.createContext<ProjectConfigValues>({
    config: projectConfigs['default']!,
    setConfig: () => {},
  })

export const filterTokens = (
  filters: { type: string; value: string }[],
  tokens: TokenData[]
): TokenData[] => {
  if (filters.length == 0) {
    // console.log('No filters')
  } else {
    filters.forEach((configFilter) => {
      if (configFilter.type === 'creators') {
        tokens = tokens.filter(
          (token) =>
            token.metadata.data.properties &&
            token.metadata.data.properties.creators.some(
              (creator: { address: string }) =>
                creator.address === configFilter.value
            )
        )
      } else if (configFilter.type == 'symbol') {
        tokens = tokens.filter(
          (token) => token.metadata.data.symbol == configFilter.value
        )
      }
    })
  }
  return tokens
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

export function ProjectConfigProvider({
  defaultConfig,
  children,
}: {
  children: ReactChild
  defaultConfig: ProjectConfig
}) {
  const [config, setConfig] = useState<ProjectConfig>(defaultConfig)

  const { query } = useRouter()
  const projectParams = query.project || query.host
  const project =
    projectParams &&
    (typeof projectParams == 'string' ? projectParams : projectParams[0])
      ?.split('.')[0]
      ?.replace('dev-', '')

  const loadConfig = async () => {
    try {
      if (!project) return
      console.log(`Loading project config for ${project}`)
      const config = projectConfigs[project] || projectConfigs['default']!
      setConfig(config)
    } catch (e) {
      console.log('Error fetching project config', e)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [project])

  return (
    <ProjectConfigValues.Provider
      value={{
        config,
        setConfig,
      }}
    >
      {children}
    </ProjectConfigValues.Provider>
  )
}

export function useProjectConfig(): ProjectConfigValues {
  return useContext(ProjectConfigValues)
}
