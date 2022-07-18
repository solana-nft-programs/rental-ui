interface Props {
  icon?: React.ReactNode
  title: string
  description: string | React.ReactNode
  disabled?: boolean
  width?: string
}

export const StepDetail: React.FC<Props> = ({
  icon,
  title,
  description,
}: Props) => {
  return (
    <div>
      {icon && <div className="h-4 w-4">{icon}</div>}
      <div className="flex flex-col gap-1">
        <div className="text-light-0">{title}</div>
        <div>{description}</div>
      </div>
    </div>
  )
}
