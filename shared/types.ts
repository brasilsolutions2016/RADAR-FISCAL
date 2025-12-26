
export interface Question {
  id: string;
  text: string;
  category: string;
  options: {
    label: string;
    weight: number;
  }[];
  condition?: {
    dependsOn: string;
    value: string;
  };
}

export interface SessionData {
  id: string;
  answers: Record<string, string | number>;
  scoreRaw: number;
  maxScorePath: number;
  scoreFinal: number;
  classification: 'LOW' | 'MEDIUM' | 'HIGH';
  paymentStatus: boolean;
  createdAt: number;
  consentPrivacy: boolean;
  consentMarketing: boolean;
  email?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
