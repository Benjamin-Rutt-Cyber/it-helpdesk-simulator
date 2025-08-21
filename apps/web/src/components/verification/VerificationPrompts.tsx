import React, { useState, useCallback, useEffect } from 'react';
import { 
  MessageCircle, 
  HelpCircle, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  Phone, 
  Building, 
  Hash, 
  Shield,
  Copy,
  RefreshCw,
  Filter
} from 'lucide-react';

export interface VerificationPrompt {
  id: string;
  type: 'question' | 'tip' | 'warning' | 'suggestion';
  category: 'direct' | 'knowledge' | 'callback' | 'alternative';
  fieldType: 'customerName' | 'username' | 'assetTag' | 'department' | 'contactInfo' | 'general';
  priority: 'high' | 'medium' | 'low';
  content: string;
  context?: string;
  tags: string[];
  usageCount?: number;
  successRate?: number;
}

export interface VerificationPromptsProps {
  currentField?: string;
  customerPersona?: string;
  scenario?: string;
  verificationHistory?: string[];
  onPromptSelect?: (prompt: VerificationPrompt) => void;
  onPromptCopy?: (content: string) => void;
  onCustomPrompt?: (content: string) => void;
  showAdvanced?: boolean;
  className?: string;
}

const DEFAULT_PROMPTS: VerificationPrompt[] = [
  // Customer Name Prompts
  {
    id: 'name-direct-1',
    type: 'question',
    category: 'direct',
    fieldType: 'customerName',
    priority: 'high',
    content: "Can you please confirm your full name as it appears in our company directory?",
    context: "Professional, standard verification opening",
    tags: ['polite', 'standard', 'directory'],
    usageCount: 0,
    successRate: 0.85
  },
  {
    id: 'name-knowledge-1',
    type: 'question',
    category: 'knowledge',
    fieldType: 'customerName',
    priority: 'medium',
    content: "What name do you use when signing into your company email?",
    context: "Knowledge-based verification for name confirmation",
    tags: ['email', 'login', 'knowledge-based'],
    usageCount: 0,
    successRate: 0.78
  },
  
  // Username Prompts
  {
    id: 'username-direct-1',
    type: 'question',
    category: 'direct',
    fieldType: 'username',
    priority: 'high',
    content: "What username do you use to log into your computer each morning?",
    context: "Direct username verification",
    tags: ['login', 'computer', 'daily-routine'],
    usageCount: 0,
    successRate: 0.90
  },
  {
    id: 'username-knowledge-1',
    type: 'question',
    category: 'knowledge',
    fieldType: 'username',
    priority: 'medium',
    content: "What comes before the '@' symbol in your company email address?",
    context: "Knowledge-based username verification via email",
    tags: ['email', 'prefix', 'indirect'],
    usageCount: 0,
    successRate: 0.82
  },

  // Asset Tag Prompts
  {
    id: 'asset-direct-1',
    type: 'question',
    category: 'direct',
    fieldType: 'assetTag',
    priority: 'high',
    content: "Can you look for a sticker with numbers on your computer - usually on the side or back?",
    context: "Direct asset tag location guidance",
    tags: ['sticker', 'location', 'physical'],
    usageCount: 0,
    successRate: 0.75
  },
  {
    id: 'asset-alternative-1',
    type: 'suggestion',
    category: 'alternative',
    fieldType: 'assetTag',
    priority: 'medium',
    content: "If you can't find an asset tag, can you provide the serial number from your computer's system information?",
    context: "Alternative when asset tag is not visible",
    tags: ['alternative', 'serial', 'system-info'],
    usageCount: 0,
    successRate: 0.68
  },

  // Department Prompts
  {
    id: 'dept-direct-1',
    type: 'question',
    category: 'direct',
    fieldType: 'department',
    priority: 'high',
    content: "Which department do you work in?",
    context: "Simple, direct department question",
    tags: ['department', 'simple', 'direct'],
    usageCount: 0,
    successRate: 0.88
  },
  {
    id: 'dept-knowledge-1',
    type: 'question',
    category: 'knowledge',
    fieldType: 'department',
    priority: 'medium',
    content: "Who is your direct supervisor or manager?",
    context: "Knowledge-based verification via reporting structure",
    tags: ['manager', 'supervisor', 'hierarchy'],
    usageCount: 0,
    successRate: 0.83
  },

  // Contact Info Prompts
  {
    id: 'contact-direct-1',
    type: 'question',
    category: 'direct',
    fieldType: 'contactInfo',
    priority: 'high',
    content: "Can you confirm the phone number we have on file for you?",
    context: "Direct phone verification",
    tags: ['phone', 'confirm', 'records'],
    usageCount: 0,
    successRate: 0.80
  },
  {
    id: 'contact-callback-1',
    type: 'suggestion',
    category: 'callback',
    fieldType: 'contactInfo',
    priority: 'high',
    content: "I'd like to call you back at your desk phone to verify your identity. What's your extension?",
    context: "Callback verification method",
    tags: ['callback', 'desk-phone', 'extension'],
    usageCount: 0,
    successRate: 0.92
  },

  // General Tips
  {
    id: 'tip-persona-office',
    type: 'tip',
    category: 'direct',
    fieldType: 'general',
    priority: 'medium',
    content: "Office workers are typically cooperative with verification. Be professional and explain the process clearly.",
    context: "Persona-specific guidance for office workers",
    tags: ['persona', 'office-worker', 'cooperative'],
    usageCount: 0
  },
  {
    id: 'tip-persona-frustrated',
    type: 'warning',
    category: 'direct',
    fieldType: 'general',
    priority: 'high',
    content: "Frustrated users may resist verification. Acknowledge their frustration and explain it's for their security.",
    context: "Persona-specific guidance for frustrated users",
    tags: ['persona', 'frustrated', 'resistance'],
    usageCount: 0
  },
  {
    id: 'tip-persona-executive',
    type: 'warning',
    category: 'alternative',
    fieldType: 'general',
    priority: 'high',
    content: "Executives may demand to bypass verification. Remain professional and suggest callback or manager approval.",
    context: "Persona-specific guidance for executives",
    tags: ['persona', 'executive', 'bypass-attempt'],
    usageCount: 0
  }
];

