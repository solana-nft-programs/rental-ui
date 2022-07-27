import { css } from '@emotion/react'
import type { TokenData } from 'api/api'
import type { ProjectConfig } from 'config/config'
import { lighten } from 'polished'

export const getAllAttributes = (
  tokens: TokenData[]
): NFTAtrributeFilterValues => {
  const allAttributes: { [traitType: string]: Set<any> } = {}
  tokens.forEach((tokenData) => {
    if (
      tokenData?.metadata?.data?.attributes &&
      tokenData?.metadata?.data?.attributes.length > 0
    ) {
      tokenData?.metadata?.data?.attributes.forEach(
        (attribute: { trait_type: string; value: string }) => {
          if (attribute.trait_type in allAttributes) {
            allAttributes[attribute.trait_type]!.add(attribute.value)
          } else {
            allAttributes[attribute.trait_type] = new Set([attribute.value])
          }
        }
      )
    }
  })

  const sortedAttributes: { [traitType: string]: string[] } = {}
  Object.keys(allAttributes).forEach((traitType) => {
    sortedAttributes[traitType] = Array.from(allAttributes[traitType] ?? [])
  })
  return sortedAttributes
}

export const filterTokensByAttributes = (
  tokens: TokenData[],
  filters: NFTAtrributeFilterValues,
  union = false
): TokenData[] => {
  if (
    Object.keys(filters).length <= 0 ||
    Object.values(filters).filter((v) => v.length > 0).length <= 0
  ) {
    return tokens
  }
  return tokens.filter((tokenData) => {
    let matchOne = false
    let missOne = false
    Object.keys(filters).forEach((filterName) => {
      filters[filterName]?.forEach((val) => {
        if (
          tokenData.metadata?.data.attributes.filter(
            (a: { trait_type: string; value: string }) =>
              a.trait_type === filterName && a.value === val
          ).length > 0
        ) {
          matchOne = true
        } else {
          missOne = true
        }
      })
    })
    return union ? matchOne : !missOne
  })
}

export type NFTAtrributeFilterValues = { [filterName: string]: string[] }

interface NFTAtrributeFiltersProps {
  tokenDatas?: TokenData[]
  config: ProjectConfig
  sortedAttributes: NFTAtrributeFilterValues
  selectedFilters: NFTAtrributeFilterValues
  setSelectedFilters: (arg: NFTAtrributeFilterValues) => void
}

export const getNFTAtrributeFilters = ({
  tokenDatas,
  config,
  sortedAttributes,
  selectedFilters,
  setSelectedFilters,
}: NFTAtrributeFiltersProps) => {
  return Object.keys(sortedAttributes)
    .sort()
    .map((traitType) => ({
      label: traitType,
      content: (
        <div key={traitType} className="px-3 pb-3 text-xs">
          {sortedAttributes[traitType]!.map((value) => (
            <div
              key={`${traitType}-${value}`}
              className="flex items-center justify-between"
              onClick={() =>
                setSelectedFilters({
                  ...selectedFilters,
                  [traitType]: selectedFilters[traitType]?.includes(value)
                    ? selectedFilters[traitType]?.filter((v) => v !== value) ??
                      []
                    : [...(selectedFilters[traitType] ?? []), value],
                })
              }
            >
              <div
                className="flex cursor-pointer items-center gap-2 py-[2px] text-light-0 transition-colors"
                css={css`
                  &:hover {
                    color: ${config.colors.secondary};
                    div {
                      border-color: ${lighten(0.2, config.colors.secondary)};
                    }
                  }
                `}
              >
                <div
                  className={`h-3 w-3 rounded-sm border-[.5px] border-light-1 transition-all`}
                  css={css`
                    background: ${selectedFilters[traitType]?.includes(value)
                      ? config.colors.secondary
                      : ''};
                  `}
                >
                  {}
                </div>
                <div>{value}</div>
              </div>
              <div className="text-medium-3">
                {tokenDatas
                  ? filterTokensByAttributes(tokenDatas, {
                      [traitType]: [value],
                    }).length
                  : ''}
              </div>
            </div>
          ))}
        </div>
      ),
    }))
}
