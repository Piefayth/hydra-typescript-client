# hydra-typescript-client

```
npm install hydra-typescript-client
```

Stateful Typescript client for [Hydra](https://github.com/input-output-hk/hydra). Works in browser (with a CORS proxy for some functionality) and node. 

Only compatible with Hydra 0.11.0.

Usage:

```ts
import { HydraClient } from "hydra-typescript-client"

async function main() {
    const host = 'localhost:4001' // no protocol
    const client = new HydraClient(host)

    await client.init() // reads the history, brings the state up to date

    client.onMessage((message: ServerResponse) => {
        // access messages as they are published
        console.log(message)
    })

    // or rely on the client to manage state for you
    const snapshotUtxos = client.state.headUtxos
    const currentStatus = client.state.stateKind
    const signingParties = client.state.parties
}
```