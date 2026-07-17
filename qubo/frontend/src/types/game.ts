export interface GameMatch {
  match_id: string;
  user_id: string;
  winner: string | null;
  turns_played: number;
  match_date: string;
}

export interface GameHistoryEvent {
  turn_number: number;
  effect_type?: string;
  effect_value?: number;
  corrupted_id?: string;
}

export interface UnityMatchStartedMessage {
  type: 'qubo:match-started';
}

export interface UnityMatchEventMessage extends GameHistoryEvent {
  type: 'qubo:match-event';
}

export interface UnityMatchCompletedMessage {
  type: 'qubo:match-completed';
  winner: string;
  turns_played: number;
}

export type UnityGameMessage =
  | UnityMatchStartedMessage
  | UnityMatchEventMessage
  | UnityMatchCompletedMessage;
