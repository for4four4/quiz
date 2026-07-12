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

/** 6 параметров темизации (см. дизайн-хэндофф) + служебные. */
export interface QuizDesign {
  primary?: string;   // основной цвет
  grad?: string;      // второй цвет градиента
  bg?: string;        // фон карточки в тёмной теме
  surface?: string;   // поверхность
  text?: string;      // цвет текста
  radius?: number;    // px, темизируемый радиус
  privacy_url?: string;
}

export interface QuizSettings {
  max_questions: number;
  contact_fields: string[];
  offer_page: OfferPage | null;
  cta_text?: string | null;
  redirect_url?: string | null;
  eyebrow?: string | null;
  cover_subtitle?: string | null;
}

export interface QuizMeta {
  title: string;
  design: QuizDesign;
  settings: QuizSettings;
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
