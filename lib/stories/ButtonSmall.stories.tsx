import type { ComponentMeta, ComponentStory } from '@storybook/react'
import { VscGear } from 'react-icons/vsc'

import { ButtonSmall } from '../src'
import { WalletGlyph } from '../src/common/Glyphs'

export default {
  title: 'Components/ButtonSmall',
  component: ButtonSmall,
} as ComponentMeta<typeof ButtonSmall>

const Template: ComponentStory<typeof ButtonSmall> = (args) => (
  <ButtonSmall {...args}></ButtonSmall>
)

export const SmallTextGlyph = Template.bind({})
SmallTextGlyph.args = {
  children: (
    <>
      <WalletGlyph />
      <>Connect wallet</>
    </>
  ),
}

export const SmallTextDisabledGlyph = Template.bind({})
SmallTextDisabledGlyph.args = {
  children: (
    <>
      <WalletGlyph />
      <>Connect wallet</>
    </>
  ),
  disabled: true,
}

export const SmallText = Template.bind({})
SmallText.args = {
  children: <>0.1 ◎ / Day</>,
}

export const SmallTextDisabled = Template.bind({})
SmallTextDisabled.args = {
  children: <>0.1 ◎ / Day</>,
  disabled: true,
}

export const SmallTextIcon = Template.bind({})
SmallTextIcon.args = {
  children: (
    <>
      <VscGear />
    </>
  ),
}

export const SmallTextIconDisabled = Template.bind({})
SmallTextIconDisabled.args = {
  children: (
    <>
      <VscGear />
    </>
  ),
  disabled: true,
}
