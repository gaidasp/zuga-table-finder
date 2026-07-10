export type AuthUser = {
  id: string;
  nickname: string | null;
  avatarDataUrl: string | null;
  avatarColor?: string;
  isAdmin: boolean;
};

export type AuthUserSummary = AuthUser & {
  code: string;
  createdAt: number;
};
