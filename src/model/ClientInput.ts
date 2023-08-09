import { Value } from "./Common";

export type ClientInput =
  | { tag: "Init" | "Abort" | "GetUTxO" | "Close" | "Fanout" | "Contest" }
  | { tag: "NewTx"; transaction: string}

export type DraftCommitTxRequest = {
  [key: string]: UtxoInput
}

export type UtxoInput = {
  address?: string
  value: Value
  witness?: Witness
}

export type Witness = {
  datum: string
  plutusV2Script: PlutusV2Script
  redeemer: string
}

export type PlutusV2Script = {
  cborHex: string
  description: string
  type: ScriptType
}

export type ScriptType = "PlutusScriptV2"