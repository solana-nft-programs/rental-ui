export const Glow = ({
  angle = 35.64,
  blur = 50,
  scale = 1,
  children,
  className,
}: {
  angle?: number
  blur?: number
  scale?: number
  children: JSX.Element | JSX.Element[]
  className?: string
}) => {
  return (
    <div className={`relative h-fit w-fit overflow-visible ${className}`}>
      <div
        className="absolute left-1/4 h-full w-1/2"
        style={{
          background: '#7560FF',
          opacity: 0.7,
          filter: `blur(${blur}px)`,
          transform: `rotate(${angle}deg) scale(${scale})`,
        }}
      ></div>
      {children}
    </div>
  )
}
