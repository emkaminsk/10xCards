import { Tables, TablesInsert, TablesUpdate, Enums } from './db/database.types';

// =============================================================================
// Authentication DTOs
// =============================================================================

/** Request body for login endpoint */
export interface LoginRequestDTO {
  password: string;
}

/** Response body for login/logout endpoints */
export interface AuthMessageResponseDTO {
  message: string;
}

/** Response body for session status endpoint */
export interface SessionResponseDTO {
  authenticated: boolean;
  user_id: string;
}

// =============================================================================
// User Settings DTOs
// =============================================================================

/** Request body for changing password */
export interface ChangePasswordRequestDTO {
  old: string;
  new: string;
}

/** Request/Response body for user settings */
export interface UserSettingsDTO {
  proficiency_level: Enums<'proficiency_level'>;
}

/** Request body for updating user settings */
export interface UpdateUserSettingsRequestDTO {
  proficiency_level: Enums<'proficiency_level'>;
}

// =============================================================================
// Import Session DTOs
// =============================================================================

/** Request body for creating import session */
export interface CreateImportSessionRequestDTO {
  source_url: string;
}

/** Response body for creating import session */
export interface CreateImportSessionResponseDTO {
  id: string;
  status: string;
}

/** Full import session data for detailed view */
export interface ImportSessionResponseDTO extends Pick<Tables<'import_sessions'>, 
  'id' | 'source_url' | 'total_generated' | 'total_accepted' | 'created_at'> {
  status: string;
}

/** Paginated list response for import sessions */
export interface ImportSessionListResponseDTO {
  data: ImportSessionResponseDTO[];
  meta: PaginationMetaDTO;
}

// =============================================================================
// Proposed Cards DTOs
// =============================================================================

/** Response body for proposed card */
export interface ProposedCardResponseDTO extends Pick<Tables<'proposed_cards'>,
  'id' | 'front' | 'back' | 'context' | 'tags' | 'is_selected'> {}

/** Request body for updating proposed card selection */
export interface UpdateProposedCardRequestDTO {
  is_selected: boolean;
}

/** Response body for bulk accept/reject operations */
export interface BulkProposedCardActionResponseDTO {
  accepted_count?: number;
  rejected_count?: number;
  message: string;
}

/** Paginated list response for proposed cards */
export interface ProposedCardListResponseDTO {
  data: ProposedCardResponseDTO[];
  meta: PaginationMetaDTO;
}

// =============================================================================
// Cards DTOs
// =============================================================================

/** Request body for creating a new card */
export interface CreateCardRequestDTO extends Pick<TablesInsert<'cards'>,
  'front' | 'back' | 'context' | 'tags'> {}

/** Request body for updating an existing card */
export interface UpdateCardRequestDTO extends Pick<TablesUpdate<'cards'>,
  'front' | 'back' | 'context' | 'tags'> {}

/** Response body for card operations */
export interface CardResponseDTO extends Pick<Tables<'cards'>,
  'id' | 'front' | 'back' | 'context' | 'tags' | 'status' | 'created_at' | 'updated_at'> {}

/** Paginated list response for cards */
export interface CardListResponseDTO {
  data: CardResponseDTO[];
  meta: PaginationMetaDTO;
}

/** Response body for card deletion */
export interface DeleteCardResponseDTO {
  message: string;
}

// =============================================================================
// Review Workflow DTOs
// =============================================================================

/** Card data for scheduled reviews */
export interface ScheduledReviewCardDTO {
  card_id: string;
  front: string;
  back: string;
  context: string | null;
  box_level: number;
  next_review_date: string;
}

/** Response body for scheduled reviews */
export interface ScheduledReviewsResponseDTO {
  data: ScheduledReviewCardDTO[];
  meta: {
    total: number;
  };
}

/** Request body for submitting a review */
export interface SubmitReviewRequestDTO {
  rating: Enums<'review_rating'>;
  response_time_ms?: number;
}

/** Response body after submitting a review */
export interface SubmitReviewResponseDTO {
  card_id: string;
  new_box_level: number;
  next_review_date: string;
  rating: Enums<'review_rating'>;
}

/** Review session summary data */
export interface ReviewSessionSummaryDTO {
  session_id: string;
  total_reviews: number;
  ratings: {
    easy: number;
    good: number;
    hard: number;
    again: number;
  };
  duration_ms: number;
  completed_at: string;
}

// =============================================================================
// Statistics DTOs
// =============================================================================

/** Proficiency distribution by box levels */
export interface ProficiencyDistributionDTO {
  box_1: number;
  box_2: number;
  box_3: number;
  box_4: number;
  box_5: number;
}

/** Overall learning statistics */
export interface StatsOverviewResponseDTO {
  total_cards: number;
  cards_due_today: number;
  cards_learned: number;
  study_streak_days: number;
  avg_daily_reviews: number;
  proficiency_distribution: ProficiencyDistributionDTO;
}

// =============================================================================
// Common DTOs
// =============================================================================

/** Standard pagination metadata */
export interface PaginationMetaDTO {
  page: number;
  limit: number;
  total: number;
}

/** Standard error response */
export interface ErrorResponseDTO {
  error: string;
  message: string;
}

/** Standard success response wrapper */
export interface SuccessResponseDTO<T> {
  data: T;
  meta?: PaginationMetaDTO;
}

// =============================================================================
// Type Guards and Utilities
// =============================================================================

/** Type guard for checking if response has pagination */
export function hasPagination<T>(response: any): response is SuccessResponseDTO<T[]> {
  return response && typeof response === 'object' && 'data' in response && 'meta' in response;
}

/** Extract the data type from a paginated response */
export type ExtractPaginatedData<T> = T extends SuccessResponseDTO<(infer U)[]> ? U : never;

// =============================================================================
// Re-exports from database types for convenience
// =============================================================================

export type { Tables, TablesInsert, TablesUpdate, Enums } from './db/database.types';

// Commonly used database enums
export type CardStatus = Enums<'card_status'>;
export type ProficiencyLevel = Enums<'proficiency_level'>;
export type ReviewRating = Enums<'review_rating'>;
