export interface QuizListItem {
  id: string;
  title: string;
  slug: string | null;
  status: 'draft' | 'published' | 'archived';
  mode: 'static' | 'adaptive';
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  position: number;
  type: string;
  title: string;
  options: { label: string }[];
  branch_rules: { why?: string };
}

export interface BusinessContext {
  business_description?: string;
  goal?: string;
  geo?: string;
  ideal_lead?: string;
  qualification_goals?: string[];
}

export interface QuizSettings {
  max_questions?: number;
  contact_fields?: string[];
  offer_page?: { headline: string; subheadline: string; bonus?: string } | null;
  cta_text?: string;
  redirect_url?: string;
}

export type CardStyle = 'classic' | 'photo' | 'minimal' | 'gradient' | 'banner';

export interface QuizDesign {
  primary?: string;
  grad?: string;
  bg?: string;
  surface?: string;
  text?: string;
  radius?: number;
  card_style?: CardStyle;
  hero_image?: string;
}

export interface QuizFull extends QuizListItem {
  business_context: BusinessContext;
  design: QuizDesign;
  settings: QuizSettings;
  result_template: Record<string, unknown>;
  questions: Question[];
}

export type Segment = 'hot' | 'warm' | 'cold' | 'junk';

export interface Lead {
  id: string;
  quiz_id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  score: number | null;
  segment: Segment | null;
  summary: string | null;
  first_line: string | null;
  fraud_flags: string[];
  billable: boolean;
  created_at: string;
}

export interface TranscriptItem {
  q: string;
  a: unknown;
  generated_by: string;
  ts: string;
}

export interface GeneratedQuiz {
  quiz_title: string;
  questions: { title: string; type: string; options: string[]; why: string }[];
  offer_page: { headline: string; subheadline: string; bonus: string };
  qualification_goals: string[];
}
