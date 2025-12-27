export interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
  imageUrl: string;
  votes: number;
  themeColor: string;
}

export interface SwipeDirection {
  direction: 'left' | 'right';
}

export enum VoteType {
  LIKE = 'LIKE',
  PASS = 'PASS'
}