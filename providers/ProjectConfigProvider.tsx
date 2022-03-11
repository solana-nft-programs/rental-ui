import { getTokenAccountsWithData, TokenData } from 'api/api'
import React, {
  useState,
  useContext,
  useCallback,
  useEffect,
  ReactChild,
} from 'react'
import { useRouter } from 'next/router'
import { useEnvironmentCtx } from './EnvironmentProvider'

export interface ProjectConfigValues {
  logoImage: string
  colors: {}
  filters: {}[]
}

const ProjectConfigValues: React.Context<ProjectConfigValues> =
  React.createContext<ProjectConfigValues>({
    logoImage: '',
    colors: {},
    filters: [],
  })

export function ProjectConfigProvider({ children }: { children: ReactChild }) {
  const [config, setConfig] = useState<ProjectConfigValues | null>(null)
  const { connection } = useEnvironmentCtx()
  const [address] = useState<string | null>(null)

  const { asPath } = useRouter()
  const project = asPath.split('/')[1] ?? 'default'  

  const loadConfig = async () => {
    try {
      const jsonData = await fetch(
        `https://api.cardinal.so/config/${project}`
      ).then(async (r) => JSON.parse(await r.json()))

      const config = {
        logoImage: jsonData.logoImage,
        colors: jsonData.colors,
        filters: jsonData.filters,
      }
      setConfig(config)
    } catch (e) {}
  }

  useEffect(() => {
    loadConfig()
  }, [asPath])

  return (
    <ProjectConfigValues.Provider value={config}>
      {children}
    </ProjectConfigValues.Provider>
  )
}

export function useProjectConfigData(): ProjectConfigValues {
  const context = useContext(ProjectConfigValues)
  return context
}
