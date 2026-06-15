import { auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    isAnonymous?: boolean | null;
  }
}

export class FirestoreOperationError extends Error {
  public readonly info!: FirestoreErrorInfo;

  constructor(info: FirestoreErrorInfo) {
    super('Nao foi possivel concluir a operacao. Tente novamente.');
    this.name = 'FirestoreOperationError';
    Object.defineProperty(this, 'info', {
      value: info,
      enumerable: false,
    });
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error('Firestore Error:', errInfo);
  }

  throw new FirestoreOperationError(errInfo);
}
