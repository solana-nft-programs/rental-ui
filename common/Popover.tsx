import { Popover as HeadlessPopover } from '@headlessui/react'
import type { Placement } from '@popperjs/core'
// import { animated, config, useTransition } from '@react-spring/web'
import React, { Fragment, useState } from 'react'
import { usePopper } from 'react-popper'

// const Arrow = styled.div`
//   width: 8px;
//   height: 8px;
//   ::before {
//     position: absolute;
//     width: 8px;
//     height: 8px;
//     z-index: -1;
//     content: '';
//     transform: rotate(45deg);
//   }
//   &.arrow-top {
//     bottom: -5px;
//     ::before {
//       border-top: none;
//       border-left: none;
//     }
//   }
//   &.arrow-bottom {
//     top: -5px;
//     ::before {
//       border-bottom: none;
//       border-right: none;
//     }
//   }
//   &.arrow-left {
//     right: -5px;
//     ::before {
//       border-bottom: none;
//       border-left: none;
//     }
//   }
//   &.arrow-right {
//     left: -5px;
//     ::before {
//       border-right: none;
//       border-top: none;
//     }
//   }
// `

// export const Popover: React.FC<PopoverProps> = ({
//   content,
//   children,
//   placement = 'right-end',
// }: PopoverProps) => {
//   const [show, setShow] = useState(false)
//   const [referenceElement, setReferenceElement] =
//     useState<HTMLDivElement | null>(null)
//   const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
//     null
//   )
//   const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null)

//   const { styles, attributes, update } = usePopper(
//     referenceElement,
//     popperElement,
//     {
//       placement,
//       modifiers: [
//         { name: 'offset', options: { offset: [20, 0] } },
//         // { name: 'arrow', options: { element: arrowElement } },
//       ],
//     }
//   )

//   const transition = useTransition(show, {
//     from: { scale: 0.96, opacity: 1 },
//     enter: { scale: 1, opacity: 1 },
//     leave: { scale: 1, opacity: 0 },
//     config: { ...config.default, duration: 100 },
//   })

//   const handleClickOutside = (e: any) => {
//     if (popperElement && !popperElement.contains(e.target)) {
//       // setShow(false)
//       togglePopover(e)
//     }
//   }

//   useEffect(() => {
//     document.addEventListener('click', handleClickOutside, true)
//     return () => {
//       document.removeEventListener('click', handleClickOutside, true)
//     }
//   }, [])

//   const togglePopover = (e: any) => {
//     e.preventDefault()
//     e.stopPropagation()
//     setShow(!show)
//     update && update()
//   }

//   return (
//     <>
//       <div ref={setReferenceElement} onClick={togglePopover}>
//         {children}
//       </div>
//       {show &&
//         transition(
//           (springStyles, item) =>
//             item && (
//               <>
//                 <div
//                   ref={setPopperElement}
//                   className="z-100 absolute"
//                   style={styles.popper}
//                   {...attributes.popper}
//                 >
//                   <animated.div
//                     className="dark:bg-warmGray-800 text-base shadow"
//                     style={springStyles}
//                   >
//                     {content}
//                   </animated.div>
//                   {/* <Arrow
//                     className={`arrow-${
//                       attributes.popper?.['data-popper-placement'] ?? ''
//                     }`}
//                     ref={setArrowElement}
//                     style={styles.arrow}
//                     {...attributes.arrow}
//                   /> */}
//                 </div>
//               </>
//             )
//         )}
//     </>
//   )
// }

export interface PopoverProps {
  content: React.ReactNode
  guide?: boolean
  children: React.ReactNode
  placement?: Placement
  offset?: [number, number]
}

export const Popover: React.FC<PopoverProps> = ({
  content,
  children,
  placement = 'right-end',
  offset = [-25, 5],
}) => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null)
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null
  )
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement,
    modifiers: [
      { name: 'offset', options: { offset } },
      // { name: 'arrow', options: { element: arrowElement } },
    ],
  })

  return (
    <HeadlessPopover>
      {/* @ts-ignore */}
      <HeadlessPopover.Button as={Fragment} ref={setReferenceElement}>
        {children}
      </HeadlessPopover.Button>
      <HeadlessPopover.Panel
        ref={setPopperElement}
        style={{ ...styles.popper, zIndex: 100 }}
        {...attributes.popper}
      >
        {content}
      </HeadlessPopover.Panel>
    </HeadlessPopover>
  )
}

export const PopoverItem = ({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) => (
  <div
    className={`${className} rounded-md px-2 py-1 hover:bg-[rgba(255,255,255,0.1)]`}
  >
    {children}
  </div>
)
