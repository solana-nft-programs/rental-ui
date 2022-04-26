import Colors from './colors'

export const NFTImageHeight =
  'h-[200px] sm:h-[175px] md:h-[150px] lg:h-[175px] xl:h-[190px] 2xl:h-[240px]'
export const NFTImageWidth =
  'w-[200px] sm:w-[175px] md:w-[150px] lg:w-[175px] xl:w-[190px] 2xl:w-[240px]'

export function TokensOuter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`${className} grid grid-cols-1 flex-wrap gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5`}
    >
      {children}
    </div>
  )
}

export function TokenMetadataStyle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    // w-[280px]
    <div
      className={`${className} relative inline-block rounded-lg text-center bg-[${Colors.tokenBackground}] z-0`}
    >
      {children}
    </div>
  )
}

export function EllipsisStyle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    // width-[35px], height-[35px]
    <div
      className={`${className} z-1 absolute top-6 right-10 flex items-center justify-center rounded-lg text-xl text-white bg-[${Colors.navBg}] hover:bg-[${Colors.background}]`}
      style={{ transition: '0.2s all' }}
    >
      {children}
    </div>
  )
}

export function DisabledEllipsisStyle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    // width-[35px], height-[35px]
    <div
      className={`${className} z-1 absolute top-6 right-10 flex items-center justify-center rounded-lg text-xl text-white bg-[${Colors.background}]`}
      style={{ transition: '0.2s all' }}
    >
      {children}
    </div>
  )
}

export function QRCodeStyle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  // width-[35px], height-[35px]
  return (
    <div
      className={`${className} z-5 absolute top-6 right-10 flex items-center justify-center rounded-xl text-base text-white bg-[${Colors.navBg}] hover:bg-[${Colors.background}]`}
      style={{ transition: '0.2s all' }}
    >
      {children}
    </div>
  )
}

export function UnissueStyle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`${className} z-5 absolute top-5 right-5 flex items-center justify-center rounded-xl text-lg text-white bg-[${Colors.navBg}] hover:bg-[${Colors.background}]`}
      style={{ transition: '0.2s all' }}
    >
      {children}
    </div>
  )
}

export function HeaderStyle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    // top: -50px;
    <div
      className={`${className} z-1 absolute w-full bg-white p-3 opacity-40`}
      style={{ transition: '0.2s all' }}
    >
      {children}
    </div>
  )
}

export function NameStyle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={`${className} text-sm`}>{children}</div>
}

export function MediaOuterStyle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  // height: 280px;
  return (
    <div className={`${className} flex max-w-full items-center justify-center`}>
      {children}
    </div>
  )
}

export function MediaOuterAndMediaStyle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  // --poster-color: transparent;
  return (
    <div className={`${className} h-full rounded-lg object-contain`}>
      {children}
    </div>
  )
}

// &:hover {
//   cursor: pointer;

//   #header {
//     top: 0;
//   }
// }
