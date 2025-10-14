// Agent Configuration
// This file contains configuration for the Allie Agent system

module.exports = {
  // Development mode settings
  development: {
    // Enable detailed logging
    verbose: true,

    // Auto-approve certain safe actions without confirmation
    autoApproveActions: [
      'read_firestore',
      'list_events',
      'get_weather',
      'search_knowledge'
    ],

    // Actions that require explicit user confirmation
    requireConfirmationActions: [
      'write_firestore',
      'delete_firestore',
      'send_email',
      'send_sms',
      'create_event',
      'update_event',
      'delete_event',
      'make_payment',
      'update_settings'
    ],

    // Maximum number of tool calls per request
    maxToolCallsPerRequest: 10,

    // Timeout for tool execution (milliseconds)
    toolExecutionTimeout: 30000,

    // Memory settings
    memory: {
      // Maximum conversation history to maintain
      maxConversationLength: 50,
      // Cache TTL in seconds
      cacheTTL: 3600,
      // Enable memory persistence
      persistMemory: true
    },

    // Rate limiting for agent requests
    rateLimiting: {
      enabled: true,
      maxRequestsPerMinute: 30,
      maxRequestsPerHour: 500
    }
  },

  // Production mode settings
  production: {
    // Reduce logging in production
    verbose: false,

    // More restrictive auto-approval in production
    autoApproveActions: [
      'read_firestore',
      'list_events',
      'search_knowledge'
    ],

    // Require confirmation for more actions in production
    requireConfirmationActions: [
      'write_firestore',
      'delete_firestore',
      'send_email',
      'send_sms',
      'create_event',
      'update_event',
      'delete_event',
      'make_payment',
      'update_settings',
      'modify_family_data',
      'change_permissions'
    ],

    // More conservative limits in production
    maxToolCallsPerRequest: 5,
    toolExecutionTimeout: 20000,

    memory: {
      maxConversationLength: 30,
      cacheTTL: 1800,
      persistMemory: true
    },

    rateLimiting: {
      enabled: true,
      maxRequestsPerMinute: 20,
      maxRequestsPerHour: 200
    }
  },

  // Tool-specific configurations
  tools: {
    firestore: {
      // Collections that can be accessed
      allowedCollections: [
        'users',
        'families',
        'events',
        'tasks',
        'kanbanTasks',
        'messages',
        'habits',
        'providers',
        'choreTemplates',
        'choreInstances',
        'rewardTemplates',
        'rewardInstances',
        'bucksTransactions',
        'places',
        'contacts',
        'documents',
        'audit_logs',
        'agent_memory',
        'agent_conversations'
      ],

      // Collections that are read-only
      readOnlyCollections: [
        'audit_logs',
        'system_config'
      ],

      // Maximum documents to return in a single query
      maxQueryLimit: 100
    },

    email: {
      // Maximum recipients per email
      maxRecipients: 10,
      // Maximum email size in bytes
      maxSizeBytes: 10485760, // 10MB
      // Allowed domains for sending
      allowedDomains: ['checkallie.com', 'families.checkallie.com']
    },

    sms: {
      // Maximum message length
      maxMessageLength: 160,
      // Maximum messages per day per family
      dailyLimit: 50
    },

    calendar: {
      // Maximum events to return in a list query
      maxEventsPerQuery: 50,
      // How far in the future to allow event creation (days)
      maxFutureDays: 365,
      // Default reminder time (minutes before event)
      defaultReminderMinutes: 30
    }
  },

  // Claude model configuration
  claude: {
    // Model to use for agent requests
    model: 'claude-3-5-sonnet-20241022',
    // Maximum tokens for response
    maxTokens: 4096,
    // Temperature for responses
    temperature: 0.7,
    // System prompt additions
    systemPromptAdditions: {
      development: 'You are in development mode. Be verbose about your reasoning and tool usage.',
      production: 'You are in production. Be concise and efficient in your responses.'
    }
  },

  // Audit and logging
  audit: {
    // Enable audit logging
    enabled: true,
    // Log all tool executions
    logToolExecutions: true,
    // Log conversation history
    logConversations: true,
    // Retention period in days
    retentionDays: 90,
    // Sensitive data patterns to redact
    redactPatterns: [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone numbers
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card numbers
      /\b\d{3}-\d{2}-\d{4}\b/g // SSN
    ]
  },

  // Error handling
  errorHandling: {
    // Retry failed tool executions
    retryFailedTools: true,
    // Maximum retry attempts
    maxRetries: 3,
    // Retry delay in milliseconds
    retryDelay: 1000,
    // Send error notifications
    sendErrorNotifications: true,
    // Error notification webhook
    errorWebhook: process.env.ERROR_WEBHOOK_URL
  },

  // Feature flags
  features: {
    // Enable web search capability
    webSearch: false,
    // Enable voice integration
    voiceEnabled: false,
    // Enable proactive suggestions
    proactiveSuggestions: true,
    // Enable learning from interactions
    learningEnabled: false,
    // Enable multi-agent collaboration
    multiAgentEnabled: false
  }
};

// Helper function to get configuration based on environment
function getConfig() {
  const env = process.env.NODE_ENV || 'development';
  const baseConfig = module.exports[env] || module.exports.development;

  return {
    ...baseConfig,
    tools: module.exports.tools,
    claude: module.exports.claude,
    audit: module.exports.audit,
    errorHandling: module.exports.errorHandling,
    features: module.exports.features
  };
}

module.exports.getConfig = getConfig;