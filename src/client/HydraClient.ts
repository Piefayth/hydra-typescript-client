import { ClientInput, DraftCommitTxRequest } from "../model/ClientInput"
import { CommandFailed, Committed, DraftCommitTxresponse, GetUTxOResponse, Greetings, HeadIsAborted, HeadIsClosed, HeadIsContested, HeadIsFinalized, HeadIsInitializing, HeadIsOpen, InvalidInput, PeerConnected, PeerDisconnected, PostTxOnChainFailed, ReadyToFanout, ServerResponse, SnapshotConfirmed, TxInvalid, TxValid, Utxo } from "../model/ServerResponse"
import NodeState from "./NodeState";

export default class HydraClient {
    host: string
    name = "HydraClient"
    isLoadingHistory = true
    state: NodeState = new NodeState()
    ws: WebSocket | undefined = undefined

    // Hacky - We store the promise resolution from "init"
    // So that "init" does not complete until loading history does
    private _notifyHistoryComplete = () => {}
    private _launched = false
    private messageListeners: Array<(data: ServerResponse) => void> = []

    constructor(host: string, name?: string) {
        this.host = host
        this.name = name || this.name
    }

    async init(): Promise<void> {
        if (this._launched) {
            console.warn("Warning: Attempted to re-initialize already-initialized HydraClient.")
            return Promise.resolve()
        }

        this._launched = true 

        const ws = new WebSocket(`ws://${this.host}`)

        ws.addEventListener("message", (event: MessageEvent) => {
            this.handleServerResponse(event.data)
        })

        return await new Promise((res, rej) => {
            ws.addEventListener("open", () => {
                this.ws = ws
                console.log(`Hydra client ${this.name} connected to: ${this.host}`)
                this._notifyHistoryComplete = res
            })
        
            ws.addEventListener("error", (event) => {
                this.close()

                rej((event as ErrorEvent).error)
            })
        })
    }

    onMessage(callback: (data: ServerResponse) => void): void {
        this.messageListeners.push(callback);
    }

    offMessage(callback: (data: ServerResponse) => void): void {
        this.messageListeners = this.messageListeners.filter(listener => listener !== callback)
    }

    close() {
        this.ws?.close()
        this.ws = undefined
        this.messageListeners = []
    }

    send(command: ClientInput) {
        if (!this.ws) {
            throw Error(`hydra client ${this.name} cannot send command before web socket is initialized and healthy`)
        }

        this.ws.send(JSON.stringify(command))
    }

    async commit(req: DraftCommitTxRequest): Promise<DraftCommitTxresponse> {
        const result = await fetch(`http://${this.host}/commit`, {
            method: "POST",
            body: JSON.stringify(req)
        })

        if (result.status != 200) {
            throw Error(`Received non-200 response from server when comitting: ${result.status}: ${result.statusText}`)
        }

        return (await result.json()) as DraftCommitTxresponse
    }

    handleServerResponse(rawResponse: string): void {
        const response = JSON.parse(rawResponse) as ServerResponse

        switch (response.tag) {
            case "Greetings":
                this.handleGreetings(response as Greetings)
                break
            case "PeerConnected":
                this.handlePeerConnected(response as PeerConnected)
                break
            case "PeerDisconnected":
                this.handlePeerDisconnected(response as PeerDisconnected)
                break
            case "HeadIsInitializing":
                this.handleHeadIsInitializing(response as HeadIsInitializing)
                break
            case "Committed":
                this.handleCommitted(response as Committed)
                break
            case "HeadIsOpen":
                this.handleHeadIsOpen(response as HeadIsOpen)
                break
            case "HeadIsClosed":
                this.handleHeadIsClosed(response as HeadIsClosed)
                break
            case "HeadIsContested":
                this.handleHeadIsContested(response as HeadIsContested)
                break
            case "ReadyToFanout":
                this.handleReadyToFanout(response as ReadyToFanout)
                break
            case "HeadIsAborted":
                this.handleHeadIsAborted(response as HeadIsAborted)
                break
            case "TxValid":
                this.handleTxValid(response as TxValid)
                break
            case "TxInvalid":
                this.handleTxInvalid(response as TxInvalid)
                break
            case "SnapshotConfirmed":
                this.handleSnapshotConfirmed(response as SnapshotConfirmed)
                break
            case "GetUTxOResponse":
                this.handleGetUTxOResponse(response as GetUTxOResponse)
                break
            case "InvalidInput":
                this.handleInvalidInput(response as InvalidInput)
                break
            case "PostTxOnChainFailed":
                this.handlePostTxOnChainFailed(response as PostTxOnChainFailed)
                break
            case "CommandFailed":
                this.handleCommandFailed(response as CommandFailed)
                break
            case "HeadIsFinalized":
                this.handleHeadIsFinalized(response as HeadIsFinalized)
                break
            default:
                throw new Error(`Unexpected server response tag: ${response.tag}`)
        }

        if (!this.isLoadingHistory) {
            for (const listener of this.messageListeners) {
                listener(response)
            }
        }

    }

    handleGreetings(response: Greetings) {
        this._notifyHistoryComplete()
        this.isLoadingHistory = false
        this.state.nodeId = response.me.vkey
    }

    handlePeerConnected(response: PeerConnected) {
        this.state.peers.add(response.peer)
    }

    handlePeerDisconnected(response: PeerDisconnected) {
        this.state.peers.delete(response.peer)
    }

    handleHeadIsInitializing(response: HeadIsInitializing) {
        this.state.transition("Initializing")
        this.state.committedUtxos = {}
        this.state.headId = response.headId
        this.state.parties = response.parties
    }

    handleHeadIsAborted(response: HeadIsAborted) {
        this.state.parties = []
        this.state.committedUtxos = {}
        this.state.headId = undefined
        this.state.transition("Idle")
    }

    handleSnapshotConfirmed(response: SnapshotConfirmed) {
        this.state.headUtxos = response.snapshot.utxo
    }

    handlePostTxOnChainFailed(response: PostTxOnChainFailed) {
        // error handling?
    }
    
    handleInvalidInput(response: InvalidInput) {
        // error handling?
    }

    handleCommandFailed(response: CommandFailed) {
        // error handling?
    }

    handleCommitted(response: Committed) {
        const ownerKey = response.party.vkey
        if (this.state.committedUtxos[ownerKey] === undefined) [
            this.state.committedUtxos[ownerKey] = {}
        ]

        this.state.committedUtxos[ownerKey] = {
            ...this.state.committedUtxos[ownerKey],
            ...response.utxo
        }
    }

    handleHeadIsClosed(response: HeadIsClosed) {
        this.state.contestationDeadline = new Date(response.contestationDeadline)
        this.state.transition("Closed")
    }

    handleHeadIsOpen(response: HeadIsOpen) {
        this.state.headUtxos = response.utxo
        this.state.transition("Open")
    }

    handleReadyToFanout(response: ReadyToFanout) {
        this.state.contestationDeadline = undefined
        this.state.transition("FanoutPossible")
    }

    handleHeadIsFinalized(response: HeadIsFinalized) {
        this.state.transition("Final")
    }

    handleGetUTxOResponse(response: GetUTxOResponse) {
        this.state.headUtxos = response.utxo
    }

    handleHeadIsContested(response: HeadIsContested){
        // nothing to do?
    }

    handleTxValid(response: TxValid) {
        // nothing to do?
    }

    handleTxInvalid(response: TxInvalid) {
        // nothing to do?
    }
}