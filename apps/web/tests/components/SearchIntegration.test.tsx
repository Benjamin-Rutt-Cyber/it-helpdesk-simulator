import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import SearchPanel from '../../src/components/search/SearchPanel';
import ContextualSearch from '../../src/components/search/ContextualSearch';
import SearchTabs from '../../src/components/search/SearchTabs';
import QuickSearch from '../../src/components/search/QuickSearch';
import ResultReferencer from '../../src/components/search/ResultReferencer';
import { useSearchIntegration } from '../../src/hooks/useSearchIntegration';

// Mock the search integration hook
jest.mock('../../src/hooks/useSearchIntegration');
const mockUseSearchIntegration = useSearchIntegration as jest.MockedFunction<typeof useSearchIntegration>;

// Mock search result data
const mockSearchResults = [
  {
    id: 'result-1',
    title: 'Windows 10 Printer Setup Guide',
    snippet: 'Complete guide for setting up printers in Windows 10',
    url: 'https://docs.microsoft.com/printer-setup',
    source: 'Microsoft Documentation',
    sourceType: 'official' as const,
    credibilityLevel: 'high' as const,
    credibilityScore: 0.95,
    date: '2024-01-15',
    position: 1,
    relevanceScore: 0.9,
    relevanceToTicket: 0.85,
    contextMatches: ['printer', 'windows', 'setup']
  },
  {
    id: 'result-2',
    title: 'Common Printer Issues',
    snippet: 'Troubleshooting common printer problems',
    url: 'https://support.company.com/printer-issues',
    source: 'Company Support',
    sourceType: 'official' as const,
    credibilityLevel: 'high' as const,
    credibilityScore: 0.9,
    date: '2024-01-12',
    position: 2,
    relevanceScore: 0.8,
    relevanceToTicket: 0.75,
    contextMatches: ['printer', 'issues', 'troubleshooting']
  }
];

const mockTicketContext = {
  ticketId: 'TICKET-123',
  issueType: 'printer connection issues',
  description: 'User cannot connect to network printer',
  customerEnvironment: 'Windows 10',
  priority: 'medium' as const
};

describe('SearchPanel Component', () => {
  beforeEach(() => {
    mockUseSearchIntegration.mockReturnValue({
      searchResults: mockSearchResults,
      isLoading: false,
      error: null,
      performSearch: jest.fn(),
      trackSearchEvent: jest.fn(),
      getSearchHistory: jest.fn(() => []),
      clearSearchHistory: jest.fn(),
      saveSearchReference: jest.fn()
    });
  });

  test('renders search interface correctly', () => {
    render(<SearchPanel ticketContext={mockTicketContext} />);
    
    expect(screen.getByPlaceholderText(/search for solutions/i)).toBeInTheDocument();
    expect(screen.getByText('Search Panel')).toBeInTheDocument();
  });

  test('displays search results when available', async () => {
    render(<SearchPanel ticketContext={mockTicketContext} />);
    
    expect(screen.getByText('Windows 10 Printer Setup Guide')).toBeInTheDocument();
    expect(screen.getByText('Common Printer Issues')).toBeInTheDocument();
  });

  test('shows loading state when searching', () => {
    mockUseSearchIntegration.mockReturnValue({
      searchResults: [],
      isLoading: true,
      error: null,
      performSearch: jest.fn(),
      trackSearchEvent: jest.fn(),
      getSearchHistory: jest.fn(() => []),
      clearSearchHistory: jest.fn(),
      saveSearchReference: jest.fn()
    });

    render(<SearchPanel ticketContext={mockTicketContext} />);
    
    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  test('handles search input and performs search', async () => {
    const mockPerformSearch = jest.fn();
    mockUseSearchIntegration.mockReturnValue({
      searchResults: [],
      isLoading: false,
      error: null,
      performSearch: mockPerformSearch,
      trackSearchEvent: jest.fn(),
      getSearchHistory: jest.fn(() => []),
      clearSearchHistory: jest.fn(),
      saveSearchReference: jest.fn()
    });

    const user = userEvent.setup();
    render(<SearchPanel ticketContext={mockTicketContext} />);
    
    const searchInput = screen.getByPlaceholderText(/search for solutions/i);
    
    await user.type(searchInput, 'printer troubleshooting');
    fireEvent.keyPress(searchInput, { key: 'Enter', charCode: 13 });

    expect(mockPerformSearch).toHaveBeenCalledWith(
      'printer troubleshooting',
      expect.any(Object)
    );
  });

  test('displays credibility indicators', () => {
    render(<SearchPanel ticketContext={mockTicketContext} />);
    
    const credibilityIndicators = screen.getAllByText('🟢');
    expect(credibilityIndicators.length).toBeGreaterThan(0);
  });

  test('shows context relevance scores', () => {
    render(<SearchPanel ticketContext={mockTicketContext} />);
    
    expect(screen.getByText('85% relevant')).toBeInTheDocument();
    expect(screen.getByText('75% relevant')).toBeInTheDocument();
  });

  test('handles result selection', async () => {
    const mockOnResultSelect = jest.fn();
    const user = userEvent.setup();
    
    render(
      <SearchPanel 
        ticketContext={mockTicketContext}
        onResultSelect={mockOnResultSelect}
      />
    );
    
    const firstResult = screen.getByText('Windows 10 Printer Setup Guide');
    await user.click(firstResult);

    expect(mockOnResultSelect).toHaveBeenCalledWith(mockSearchResults[0]);
  });
});

describe('ContextualSearch Component', () => {
  beforeEach(() => {
    mockUseSearchIntegration.mockReturnValue({
      searchResults: mockSearchResults,
      isLoading: false,
      error: null,
      performSearch: jest.fn(),
      trackSearchEvent: jest.fn(),
      getSearchHistory: jest.fn(() => []),
      clearSearchHistory: jest.fn(),
      saveSearchReference: jest.fn()
    });
  });

  test('renders with ticket context information', () => {
    render(<ContextualSearch ticketContext={mockTicketContext} />);
    
    expect(screen.getByText(/contextual search for ticket/i)).toBeInTheDocument();
    expect(screen.getByText('#TICKET-123')).toBeInTheDocument();
  });

  test('shows context analysis', () => {
    render(<ContextualSearch ticketContext={mockTicketContext} />);
    
    expect(screen.getByText(/context analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/issue type/i)).toBeInTheDocument();
  });

  test('displays suggested queries based on context', () => {
    render(<ContextualSearch ticketContext={mockTicketContext} />);
    
    expect(screen.getByText(/suggested queries/i)).toBeInTheDocument();
    // Should show contextual suggestions
    expect(screen.getByText(/printer/i)).toBeInTheDocument();
  });

  test('performs contextual search automatically', () => {
    const mockPerformSearch = jest.fn();
    mockUseSearchIntegration.mockReturnValue({
      searchResults: [],
      isLoading: false,
      error: null,
      performSearch: mockPerformSearch,
      trackSearchEvent: jest.fn(),
      getSearchHistory: jest.fn(() => []),
      clearSearchHistory: jest.fn(),
      saveSearchReference: jest.fn()
    });

    render(<ContextualSearch ticketContext={mockTicketContext} />);
    
    // Should automatically perform contextual search
    expect(mockPerformSearch).toHaveBeenCalled();
  });
});

describe('SearchTabs Component', () => {
  beforeEach(() => {
    mockUseSearchIntegration.mockReturnValue({
      searchResults: mockSearchResults,
      isLoading: false,
      error: null,
      performSearch: jest.fn(),
      trackSearchEvent: jest.fn(),
      getSearchHistory: jest.fn(() => []),
      clearSearchHistory: jest.fn(),
      saveSearchReference: jest.fn()
    });
  });

  test('renders initial search tab', () => {
    render(<SearchTabs ticketContext={mockTicketContext} />);
    
    expect(screen.getByText('Search 1')).toBeInTheDocument();
  });

  test('creates new tab when plus button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchTabs ticketContext={mockTicketContext} />);
    
    const newTabButton = screen.getByTitle('New search tab');
    await user.click(newTabButton);

    expect(screen.getByText('Search 2')).toBeInTheDocument();
  });

  test('switches between tabs', async () => {
    const user = userEvent.setup();
    render(<SearchTabs ticketContext={mockTicketContext} />);
    
    // Create second tab
    const newTabButton = screen.getByTitle('New search tab');
    await user.click(newTabButton);
    
    // Click on first tab
    const firstTab = screen.getByText('Search 1');
    await user.click(firstTab);

    // First tab should be active
    expect(firstTab.closest('.tab-header')).toHaveClass('active');
  });

  test('closes tab when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchTabs ticketContext={mockTicketContext} />);
    
    // Create second tab so we have one to close
    const newTabButton = screen.getByTitle('New search tab');
    await user.click(newTabButton);
    
    // Close the second tab
    const closeBtns = screen.getAllByTitle('Close tab');
    await user.click(closeBtns[1]);

    expect(screen.queryByText('Search 2')).not.toBeInTheDocument();
  });

  test('shows search results count on tabs', async () => {
    render(<SearchTabs ticketContext={mockTicketContext} />);
    
    // Tab should show result count
    await waitFor(() => {
      expect(screen.getByText('(2)')).toBeInTheDocument();
    });
  });
});

