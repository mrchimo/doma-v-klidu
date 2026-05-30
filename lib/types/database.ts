export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; role: Role };
        Update: Partial<Profile>;
      };
      households: {
        Row: Household;
        Insert: Partial<Household> & { owner_id: string; name: string };
        Update: Partial<Household>;
      };
      pets: {
        Row: Pet;
        Insert: Partial<Pet> & { owner_id: string; household_id: string; name: string };
        Update: Partial<Pet>;
      };
      sitter_profiles: {
        Row: SitterProfile;
        Insert: Partial<SitterProfile> & { user_id: string };
        Update: Partial<SitterProfile>;
      };
      house_sitting_requests: {
        Row: HouseSittingRequest;
        Insert: Partial<HouseSittingRequest> & { owner_id: string; household_id: string; title: string };
        Update: Partial<HouseSittingRequest>;
      };
      request_pets: {
        Row: RequestPet;
        Insert: Partial<RequestPet> & { request_id: string; pet_id: string };
        Update: Partial<RequestPet>;
      };
      handover_checklist_items: {
        Row: HandoverChecklistItem;
        Insert: Partial<HandoverChecklistItem> & { request_id: string; owner_id: string; title: string };
        Update: Partial<HandoverChecklistItem>;
      };
      sitter_requests: {
        Row: SitterRequest;
        Insert: Partial<SitterRequest> & { request_id: string; owner_id: string; sitter_id: string };
        Update: Partial<SitterRequest>;
      };
      sitting_agreements: {
        Row: SittingAgreement;
        Insert: Partial<SittingAgreement> & { request_id: string; sitter_request_id: string; owner_id: string; sitter_id: string };
        Update: Partial<SittingAgreement>;
      };
      sitting_feedback: {
        Row: SittingFeedback;
        Insert: Partial<SittingFeedback> & { agreement_id: string; request_id: string; owner_id: string; sitter_id: string; went_well: boolean; sitter_on_time: boolean; instructions_clear: boolean; would_book_again: boolean };
        Update: Partial<SittingFeedback>;
      };
      owner_favorite_sitters: {
        Row: OwnerFavoriteSitter;
        Insert: Partial<OwnerFavoriteSitter> & { owner_id: string; sitter_id: string };
        Update: Partial<OwnerFavoriteSitter>;
      };
      calm_reports: {
        Row: CalmReport;
        Insert: Partial<CalmReport> & { agreement_id: string; request_id: string; owner_id: string; sitter_id: string; pet_status: CalmReportPetStatus; feeding_status: CalmReportTaskStatus; walking_status: CalmReportTaskStatus; home_check_status: CalmReportTaskStatus };
        Update: Partial<CalmReport>;
      };
      trust_badges: {
        Row: TrustBadge;
        Insert: Partial<TrustBadge> & { sitter_id: string; badge_type: string; label: string };
        Update: Partial<TrustBadge>;
      };
      email_notifications: {
        Row: EmailNotification;
        Insert: Partial<EmailNotification> & { notification_type: EmailNotificationType; subject: string; body: string };
        Update: Partial<EmailNotification>;
      };
      public_sitters: {
        Row: PublicSitter;
        Insert: never;
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Role = "owner" | "sitter" | "professional" | "admin";

export type Profile = {
  id: string;
  full_name: string | null;
  role: Role;
  email: string | null;
  phone: string | null;
  city: string | null;
  neighborhood: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Household = {
  id: string;
  owner_id: string;
  name: string;
  city: string | null;
  neighborhood: string | null;
  household_type: string | null;
  has_plants: boolean;
  has_mail_pickup: boolean;
  has_alarm: boolean;
  has_cameras: boolean;
  parking_notes: string | null;
  house_rules: string | null;
  access_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Pet = {
  id: string;
  owner_id: string;
  household_id: string;
  name: string;
  species: string | null;
  breed: string | null;
  age: string | null;
  size: string | null;
  temperament: string | null;
  feeding_instructions: string | null;
  medication: string | null;
  allergies: string | null;
  fears: string | null;
  behavior_people: string | null;
  behavior_animals: string | null;
  veterinarian_contact: string | null;
  emergency_contact: string | null;
  never_do: string | null;
  created_at: string;
  updated_at: string;
};

export type SitterProfile = {
  id: string;
  user_id: string;
  bio: string | null;
  motivation: string | null;
  animal_experience: string | null;
  accepts_dogs: boolean;
  accepts_cats: boolean;
  accepts_small_animals: boolean;
  overnight_stays: boolean;
  daily_visits: boolean;
  dog_walking: boolean;
  emergency_help: boolean;
  medication_experience: boolean;
  senior_pet_experience: boolean;
  puppy_experience: boolean;
  reactive_dog_experience: boolean;
  multiple_pet_experience: boolean;
  rate_range: string | null;
  availability_notes: string | null;
  available_weekends: boolean;
  available_weekday_evenings: boolean;
  available_mornings: boolean;
  available_short_notice: boolean;
  unavailable_until: string | null;
  reference_contact: string | null;
  video_intro_url: string | null;
  phone_verified: boolean;
  reference_checked: boolean;
  video_intro_reviewed: boolean;
  bio_reviewed: boolean;
  experience_reviewed: boolean;
  risk_reviewed: boolean;
  risk_flags: string[];
  risk_notes: string | null;
  admin_public_note: string | null;
  admin_private_note: string | null;
  approval_status: "pending_approval" | "approved" | "rejected";
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

export type HouseSittingRequest = {
  id: string;
  owner_id: string;
  household_id: string;
  title: string;
  start_date: string;
  end_date: string;
  sitting_type: string;
  preferred_time_windows: string | null;
  tasks: string[] | null;
  sitter_requirements: string[] | null;
  budget_range: string | null;
  notes: string | null;
  urgency: "normal" | "urgent";
  status: "open" | "matched" | "cancelled" | "completed";
  created_at: string;
  updated_at: string;
};

export type RequestPet = {
  id: string;
  request_id: string;
  pet_id: string;
};

export type HandoverChecklistItem = {
  id: string;
  request_id: string;
  owner_id: string;
  title: string;
  details: string | null;
  category: "pet_care" | "home" | "access" | "safety" | "plants_mail" | "other";
  is_required: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type SitterRequest = {
  id: string;
  request_id: string;
  owner_id: string;
  sitter_id: string;
  message: string | null;
  status: "sent" | "accepted" | "declined" | "cancelled" | "completed";
  sitter_response: string | null;
  created_at: string;
  updated_at: string;
};

export type SittingAgreement = {
  id: string;
  request_id: string;
  sitter_request_id: string;
  owner_id: string;
  sitter_id: string;
  status: "confirmed" | "cancelled" | "completed";
  owner_note: string | null;
  confirmed_at: string;
  cancelled_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SittingFeedback = {
  id: string;
  agreement_id: string;
  request_id: string;
  owner_id: string;
  sitter_id: string;
  went_well: boolean;
  sitter_on_time: boolean;
  instructions_clear: boolean;
  would_book_again: boolean;
  owner_note: string | null;
  created_at: string;
  updated_at: string;
};

export type OwnerFavoriteSitter = {
  id: string;
  owner_id: string;
  sitter_id: string;
  created_at: string;
};

export type CalmReportPetStatus = "okay" | "attention";
export type CalmReportTaskStatus = "done" | "not_needed" | "attention";

export type CalmReport = {
  id: string;
  agreement_id: string;
  request_id: string;
  owner_id: string;
  sitter_id: string;
  pet_status: CalmReportPetStatus;
  feeding_status: CalmReportTaskStatus;
  walking_status: CalmReportTaskStatus;
  home_check_status: CalmReportTaskStatus;
  note: string | null;
  photo_path: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
};

export type TrustBadge = {
  id: string;
  sitter_id: string;
  badge_type: string;
  label: string;
  verified_at: string | null;
  created_at: string;
};

export type EmailNotificationType = "sitter_request_sent" | "sitter_request_responded" | "sitter_approved" | "sitting_reminder" | "calm_report_submitted";

export type EmailNotification = {
  id: string;
  recipient_id: string | null;
  recipient_email: string | null;
  notification_type: EmailNotificationType;
  subject: string;
  body: string;
  action_url: string | null;
  status: "pending" | "sent" | "failed";
  scheduled_for: string;
  sent_at: string | null;
  provider: string | null;
  provider_message_id: string | null;
  error_message: string | null;
  related_request_id: string | null;
  related_sitter_request_id: string | null;
  related_agreement_id: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicSitter = Pick<
  SitterProfile,
  | "id"
  | "user_id"
  | "bio"
  | "motivation"
  | "animal_experience"
  | "accepts_dogs"
  | "accepts_cats"
  | "accepts_small_animals"
  | "overnight_stays"
  | "daily_visits"
  | "dog_walking"
  | "emergency_help"
  | "medication_experience"
  | "senior_pet_experience"
  | "puppy_experience"
  | "reactive_dog_experience"
  | "multiple_pet_experience"
  | "rate_range"
  | "availability_notes"
  | "available_weekends"
  | "available_weekday_evenings"
  | "available_mornings"
  | "available_short_notice"
  | "unavailable_until"
  | "video_intro_url"
  | "phone_verified"
  | "reference_checked"
  | "video_intro_reviewed"
  | "admin_public_note"
  | "approval_status"
  | "is_featured"
  | "created_at"
  | "updated_at"
> & {
  full_name: string | null;
  city: string | null;
  neighborhood: string | null;
  avatar_url: string | null;
};
