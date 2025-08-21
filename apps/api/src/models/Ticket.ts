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
  responseTimeMinutes: number; // SLA for first response
  resolutionTimeHours: number; // SLA for resolution
  escalationTimeHours: number; // Time before escalation
  actualResponseTime?: number; // Actual time to first response
  actualResolutionTime?: number; // Actual time to resolution
  slaBreached: boolean;
  breachReason?: string;
  escalationLevel: number; // 0 = no escalation, 1+ = escalation levels
  escalationHistory: {
    level: number;
    timestamp: Date;
    reason: string;
    escalatedBy: string;
    escalatedTo?: string;
  }[];
}

export interface TicketMetadata {
  scenarioId?: string;
  templateId?: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  learningObjectives: string[];
  expectedResolutionSteps: string[];
  knowledgeBaseArticles: string[];
  skillsRequired: string[];
  estimatedResolutionTime: number; // in minutes
  complexity: 'low' | 'medium' | 'high';
  businessImpact: 'low' | 'medium' | 'high' | 'critical';
}

export interface TicketHistory {
  id: string;
  ticketId: string;
  timestamp: Date;
  action: 'created' | 'updated' | 'status_changed' | 'assigned' | 'commented' | 'escalated' | 'resolved' | 'closed';
  performedBy: string;
  previousValue?: any;
  newValue?: any;
  comment?: string;
  metadata?: Record<string, any>;
}

export interface Ticket {
  id: string;
  ticketNumber: string; // Human-readable format like "TKT-2024-001234"
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  
  // Customer and Asset Information
  customer: CustomerInfo;
  affectedAssets: AssetInfo[];
  
  // Technical Information
  technicalContext: TechnicalContext;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  firstResponseAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  
  // Assignment and Ownership
  assignedTo?: string; // User ID of assigned technician
  assignedAt?: Date;
  createdBy: string; // System or user ID
  
  // SLA and Performance
  slaTracking: SLATracking;
  
  // Learning and Scenario Information
  metadata: TicketMetadata;
  
  // Resolution Information
  resolution?: {
    summary: string;
    rootCause: string;
    actionsTaken: string[];
    preventionMeasures?: string;
    followUpRequired: boolean;
    followUpDate?: Date;
    customerSatisfaction?: number; // 1-5 rating
    resolutionNotes?: string;
  };
  
  // Communication and Updates
  updates: {
    id: string;
    timestamp: Date;
    updateType: 'note' | 'status_change' | 'assignment' | 'customer_communication';
    content: string;
    isPublic: boolean; // Visible to customer
    author: string;
    attachments?: string[];
  }[];
  
  // History and Audit Trail
  history: TicketHistory[];
  
  // Performance Metrics
  performanceMetrics?: {
    timeToFirstResponse: number; // in minutes
    timeToResolution: number; // in minutes
    customerInteractions: number;
    escalations: number;
    reopens: number;
    resolutionAccuracy: number; // percentage
  };
}

// Template system for generating realistic tickets
export interface TicketTemplate {
  id: string;
  name: string;
  category: TicketCategory;
  priority: TicketPriority;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  
  // Template content
  titleTemplates: string[];
  descriptionTemplates: string[];
  
  // Customer profile templates
  customerProfiles: Partial<CustomerInfo>[];
  
  // Asset templates
  assetTemplates: Partial<AssetInfo>[];
  
  // Technical context templates
  technicalContextTemplates: Partial<TechnicalContext>[];
  
  // Learning objectives
  learningObjectives: string[];
  expectedResolutionSteps: string[];
  skillsRequired: string[];
  knowledgeBaseArticles: string[];
  
  // Scenario parameters
  estimatedResolutionTime: number;
  complexity: 'low' | 'medium' | 'high';
  businessImpact: 'low' | 'medium' | 'high' | 'critical';
  
  // Variation settings
  variationRules: {
    allowTitleVariation: boolean;
    allowDescriptionVariation: boolean;
    allowCustomerVariation: boolean;
    allowAssetVariation: boolean;
    allowTechnicalVariation: boolean;
    maxVariations: number;
  };
  
  // Usage tracking
  usageCount: number;
  lastUsed?: Date;
  successRate: number; // Percentage of successful resolutions
  averageResolutionTime: number;
  
