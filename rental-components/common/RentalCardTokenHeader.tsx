import type { TokenData } from 'api/api'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  tokenDatas: TokenData[]
}

export const RentalCardTokenHeader: React.FC<Props> = ({
  tokenDatas,
}: Props) => {
  return (
    <div
      className={
        `flex w-full gap-4 overflow-scroll overflow-x-auto py-4 ` +
        (tokenDatas.length <= 2 ? 'justify-center' : '')
      }
    >
      {tokenDatas.map((tokenData, i) => (
        <div
          key={i}
          className="w-1/2 flex-shrink-0 overflow-hidden rounded-lg bg-medium-4"
        >
          {tokenData.metadata && tokenData.metadata.data && (
            <img
              src={tokenData.metadata.data.image}
              alt={tokenData.metadata.data.name}
            />
          )}
        </div>
      ))}
    </div>
  )
}
