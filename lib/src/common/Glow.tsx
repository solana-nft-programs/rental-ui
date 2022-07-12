export const Glow = ({ children }: { children: JSX.Element }) => {
  return (
    <div className="relative h-fit w-fit overflow-visible">
      <div
        className="absolute left-1/4 h-full w-1/2"
        style={{
          background: '#7560FF',
          opacity: 0.7,
          filter: 'blur(50px)',
          transform: 'rotate(35.65deg)',
        }}
      ></div>
      {children}
    </div>
  )
}
