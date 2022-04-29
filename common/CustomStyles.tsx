import Colors from './colors'

export const NFTImageHeight =
  'h-[200px] sm:h-[180px] md:h-[180px] lg:h-[200px] xl:h-[240px] 2xl:h-[280px]'
export const NFTImageWidth =
  'w-[200px] sm:w-[180px] md:w-[180px] lg:w-[200px] xl:w-[240px] 2xl:w-[280px]'
export const NFTImageMaxWidth =
  'max-w-[200px] sm:max-w-[180px] md:max-w-[180px] lg:max-w-[200px] xl:max-w-[240px] 2xl:max-w-[280px]'

export function TokensOuterStyle({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: { [key: string]: string }
}) {
  return (
    <div
      className={`${className} mx-auto flex flex-wrap justify-center gap-5`}
      style={style}
    >
      {children}
    </div>
  )
}

export function TokenMetadataStyle({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: { [key: string]: string }
}) {
  return (
    <div
      className={`${className} relative z-0 inline-block text-center`}
      style={{ ...style, backgroundColor: Colors.tokenBackground }}
    >
      {children}
    </div>
  )
}

export function EllipsisStyle({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: { [key: string]: string }
}) {
  return (
    <div
      className={`${className} z-1 absolute top-6 right-10 flex items-center justify-center rounded-lg text-xl text-white`}
      style={{
        ...style,
        transition: '0.2s all',
        backgroundColor: Colors.navBg,
      }}
    >
      {children}
    </div>
  )
}

export function DisabledEllipsisStyle({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: { [key: string]: string }
}) {
  return (
    <div
      className={`${className} z-1 absolute top-6 right-10 flex items-center justify-center rounded-lg text-xl text-white`}
      style={{
        ...style,
        transition: '0.2s all',
        backgroundColor: Colors.tokenBackground,
      }}
    >
      {children}
    </div>
  )
}

export function QRCodeStyle({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: { [key: string]: string }
}) {
  return (
    <div
      className={`${className} z-5 absolute top-6 right-10 flex items-center justify-center rounded-xl text-base text-white`}
      style={{
        ...style,
        transition: '0.2s all',
        backgroundColor: Colors.navBg,
      }}
    >
      {children}
    </div>
  )
}

export function UnissueStyle({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: { [key: string]: string }
}) {
  return (
    <div
      className={`${className} z-5 absolute top-5 right-5 flex items-center justify-center rounded-xl text-lg text-white`}
      style={{
        ...style,
        transition: '0.2s all',
        backgroundColor: Colors.navBg,
      }}
    >
      {children}
    </div>
  )
}

export function HeaderStyle({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: { [key: string]: string }
}) {
  return (
    <div
      className={`${className} z-1 absolute w-full bg-white p-3 opacity-40`}
      style={{ ...style, transition: '0.2s all' }}
    >
      {children}
    </div>
  )
}

export function NameStyle({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: { [key: string]: string }
}) {
  return (
    <div className={`${className} text-sm`} style={style}>
      {children}
    </div>
  )
}

export function MediaOuterStyle({
  children,
  className,
  style,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  style?: { [key: string]: string }
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`${className} flex max-w-full items-center justify-center`}
      style={style}
    >
      {children}
    </div>
  )
}

export function MediaOuterAndMediaStyle({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: { [key: string]: string }
}) {
  return (
    <div
      className={`${className} h-full rounded-lg object-contain`}
      style={style}
    >
      {children}
    </div>
  )
}
