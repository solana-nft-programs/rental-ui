export const Glow = ({
  angle = 35.64,
  children,
}: {
  angle?: number
  children: JSX.Element
}) => {
  return (
    <div className="relative h-fit w-fit overflow-visible">
      <div
        className="absolute left-1/4 h-full w-1/2"
        style={{
          background: '#7560FF',
          opacity: 0.7,
          filter: 'blur(50px)',
          transform: `rotate(${angle}deg)`,
        }}
      ></div>
      {children}
    </div>
  )
}