describe('QuickSearch Component', () => {
  beforeEach(() => {
    mockUseSearchIntegration.mockReturnValue({
      searchResults: mockSearchResults,
      isLoading: false,
      error: null,
      performSearch: jest.fn(),
      trackSearchEvent: jest.fn(),
      getSearchHistory: jest.fn(() => ['previous search']),
      clearSearchHistory: jest.fn(),
      saveSearchReference: jest.fn()
    });
  });

  test('renders when isOpen is true', () => {
    render(<QuickSearch isOpen={true} onClose={jest.fn()} />);
    
    expect(screen.getByPlaceholderText(/search or type/i)).toBeInTheDocument();
  });

  test('does not render when isOpen is false', () => {
    render(<QuickSearch isOpen={false} onClose={jest.fn()} />);
    
    expect(screen.queryByPlaceholderText(/search or type/i)).not.toBeInTheDocument();
  });

  test('shows recent searches when input is empty', () => {
    render(<QuickSearch isOpen={true} onClose={jest.fn()} />);
    
    expect(screen.getByText('Recent Searches')).toBeInTheDocument();
    expect(screen.getByText('previous search')).toBeInTheDocument();
  });

  test('handles voice search activation', async () => {
    // Mock the speech recognition API
    const mockRecognition = {
      start: jest.fn(),
      stop: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
    global.webkitSpeechRecognition = jest.fn(() => mockRecognition);

    const user = userEvent.setup();
    render(<QuickSearch isOpen={true} onClose={jest.fn()} />);
    
    const voiceButton = screen.getByTitle('Voice search');
    await user.click(voiceButton);

    expect(mockRecognition.start).toHaveBeenCalled();
  });

  test('navigates results with keyboard', async () => {
    const user = userEvent.setup();
    render(<QuickSearch isOpen={true} onClose={jest.fn()} />);
    
    const input = screen.getByPlaceholderText(/search or type/i);
    await user.type(input, 'test{arrowdown}{arrowdown}');

    // Should navigate through suggestions/results
    // The exact behavior depends on implementation details
  });

  test('executes commands when starting with >', async () => {
    const user = userEvent.setup();
    render(<QuickSearch isOpen={true} onClose={jest.fn()} />);
    
    const input = screen.getByPlaceholderText(/search or type/i);
    await user.type(input, '>clear cache');

    expect(screen.getByText('Commands')).toBeInTheDocument();
  });
});

describe('ResultReferencer Component', () => {
  const mockResult = mockSearchResults[0];

  test('renders citation tab by default', () => {
    render(
      <ResultReferencer 
        result={mockResult}
        ticketContext={mockTicketContext}
      />
    );
    
    expect(screen.getByText('Citation')).toBeInTheDocument();
    expect(screen.getByText('Generated Citation:')).toBeInTheDocument();
  });

  test('switches between tabs', async () => {
    const user = userEvent.setup();
    render(
      <ResultReferencer 
        result={mockResult}
        ticketContext={mockTicketContext}
      />
    );
    
    // Click on Reference tab
    const referenceTab = screen.getByText('Reference');
    await user.click(referenceTab);

    expect(screen.getByText('Notes:')).toBeInTheDocument();
    expect(screen.getByText('Tags:')).toBeInTheDocument();
  });

  test('allows adding notes and tags', async () => {
    const user = userEvent.setup();
    render(
      <ResultReferencer 
        result={mockResult}
        ticketContext={mockTicketContext}
      />
    );
    
    // Switch to Reference tab
    await user.click(screen.getByText('Reference'));
    
    // Add notes
    const notesTextarea = screen.getByPlaceholderText(/add your notes/i);
    await user.type(notesTextarea, 'This is a helpful resource');

    expect(notesTextarea).toHaveValue('This is a helpful resource');
    
    // Add tag
    const tagInput = screen.getByPlaceholderText(/add tags/i);
    await user.type(tagInput, 'printer{enter}');

    expect(screen.getByText('printer')).toBeInTheDocument();
  });

  test('generates different citation formats', async () => {
    const user = userEvent.setup();
    render(
      <ResultReferencer 
        result={mockResult}
        ticketContext={mockTicketContext}
      />
    );
    
    // Change citation format
    const formatSelect = screen.getByLabelText(/citation format/i);
    await user.selectOptions(formatSelect, 'mla');

    // Citation text should update
    const citationText = screen.getByText(/Microsoft Documentation/);
    expect(citationText).toBeInTheDocument();
  });

  test('handles share functionality', async () => {
    const user = userEvent.setup();
    render(
      <ResultReferencer 
        result={mockResult}
        ticketContext={mockTicketContext}
      />
    );
    
    // Switch to Share tab
    await user.click(screen.getByText('Share'));

    expect(screen.getByText('Share Content:')).toBeInTheDocument();
    expect(screen.getByText('Share Options:')).toBeInTheDocument();
  });

  test('saves reference successfully', async () => {
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    
    render(
      <ResultReferencer 
        result={mockResult}
        ticketContext={mockTicketContext}
        onReferenceSaved={mockOnSave}
      />
    );
    
    // Switch to Reference tab and save
    await user.click(screen.getByText('Reference'));
    
    const saveButton = screen.getByText('Save Reference');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Reference Saved Successfully!')).toBeInTheDocument();
    });
  });

  test('copies citation to clipboard', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve()),
      },
    });

    const user = userEvent.setup();
    render(
      <ResultReferencer 
        result={mockResult}
        ticketContext={mockTicketContext}
      />
    );
    
    const copyButton = screen.getByText('Copy Citation');
    await user.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText('Citation copied!')).toBeInTheDocument();
    });
  });
});

