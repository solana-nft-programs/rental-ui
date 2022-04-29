import { ApolloClient, InMemoryCache } from '@apollo/client'

const client = new ApolloClient({
  uri: '//graph.holaplex.com/v1',
  cache: new InMemoryCache({ resultCaching: false }),
})

export default client
