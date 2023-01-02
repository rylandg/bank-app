export enum Status {
  Started = 1,
  Depositing,
  Refunding,
  Failed,
  Succeeded,
}

export interface TransactionInput {
  referenceID: string;
  sourceAccountID: string;
  targetAccountID: string;
  amount: number;
  errorMessage: string;
  lastStatus: Status;
}
