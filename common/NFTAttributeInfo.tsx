import type { TokenData } from 'apis/api'
import { useMintMetadata } from 'hooks/useMintMetadata'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { BsFillInfoCircleFill } from 'react-icons/bs'

import { Tooltip } from './Tooltip'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  tokenData: Pick<TokenData, 'metaplexData' | 'indexedData'>
}

export const NFTAttributeInfo = ({ tokenData, className }: Props) => {
  const { config } = useProjectConfig()
  const metadata = useMintMetadata(tokenData).data
  const attributesByTraitType = metadata?.parsed.attributes?.reduce(
    (acc, attr) => ({ ...acc, [attr.trait_type]: attr }),
    {} as { [trait_type: string]: { value: string } }
  )
  if (!attributesByTraitType) return <></>
  return (
    <Tooltip
      className={`cursor-pointer rounded-md text-light-0`}
      title={
        <div>
          {metadata?.parsed.attributes?.map((attr, i) => (
            <div
              key={i}
              className={`flex items-center justify-between gap-1 rounded-md py-[2px] text-sm text-light-0`}
            >
              <div className="font-bold">{attr.trait_type}</div>
              <div className="text-light-2">{attr?.value}</div>
            </div>
          ))}
        </div>
      }
    >
      <div
        className={`${className} flex items-center gap-3 rounded-md text-light-0 ${
          config.attributeDisplay && 'bg-dark-5 px-2 py-1'
        }`}
      >
        {config.attributeDisplay && (
          <div className="flex items-center gap-2">
            {config.attributeDisplay.map(
              ({ displayName, attributeName }, i) =>
                attributesByTraitType[attributeName] && (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="font-semibold">
                        {displayName || attributeName}:{' '}
                      </div>
                      <div>{attributesByTraitType[attributeName]?.value}</div>
                    </div>
                    {config.attributeDisplay &&
                      config.attributeDisplay?.length > 1 &&
                      i !== config.attributeDisplay?.length - 1 && <div>|</div>}
                  </div>
                )
            )}
          </div>
        )}
        <div
          className={`flex items-center gap-1 ${
            config.attributeDisplay
              ? 'scale-[1.25] text-light-2'
              : 'scale-[1.5] rounded-full bg-light-0 text-dark-6'
          }`}
        >
          <BsFillInfoCircleFill />
        </div>
      </div>
    </Tooltip>
  )
}
