import { TokenData } from 'api/api'
import React, { useState, useContext, useEffect, ReactChild } from 'react'
import { useRouter } from 'next/router'

export interface ProjectConfigValues {
  logoImage: string
  colors: { main: string; secondary: string }
  filters: { type: string; value: string }[]
  projectName: string
  configLoaded: boolean
}

const defaultMain = 'rgba(0, 0, 0, 0.15)'
const defaultSecondary = 'rgb(29, 155, 240)'

const ProjectConfigValues: React.Context<ProjectConfigValues> =
  React.createContext<ProjectConfigValues>({
    logoImage: '',
    colors: { main: '', secondary: '' },
    filters: [],
    projectName: '',
    configLoaded: false,
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
              (creator) => creator.address === configFilter.value
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

export function ProjectConfigProvider({ children }: { children: ReactChild }) {
  const [logoImage, setLogoImage] = useState<string>('')
  const [colors, setColors] = useState<{ main: string; secondary: string }>({
    main: defaultMain,
    secondary: defaultSecondary,
  })
  const [filters, setFilters] = useState<{ type: string; value: string }[]>([])
  const [projectName, setProjectName] = useState<string>('')
  const [configLoaded, setConfigLoaded] = useState<boolean>(false)

  const { asPath } = useRouter()
  const project = asPath.split('/')[1] ?? 'default'

  const loadConfig = async () => {
    try {
      if (project == '[project]') return
      const jsonData = await fetch(`https://api.cardinal.so/config/${project}`)
        .then(async (r) => JSON.parse(await r.json()))
        .finally(() => {
          if (projectName) setConfigLoaded(true)
        })
      setLogoImage(jsonData.logoImage)
      setColors(jsonData.colors)
      setFilters(jsonData.filters)
      setProjectName(jsonData.projectName)
    } catch (e) {
      console.log('ERROR', e)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [asPath])

  return (
    <ProjectConfigValues.Provider
      value={{
        logoImage,
        colors,
        filters,
        projectName,
        configLoaded,
      }}
    >
      {children}
    </ProjectConfigValues.Provider>
  )
}

export function useProjectConfigData(): ProjectConfigValues {
  const context = useContext(ProjectConfigValues)
  return context
}
