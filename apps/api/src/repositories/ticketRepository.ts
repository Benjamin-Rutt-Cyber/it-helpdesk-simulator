import { PrismaClient } from '@prisma/client';
import { 
  Ticket, 
  TicketStatus, 
  TicketPriority, 
  TicketCategory,
  TicketFilters,
  TicketSortOptions,
  TicketQueryResult,
  TicketHistory,
  TicketTemplate,
  CustomerInfo,
  AssetInfo,
} from '../models/Ticket';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateTicketData {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  customerId: string;
  assetIds?: string[];
  scenarioId?: string;
  templateId?: string;
  assignedTo?: string;
  metadata?: any;
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  assignedTo?: string;
  resolution?: any;
  metadata?: any;
}

export interface TicketSearchOptions {
  query?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  assignedTo?: string;
  customerId?: string;
  scenarioId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  slaBreached?: boolean;
  escalationLevel?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class TicketRepository {
  async create(ticketData: CreateTicketData, createdBy: string): Promise<Ticket> {
    try {
      // Generate ticket number
      const ticketNumber = await this.generateTicketNumber();
      
      // Calculate SLA times based on priority
      const slaConfig = this.getSLAConfiguration(ticketData.priority);
      
      // Create the ticket in database
      const dbTicket = await prisma.$transaction(async (tx) => {
        // Create the main ticket record
        const ticket = await tx.ticket.create({
          data: {
            ticketNumber,
            title: ticketData.title,
            description: ticketData.description,
            category: ticketData.category,
            priority: ticketData.priority,
            status: TicketStatus.OPEN,
            customerId: ticketData.customerId,
            assignedTo: ticketData.assignedTo,
            createdBy,
            scenarioId: ticketData.scenarioId,
            templateId: ticketData.templateId,
            slaResponseTimeMinutes: slaConfig.responseTimeMinutes,
            slaResolutionTimeHours: slaConfig.resolutionTimeHours,
            slaEscalationTimeHours: slaConfig.escalationTimeHours,
            metadata: JSON.stringify(ticketData.metadata || {}),
          },
          include: {
            customer: true,
            assets: {
              include: {
                asset: true,
              },
            },
            assignedUser: true,
            creator: true,
            history: {
              orderBy: { createdAt: 'desc' },
            },
            updates: {
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        // Create initial history entry
        await tx.ticketHistory.create({
          data: {
            ticketId: ticket.id,
            action: 'created',
            performedBy: createdBy,
            newValue: JSON.stringify({
              status: TicketStatus.OPEN,
              priority: ticketData.priority,
              category: ticketData.category,
            }),
            comment: 'Ticket created',
          },
        });

        // Associate assets if provided
        if (ticketData.assetIds && ticketData.assetIds.length > 0) {
          await Promise.all(
            ticketData.assetIds.map((assetId) =>
              tx.ticketAsset.create({
                data: {
                  ticketId: ticket.id,
                  assetId,
                },
              })
            )
          );
        }

        return ticket;
      });

      logger.info('Ticket created successfully', { 
        ticketId: dbTicket.id, 
        ticketNumber: dbTicket.ticketNumber 
      });

      return this.mapDbTicketToModel(dbTicket);
    } catch (error) {
      logger.error('Failed to create ticket', { ticketData, createdBy, error });
      throw error;
    }
  }

  async getById(ticketId: string): Promise<Ticket | null> {
    try {
      const dbTicket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          customer: true,
          assets: {
            include: {
              asset: true,
            },
          },
          assignedUser: true,
          creator: true,
          scenario: true,
          template: true,
          history: {
            orderBy: { createdAt: 'desc' },
            include: {
              user: true,
            },
          },
          updates: {
            orderBy: { createdAt: 'desc' },
            include: {
              user: true,
            },
          },
          escalations: {
            orderBy: { createdAt: 'desc' },
            include: {
              escalator: true,
              escalatee: true,
              resolver: true,
            },
          },
        },
      });

      if (!dbTicket) {
        return null;
      }

      return this.mapDbTicketToModel(dbTicket);
    } catch (error) {
      logger.error('Failed to get ticket by ID', { ticketId, error });
      throw error;
    }
  }

  async getByNumber(ticketNumber: string): Promise<Ticket | null> {
    try {
      const dbTicket = await prisma.ticket.findUnique({
        where: { ticketNumber },
        include: {
          customer: true,
          assets: {
            include: {
              asset: true,
            },
          },
          assignedUser: true,
          creator: true,
          scenario: true,
          template: true,
          history: {
            orderBy: { createdAt: 'desc' },
            include: {
              user: true,
            },
          },
          updates: {
            orderBy: { createdAt: 'desc' },
            include: {
              user: true,
            },
          },
          escalations: {
            orderBy: { createdAt: 'desc' },
            include: {
              escalator: true,
              escalatee: true,
              resolver: true,
            },
          },
        },
      });

      if (!dbTicket) {
        return null;
      }

      return this.mapDbTicketToModel(dbTicket);
    } catch (error) {
      logger.error('Failed to get ticket by number', { ticketNumber, error });
      throw error;
    }
  }

  async update(
    ticketId: string, 
    updateData: UpdateTicketData, 
    updatedBy: string
  ): Promise<Ticket> {
    try {
      const dbTicket = await prisma.$transaction(async (tx) => {
        // Get current ticket for comparison
        const currentTicket = await tx.ticket.findUnique({
          where: { id: ticketId },
          include: { customer: true },
        });

        if (!currentTicket) {
          throw new Error(`Ticket with ID ${ticketId} not found`);
        }

        // Update the ticket
        const updatedTicket = await tx.ticket.update({
          where: { id: ticketId },
          data: {
            title: updateData.title,
            description: updateData.description,
            category: updateData.category,
            priority: updateData.priority,
            status: updateData.status,
            assignedTo: updateData.assignedTo,
            resolution: updateData.resolution ? JSON.stringify(updateData.resolution) : undefined,
            metadata: updateData.metadata ? JSON.stringify(updateData.metadata) : undefined,
            resolvedAt: updateData.status === TicketStatus.RESOLVED ? new Date() : undefined,
            closedAt: updateData.status === TicketStatus.CLOSED ? new Date() : undefined,
          },
          include: {
            customer: true,
            assets: {
              include: {
                asset: true,
              },
            },
            assignedUser: true,
            creator: true,
            history: {
              orderBy: { createdAt: 'desc' },
            },
            updates: {
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        // Create history entries for changes
        const changes = this.detectChanges(currentTicket, updateData);
        if (changes.length > 0) {
          await Promise.all(
            changes.map(change =>
              tx.ticketHistory.create({ data: change })
            )
          );
        }

        // Create update entry
        await tx.ticketUpdate.create({
          data: {
            ticketId,
            updateType: 'status_update',
            content: `Ticket updated by ${updatedBy}`,
            createdBy: updatedBy,
          },
        });

        // Update SLA tracking if status changed
        if (updateData.status && updateData.status !== currentTicket.status) {
          await this.updateSLATracking(tx, ticketId, updateData.status);
        }

        return updatedTicket;
      });

      logger.info('Ticket updated successfully', { 
        ticketId, 
        updatedBy,
        changes: Object.keys(updateData)
      });

      return this.mapDbTicketToModel(dbTicket);
    } catch (error) {
      logger.error('Failed to update ticket', { ticketId, updateData, updatedBy, error });
      throw error;
    }
  }

  async delete(ticketId: string, deletedBy: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Add final history entry
        await tx.ticketHistory.create({
          data: {
            ticketId,
            action: 'deleted',
            performedBy: deletedBy,
            comment: `Ticket deleted by ${deletedBy}`,
          },
        });

        // Delete the ticket (cascades to related records)
        await tx.ticket.delete({
          where: { id: ticketId },
        });
      });

      logger.info('Ticket deleted successfully', { ticketId, deletedBy });
    } catch (error) {
      logger.error('Failed to delete ticket', { ticketId, deletedBy, error });
      throw error;
    }
  }

  async search(options: TicketSearchOptions = {}): Promise<TicketQueryResult> {
    try {
      const {
        query,
        category,
        priority,
        status,
        assignedTo,
        customerId,
        scenarioId,
        dateFrom,
        dateTo,
        slaBreached,
        escalationLevel,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      // Build where clause
      const where: any = {};

      if (query) {
        where.OR = [
          { title: { contains: query } },
          { description: { contains: query } },
          { ticketNumber: { contains: query } },
        ];
      }

      if (category) where.category = category;
      if (priority) where.priority = priority;
      if (status) where.status = status;
      if (assignedTo) where.assignedTo = assignedTo;
      if (customerId) where.customerId = customerId;
      if (scenarioId) where.scenarioId = scenarioId;
      if (slaBreached !== undefined) where.slaBreached = slaBreached;
      if (escalationLevel !== undefined) where.escalationLevel = escalationLevel;

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      // Get total count
      const total = await prisma.ticket.count({ where });

      // Get tickets with pagination
      const tickets = await prisma.ticket.findMany({
        where,
        include: {
          customer: true,
          assets: {
            include: {
              asset: true,
            },
          },
          assignedUser: true,
          creator: true,
          _count: {
            select: {
              history: true,
              updates: true,
              escalations: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      });

      const mappedTickets = tickets.map(ticket => this.mapDbTicketToModel(ticket));

      return {
        tickets: mappedTickets,
        totalCount: total,
        filteredCount: total,
        page,
        pageSize: limit,
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      logger.error('Failed to search tickets', { options, error });
      throw error;
    }
  }

  async getHistory(ticketId: string): Promise<TicketHistory[]> {
    try {
      const history = await prisma.ticketHistory.findMany({
        where: { ticketId },
        include: {
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return history.map(entry => ({
        id: entry.id,
        ticketId: entry.ticketId,
        timestamp: entry.createdAt,
        action: entry.action as any,
        performedBy: entry.user.id,
        previousValue: entry.oldValue ? JSON.parse(entry.oldValue) : null,
        newValue: entry.newValue ? JSON.parse(entry.newValue) : null,
        comment: entry.comment || '',
        metadata: {},
      }));
    } catch (error) {
      logger.error('Failed to get ticket history', { ticketId, error });
      throw error;
    }
  }

  async getStatistics(filters?: Partial<TicketSearchOptions>): Promise<any> {
    try {
      const where = this.buildWhereClause(filters || {});

      const [
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        escalatedTickets,
        closedTickets,
        highPriorityTickets,
        slaBreachedTickets,
      ] = await Promise.all([
        prisma.ticket.count({ where }),
        prisma.ticket.count({ where: { ...where, status: TicketStatus.OPEN } }),
        prisma.ticket.count({ where: { ...where, status: TicketStatus.IN_PROGRESS } }),
        prisma.ticket.count({ where: { ...where, status: TicketStatus.RESOLVED } }),
        prisma.ticket.count({ where: { ...where, status: TicketStatus.ESCALATED } }),
        prisma.ticket.count({ where: { ...where, status: TicketStatus.CLOSED } }),
        prisma.ticket.count({ where: { ...where, priority: TicketPriority.HIGH } }),
        prisma.ticket.count({ where: { ...where, slaBreached: true } }),
      ]);

      // Calculate average resolution time for resolved tickets
      const resolvedTicketsWithTimes = await prisma.ticket.findMany({
        where: {
          ...where,
          status: TicketStatus.RESOLVED,
          resolvedAt: { not: null },
        },
        select: {
          createdAt: true,
          resolvedAt: true,
        },
      });

      const averageResolutionTime = resolvedTicketsWithTimes.length > 0
        ? resolvedTicketsWithTimes.reduce((sum: number, ticket: any) => {
            const resolutionTime = ticket.resolvedAt.getTime() - ticket.createdAt.getTime();
            return sum + resolutionTime;
          }, 0) / resolvedTicketsWithTimes.length / (1000 * 60 * 60) // Convert to hours
        : 0;

      return {
        totalTickets,
        statusDistribution: {
          open: openTickets,
          inProgress: inProgressTickets,
          resolved: resolvedTickets,
          escalated: escalatedTickets,
          closed: closedTickets,
        },
        priorityDistribution: {
          high: highPriorityTickets,
          medium: totalTickets - highPriorityTickets - (totalTickets - highPriorityTickets), // Approximate
          low: totalTickets - highPriorityTickets,
        },
        slaMetrics: {
          breachedTickets: slaBreachedTickets,
          breachRate: totalTickets > 0 ? (slaBreachedTickets / totalTickets) * 100 : 0,
        },
        performance: {
          averageResolutionTimeHours: Math.round(averageResolutionTime * 100) / 100,
        },
      };
    } catch (error) {
      logger.error('Failed to get ticket statistics', { filters, error });
      throw error;
    }
  }

  // Template management
  async createTemplate(templateData: Omit<TicketTemplate, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Promise<TicketTemplate> {
    try {
      const dbTemplate = await prisma.ticketTemplate.create({
        data: {
          name: templateData.name,
          category: templateData.category,
          priority: templateData.priority,
          difficultyLevel: templateData.difficultyLevel,
          titleTemplates: JSON.stringify(templateData.titleTemplates),
          descriptionTemplates: JSON.stringify(templateData.descriptionTemplates),
          customerProfiles: JSON.stringify(templateData.customerProfiles),
          assetTemplates: JSON.stringify(templateData.assetTemplates),
          technicalContextTemplates: JSON.stringify(templateData.technicalContextTemplates),
          learningObjectives: JSON.stringify(templateData.learningObjectives),
          expectedResolutionSteps: JSON.stringify(templateData.expectedResolutionSteps),
          skillsRequired: JSON.stringify(templateData.skillsRequired),
          knowledgeBaseArticles: JSON.stringify(templateData.knowledgeBaseArticles),
          estimatedResolutionTime: templateData.estimatedResolutionTime,
          complexity: templateData.complexity,
          businessImpact: templateData.businessImpact,
          variationRules: JSON.stringify(templateData.variationRules),
          usageCount: templateData.usageCount,
          successRate: templateData.successRate,
          averageResolutionTime: templateData.averageResolutionTime,
          tags: JSON.stringify(templateData.tags),
          isActive: templateData.isActive,
          createdBy,
        },
        include: {
          creator: true,
        },
      });

      return this.mapDbTemplateToModel(dbTemplate);
    } catch (error) {
      logger.error('Failed to create ticket template', { templateData, createdBy, error });
      throw error;
    }
  }

  async getTemplateById(templateId: string): Promise<TicketTemplate | null> {
    try {
      const dbTemplate = await prisma.ticketTemplate.findUnique({
        where: { id: templateId },
        include: {
          creator: true,
        },
      });

      if (!dbTemplate) {
        return null;
      }

      return this.mapDbTemplateToModel(dbTemplate);
    } catch (error) {
      logger.error('Failed to get template by ID', { templateId, error });
      throw error;
    }
  }

  async getTemplates(filters: { category?: TicketCategory; isActive?: boolean } = {}): Promise<TicketTemplate[]> {
    try {
      const dbTemplates = await prisma.ticketTemplate.findMany({
        where: {
          category: filters.category,
          isActive: filters.isActive,
        },
        include: {
          creator: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return dbTemplates.map(template => this.mapDbTemplateToModel(template));
    } catch (error) {
      logger.error('Failed to get templates', { filters, error });
      throw error;
    }
  }

  // Additional query methods
  async queryTickets(filters: TicketFilters, sortOptions?: TicketSortOptions): Promise<TicketQueryResult> {
    return this.search({
      query: filters.query,
      category: filters.category,
      priority: filters.priority,
      status: filters.status,
      assignedTo: filters.assignedTo,
      customerId: filters.customerId,
      scenarioId: filters.scenarioId,
      dateFrom: filters.dateRange?.start,
      dateTo: filters.dateRange?.end,
      slaBreached: filters.slaBreached,
      escalationLevel: filters.escalationLevel,
      page: filters.page,
      limit: filters.limit,
      sortBy: sortOptions?.field,
      sortOrder: sortOptions?.direction,
    });
  }

  async getTicketHistory(ticketId: string): Promise<TicketHistory[]> {
    return this.getHistory(ticketId);
  }

  async getTicketsByUser(userId: string, filters?: TicketFilters): Promise<TicketQueryResult> {
    return this.search({
      ...filters,
      assignedTo: userId,
    });
  }

  async getTicketMetrics(filters?: TicketFilters): Promise<any> {
    return this.getStatistics(filters);
  }

  async findById(ticketId: string): Promise<Ticket | null> {
    return this.getById(ticketId);
  }

  // Private helper methods
  private async generateTicketNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    // Get count of tickets created today
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const todayCount = await prisma.ticket.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    const sequence = String(todayCount + 1).padStart(4, '0');
    return `TK-${year}${month}-${sequence}`;
  }

  private getSLAConfiguration(priority: TicketPriority): {
    responseTimeMinutes: number;
    resolutionTimeHours: number;
    escalationTimeHours: number;
  } {
    switch (priority) {
      case TicketPriority.HIGH:
        return {
          responseTimeMinutes: 15,
          resolutionTimeHours: 4,
          escalationTimeHours: 2,
        };
      case TicketPriority.MEDIUM:
        return {
          responseTimeMinutes: 60,
          resolutionTimeHours: 24,
          escalationTimeHours: 8,
        };
      case TicketPriority.LOW:
        return {
          responseTimeMinutes: 240,
          resolutionTimeHours: 72,
          escalationTimeHours: 24,
        };
      default:
        return {
          responseTimeMinutes: 60,
          resolutionTimeHours: 24,
          escalationTimeHours: 8,
        };
    }
  }

  private detectChanges(currentTicket: any, updateData: UpdateTicketData): any[] {
    const changes: any[] = [];
    const ticketId = currentTicket.id;
    const timestamp = new Date();

    Object.entries(updateData).forEach(([field, newValue]) => {
      if (newValue !== undefined && currentTicket[field] !== newValue) {
        changes.push({
          ticketId,
          action: `${field}_changed`,
          oldValue: JSON.stringify(currentTicket[field]),
          newValue: JSON.stringify(newValue),
          performedBy: 'system', // This should be passed from the calling method
          createdAt: timestamp,
        });
      }
    });

    return changes;
  }

  private async updateSLATracking(tx: any, ticketId: string, newStatus: TicketStatus): Promise<void> {
    const ticket = await tx.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return;

    const now = new Date();
    const createdAt = ticket.createdAt;
    const updates: any = {};

    if (newStatus === TicketStatus.IN_PROGRESS && !ticket.actualResponseTime) {
      const responseTime = Math.floor((now.getTime() - createdAt.getTime()) / 60000); // minutes
      updates.actualResponseTime = responseTime;
      
      if (responseTime > ticket.slaResponseTimeMinutes) {
        updates.slaBreached = true;
        updates.breachReason = 'Response time SLA exceeded';
      }
    }

    if (newStatus === TicketStatus.RESOLVED && !ticket.actualResolutionTime) {
      const resolutionTime = Math.floor((now.getTime() - createdAt.getTime()) / 3600000); // hours
      updates.actualResolutionTime = resolutionTime;
      
      if (resolutionTime > ticket.slaResolutionTimeHours) {
        updates.slaBreached = true;
        updates.breachReason = updates.breachReason 
          ? `${updates.breachReason}, Resolution time SLA exceeded`
          : 'Resolution time SLA exceeded';
      }
    }

    if (Object.keys(updates).length > 0) {
      await tx.ticket.update({
        where: { id: ticketId },
        data: updates,
      });
    }
  }

  private buildWhereClause(filters: Partial<TicketSearchOptions>): any {
    const where: any = {};
    
    if (filters.category) where.category = filters.category;
    if (filters.priority) where.priority = filters.priority;
    if (filters.status) where.status = filters.status;
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.scenarioId) where.scenarioId = filters.scenarioId;
    if (filters.slaBreached !== undefined) where.slaBreached = filters.slaBreached;
    if (filters.escalationLevel !== undefined) where.escalationLevel = filters.escalationLevel;

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    return where;
  }

  private mapDbTicketToModel(dbTicket: any): Ticket {
    return {
      id: dbTicket.id,
      ticketNumber: dbTicket.ticketNumber,
      title: dbTicket.title,
      description: dbTicket.description,
      category: dbTicket.category as TicketCategory,
      priority: dbTicket.priority as TicketPriority,
      status: dbTicket.status as TicketStatus,
      customer: this.mapDbCustomerToModel(dbTicket.customer),
      assignedTo: dbTicket.assignedTo,
      createdBy: dbTicket.createdBy,
      scenarioId: dbTicket.scenarioId,
      templateId: dbTicket.templateId,
      slaTracking: {
        responseTimeMinutes: dbTicket.slaResponseTimeMinutes,
        resolutionTimeHours: dbTicket.slaResolutionTimeHours,
        escalationTimeHours: dbTicket.slaEscalationTimeHours,
        actualResponseTime: dbTicket.actualResponseTime,
        actualResolutionTime: dbTicket.actualResolutionTime,
        slaBreached: dbTicket.slaBreached,
        breachReason: dbTicket.breachReason,
        escalationLevel: dbTicket.escalationLevel,
        escalationHistory: dbTicket.escalations?.map((esc: any) => ({
          level: esc.level,
          timestamp: esc.createdAt,
          reason: esc.reason,
          escalatedBy: esc.escalator.email,
          escalatedTo: esc.escalatee?.email,
          resolvedBy: esc.resolver?.email,
          resolvedAt: esc.resolvedAt,
        })) || [],
      },
      resolution: dbTicket.resolution ? JSON.parse(dbTicket.resolution) : null,
      metadata: dbTicket.metadata ? JSON.parse(dbTicket.metadata) : {},
      history: dbTicket.history?.map((h: any) => ({
        id: h.id,
        action: h.action,
        oldValue: h.oldValue ? JSON.parse(h.oldValue) : null,
        newValue: h.newValue ? JSON.parse(h.newValue) : null,
        comment: h.comment || '',
        performedBy: h.user ? {
          id: h.user.id,
          firstName: h.user.firstName || '',
          lastName: h.user.lastName || '',
          email: h.user.email,
        } : undefined,
        createdAt: h.createdAt,
      })) || [],
      updates: dbTicket.updates?.map((u: any) => ({
        id: u.id,
        updateType: u.updateType,
        title: u.title,
        content: u.content,
        isInternal: u.isInternal,
        createdBy: u.user ? {
          id: u.user.id,
          firstName: u.user.firstName || '',
          lastName: u.user.lastName || '',
          email: u.user.email,
        } : undefined,
        createdAt: u.createdAt,
      })) || [],
      createdAt: dbTicket.createdAt,
      updatedAt: dbTicket.updatedAt,
      resolvedAt: dbTicket.resolvedAt,
      closedAt: dbTicket.closedAt,
    };
  }

  private mapDbCustomerToModel(dbCustomer: any): CustomerInfo {
    return {
      id: dbCustomer.id,
      firstName: dbCustomer.firstName,
      lastName: dbCustomer.lastName,
      fullName: dbCustomer.fullName,
      email: dbCustomer.email,
      phone: dbCustomer.phone,
      department: dbCustomer.department,
      jobTitle: dbCustomer.jobTitle,
      officeLocation: dbCustomer.officeLocation,
      employeeId: dbCustomer.employeeId,
      manager: dbCustomer.manager,
      technicalSkillLevel: dbCustomer.technicalSkillLevel,
      preferredContactMethod: dbCustomer.preferredContactMethod,
      timezone: dbCustomer.timezone,
      workingHours: JSON.parse(dbCustomer.workingHours),
    };
  }

  private mapDbAssetToModel(dbAsset: any): AssetInfo {
    return {
      assetTag: dbAsset.assetTag,
      assetType: dbAsset.assetType,
      manufacturer: dbAsset.manufacturer,
      model: dbAsset.model,
      serialNumber: dbAsset.serialNumber,
      operatingSystem: dbAsset.operatingSystem,
      osVersion: dbAsset.osVersion,
      purchaseDate: dbAsset.purchaseDate,
      warrantyExpiration: dbAsset.warrantyExpiration,
      assignedUser: dbAsset.assignedUser,
      location: dbAsset.location,
      specifications: JSON.parse(dbAsset.specifications || '{}'),
      installedSoftware: JSON.parse(dbAsset.installedSoftware || '[]'),
      lastMaintenanceDate: dbAsset.lastMaintenanceDate,
      maintenanceSchedule: dbAsset.maintenanceSchedule,
    };
  }

  private mapDbTemplateToModel(dbTemplate: any): TicketTemplate {
    return {
      id: dbTemplate.id,
      name: dbTemplate.name,
      category: dbTemplate.category as TicketCategory,
      priority: dbTemplate.priority as TicketPriority,
      difficultyLevel: dbTemplate.difficultyLevel,
      titleTemplates: JSON.parse(dbTemplate.titleTemplates),
      descriptionTemplates: JSON.parse(dbTemplate.descriptionTemplates),
      customerProfiles: JSON.parse(dbTemplate.customerProfiles),
      assetTemplates: JSON.parse(dbTemplate.assetTemplates),
      technicalContextTemplates: JSON.parse(dbTemplate.technicalContextTemplates),
      learningObjectives: JSON.parse(dbTemplate.learningObjectives),
      expectedResolutionSteps: JSON.parse(dbTemplate.expectedResolutionSteps),
      skillsRequired: JSON.parse(dbTemplate.skillsRequired),
      knowledgeBaseArticles: JSON.parse(dbTemplate.knowledgeBaseArticles),
      estimatedResolutionTime: dbTemplate.estimatedResolutionTime,
      complexity: dbTemplate.complexity,
      businessImpact: dbTemplate.businessImpact,
      variationRules: JSON.parse(dbTemplate.variationRules),
      usageCount: dbTemplate.usageCount,
      successRate: dbTemplate.successRate,
      averageResolutionTime: dbTemplate.averageResolutionTime,
      tags: JSON.parse(dbTemplate.tags),
      isActive: dbTemplate.isActive,
      createdAt: dbTemplate.createdAt,
      updatedAt: dbTemplate.updatedAt,
      createdBy: dbTemplate.createdBy,
    };
  }
}

export const ticketRepository = new TicketRepository();
export default ticketRepository;