export const VerificationPrompts: React.FC<VerificationPromptsProps> = ({
  currentField,
  customerPersona,
  scenario,
  verificationHistory = [],
  onPromptSelect,
  onPromptCopy,
  onCustomPrompt,
  showAdvanced = false,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [customPrompt, setCustomPrompt] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [prompts, setPrompts] = useState<VerificationPrompt[]>(DEFAULT_PROMPTS);

  // Filter prompts based on current context
  const getFilteredPrompts = useCallback(() => {
    let filtered = prompts;

    // Filter by current field
    if (currentField && currentField !== 'general') {
      filtered = filtered.filter(p => 
        p.fieldType === currentField || p.fieldType === 'general'
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.type === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.content.toLowerCase().includes(query) ||
        p.context?.toLowerCase().includes(query) ||
        p.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort by priority and success rate
    filtered.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return (b.successRate || 0) - (a.successRate || 0);
    });

    return filtered;
  }, [prompts, currentField, selectedCategory, selectedType, searchQuery]);

  const getPersonaSpecificPrompts = useCallback(() => {
    if (!customerPersona) return [];
    
    return prompts.filter(p => 
      p.tags.includes('persona') && 
      p.tags.includes(customerPersona.toLowerCase().replace(/\s+/g, '-'))
    );
  }, [prompts, customerPersona]);

  const getContextualTips = useCallback(() => {
    const tips = [];
    
    // Add field-specific tips
    if (currentField) {
      const fieldTips = prompts.filter(p => 
        p.type === 'tip' && p.fieldType === currentField
      );
      tips.push(...fieldTips);
    }

    // Add persona-specific tips
    const personaTips = getPersonaSpecificPrompts();
    tips.push(...personaTips);

    // Add scenario-specific tips
    if (scenario) {
      const scenarioTips = prompts.filter(p => 
        p.tags.includes(scenario.toLowerCase())
      );
      tips.push(...scenarioTips);
    }

    return tips;
  }, [currentField, getPersonaSpecificPrompts, prompts, scenario]);

  const handlePromptClick = useCallback((prompt: VerificationPrompt) => {
    // Update usage count
    setPrompts(prev => prev.map(p => 
      p.id === prompt.id 
        ? { ...p, usageCount: (p.usageCount || 0) + 1 }
        : p
    ));

    if (onPromptSelect) {
      onPromptSelect(prompt);
    }
  }, [onPromptSelect]);

  const handleCopyPrompt = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      if (onPromptCopy) {
        onPromptCopy(content);
      }
    } catch (error) {
      console.error('Failed to copy prompt:', error);
    }
  }, [onPromptCopy]);

  const handleCustomSubmit = useCallback(() => {
    if (customPrompt.trim() && onCustomPrompt) {
      onCustomPrompt(customPrompt.trim());
      setCustomPrompt('');
    }
  }, [customPrompt, onCustomPrompt]);

  const getPromptIcon = (type: VerificationPrompt['type'], size: number = 16) => {
    switch (type) {
      case 'question':
        return <HelpCircle size={size} className="text-blue-500" />;
      case 'tip':
        return <Lightbulb size={size} className="text-yellow-500" />;
      case 'warning':
        return <AlertTriangle size={size} className="text-orange-500" />;
      case 'suggestion':
        return <MessageCircle size={size} className="text-green-500" />;
      default:
        return <MessageCircle size={size} className="text-gray-500" />;
    }
  };

  const getFieldIcon = (fieldType: string, size: number = 16) => {
    switch (fieldType) {
      case 'customerName': return <User size={size} />;
      case 'username': return <Hash size={size} />;
      case 'assetTag': return <Shield size={size} />;
      case 'department': return <Building size={size} />;
      case 'contactInfo': return <Phone size={size} />;
      default: return <MessageCircle size={size} />;
    }
  };

  const filteredPrompts = getFilteredPrompts();
  const contextualTips = getContextualTips();

  return (
    <div className={`verification-prompts ${className}`}>
      {/* Header */}
      <div className="prompts-header">
        <div className="header-title">
          <MessageCircle size={20} className="text-blue-600" />
          <h3>Verification Prompts</h3>
        </div>
        {currentField && (
          <div className="current-context">
            {getFieldIcon(currentField)}
            <span>
              {currentField.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </span>
          </div>
        )}
      </div>

      {/* Contextual Tips (Priority Display) */}
      {contextualTips.length > 0 && (
        <div className="contextual-tips">
          <h4>Context-Aware Guidance</h4>
          <div className="tips-list">
            {contextualTips.slice(0, 2).map(tip => (
              <div key={tip.id} className={`tip-item ${tip.type}`}>
                {getPromptIcon(tip.type)}
                <div className="tip-content">
                  <p>{tip.content}</p>
                  {tip.context && (
                    <span className="tip-context">{tip.context}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="prompts-filters">
        <div className="filter-group">
          <label htmlFor="category-filter">Category:</label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="direct">Direct Questions</option>
            <option value="knowledge">Knowledge-Based</option>
            <option value="callback">Callback Verification</option>
            <option value="alternative">Alternative Methods</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="type-filter">Type:</label>
          <select
            id="type-filter"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="question">Questions</option>
            <option value="tip">Tips</option>
            <option value="warning">Warnings</option>
            <option value="suggestion">Suggestions</option>
          </select>
        </div>

        <div className="search-group">
          <input
            type="text"
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Prompts List */}
      <div className="prompts-list">
        {filteredPrompts.length === 0 ? (
          <div className="no-prompts">
            <MessageCircle size={48} className="text-gray-400" />
            <p>No prompts found matching your criteria</p>
          </div>
        ) : (
          filteredPrompts.map(prompt => (
            <div
              key={prompt.id}
              className={`prompt-item ${prompt.type} ${prompt.priority}`}
              onClick={() => handlePromptClick(prompt)}
            >
              <div className="prompt-header">
                <div className="prompt-info">
                  {getPromptIcon(prompt.type)}
                  <div className="prompt-meta">
                    <span className="prompt-category">{prompt.category}</span>
                    <span className="prompt-field">
                      {getFieldIcon(prompt.fieldType, 12)}
                      {prompt.fieldType === 'general' ? 'General' : 
                       prompt.fieldType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </div>
                </div>
                <div className="prompt-actions">
                  {prompt.successRate && (
                    <span className="success-rate">
                      {Math.round(prompt.successRate * 100)}% success
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyPrompt(prompt.content);
                    }}
                    className="copy-button"
                    title="Copy to clipboard"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <div className="prompt-content">
                <p className="prompt-text">{prompt.content}</p>
                {prompt.context && (
                  <span className="prompt-context">{prompt.context}</span>
                )}
              </div>

              <div className="prompt-tags">
                {prompt.tags.map(tag => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>

              {showAdvanced && (
                <div className="prompt-stats">
                  <span className="stat">
                    Used: {prompt.usageCount || 0} times
                  </span>
                  {prompt.successRate && (
                    <span className="stat">
                      Success: {Math.round(prompt.successRate * 100)}%
                    </span>
                  )}
                  <span className={`priority-indicator ${prompt.priority}`}>
                    {prompt.priority} priority
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Custom Prompt Input */}
      <div className="custom-prompt">
        <h4>Custom Verification Prompt</h4>
        <div className="custom-input-group">
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Enter your own verification question or prompt..."
            className="custom-textarea"
            rows={3}
          />
          <div className="custom-actions">
            <button
              onClick={handleCustomSubmit}
              disabled={!customPrompt.trim()}
              className="custom-submit"
            >
              <MessageCircle size={16} />
              Use Custom Prompt
            </button>
            <button
              onClick={() => setCustomPrompt('')}
              className="custom-clear"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {showAdvanced && (
        <div className="prompts-stats">
          <div className="stat-item">
            <span className="stat-label">Total Prompts:</span>
            <span className="stat-value">{prompts.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Filtered:</span>
            <span className="stat-value">{filteredPrompts.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Current Field:</span>
            <span className="stat-value">
              {currentField ? currentField.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) : 'None'}
            </span>
          </div>
        </div>
      )}

      {/* Refresh Prompts */}
      <div className="prompts-footer">
        <button
          onClick={() => setPrompts([...DEFAULT_PROMPTS])}
          className="refresh-button"
        >
          <RefreshCw size={16} />
          Reset Prompts
        </button>
      </div>
    </div>
  );
};

export default VerificationPrompts;