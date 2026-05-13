export type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  sources?: string[];
  toolInvocations?: any[];
};

export type VaultFile = {
  name: string;
  date: number;
};
