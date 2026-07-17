export type AuthUser = {
  id: string;
  nickname: string | null;
  avatarDataUrl: string | null;
  avatarColor?: string;
  isAdmin: boolean;
  preferredView: 'vertical' | 'horizontal';
};

export type AuthUserSummary = AuthUser & {
  code: string;
  createdAt: number;
};
