import { Party, Utxos } from "../model/ServerResponse";

export type NodeStateKind = "Initializing" |  "Open" | "Closed" | "FanoutPossible" | "Final" | "Idle"

export default class NodeState {
    stateKind: NodeStateKind = "Idle"
    peers = new Set<string>()
    parties: Party[] = []
    headId: string | undefined = undefined
    committedUtxos: Record<string, Utxos> = {}
    headUtxos: Utxos = {}
    nodeId: string | undefined = undefined
    contestationDeadline: Date | undefined = undefined


    transition(newState: NodeStateKind) {
        this.stateKind = newState
    }
}