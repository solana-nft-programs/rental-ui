import { logEvent } from '@amplitude/analytics-browser'
import { GlyphBrowse } from 'assets/GlyphBrowse'
import type { ProjectConfig } from 'config/config'
import { useEffect, useRef, useState } from 'react'
import { AiOutlineMenu } from 'react-icons/ai'
import { BiChevronDown, BiChevronUp } from 'react-icons/bi'

import { ButtonSmall } from './ButtonSmall'
import { CollectionsGrid } from './CollectionsGrid'
import { CollectionsList } from './CollectionsList'
import { TabSelector } from './TabSelector'

type VIEW_OPTIONS = 'grid' | 'list'
const VIEW_TABS: {
  label: JSX.Element
  value: VIEW_OPTIONS
  disabled?: boolean
  tooltip?: string
}[] = [
  {
    label: <GlyphBrowse />,
    value: 'grid',
  },
  {
    label: <AiOutlineMenu className="text-xl" />,
    value: 'list',
  },
]

export const CollectionsView = ({
  configs,
  header,
}: {
  configs: ProjectConfig[]
  header?: { title?: string; description?: string }
}) => {
  const [view, setView] = useState<VIEW_OPTIONS>('grid')
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(
    () =>
      window.scrollTo({
        behavior: 'smooth',
        top: (ref.current?.offsetTop ?? 0) - 50,
      }),
    [view]
  )
  return (
    <div ref={ref}>
      <div className="flex flex-col gap-2">
        {header?.title && (
          <>
            <div className="text-5xl text-light-0">{header.title}</div>
          </>
        )}
        <div className="flex items-center justify-between">
          <div className="mb-6 text-lg text-medium-3">
            {header?.description}{' '}
          </div>
          <div className="mb-6 flex justify-end">
            <TabSelector<VIEW_OPTIONS>
              defaultOption={VIEW_TABS[0]}
              options={VIEW_TABS}
              value={VIEW_TABS.find((p) => p.value === view)}
              onChange={(o) => {
                logEvent('collection: set view', {
                  view_value: o?.label,
                })
                setView(o.value)
              }}
            />
          </div>
          {/* <div
                className="cursor-pointer px-4 text-2xl"
                onClick={() => setView((v) => (v === 'grid' ? 'list' : 'grid'))}
              >
                {view === 'grid' ? (
                  <AiOutlineMenu />
                ) : (
                  <div className="scale-[1.25] px-1">
                    <GlyphBrowse />
                  </div>
                )}
              </div> */}
        </div>
      </div>
      {view === 'grid' ? (
        <div>
          <CollectionsGrid configs={configs.slice(0, 8)} />
          <div className="mt-3 flex items-center justify-center">
            <ButtonSmall onClick={() => setView('list')}>
              <div className="flex items-center">
                <div>See all</div>
                <div className="text-xl">
                  <BiChevronDown />
                </div>
              </div>
            </ButtonSmall>
          </div>
        </div>
      ) : (
        <div>
          <CollectionsList configs={configs} />
          <div className="mt-3 flex items-center justify-center">
            <ButtonSmall onClick={() => setView('grid')}>
              <div className="flex items-center">
                <div>View</div>
                <div className="text-xl">
                  <BiChevronUp />
                </div>
              </div>
            </ButtonSmall>
          </div>
        </div>
      )}
    </div>
  )
}
