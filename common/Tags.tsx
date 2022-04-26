// import type { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
// import { stateColor } from 'common/NFTOverlay'

export function StyledTag({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={`${className} flex flex-col items-center justify-center text-center`}
    >
      {children}
    </span>
  )
}

export function Tag({
  children,
  // state,
  className,
  onClick,
}: {
  children: React.ReactNode
  // state: TokenManagerState
  className?: string
  onClick?: () => void
}) {
  return (
    <span
      onClick={onClick}
      className={`${className} flex cursor-pointer text-xs`}
      // style={{ color: stateColor(state, true) }}
    >
      {children}
    </span>
  )
}