  // Template metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isActive: boolean;
  tags: string[];
}

// Utility types for filtering and querying
export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  assignedTo?: string;
  customer?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  slaBreached?: boolean;
  department?: Department[];
  searchText?: string;
}

export interface TicketSortOptions {
  field: 'createdAt' | 'updatedAt' | 'priority' | 'status' | 'dueDate' | 'customer';
  direction: 'asc' | 'desc';
}

export interface TicketQueryResult {
  tickets: Ticket[];
  totalCount: number;
  filteredCount: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// SLA Configuration
export interface SLAConfiguration {
  priority: TicketPriority;
  responseTimeMinutes: number;
  resolutionTimeHours: number;
  escalationTimeHours: number;
  businessHoursOnly: boolean;
  excludeWeekends: boolean;
  excludeHolidays: boolean;
}

// Default SLA configurations
export const DEFAULT_SLA_CONFIG: Record<TicketPriority, SLAConfiguration> = {
  [TicketPriority.HIGH]: {
    priority: TicketPriority.HIGH,
    responseTimeMinutes: 60, // 1 hour
    resolutionTimeHours: 4,
    escalationTimeHours: 2,
    businessHoursOnly: false,
    excludeWeekends: false,
    excludeHolidays: true,
  },
  [TicketPriority.MEDIUM]: {
    priority: TicketPriority.MEDIUM,
    responseTimeMinutes: 120, // 2 hours
    resolutionTimeHours: 8,
    escalationTimeHours: 6,
    businessHoursOnly: true,
    excludeWeekends: true,
    excludeHolidays: true,
  },
  [TicketPriority.LOW]: {
    priority: TicketPriority.LOW,
    responseTimeMinutes: 240, // 4 hours
    resolutionTimeHours: 24,
    escalationTimeHours: 16,
    businessHoursOnly: true,
    excludeWeekends: true,
    excludeHolidays: true,
  },
};

// Validation schemas and utility functions
export const CATEGORY_DESCRIPTIONS: Record<TicketCategory, string> = {
  [TicketCategory.HARDWARE]: 'Physical computer equipment, peripherals, and hardware failures',
  [TicketCategory.SOFTWARE]: 'Application issues, software installation, and configuration problems',
  [TicketCategory.NETWORK]: 'Internet connectivity, Wi-Fi, VPN, and network access issues',
  [TicketCategory.EMAIL]: 'Email client configuration, delivery issues, and communication problems',
  [TicketCategory.PASSWORD]: 'Password resets, account lockouts, and authentication issues',
  [TicketCategory.PRINTER]: 'Printing problems, driver issues, and printer configuration',
  [TicketCategory.PHONE]: 'VoIP, phone system, and telecommunication issues',
  [TicketCategory.ACCOUNT]: 'User account management, permissions, and access control',
  [TicketCategory.SECURITY]: 'Security incidents, malware, and data protection issues',
  [TicketCategory.GENERAL]: 'General IT support requests and miscellaneous issues',
};

export const PRIORITY_DESCRIPTIONS: Record<TicketPriority, string> = {
  [TicketPriority.HIGH]: 'Critical business impact, immediate attention required',
  [TicketPriority.MEDIUM]: 'Moderate business impact, resolution within business hours',
  [TicketPriority.LOW]: 'Minor impact, can be resolved during standard support hours',
};

export const STATUS_DESCRIPTIONS: Record<TicketStatus, string> = {
  [TicketStatus.OPEN]: 'Ticket has been created and awaits assignment or initial response',
  [TicketStatus.IN_PROGRESS]: 'Ticket is actively being worked on by a technician',
  [TicketStatus.RESOLVED]: 'Issue has been resolved, awaiting customer confirmation',
  [TicketStatus.ESCALATED]: 'Ticket has been escalated to higher-level support',
  [TicketStatus.CLOSED]: 'Ticket has been completed and closed',
};

// Utility functions for ticket management
export class TicketUtils {
  static generateTicketNumber(): string {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `TKT-${year}-${timestamp}`;
  }

  static calculateSLA(priority: TicketPriority, createdAt: Date): SLAConfiguration {
    return DEFAULT_SLA_CONFIG[priority];
  }

