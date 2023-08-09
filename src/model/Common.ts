export type Lovelace = {
    lovelace?: number
}

export type MultiAsset = {
    [key: string]: {
        [key: string]: number
    } | number
}

export type Value = Lovelace & MultiAsset