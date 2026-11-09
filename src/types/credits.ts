export type CreditSource = {
  name: string
  url: string
  license: string
  note: string
}

export type FrameCredit = {
  exerciseId: string
  creator: string
  license: string
  sourceUrl?: string
  changes?: string
}

export type Credits = {
  sources: CreditSource[]
  frames: FrameCredit[]
}
