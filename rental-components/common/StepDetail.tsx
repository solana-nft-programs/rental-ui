import styled from '@emotion/styled'

interface Props {
  icon: React.ReactNode
  title: string
  description: string | React.ReactNode
  disabled?: boolean
  width?: string
}

export const StepDetail: React.FC<Props> = ({
  icon,
  title,
  description,
  disabled,
  width,
}: Props) => {
  return (
    <Wrapper disabled={disabled} width={width}>
      {icon}
      <Info>
        <Title>{title}</Title>
        <Description>{description}</Description>
      </Info>
    </Wrapper>
  )
}

const Wrapper = styled.div<{ disabled?: boolean; width?: string }>`
  display: grid;
  grid-template-columns: 18px 1fr;
  grid-column-gap: 9px;
  width: ${({ width }) => width ?? '100%'};
  opacity: ${({ disabled }) => (disabled ? 0.3 : 1)};

  svg {
    height: 16px;
    width: 16px;
  }
`

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const Title = styled.span`
  font-weight: bold;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: -0.02em;
  color: #000000;
`

const Description = styled.div`
  margin: 0;
  font-size: 12px;
  line-height: 15px;
  letter-spacing: -0.02em;
  color: #696969;
`
