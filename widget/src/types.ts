export interface Question {
  title: string;
  type: 'single' | 'multi' | 'slider' | 'text';
  options: string[];
}

export interface OfferPage {
  headline: string;
  subheadline: string;
  bonus?: string;
}

export interface QuizDesign {
  primary?: string;       // основной цвет кнопок/акцентов
  primary_dark?: string;  // второй цвет градиента
  bg?: string;
  text?: string;
  radius?: string;        // напр. '16px'
  font?: string;
  privacy_url?: string;
}

export interface QuizMeta {
  title: string;
  design: QuizDesign;
  settings: {
    max_questions: number;
    contact_fields: string[];
    offer_page: OfferPage | null;
  };
  questionsCount: number;
}

export interface StartResponse {
  sessionId: string;
  quiz: Omit<QuizMeta, 'questionsCount'>;
  question: Question | null;
}

export type StepResponse =
  | { action: 'ask'; question: Question }
  | { action: 'finish' };

export interface ResultResponse {
  headline: string;
  body: string;
}

/** Локальная история для кнопки «назад». */
export interface HistoryEntry {
  question: Question;
  answer: string | string[] | number | null;
}
