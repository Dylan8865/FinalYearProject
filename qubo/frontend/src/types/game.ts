export interface GameMatch {
  match_id: string;
  user_id: string;
  winner: string | null;
  turns_played: number;
  match_date: string;
  game_level: number;
  waves_cleared: number;
  is_victory: boolean;
  score: number | null;
  enemies_defeated: number | null;
  compounds_discovered: number | null;
  highest_combo: number | null;
  leaderboard_points: number | null;
  completed_at: string | null;
}

export interface GameMatchHistory extends GameMatch {
  result: 'Win' | 'Loss';
}

export interface LevelOneLeaderboardEntry {
  rank: number;
  match_id: string;
  username: string;
  profile_picture_url: string | null;
  score: number;
  leaderboard_points: number;
  waves_cleared: number;
  enemies_defeated: number;
  compounds_discovered: number;
  highest_combo: number;
  grade: string;
  turns_played: number;
  completed_at: string | null;
  played_at: string;
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
  waves_cleared?: number;
  is_victory?: boolean;
  score?: number;
  enemies_defeated?: number;
  compounds_discovered?: number;
  highest_combo?: number;
}

export type UnityGameMessage =
  | UnityMatchStartedMessage
  | UnityMatchEventMessage
  | UnityMatchCompletedMessage;
