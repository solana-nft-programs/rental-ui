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
import Colors from 'common/colors'

export interface ProjectConfigValues {
  logoImage: string
  colors: { main: string; secondary: string }
  filters: { type: string; publicKey: string }[]
  projectName: string
}

const ProjectConfigValues: React.Context<ProjectConfigValues> =
  React.createContext<ProjectConfigValues>({
    logoImage: '',
    colors: { main: '', secondary: '' },
    filters: [],
    projectName: '',
  })

export const filterTokens = (
  filters: { type: string; publicKey: string }[],
  tokens: TokenData[]
): TokenData[] => {
  if (filters.length == 0) {
    // console.log('No filters')
  } else {
    // console.log("Got filters!")
    // console.log(filters)
    for (const configFilter of filters) {
      if (configFilter.type === 'creators') {
        tokens = tokens.filter(
          (token) =>
            token.metadata.data.properties &&
            token.metadata.data.properties.creators.some(
              (creator) => creator.address === configFilter.publicKey
            )
        )
      }
    }
  }
  console.log(tokens)
  return tokens
}

export function ProjectConfigProvider({ children }: { children: ReactChild }) {
  const [logoImage, setLogoImage] = useState<string>('')
  const [colors, setColors] = useState<{ main: string; secondary: string }>()
  const [filters, setFilters] = useState<{ type: string; publicKey: string }[]>(
    []
  )
  const [projectName, setProjectName] = useState<string>('')

  const { asPath } = useRouter()
  const project = asPath.split('/')[1] ?? 'default'

  const loadConfig = async () => {
    try {
      const jsonData = await fetch(
        `https://api.cardinal.so/config/${project}`
      ).then(async (r) => JSON.parse(await r.json()))
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

  console.log(filters)

  return (
    <ProjectConfigValues.Provider
      value={{
        logoImage,
        colors,
        filters,
        projectName,
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
