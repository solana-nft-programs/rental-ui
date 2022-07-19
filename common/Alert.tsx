import { IoMdClose } from 'react-icons/io'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  variant: 'error'
  showClose?: boolean
}

export const Alert: React.FC<Props> = ({
  variant,
  showClose,
  children,
  onClick,
}: Props) => {
  return {
    error: (
      <div
        className="relative flex cursor-pointer items-center justify-center rounded-md border-[1px] border-red-500 bg-red-500 bg-opacity-25 p-4 text-light-2"
        onClick={onClick}
      >
        <div style={{ wordBreak: 'break-word' }}>{children}</div>
        {showClose && (
          <div className="absolute top-4 right-4">
            <IoMdClose />
          </div>
        )}
      </div>
    ),
  }[variant]
}
