
export enum AppLanguage {
  PORTUGUESE_BR = 'pt',
  ENGLISH_US = 'en',
  SPANISH_ES = 'es',
  JAPANESE = 'ja',
  RUSSIAN = 'ru'
}

export enum BeltColor {
  WHITE = 'White',
  BLUE = 'Blue',
  PURPLE = 'Purple',
  BROWN = 'Brown',
  BLACK = 'Black',
  RED_BLACK = 'Red-Black',
  RED_WHITE = 'Red-White',
  RED = 'Red'
}

export enum KidsBeltColor {
  WHITE = 'White',
  WHITE_GRAY = 'White-Gray',
  GRAY = 'Gray',
  GRAY_BLACK = 'Gray-Black',
  WHITE_YELLOW = 'White-Yellow',
  YELLOW = 'Yellow',
  BLACK_YELLOW = 'Black-Yellow',
  WHITE_ORANGE = 'White-Orange',
  ORANGE = 'Orange',
  BLACK_ORANGE = 'Black-Orange',
  WHITE_GREEN = 'White-Green',
  GREEN = 'Green',
  BLACK_GREEN = 'Black-Green'
}

export enum StudentStatus {
  WAITLIST = 'Waitlist',
  ACTIVE = 'Active',
  PENDING = 'Pending',
  OVERDUE = 'Overdue',
  INACTIVE = 'Inactive',
  SUSPENDED = 'Suspended'
}

export enum TechniqueCategory {
  WARMUP = 'Aquecimento',
  GUARD_PASSING = 'Passagem de Guarda',
  SUBMISSIONS = 'Finalizações',
  ESCAPES = 'Escapadas',
  TAKEDOWNS = 'Quedas',
  SWEEPS = 'Raspagens',
  POSITIONAL = 'Controle Posicional',
  BACK_TAKES = 'Pegada de Costas',
  GUARD_PULL = 'Puxada de Guarda',
  SELF_DEFENSE = 'Defesa Pessoal'
}

export enum ExtraRevenueCategory {
  PRIVATE_LESSON = 'Aula Particular',
  PRODUCT = 'Loja/Produtos',
  SEMINAR = 'Seminário/Workshop',
  OTHER = 'Outros'
}

export interface ExtraRevenue {
  id: string;
  description: string;
  category: ExtraRevenueCategory;
  amount: number;
  date: string;
  studentId?: string;
  studentName?: string;
  paid: boolean;
  paymentMethod: string;
}

export interface GalleryImage {
  id: string;
  url: string;
  title: string;
  date: string;
  category: 'Treino' | 'Evento' | 'Seminário' | 'Graduação';
}

export interface LibraryTechnique {
  id: string;
  name: string;
  category: TechniqueCategory;
  description: string;
  videoUrl?: string;
  beltLevel: BeltColor;
}

export interface LessonPlan {
  id: string;
  date: string;
  title: string;
  techniques: LibraryTechnique[];
  warmup?: string;
  specificTraining?: string;
  sparring?: string;
  notes: string;
  isPublished: boolean;
  ruleFocus?: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number;
  category: string;
  cover?: string;
}

export interface ClassSchedule {
  id: string;
  time: string;
  title: string;
  instructor: string;
  category: string;
  days: string[]; // ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']
  notes?: string;
}

export interface IBJJFRule {
  belt: BeltColor | KidsBeltColor;
  minAge: number;
  minTimeMonths: number;
  description: string;
}

export interface LearnedTechnique {
  id: string;
  name: string;
  category: TechniqueCategory;
  dateLearned: string;
  proficiency: number;
  notes?: string;
}

export interface Goal {
  id: string;
  title: string;
  progress: number;
  targetDate: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
}

export interface Feedback {
  date: string;
  instructor: string;
  comment: string;
  rating: number;
}

export interface CustomIndicator {
  name: string;
  value: number; // 0-100
}

export interface GraduationCriterion {
  id: string;
  name: string;
  weight: number; // Importance (0-1)
  icon?: string;
}

export interface ProfessorProfile {
  name: string;
  academyName: string;
  belt: BeltColor;
  stripes: number;
  specialization: string;
  avatarUrl?: string;
  pixKey: string;
  pixName: string;
  pixCity: string;
  graduationRules?: string;
  customCriteria?: GraduationCriterion[];
  logoUrl?: string;
  backgroundImageUrl?: string;
  technicalFocus?: string;
  technicalFocusDescription?: string;
  latitude?: number;
  longitude?: number;
  geofenceRadius?: number; // em metros
}

export interface ProgressRecord {
  date: string;
  type: 'Belt' | 'Stripe' | 'Achievement';
  description: string;
  instructor: string;
}

export interface Payment {
  id: string;
  name: string;
  amount: number;
  date: string;
  method: string;
  status: string;
}

export interface Reward {
  id: string;
  name: string;
  cost: number;
  icon: string;
  category: string;
}

// Fixed missing KimonoOrder interface for pages/Kimonos.tsx
export interface KimonoOrder {
  id: string;
  studentId: string;
  studentName: string;
  size: string;
  color: string;
  type: 'Kimono' | 'Rash Guard' | 'Faixa' | 'Outros';
  status: 'Pending' | 'Ordered' | 'Received' | 'Delivered';
  date: string;
  price: number;
  paid: boolean;
}

