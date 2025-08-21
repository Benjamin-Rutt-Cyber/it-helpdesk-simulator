import React, { useState, useCallback } from 'react';
import { 
  Copy, 
  BookOpen, 
  Link, 
  FileText, 
  Share, 
  Download, 
  Quote, 
  CheckCircle,
  ExternalLink,
  Tag,
  Calendar,
  User,
  Star
} from 'lucide-react';
import { SearchResult, TicketContext } from '../../types/search';
import { useSearchIntegration } from '../../hooks/useSearchIntegration';

interface ResultReferencerProps {
  result: SearchResult;
  ticketContext?: TicketContext;
  onReferenceSaved?: (reference: any) => void;
  onClose?: () => void;
  className?: string;
}

interface CitationFormat {
  id: string;
  name: string;
  format: (result: SearchResult) => string;
}

interface Reference {
  id: string;
  resultId: string;
  ticketId?: string;
  title: string;
  url: string;
  snippet: string;
  credibilityLevel: 'high' | 'medium' | 'low';
  notes: string;
  tags: string[];
  citationFormat: string;
  savedAt: Date;
}

export const ResultReferencer: React.FC<ResultReferencerProps> = ({
  result,
  ticketContext,
  onReferenceSaved,
  onClose,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'cite' | 'reference' | 'share'>('cite');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedCitationFormat, setSelectedCitationFormat] = useState('apa');
  const [isSaving, setIsSaving] = useState(false);
  const [savedReference, setSavedReference] = useState<Reference | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const { trackSearchEvent } = useSearchIntegration({ ticketContext });

  // Citation formats
  const citationFormats: CitationFormat[] = [
    {
      id: 'apa',
      name: 'APA Style',
      format: (result) => {
        const date = new Date(result.date).getFullYear();
        return `${result.source}. (${date}). ${result.title}. Retrieved from ${result.url}`;
      }
    },
    {
      id: 'mla',
      name: 'MLA Style',
      format: (result) => {
        const date = new Date(result.date).toLocaleDateString();
        return `"${result.title}." ${result.source}, ${date}, ${result.url}.`;
      }
    },
    {
      id: 'chicago',
      name: 'Chicago Style',
      format: (result) => {
        const date = new Date(result.date).toLocaleDateString();
        return `${result.source}. "${result.title}." Accessed ${date}. ${result.url}.`;
      }
    },
    {
      id: 'ieee',
      name: 'IEEE Style',
      format: (result) => {
        return `${result.source}, "${result.title}," [Online]. Available: ${result.url}. [Accessed: ${new Date().toLocaleDateString()}].`;
      }
    },
    {
      id: 'simple',
      name: 'Simple Reference',
      format: (result) => {
        return `${result.title} - ${result.source} (${result.url})`;
      }
    }
  ];

  const getCurrentCitation = useCallback(() => {
    const format = citationFormats.find(f => f.id === selectedCitationFormat);
    return format ? format.format(result) : result.url;
  }, [result, selectedCitationFormat]);

  const handleCopyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(`${label} copied!`);
      setTimeout(() => setCopyFeedback(null), 2000);
      
      trackSearchEvent('result_copied', {
        resultId: result.id,
        type: label.toLowerCase(),
        ticketId: ticketContext?.ticketId
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setCopyFeedback('Copy failed');
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  }, [result.id, ticketContext, trackSearchEvent]);

  const handleAddTag = useCallback(() => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && tagInput.trim()) {
      event.preventDefault();
      handleAddTag();
    }
  }, [tagInput, handleAddTag]);

  const handleSaveReference = useCallback(async () => {
    setIsSaving(true);
    
    try {
      const reference: Reference = {
        id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        resultId: result.id,
        ticketId: ticketContext?.ticketId,
        title: result.title,
        url: result.url,
        snippet: result.snippet,
        credibilityLevel: result.credibilityLevel,
        notes,
        tags,
        citationFormat: getCurrentCitation(),
        savedAt: new Date()
      };

      // In a real implementation, this would call the API
      // await saveReference(reference);
      
      setSavedReference(reference);
      
      trackSearchEvent('result_referenced', {
        resultId: result.id,
        ticketId: ticketContext?.ticketId,
        referenceId: reference.id,
        hasNotes: !!notes,
        tagCount: tags.length
      });

      if (onReferenceSaved) {
        onReferenceSaved(reference);
      }

    } catch (error) {
      console.error('Failed to save reference:', error);
    } finally {
      setIsSaving(false);
    }
  }, [result, ticketContext, notes, tags, getCurrentCitation, onReferenceSaved, trackSearchEvent]);

  const handleShare = useCallback(async (method: string) => {
    const shareData = {
      title: result.title,
      text: result.snippet,
      url: result.url
    };

    try {
      if (method === 'native' && navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying share text
        const shareText = `${result.title}\n\n${result.snippet}\n\nSource: ${result.source}\n${result.url}`;
        await handleCopyToClipboard(shareText, 'Share content');
      }

      trackSearchEvent('result_shared', {
        resultId: result.id,
        method,
        ticketId: ticketContext?.ticketId
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  }, [result, ticketContext, trackSearchEvent, handleCopyToClipboard]);

  const handleExport = useCallback(() => {
    const exportData = {
      result: {
        title: result.title,
        url: result.url,
        snippet: result.snippet,
        source: result.source,
        credibilityLevel: result.credibilityLevel,
        date: result.date
      },
      reference: {
        notes,
        tags,
        citation: getCurrentCitation(),
        savedAt: new Date().toISOString()
      },
      ticket: ticketContext ? {
        ticketId: ticketContext.ticketId,
        issueType: ticketContext.issueType
      } : null
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `search-reference-${result.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    trackSearchEvent('result_exported', {
      resultId: result.id,
      ticketId: ticketContext?.ticketId
    });
  }, [result, notes, tags, getCurrentCitation, ticketContext, trackSearchEvent]);

  if (savedReference) {
    return (
      <div className={`result-referencer success-state ${className}`}>
        <div className="success-content">
          <div className="success-icon">
            <CheckCircle size={48} className="text-green-500" />
          </div>
          <h3>Reference Saved Successfully!</h3>
          <p>Your search result has been saved with citation and notes.</p>
          
          <div className="reference-summary">
            <div className="summary-item">
              <span className="label">Title:</span>
              <span className="value">{savedReference.title}</span>
            </div>
            {savedReference.notes && (
              <div className="summary-item">
                <span className="label">Notes:</span>
                <span className="value">{savedReference.notes}</span>
              </div>
            )}
            {savedReference.tags.length > 0 && (
              <div className="summary-item">
                <span className="label">Tags:</span>
                <div className="tag-list">
                  {savedReference.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="success-actions">
            <button
              onClick={() => setSavedReference(null)}
              className="secondary-button"
            >
              Save Another
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="primary-button"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`result-referencer ${className}`}>
      {/* Header */}
      <div className="referencer-header">
        <div className="result-info">
          <h3 className="result-title">{result.title}</h3>
          <div className="result-meta">
            <div className={`credibility-badge ${result.credibilityLevel}`}>
              <Star size={12} />
              {result.credibilityLevel} credibility
            </div>
            <span className="result-source">{result.source}</span>
            <span className="result-date">
              <Calendar size={12} />
              {result.date}
            </span>
          </div>
        </div>
        
        {ticketContext && (
          <div className="ticket-context">
            <span className="context-label">
              For ticket #{ticketContext.ticketId}
            </span>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          onClick={() => setActiveTab('cite')}
          className={`tab-button ${activeTab === 'cite' ? 'active' : ''}`}
        >
          <Quote size={16} />
          Citation
        </button>
        <button
          onClick={() => setActiveTab('reference')}
          className={`tab-button ${activeTab === 'reference' ? 'active' : ''}`}
        >
          <BookOpen size={16} />
          Reference
        </button>
        <button
          onClick={() => setActiveTab('share')}
          className={`tab-button ${activeTab === 'share' ? 'active' : ''}`}
        >
          <Share size={16} />
          Share
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Citation Tab */}
        {activeTab === 'cite' && (
          <div className="citation-tab">
            <div className="citation-format-selector">
              <label htmlFor="citation-format">Citation Format:</label>
              <select
                id="citation-format"
                value={selectedCitationFormat}
                onChange={(e) => setSelectedCitationFormat(e.target.value)}
                className="format-select"
              >
                {citationFormats.map(format => (
                  <option key={format.id} value={format.id}>
                    {format.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="citation-preview">
              <label>Generated Citation:</label>
              <div className="citation-text">
                {getCurrentCitation()}
              </div>
              <button
                onClick={() => handleCopyToClipboard(getCurrentCitation(), 'Citation')}
                className="copy-button"
              >
                <Copy size={16} />
                Copy Citation
              </button>
            </div>

            <div className="quick-actions">
              <button
                onClick={() => handleCopyToClipboard(result.url, 'URL')}
                className="action-button"
              >
                <Link size={16} />
                Copy URL
              </button>
              <button
                onClick={() => handleCopyToClipboard(result.title, 'Title')}
                className="action-button"
              >
                <FileText size={16} />
                Copy Title
              </button>
              <button
                onClick={() => window.open(result.url, '_blank')}
                className="action-button"
              >
                <ExternalLink size={16} />
                Open Source
              </button>
            </div>
          </div>
        )}

        {/* Reference Tab */}
        {activeTab === 'reference' && (
          <div className="reference-tab">
            <div className="notes-section">
              <label htmlFor="reference-notes">Notes:</label>
              <textarea
                id="reference-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your notes about this source..."
                className="notes-textarea"
                rows={4}
              />
            </div>

            <div className="tags-section">
              <label>Tags:</label>
              <div className="tag-input-container">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add tags..."
                  className="tag-input"
                />
                <button
                  onClick={handleAddTag}
                  className="add-tag-button"
                  disabled={!tagInput.trim()}
                >
                  <Tag size={16} />
                  Add
                </button>
              </div>
              
              {tags.length > 0 && (
                <div className="tag-list">
                  {tags.map(tag => (
                    <div key={tag} className="tag">
                      <span>{tag}</span>
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="remove-tag"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="reference-actions">
              <button
                onClick={handleSaveReference}
                disabled={isSaving}
                className="save-button"
              >
                <BookOpen size={16} />
                {isSaving ? 'Saving...' : 'Save Reference'}
              </button>
              <button
                onClick={handleExport}
                className="export-button"
              >
                <Download size={16} />
                Export
              </button>
            </div>
          </div>
        )}

        {/* Share Tab */}
        {activeTab === 'share' && (
          <div className="share-tab">
            <div className="share-preview">
              <h4>Share Content:</h4>
              <div className="share-content">
                <div className="share-title">{result.title}</div>
                <div className="share-snippet">{result.snippet}</div>
                <div className="share-source">Source: {result.source}</div>
                <div className="share-url">{result.url}</div>
              </div>
            </div>

            <div className="share-methods">
              <h4>Share Options:</h4>
              <div className="share-buttons">
                {navigator.share && (
                  <button
                    onClick={() => handleShare('native')}
                    className="share-method"
                  >
                    <Share size={16} />
                    System Share
                  </button>
                )}
                <button
                  onClick={() => handleShare('copy')}
                  className="share-method"
                >
                  <Copy size={16} />
                  Copy Content
                </button>
                <button
                  onClick={() => handleShare('email')}
                  className="share-method"
                >
                  <User size={16} />
                  Email Share
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="referencer-footer">
        {copyFeedback && (
          <div className="copy-feedback">
            <CheckCircle size={16} />
            {copyFeedback}
          </div>
        )}
        
        {onClose && (
          <button onClick={onClose} className="close-button">
            Close
          </button>
        )}
      </div>
    </div>
  );
};

export default ResultReferencer;