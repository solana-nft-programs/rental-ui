import type { ComponentMeta, ComponentStory } from '@storybook/react'

import { Color } from '../src'

export default {
  title: 'Components/Colors',
} as ComponentMeta<typeof Color>

const Template: ComponentStory<typeof Color> = () => (
  <div className="flex flex-wrap gap-2">
    <Color name="primary" />
    <Color name="secondary" />
    <Color name="accent" />
    <Color name="light-0" />
    <Color name="light-1" />
    <Color name="light-2" />
    <Color name="medium-3" />
    <Color name="medium-4" />
    <Color name="dark-5" />
    <Color name="dark-6" />
  </div>
)

export const All = Template.bind({})
All.args = {}
