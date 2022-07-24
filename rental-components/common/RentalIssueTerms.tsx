export interface RentalIssueTermsParams
  extends React.HTMLAttributes<HTMLDivElement> {
  confirmed: boolean
}

export const RentalIssueTerms: React.FC<RentalIssueTermsParams> = ({
  confirmed,
  ...props
}: RentalIssueTermsParams) => {
  return (
    <div {...props} className="flex cursor-pointer gap-3 text-sm">
      <div
        className={`h-5 w-5 shrink-0 rounded-md border-[2px] border-border transition-all ${
          confirmed ? 'bg-primary' : ''
        }`}
      />
      <div>
        I have read, understood and agree to Risk Disclaimer, as well as I agree
        to the rental terms displayed here.
      </div>
    </div>
  )
}