  static isSLABreached(ticket: Ticket): boolean {
    const sla = this.calculateSLA(ticket.priority, ticket.createdAt);
    const now = new Date();
    
    // Check response time SLA
    if (!ticket.firstResponseAt) {
      const responseTimeMs = now.getTime() - ticket.createdAt.getTime();
      const slaResponseTimeMs = sla.responseTimeMinutes * 60 * 1000;
      return responseTimeMs > slaResponseTimeMs;
    }
    
    // Check resolution time SLA
    if (!ticket.resolvedAt && ticket.status !== TicketStatus.CLOSED) {
      const resolutionTimeMs = now.getTime() - ticket.createdAt.getTime();
      const slaResolutionTimeMs = sla.resolutionTimeHours * 60 * 60 * 1000;
      return resolutionTimeMs > slaResolutionTimeMs;
    }
    
    return false;
  }

  static getTimeToSLABreach(ticket: Ticket): number {
    const sla = this.calculateSLA(ticket.priority, ticket.createdAt);
    const now = new Date();
    
    if (!ticket.firstResponseAt) {
      const responseTimeMs = now.getTime() - ticket.createdAt.getTime();
      const slaResponseTimeMs = sla.responseTimeMinutes * 60 * 1000;
      return slaResponseTimeMs - responseTimeMs;
    }
    
    if (!ticket.resolvedAt && ticket.status !== TicketStatus.CLOSED) {
      const resolutionTimeMs = now.getTime() - ticket.createdAt.getTime();
      const slaResolutionTimeMs = sla.resolutionTimeHours * 60 * 60 * 1000;
      return slaResolutionTimeMs - resolutionTimeMs;
    }
    
    return Infinity; // No SLA concern
  }

  static getPriorityColor(priority: TicketPriority): string {
    switch (priority) {
      case TicketPriority.HIGH:
        return '#dc2626'; // red-600
      case TicketPriority.MEDIUM:
        return '#d97706'; // amber-600
      case TicketPriority.LOW:
        return '#059669'; // emerald-600
      default:
        return '#6b7280'; // gray-500
    }
  }

  static getStatusColor(status: TicketStatus): string {
    switch (status) {
      case TicketStatus.OPEN:
        return '#2563eb'; // blue-600
      case TicketStatus.IN_PROGRESS:
        return '#d97706'; // amber-600
      case TicketStatus.RESOLVED:
        return '#059669'; // emerald-600
      case TicketStatus.ESCALATED:
        return '#dc2626'; // red-600
      case TicketStatus.CLOSED:
        return '#6b7280'; // gray-500
      default:
        return '#6b7280'; // gray-500
    }
  }

  static validateTicket(ticket: Partial<Ticket>): string[] {
    const errors: string[] = [];

    if (!ticket.title || ticket.title.trim().length === 0) {
      errors.push('Ticket title is required');
    }

    if (!ticket.description || ticket.description.trim().length === 0) {
      errors.push('Ticket description is required');
    }

    if (!ticket.category || !Object.values(TicketCategory).includes(ticket.category)) {
      errors.push('Valid ticket category is required');
    }

    if (!ticket.priority || !Object.values(TicketPriority).includes(ticket.priority)) {
      errors.push('Valid ticket priority is required');
    }

    if (!ticket.customer) {
      errors.push('Customer information is required');
    } else {
      if (!ticket.customer.firstName || !ticket.customer.lastName) {
        errors.push('Customer first name and last name are required');
      }
      if (!ticket.customer.email) {
        errors.push('Customer email is required');
      }
      if (!ticket.customer.department) {
        errors.push('Customer department is required');
      }
    }

    return errors;
  }

  static canTransitionStatus(currentStatus: TicketStatus, newStatus: TicketStatus): boolean {
    const validTransitions: Record<TicketStatus, TicketStatus[]> = {
      [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS, TicketStatus.ESCALATED, TicketStatus.CLOSED],
      [TicketStatus.IN_PROGRESS]: [TicketStatus.RESOLVED, TicketStatus.ESCALATED, TicketStatus.OPEN],
      [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.IN_PROGRESS],
      [TicketStatus.ESCALATED]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED],
      [TicketStatus.CLOSED]: [], // Closed tickets cannot be transitioned
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }
}

export default Ticket;