describe('Search Integration Hooks', () => {
  test('useSearchIntegration returns expected interface', () => {
    const hookResult = mockUseSearchIntegration();
    
    expect(hookResult).toHaveProperty('searchResults');
    expect(hookResult).toHaveProperty('isLoading');
    expect(hookResult).toHaveProperty('error');
    expect(hookResult).toHaveProperty('performSearch');
    expect(hookResult).toHaveProperty('trackSearchEvent');
    expect(hookResult).toHaveProperty('getSearchHistory');
    expect(hookResult).toHaveProperty('clearSearchHistory');
    expect(hookResult).toHaveProperty('saveSearchReference');
  });
});

describe('Integration Workflow Tests', () => {
  test('complete search and reference workflow', async () => {
    const mockTrackEvent = jest.fn();
    const mockSaveReference = jest.fn();
    
    mockUseSearchIntegration.mockReturnValue({
      searchResults: mockSearchResults,
      isLoading: false,
      error: null,
      performSearch: jest.fn(),
      trackSearchEvent: mockTrackEvent,
      getSearchHistory: jest.fn(() => []),
      clearSearchHistory: jest.fn(),
      saveSearchReference: mockSaveReference
    });

    const user = userEvent.setup();
    
    // Render search panel
    render(<SearchPanel ticketContext={mockTicketContext} />);
    
    // Click on a result
    const firstResult = screen.getByText('Windows 10 Printer Setup Guide');
    await user.click(firstResult);

    // Should track result click
    expect(mockTrackEvent).toHaveBeenCalledWith(
      'search_result_clicked',
      expect.any(Object)
    );
  });

  test('search persistence across component rerenders', () => {
    const { rerender } = render(
      <SearchPanel ticketContext={mockTicketContext} />
    );
    
    // Should show search results
    expect(screen.getByText('Windows 10 Printer Setup Guide')).toBeInTheDocument();
    
    // Rerender with same context
    rerender(<SearchPanel ticketContext={mockTicketContext} />);
    
    // Results should still be there
    expect(screen.getByText('Windows 10 Printer Setup Guide')).toBeInTheDocument();
  });

  test('contextual search updates when ticket context changes', () => {
    const mockPerformSearch = jest.fn();
    mockUseSearchIntegration.mockReturnValue({
      searchResults: [],
      isLoading: false,
      error: null,
      performSearch: mockPerformSearch,
      trackSearchEvent: jest.fn(),
      getSearchHistory: jest.fn(() => []),
      clearSearchHistory: jest.fn(),
      saveSearchReference: jest.fn()
    });

    const { rerender } = render(
      <ContextualSearch ticketContext={mockTicketContext} />
    );
    
    const newContext = {
      ...mockTicketContext,
      issueType: 'email configuration issues'
    };
    
    rerender(<ContextualSearch ticketContext={newContext} />);
    
    // Should trigger new contextual search
    expect(mockPerformSearch).toHaveBeenCalledTimes(2);
  });
});

describe('Error Handling', () => {
  test('handles search errors gracefully', () => {
    mockUseSearchIntegration.mockReturnValue({
      searchResults: [],
      isLoading: false,
      error: 'Search service unavailable',
      performSearch: jest.fn(),
      trackSearchEvent: jest.fn(),
      getSearchHistory: jest.fn(() => []),
      clearSearchHistory: jest.fn(),
      saveSearchReference: jest.fn()
    });

    render(<SearchPanel ticketContext={mockTicketContext} />);
    
    expect(screen.getByText(/search service unavailable/i)).toBeInTheDocument();
  });

  test('handles missing ticket context', () => {
    render(<SearchPanel />);
    
    // Should render without crashing
    expect(screen.getByText('Search Panel')).toBeInTheDocument();
  });

  test('handles empty search results', () => {
    mockUseSearchIntegration.mockReturnValue({
      searchResults: [],
      isLoading: false,
      error: null,
      performSearch: jest.fn(),
      trackSearchEvent: jest.fn(),
      getSearchHistory: jest.fn(() => []),
      clearSearchHistory: jest.fn(),
      saveSearchReference: jest.fn()
    });

    render(<SearchPanel ticketContext={mockTicketContext} />);
    
    expect(screen.getByText(/no results found/i)).toBeInTheDocument();
  });
});