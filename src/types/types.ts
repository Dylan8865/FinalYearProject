export interface IslandType {
  id: string;
  name: string;
  level: number;
  theme: string;
  user: UserType;
}

export interface UserType {
  id: string;
  username: string;
  email: string;
  password: string;
  lastLoginTime: string;
  oxygen: number;
  level: number;
}
