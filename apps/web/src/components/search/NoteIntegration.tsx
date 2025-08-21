import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Plus, 
  FileText, 
  Link, 
  Quote, 
  Tag, 
  Calendar, 
  Save, 
  Edit3, 
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { SearchResult, TicketContext } from '../../types/search';
import { useSearchIntegration } from '../../hooks/useSearchIntegration';

interface NoteIntegrationProps {
  searchResult: SearchResult;
  ticketContext?: TicketContext;
  existingNote?: string;
  onNoteUpdate?: (note: string, references: NoteReference[]) => void;
  onSave?: (noteData: NoteData) => void;
  className?: string;
}

interface NoteReference {
  id: string;
  resultId: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  credibilityLevel: 'high' | 'medium' | 'low';
  insertedAt: Date;
  type: 'citation' | 'quote' | 'link' | 'summary';
}

interface NoteData {
  id: string;
  content: string;
  references: NoteReference[];
  tags: string[];
  ticketId?: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  placeholders: string[];
}

export const NoteIntegration: React.FC<NoteIntegrationProps> = ({
  searchResult,
  ticketContext,
  existingNote = '',
  onNoteUpdate,
  onSave,
  className = ''
}) => {
  const [noteContent, setNoteContent] = useState(existingNote);
  const [references, setReferences] = useState<NoteReference[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [insertionMode, setInsertionMode] = useState<'cursor' | 'end'>('cursor');

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const cursorPositionRef = useRef<number>(0);

  const { trackSearchEvent } = useSearchIntegration({ ticketContext });

  // Note templates
  const noteTemplates: NoteTemplate[] = [
    {
      id: 'solution-found',
      name: 'Solution Found',
      description: 'Template for documenting a found solution',
      template: `## Solution Found

**Issue:** {issue}
**Solution:** {solution}

**Source:** {source}
**Credibility:** {credibility}

**Steps:**
1. {step1}
2. {step2}
3. {step3}

**Outcome:** {outcome}

**References:**
{references}`,
      placeholders: ['issue', 'solution', 'source', 'credibility', 'step1', 'step2', 'step3', 'outcome', 'references']
    },
    {
      id: 'research-summary',
      name: 'Research Summary',
      description: 'Template for summarizing research findings',
      template: `## Research Summary - {topic}

**Research Question:** {question}

**Key Findings:**
- {finding1}
- {finding2}
- {finding3}

**Sources Reviewed:**
{sources}

**Recommendations:**
{recommendations}

**Next Steps:**
{next_steps}`,
      placeholders: ['topic', 'question', 'finding1', 'finding2', 'finding3', 'sources', 'recommendations', 'next_steps']
    },
    {
      id: 'troubleshooting-log',
      name: 'Troubleshooting Log',
      description: 'Template for logging troubleshooting steps',
      template: `## Troubleshooting Log - {date}

**Problem:** {problem}
**Environment:** {environment}

**Steps Attempted:**
1. **{step1_title}**
   - Action: {step1_action}
   - Result: {step1_result}

2. **{step2_title}**
   - Action: {step2_action}
   - Result: {step2_result}

**Research Sources:**
{research_sources}

**Resolution:** {resolution}
**Status:** {status}`,
      placeholders: ['date', 'problem', 'environment', 'step1_title', 'step1_action', 'step1_result', 'step2_title', 'step2_action', 'step2_result', 'research_sources', 'resolution', 'status']
    }
  ];

  // Track cursor position
  useEffect(() => {
    const textarea = textAreaRef.current;
    if (textarea) {
      const handleSelectionChange = () => {
        cursorPositionRef.current = textarea.selectionStart;
      };

      textarea.addEventListener('selectionchange', handleSelectionChange);
      textarea.addEventListener('click', handleSelectionChange);
      textarea.addEventListener('keyup', handleSelectionChange);

      return () => {
        textarea.removeEventListener('selectionchange', handleSelectionChange);
        textarea.removeEventListener('click', handleSelectionChange);
        textarea.removeEventListener('keyup', handleSelectionChange);
      };
    }
  }, []);

  const insertAtCursor = useCallback((text: string) => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const start = insertionMode === 'cursor' ? textarea.selectionStart : noteContent.length;
    const end = insertionMode === 'cursor' ? textarea.selectionEnd : noteContent.length;
    
    const newText = noteContent.substring(0, start) + text + noteContent.substring(end);
    setNoteContent(newText);

    // Set cursor position after insertion
    setTimeout(() => {
      const newPosition = start + text.length;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  }, [noteContent, insertionMode]);

  const insertCitation = useCallback(() => {
    const citation = `[${searchResult.title}](${searchResult.url}) - ${searchResult.source}`;
    insertAtCursor(citation);

    const reference: NoteReference = {
      id: `ref_${Date.now()}`,
      resultId: searchResult.id,
      title: searchResult.title,
      url: searchResult.url,
      snippet: searchResult.snippet,
      source: searchResult.source,
      credibilityLevel: searchResult.credibilityLevel,
      insertedAt: new Date(),
      type: 'citation'
    };

    setReferences(prev => [...prev, reference]);
    
    trackSearchEvent('note_citation_added', {
      resultId: searchResult.id,
      ticketId: ticketContext?.ticketId
    });
  }, [searchResult, insertAtCursor, ticketContext, trackSearchEvent]);

  const insertQuote = useCallback(() => {
    const quote = `\n> "${searchResult.snippet}"\n> \n> Source: [${searchResult.source}](${searchResult.url})\n`;
    insertAtCursor(quote);

    const reference: NoteReference = {
      id: `ref_${Date.now()}`,
      resultId: searchResult.id,
      title: searchResult.title,
      url: searchResult.url,
      snippet: searchResult.snippet,
      source: searchResult.source,
      credibilityLevel: searchResult.credibilityLevel,
      insertedAt: new Date(),
      type: 'quote'
    };

    setReferences(prev => [...prev, reference]);
    
    trackSearchEvent('note_quote_added', {
      resultId: searchResult.id,
      ticketId: ticketContext?.ticketId
    });
  }, [searchResult, insertAtCursor, ticketContext, trackSearchEvent]);

  const insertLink = useCallback(() => {
    const link = `[${searchResult.title}](${searchResult.url})`;
    insertAtCursor(link);

    const reference: NoteReference = {
      id: `ref_${Date.now()}`,
      resultId: searchResult.id,
      title: searchResult.title,
      url: searchResult.url,
      snippet: searchResult.snippet,
      source: searchResult.source,
      credibilityLevel: searchResult.credibilityLevel,
      insertedAt: new Date(),
      type: 'link'
    };

    setReferences(prev => [...prev, reference]);
    
    trackSearchEvent('note_link_added', {
      resultId: searchResult.id,
      ticketId: ticketContext?.ticketId
    });
  }, [searchResult, insertAtCursor, ticketContext, trackSearchEvent]);

  const insertSummary = useCallback(() => {
    const summary = `\n## Summary from ${searchResult.source}\n\n**Title:** ${searchResult.title}\n**Key Points:** ${searchResult.snippet}\n**Source:** [${searchResult.source}](${searchResult.url})\n**Credibility:** ${searchResult.credibilityLevel}\n\n`;
    insertAtCursor(summary);

    const reference: NoteReference = {
      id: `ref_${Date.now()}`,
      resultId: searchResult.id,
      title: searchResult.title,
      url: searchResult.url,
      snippet: searchResult.snippet,
      source: searchResult.source,
      credibilityLevel: searchResult.credibilityLevel,
      insertedAt: new Date(),
      type: 'summary'
    };

    setReferences(prev => [...prev, reference]);
    
    trackSearchEvent('note_summary_added', {
      resultId: searchResult.id,
      ticketId: ticketContext?.ticketId
    });
  }, [searchResult, insertAtCursor, ticketContext, trackSearchEvent]);

  const applyTemplate = useCallback((templateId: string) => {
    const template = noteTemplates.find(t => t.id === templateId);
    if (!template) return;

    let templateText = template.template;
    
    // Replace known placeholders with search result data
    templateText = templateText
      .replace('{source}', searchResult.source)
      .replace('{credibility}', searchResult.credibilityLevel)
      .replace('{date}', new Date().toLocaleDateString())
      .replace('{issue}', ticketContext?.issueType || '[Issue Type]')
      .replace('{environment}', ticketContext?.customerEnvironment || '[Environment]')
      .replace('{references}', `- [${searchResult.title}](${searchResult.url})`);

    if (noteContent.trim()) {
      insertAtCursor('\n\n' + templateText);
    } else {
      setNoteContent(templateText);
    }

    setShowTemplates(false);
    setSelectedTemplate('');

    trackSearchEvent('note_template_applied', {
      templateId,
      ticketId: ticketContext?.ticketId
    });
  }, [searchResult, ticketContext, noteContent, insertAtCursor, trackSearchEvent]);

  const handleAddTag = useCallback(() => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);

  const handleSaveNote = useCallback(async () => {
    setSaveStatus('saving');

    try {
      const noteData: NoteData = {
        id: `note_${Date.now()}`,
        content: noteContent,
        references,
        tags,
        ticketId: ticketContext?.ticketId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      };

      if (onSave) {
        await onSave(noteData);
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);

      trackSearchEvent('note_saved', {
        noteId: noteData.id,
        referenceCount: references.length,
        tagCount: tags.length,
        ticketId: ticketContext?.ticketId
      });

    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [noteContent, references, tags, ticketContext, onSave, trackSearchEvent]);

  const copyNoteContent = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(noteContent);
      
      trackSearchEvent('note_copied', {
        ticketId: ticketContext?.ticketId,
        contentLength: noteContent.length
      });
    } catch (error) {
      console.error('Failed to copy note:', error);
    }
  }, [noteContent, ticketContext, trackSearchEvent]);

  // Notify parent of changes
  useEffect(() => {
    if (onNoteUpdate) {
      onNoteUpdate(noteContent, references);
    }
  }, [noteContent, references, onNoteUpdate]);

  return (
    <div className={`note-integration ${className}`}>
      {/* Header */}
      <div className="note-header">
        <div className="header-title">
          <FileText size={18} />
          <h3>Note Integration</h3>
        </div>
        
        <div className="insertion-mode-toggle">
          <label htmlFor="insertion-mode">Insert at:</label>
          <select
            id="insertion-mode"
            value={insertionMode}
            onChange={(e) => setInsertionMode(e.target.value as 'cursor' | 'end')}
            className="mode-select"
          >
            <option value="cursor">Cursor position</option>
            <option value="end">End of note</option>
          </select>
        </div>
      </div>

      {/* Source Information */}
      <div className="source-info">
        <div className="source-details">
          <h4>{searchResult.title}</h4>
          <div className="source-meta">
            <span className="source-name">{searchResult.source}</span>
            <div className={`credibility-badge ${searchResult.credibilityLevel}`}>
              {searchResult.credibilityLevel} credibility
            </div>
            <button
              onClick={() => window.open(searchResult.url, '_blank')}
              className="external-link"
            >
              <ExternalLink size={14} />
              View Source
            </button>
          </div>
        </div>
      </div>

      {/* Quick Insert Actions */}
      <div className="quick-actions">
        <button onClick={insertCitation} className="action-button citation">
          <Link size={16} />
          Insert Citation
        </button>
        <button onClick={insertQuote} className="action-button quote">
          <Quote size={16} />
          Insert Quote
        </button>
        <button onClick={insertLink} className="action-button link">
          <ExternalLink size={16} />
          Insert Link
        </button>
        <button onClick={insertSummary} className="action-button summary">
          <BookOpen size={16} />
          Insert Summary
        </button>
      </div>

      {/* Template Selection */}
      <div className="template-section">
        <div className="template-header">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="template-toggle"
          >
            <Plus size={16} />
            {showTemplates ? 'Hide Templates' : 'Use Template'}
          </button>
        </div>

        {showTemplates && (
          <div className="template-list">
            {noteTemplates.map(template => (
              <div key={template.id} className="template-item">
                <div className="template-info">
                  <h4>{template.name}</h4>
                  <p>{template.description}</p>
                </div>
                <button
                  onClick={() => applyTemplate(template.id)}
                  className="use-template-button"
                >
                  Use Template
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note Editor */}
      <div className="note-editor">
        <label htmlFor="note-content">Note Content:</label>
        <textarea
          ref={textAreaRef}
          id="note-content"
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder="Start writing your note here... Use the buttons above to insert references from your search results."
          className="note-textarea"
          rows={12}
        />
      </div>

      {/* Tags Section */}
      <div className="tags-section">
        <label>Tags:</label>
        <div className="tag-input-container">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="Add tags..."
            className="tag-input"
          />
          <button onClick={handleAddTag} className="add-tag-button">
            <Tag size={16} />
            Add
          </button>
        </div>
        
        {tags.length > 0 && (
          <div className="tag-list">
            {tags.map(tag => (
              <div key={tag} className="tag">
                <span>{tag}</span>
                <button onClick={() => handleRemoveTag(tag)} className="remove-tag">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* References Summary */}
      {references.length > 0 && (
        <div className="references-summary">
          <h4>References in this note ({references.length}):</h4>
          <div className="reference-list">
            {references.map(ref => (
              <div key={ref.id} className="reference-item">
                <div className="reference-icon">
                  {ref.type === 'citation' && <Link size={14} />}
                  {ref.type === 'quote' && <Quote size={14} />}
                  {ref.type === 'link' && <ExternalLink size={14} />}
                  {ref.type === 'summary' && <BookOpen size={14} />}
                </div>
                <div className="reference-details">
                  <span className="reference-title">{ref.title}</span>
                  <span className="reference-source">{ref.source}</span>
                  <span className="reference-type">{ref.type}</span>
                </div>
                <button
                  onClick={() => setReferences(prev => prev.filter(r => r.id !== ref.id))}
                  className="remove-reference"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="note-actions">
        <div className="primary-actions">
          <button
            onClick={handleSaveNote}
            disabled={!noteContent.trim() || saveStatus === 'saving'}
            className="save-button"
          >
            <Save size={16} />
            {saveStatus === 'saving' ? 'Saving...' : 'Save Note'}
          </button>
          
          <button onClick={copyNoteContent} className="copy-button">
            <Copy size={16} />
            Copy Content
          </button>
        </div>

        <div className="save-status">
          {saveStatus === 'saved' && (
            <div className="status-message success">
              <CheckCircle size={16} />
              Note saved successfully!
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="status-message error">
              <AlertCircle size={16} />
              Failed to save note
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteIntegration;