export interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
  imageUrl: string;
  votes: number;
  themeColor: string;
  familyName?: string; // New: Nama Marga/Family
  familyIcon?: 'crown' | 'sword' | 'shield' | 'star' | 'ghost' | 'flame' | 'zap'; // New: Icon identifier
  activeEffect?: 'none' | 'fire' | 'lightning' | 'shadow'; // New: Special visual effect when active
}

export interface SwipeDirection {
  direction: 'left' | 'right';
}

export enum VoteType {
  LIKE = 'LIKE',
  PASS = 'PASS'
}