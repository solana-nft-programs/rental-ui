import Claim from 'components/Claim'

function ClaimHome(props: any) {
  return <Claim {...props} />
}

export async function getServerSideProps() {
  return {
    props: { test: 'asd' },
  }
}

export default ClaimHome
