import { NFT, TokensOuter } from 'common/NFT'
import { useManagedTokens } from 'providers/ManagedTokensProvider'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'

export const Manage = () => {
  const { managedTokens, loaded } = useManagedTokens()
  return (
    <TokensOuter>
      {managedTokens && managedTokens.length > 0 ? (
        managedTokens.map((tokenData) => (
          <NFT
            key={tokenData?.tokenAccount?.pubkey.toBase58()}
            tokenData={tokenData}
          ></NFT>
        ))
      ) : loaded ? (
        <div className="white flex w-full flex-col items-center justify-center gap-1">
          <div className="text-white">No outstanding tokens!</div>
        </div>
      ) : (
        <div className="flex w-full items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
    </TokensOuter>
  )
}
