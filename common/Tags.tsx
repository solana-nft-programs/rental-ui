import type { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import styled from '@emotion/styled'
import { stateColor } from 'common/NFTOverlay'

export const Tag = styled.div<{ state: TokenManagerState }>`
  color: ${({ state }) => stateColor(state, true)} !important;
`
