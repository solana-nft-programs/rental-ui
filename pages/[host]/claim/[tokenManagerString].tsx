import Claim from 'components/Claim'

function ClaimHome(props: any) {
  return <Claim {...props} />
}

export async function getServerSideProps() {
  return {
    props: {},
  }
}

export default ClaimHome
