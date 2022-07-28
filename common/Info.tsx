import { css } from '@emotion/react'
import { GlyphPerformance } from 'assets/GlyphPerformance'
import { GlyphQuestion } from 'assets/GlyphQuestion'
import type { TokenSection } from 'config/config'
import { lighten } from 'polished'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { AiFillStar, AiOutlineShoppingCart } from 'react-icons/ai'
import { MdAccessTimeFilled, MdSell } from 'react-icons/md'

type Props = {
  colorized?: boolean
  section?: TokenSection
}
export const Info: React.FC<Props> = ({ section, colorized }: Props) => {
  const { config } = useProjectConfig()
  return (
    <div className="relative z-0 mx-10 mt-10 flex items-center gap-4 overflow-hidden rounded-xl px-8 py-4 text-xl">
      <div
        className="blur-4xl absolute left-20 top-[1/2] -z-10 h-[120px] w-[500px] -translate-y-1/2 -rotate-[60deg] bg-glow blur-[250px]"
        css={
          colorized &&
          css`
            background: ${lighten(0.5, config.colors.main)} !important;
          `
        }
      />
      <div
        className="blur-4xl absolute right-10 top-[1/2] -z-10 h-[120px] w-[300px] -translate-y-1/2 -rotate-[60deg] bg-glow blur-[250px]"
        css={
          colorized &&
          css`
            background: ${lighten(0.5, config.colors.main)} !important;
          `
        }
      />
      <div className="text-white">
        {section?.icon &&
          {
            time: <MdAccessTimeFilled />,
            featured: <AiFillStar />,
            listed: <AiOutlineShoppingCart />,
            rented: <AiOutlineShoppingCart />,
            available: (
              <MdSell className="h-[68px] w-[68px] rounded-full border-[2px] border-medium-4 p-3" />
            ),
            info: <GlyphQuestion />,
            performance: <GlyphPerformance />,
          }[section!.icon!]}
      </div>
      <div className="flex flex-col">
        <div className="text-medium-3">{section?.header}</div>
        <div className="text-light-0">{section?.description}</div>
      </div>
    </div>
  )
}
