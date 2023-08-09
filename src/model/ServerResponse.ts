import { Value } from "./Common";

export interface ServerResponse {
    tag: string
    timestamp: Date
    seq: number
    headId: string
}

export type Utxo = {
    address: string
    datumhash?: string | undefined
    inlineDatum?: string | undefined
    referenceScript?: string | undefined
    value: Value
}

export type Utxos = {
    [key: string]: Utxo
}

export interface Party {
    vkey: string
}

export interface Transaction {
    id: string
    isValid: boolean
    auxiliaryData: string
    body: TransactionBody
    witnesses: Witnesses
}

type TransactionBody = {
    inputs: string[]
    outputs: Utxo[]
    fees: number
}

type Witnesses = {
    redeemers: string
    keys: string[]
    scripts: {
        [key: string]: string
    }
    datums: {
        [key: string]: string
    }
}

export interface Greetings extends ServerResponse {
    tag: "Greetings"
    me: Party
    headStatus: string
    snapshotUtxo: Utxos
}

export interface PeerConnected extends ServerResponse {
    tag: "PeerConnected"
    peer: string
}

export interface PeerDisconnected extends ServerResponse {
    tag: "PeerDisconnected"
    peer: string
}

export interface HeadIsInitializing extends ServerResponse {
    tag: "HeadIsInitializing"
    parties: Party[]
}

export interface Committed extends ServerResponse {
    tag: "Committed"
    party: Party
    utxo: Utxos
}

export interface HeadIsOpen extends ServerResponse {
    tag: "HeadIsOpen"
    utxo: Utxos
}

export interface HeadIsClosed extends ServerResponse {
    tag: "HeadIsClosed"
    snapshotNumber: number
    contestationDeadline: Date
}

export interface HeadIsContested extends ServerResponse {
    tag: "HeadIsContested"
    snapshotNumber: number
}

export interface ReadyToFanout extends ServerResponse {
    tag: "ReadyToFanout"
}

export interface HeadIsAborted extends ServerResponse {
    tag: "HeadIsAborted"
    utxo: Utxos
}

export interface TxValid extends ServerResponse {
    tag: "TxValid"
    transaction: Transaction
}

export interface TxInvalid extends ServerResponse {
    tag: "TxInvalid"
    transaction: Transaction
    validationError: {
        reason: string
    }
}

export interface SnapshotConfirmed extends ServerResponse {
    tag: "SnapshotConfirmed"
    snapshot: {
        snapshotNumber: number,
        utxo: Utxos
    }
    confirmedTransactions: string[]
}

export interface GetUTxOResponse extends ServerResponse {
    tag: "GetUTxOResponse"
    utxo: Utxos
}

export interface InvalidInput extends ServerResponse {
    tag: "InvalidInput"
    reason: string
    input: string
}

export interface PostTxOnChainFailed extends ServerResponse {
    tag: "PostTxOnChainFailed"
    postChainTx: {
        tag: string // TODO: Limited set of values?
    }
    headParameters: {
        contestationPeriod: number,
        parties: Party[]
    }
    postTxError: {
        tag: string
        redeemerPtr: string
        failureReason: string
    }
}

export interface CommandFailed extends ServerResponse {
    tag: "CommandFailed"
    clientInput: {
        tag: string
    }
}

export interface HeadIsFinalized extends ServerResponse {
    tag: "HeadIsFinalized"
    utxo: Utxos
}

export interface DraftCommitTxresponse {
    cborHex: string
    description: string
    type: string
}