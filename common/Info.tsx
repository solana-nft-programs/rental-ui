import { GlyphPerformance } from 'assets/GlyphPerformance'
import { GlyphQuestion } from 'assets/GlyphQuestion'
import type { TokenSection } from 'config/config'
import { AiFillStar, AiOutlineShoppingCart } from 'react-icons/ai'
import { MdAccessTimeFilled, MdSell } from 'react-icons/md'

type Props = {
  section?: TokenSection
}
export const Info: React.FC<Props> = ({ section }: Props) => {
  return (
    <div className="mx-10 mt-10 flex items-center gap-4 text-xl">
      <div className="text-white">
        {section?.icon &&
          {
            time: <MdAccessTimeFilled />,
            featured: <AiFillStar />,
            listed: <AiOutlineShoppingCart />,
            rented: <AiOutlineShoppingCart />,
            available: <MdSell />,
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