export enum Gender {
  MALE = 'Masculino',
  FEMALE = 'Feminino'
}

export enum CBJJCategory {
  MIRIM_1 = 'Mirim 1',
  MIRIM_2 = 'Mirim 2',
  MIRIM_3 = 'Mirim 3',
  INFANTIL_1 = 'Infantil 1',
  INFANTIL_2 = 'Infantil 2',
  INFANTIL_3 = 'Infantil 3',
  INFANTO_JUVENIL_1 = 'Infanto-Juvenil 1',
  INFANTO_JUVENIL_2 = 'Infanto-Juvenil 2',
  INFANTO_JUVENIL_3 = 'Infanto-Juvenil 3',
  JUVENIL_1 = 'Juvenil 1',
  JUVENIL_2 = 'Juvenil 2',
  ADULTO = 'Adulto',
  MASTER_1 = 'Master 1',
  MASTER_2 = 'Master 2',
  MASTER_3 = 'Master 3',
  MASTER_4 = 'Master 4',
  MASTER_5 = 'Master 5',
  MASTER_6 = 'Master 6',
  MASTER_7 = 'Master 7'
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: ExtraRevenueCategory;
  stock?: number;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  benefits?: string[];
}

export interface AttendanceRecord {
  date: string;
  lessonPlanId?: string;
  classId?: string;
  notes?: string;
}

export interface PositionVideo {
  id: string;
  title: string;
  videoUrl: string;
  description?: string;
  date: string;
  authorId: string; // ID of student or professor who posted it
  authorName: string;
}

export interface Milestone {
  id: string;
  type: 'Seminar' | 'Course' | 'Competition' | 'Other';
  title: string;
  date: string;
  description?: string;
}

export interface Student {
  id: string;
  name: string;
  nickname?: string;
  email: string;
  phone: string;
  birthDate: string;
  gender?: Gender;
  cpf?: string;
  rg?: string;
  weight?: number;
  height?: number;
  category?: CBJJCategory;
  weightClass?: string;
  federationId?: string;
  lastPromotionDate: string;
  status: StudentStatus;
  belt: BeltColor | KidsBeltColor;
  stripes: number;
  monthlyValue: number;
  dueDay: number;
  lastPaymentDate?: string;
  isKid: boolean;
  isInstructor: boolean;
  attendanceCount: number;
  behaviorScore?: number;
  rewardPoints?: number;
  rulesKnowledge?: number;
  isReadyForPromotion?: boolean;
  history?: ProgressRecord[];
  techniques?: LearnedTechnique[];
  goals?: Goal[];
  feedbacks?: Feedback[];
  currentStreak?: number;
  portalAccessCode?: string;
  graduationNotes?: string;
  pros?: string;
  cons?: string;
  photoUrl?: string;
  photo?: string;
  planId?: string;
  homeWorkoutHistory?: { date: string, type: string, count: number }[];
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalConditions?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  bloodType?: string;
  responsiblePerson?: string;
  responsibleEmail?: string;
  responsiblePhone?: string;
  responsibleCpf?: string;
  civilStatus?: string;
  occupation?: string;
  nationality?: string;
  rgIssuer?: string;
  lgpdConsent?: boolean;
  contractUrl?: string;
  attendanceHistory?: AttendanceRecord[];
  billingPaused?: boolean;
  completedRuleLessons?: string[];
  isCompetitor?: boolean;
  isWaitlist?: boolean;
  waitlistRank?: number;
  technicalNotes?: string;
  customIndicators?: CustomIndicator[];
  medicalCertificateUrl?: string;
  medicalCertificateDate?: string;
  medicalCertificateExpiration?: string;
  liabilityWaiverAccepted?: boolean;
  liabilityWaiverDate?: string;
  classId?: string; // Default class/turma
  positionVideos?: PositionVideo[];
  milestones?: Milestone[];
  examRequirements?: Record<string, boolean>;
  lastAttendanceDate?: string;
  joinedAt?: string;
  graduationHistory?: {
    belt: string;
    date: string;
    instructor: string;
  }[];
  technicalMetrics?: {
    striking?: number;
    grappling?: number;
    cardio?: number;
    strategy?: number;
  };
  securityAuditStatus?: 'Verified' | 'Unverified' | 'Compromised';
  documents?: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploadDate: string;
  }[];
}

export interface SystemLog {
  id: string;
  timestamp: number;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  category: 'User' | 'Financial' | 'System' | 'Security';
  deviceInfo: string;
  previousHash?: string;
  hash?: string;
}

export interface PaymentReceipt {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  date: string;
  receiptUrl: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  timestamp: number;
}

export interface TransactionLedger {
  id: string;
  timestamp: number;
  type: 'Income' | 'Expense' | 'StudentPayment' | 'ExtraRevenue' | 'StatusChange';
  amount: number;
  description: string;
  category: string;
  method: string;
  studentId?: string;
  previousHash: string;
  hash: string;
}

