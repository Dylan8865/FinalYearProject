export interface dbIslandType {
  id: string;
  createdAt: string;
  name: string;
  level: number;
  theme: string;
  userId: string;
}

export interface dbUserType {
  id: string;
  createdAt: string;
  username: string;
  email: string;
  password: string;
  lastLoginTime: string;
  oxygen: number;
  level: number;
}
