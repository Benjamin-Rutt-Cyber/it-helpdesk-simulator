export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
  CLOSED = 'closed',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum TicketCategory {
  HARDWARE = 'hardware',
  SOFTWARE = 'software',
  NETWORK = 'network',
  EMAIL = 'email',
  PASSWORD = 'password',
  PRINTER = 'printer',
  PHONE = 'phone',
  ACCOUNT = 'account',
  SECURITY = 'security',
  GENERAL = 'general',
}

export enum Department {
  IT = 'IT',
  SALES = 'Sales',
  MARKETING = 'Marketing',
  HR = 'Human Resources',
  FINANCE = 'Finance',
  OPERATIONS = 'Operations',
  ENGINEERING = 'Engineering',
  CUSTOMER_SERVICE = 'Customer Service',
}

export interface CustomerInfo {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  department: Department;
  jobTitle: string;
  officeLocation?: string;
  employeeId?: string;
  manager?: string;
  technicalSkillLevel: 'novice' | 'intermediate' | 'advanced';
  preferredContactMethod: 'email' | 'phone' | 'in_person';
  timezone: string;
  workingHours: {
    start: string;
    end: string;
    daysOfWeek: string[];
  };
}

export interface AssetInfo {
  assetTag: string;
  assetType: 'laptop' | 'desktop' | 'monitor' | 'printer' | 'phone' | 'tablet' | 'server' | 'network_device';
  manufacturer: string;
  model: string;
  serialNumber?: string;
  operatingSystem?: string;
  osVersion?: string;
  purchaseDate?: Date;
  warrantyExpiration?: Date;
  assignedUser?: string;
  location?: string;
  specifications?: {
    cpu?: string;
    ram?: string;
    storage?: string;
    graphics?: string;
    networkAdapter?: string;
  };
  installedSoftware?: {
    name: string;
    version: string;
    licenseKey?: string;
  }[];
  lastMaintenanceDate?: Date;
  maintenanceSchedule?: string;
}

export interface TechnicalContext {
  systemSpecifications: {
    operatingSystem: string;
    version: string;
    architecture: string;
    processor: string;
    memory: string;
    diskSpace: string;
    networkConfiguration?: string;
  };
  errorMessages: {
    errorCode?: string;
    message: string;
    timestamp: Date;
    source: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    stackTrace?: string;
  }[];
  environmentDetails: {
    domain?: string;
    networkSegment?: string;
    dhcpEnabled?: boolean;
    proxySettings?: string;
    firewallStatus?: string;
    antivirusStatus?: string;
    lastUpdates?: Date;
  };
  symptoms: {
    description: string;
    frequency: 'once' | 'intermittent' | 'frequent' | 'constant';
    impact: 'low' | 'medium' | 'high' | 'critical';
    workarounds?: string;
    reproducible: boolean;
    reproducibilitySteps?: string[];
  }[];
  relatedIncidents?: {
    ticketId: string;
    date: Date;
    resolution?: string;
  }[];
  troubleshootingAttempted?: {
    action: string;
    result: string;
    timestamp: Date;
    performedBy: string;
  }[];
}

export interface SLATracking {
  responseTimeMinutes: number;
  resolutionTimeHours: number;
  escalationTimeHours: number;
  actualResponseTime?: number;
  actualResolutionTime?: number;
  slaBreached: boolean;
  breachReason?: string;
  escalationLevel: number;
  escalationHistory: {
    level: number;
    timestamp: Date;
    reason: string;
    escalatedBy: string;
    escalatedTo?: string;
    resolvedBy?: string;
    resolvedAt?: Date;
  }[];
}

export interface TicketHistory {
  id: string;
  timestamp: Date;
  action: 'created' | 'updated' | 'status_changed' | 'assigned' | 'commented' | 'escalated' | 'resolved' | 'closed';
  performedBy: string;
  previousValue?: any;
  newValue?: any;
  comment?: string;
  metadata?: Record<string, any>;
}

export interface TicketMetadata {
  scenarioId?: string;
  templateId?: string;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  learningObjectives?: string[];
  expectedResolutionSteps?: string[];
  skillsRequired?: string[];
  knowledgeBaseArticles?: string[];
  estimatedResolutionTime?: number;
  complexity?: 'low' | 'medium' | 'high';
  businessImpact?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  customer: CustomerInfo;
  assignedTo?: string;
  createdBy: string;
  slaTracking: SLATracking;
  metadata: TicketMetadata;
  resolution?: {
    summary: string;
    rootCause: string;
    actionsTaken: string[];
    preventionMeasures?: string;
    followUpRequired: boolean;
    followUpDate?: Date;
    customerSatisfaction?: number;
    resolutionNotes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
}