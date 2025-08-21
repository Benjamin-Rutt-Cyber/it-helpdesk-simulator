import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create achievements
  const achievements = [
    {
      id: 'ach-first-contact',
      title: 'First Contact',
      description: 'Complete your first customer conversation',
      icon: '🎯',
      tier: 'bronze',
      xpReward: 100,
      criteria: { type: 'session_complete', count: 1 },
    },
    {
      id: 'ach-speed-demon',
      title: 'Speed Demon',
      description: 'Resolve a ticket in under 5 minutes',
      icon: '⚡',
      tier: 'silver',
      xpReward: 250,
      criteria: { type: 'completion_time', maxTime: 300 },
    },
    {
      id: 'ach-communication-master',
      title: 'Communication Master',
      description: 'Achieve perfect communication score',
      icon: '🗣️',
      tier: 'gold',
      xpReward: 500,
      criteria: { type: 'communication_score', minScore: 100 },
    },
    {
      id: 'ach-tech-wizard',
      title: 'Tech Wizard',
      description: 'Master technical troubleshooting',
      icon: '🧙‍♂️',
      tier: 'platinum',
      xpReward: 1000,
      criteria: { type: 'technical_score', minScore: 95 },
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { id: achievement.id },
      update: {},
      create: achievement,
    });
  }

  // Create scenarios
  const scenarios = [
    {
      id: 'scenario-password-reset',
      title: 'Password Reset Request',
      description: 'A user cannot access their account and needs password reset assistance',
      difficulty: 'starter' as const,
      estimatedTime: 300, // 5 minutes
      xpReward: 100,
      ticketTemplate: {
        subject: 'Cannot log into my account',
        urgency: 'medium',
        category: 'account_access',
        initialMessage: 'Hi, I forgot my password and cannot log into my account. Can you help me reset it?',
      },
      customerPersona: {
        name: 'Sarah Johnson',
        role: 'Marketing Manager',
        techLevel: 'basic',
        communicationStyle: 'friendly',
        urgency: 'medium',
        background: 'Has been using the system for 6 months, generally comfortable with basic functions',
      },
      knowledgeBaseEntries: [
        {
          id: 'kb-password-reset',
          title: 'Password Reset Procedure',
          content: 'To reset a password: 1. Navigate to login page 2. Click "Forgot Password" 3. Enter email 4. Check email for reset link 5. Follow link to create new password',
          category: 'authentication',
        },
        {
          id: 'kb-account-lockout',
          title: 'Account Lockout Policy',
          content: 'Accounts are locked after 5 failed login attempts. Lockout duration is 30 minutes or until manual reset by support.',
          category: 'security',
        },
      ],
      assessmentCriteria: {
        verification: { weight: 0.2, description: 'Verify user identity before reset' },
        communication: { weight: 0.3, description: 'Clear, empathetic communication' },
        technical: { weight: 0.3, description: 'Correct password reset procedure' },
        documentation: { weight: 0.2, description: 'Document resolution in ticket' },
      },
      prerequisites: [],
    },
    {
      id: 'scenario-software-installation',
      title: 'Software Installation Issue',
      description: 'User experiencing problems installing company software on their computer',
      difficulty: 'intermediate' as const,
      estimatedTime: 900, // 15 minutes
      xpReward: 200,
      ticketTemplate: {
        subject: 'Software installation fails with error code 1603',
        urgency: 'high',
        category: 'software_support',
        initialMessage: 'The company app keeps failing to install on my Windows 10 machine. I get error code 1603 every time. I need this working for my presentation tomorrow.',
      },
      customerPersona: {
        name: 'Michael Chen',
        role: 'Sales Director',
        techLevel: 'intermediate',
        communicationStyle: 'direct',
        urgency: 'high',
        background: 'Comfortable with technology but pressed for time, needs quick resolution',
      },
      knowledgeBaseEntries: [
        {
          id: 'kb-error-1603',
          title: 'Windows Installer Error 1603',
          content: 'Error 1603: Usually caused by insufficient permissions, corrupted Windows Installer, or conflicting software. Solutions: Run as administrator, clean installer cache, disable antivirus temporarily.',
          category: 'installation',
        },
        {
          id: 'kb-system-requirements',
          title: 'Software System Requirements',
          content: 'Minimum requirements: Windows 10 64-bit, 8GB RAM, 2GB free space, Administrator privileges required for installation.',
          category: 'specifications',
        },
      ],
      assessmentCriteria: {
        verification: { weight: 0.15, description: 'Gather system information and error details' },
        communication: { weight: 0.25, description: 'Manage customer urgency professionally' },
        technical: { weight: 0.4, description: 'Diagnose and resolve installation issue' },
        documentation: { weight: 0.2, description: 'Document troubleshooting steps' },
      },
      prerequisites: ['scenario-password-reset'],
    },
    {
      id: 'scenario-network-connectivity',
      title: 'Network Connectivity Problems',
      description: 'Remote employee cannot connect to company VPN and access internal resources',
      difficulty: 'advanced' as const,
      estimatedTime: 1200, // 20 minutes
      xpReward: 300,
      ticketTemplate: {
        subject: 'VPN connection timeout - cannot access company servers',
        urgency: 'high',
        category: 'network_support',
        initialMessage: 'I\'m working from home and suddenly cannot connect to the VPN. It times out every time I try. I need access to the internal servers for my work.',
      },
      customerPersona: {
        name: 'Jennifer Rodriguez',
        role: 'Senior Developer',
        techLevel: 'advanced',
        communicationStyle: 'technical',
        urgency: 'high',
        background: 'Very technical user who has tried basic troubleshooting, needs expert assistance',
      },
      knowledgeBaseEntries: [
        {
          id: 'kb-vpn-troubleshooting',
          title: 'VPN Connection Troubleshooting',
          content: 'Common VPN issues: Check internet connectivity, verify VPN client version, test different VPN servers, check firewall settings, restart network adapter.',
          category: 'networking',
        },
        {
          id: 'kb-firewall-ports',
          title: 'Required Firewall Ports',
          content: 'VPN requires: TCP 1723 (PPTP), UDP 500/4500 (IPSec), TCP 443 (SSL VPN). Corporate firewall may block these ports.',
          category: 'security',
        },
      ],
      assessmentCriteria: {
        verification: { weight: 0.2, description: 'Diagnose network connectivity systematically' },
        communication: { weight: 0.2, description: 'Communicate technical solutions clearly' },
        technical: { weight: 0.5, description: 'Resolve complex network issue' },
        documentation: { weight: 0.1, description: 'Document network configuration' },
      },
      prerequisites: ['scenario-software-installation'],
    },
  ];

  for (const scenario of scenarios) {
    await prisma.scenario.upsert({
      where: { id: scenario.id },
      update: {},
      create: scenario,
    });
  }

  // Create sample test users
  const testUsers = [
    {
      id: 'user-demo-1',
      email: 'demo@example.com',
      passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj5GNWKgwghO', // password: 'demo123'
      firstName: 'Demo',
      lastName: 'User',
      level: 1,
      xp: 0,
      timezone: 'UTC',
      preferences: { theme: 'light', notifications: true },
      isVerified: true,
    },
    {
      id: 'user-advanced-1',
      email: 'advanced@example.com',
      passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj5GNWKgwghO', // password: 'demo123'
      firstName: 'Advanced',
      lastName: 'Tester',
      level: 3,
      xp: 750,
      timezone: 'America/New_York',
      preferences: { theme: 'dark', notifications: false },
      isVerified: true,
    },
  ];

  for (const user of testUsers) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: user,
    });
  }

  // Create sample performance metrics
  const sampleMetrics = [
    {
      userId: 'user-demo-1',
      sessionId: 'session-demo-1',
      scenarioId: 'scenario-password-reset',
      verificationScore: 85.5,
      communicationScore: 92.0,
      technicalScore: 78.5,
      documentationScore: 88.0,
      responseTimeScore: 95.0,
      overallScore: 87.8,
      xpEarned: 100,
      completionTime: 240,
    },
  ];

  // Note: We'll create sample sessions and performance metrics only if the related records exist
  // This is to avoid foreign key constraint errors

  console.log('Database seed completed successfully!');
  console.log(`- Created ${achievements.length} achievements`);
  console.log(`- Created ${scenarios.length} scenarios`);
  console.log(`- Created ${testUsers.length} test users`);
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });