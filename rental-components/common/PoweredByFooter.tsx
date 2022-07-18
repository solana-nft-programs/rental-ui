import { LogoTitled } from '../common/LogoTitled'

export const PoweredByFooter = () => {
  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <div>Powered by</div>
      <LogoTitled light className="h-[12px]" />
    </div>
  )
}
