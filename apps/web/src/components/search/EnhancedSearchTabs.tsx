import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Plus, 
  X, 
  Search, 
  RotateCw, 
  BookOpen, 
  Clock, 
  Copy,
  Download,
  Upload,
  Settings,
  Maximize2,
  Minimize2,
  RefreshCw,
  Bookmark,
  History,
  Filter
} from 'lucide-react';
import { SearchTab, SearchResult, SearchFilter, TicketContext } from '../../types/search';
import { useSearchIntegration } from '../../hooks/useSearchIntegration';

interface EnhancedSearchTabsProps {
  ticketContext?: TicketContext;
  onResultSelect?: (result: SearchResult) => void;
  onTabsChange?: (tabs: SearchTab[]) => void;
  initialTabs?: SearchTab[];
  enableSync?: boolean;
  maxTabs?: number;
  className?: string;
}

interface TabState {
  query: string;
  filters: SearchFilter;
  isLoading: boolean;
  results: SearchResult[];
  error: string | null;
  searchHistory: string[];
  lastSearchTime?: Date;
  bookmarked: boolean;
}

interface TabSession {
  id: string;
  name: string;
  tabs: SearchTab[];
  createdAt: Date;
  lastUsed: Date;
}

interface TabConfiguration {
  autoSave: boolean;
  syncAcrossDevices: boolean;
  maxHistoryItems: number;
  enableKeyboardShortcuts: boolean;
  showTabPreview: boolean;
  tabPosition: 'top' | 'left' | 'right';
}

export const EnhancedSearchTabs: React.FC<EnhancedSearchTabsProps> = ({
  ticketContext,
  onResultSelect,
  onTabsChange,
  initialTabs = [],
  enableSync = false,
  maxTabs = 8,
  className = ''
}) => {
  const [tabs, setTabs] = useState<SearchTab[]>(initialTabs);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [tabStates, setTabStates] = useState<Map<string, TabState>>(new Map());
  const [savedSessions, setSavedSessions] = useState<TabSession[]>([]);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [showTabSettings, setShowTabSettings] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  
  const tabInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const nextTabId = useRef(1);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [config, setConfig] = useState<TabConfiguration>({
    autoSave: true,
    syncAcrossDevices: enableSync,
    maxHistoryItems: 50,
    enableKeyboardShortcuts: true,
    showTabPreview: true,
    tabPosition: 'top'
  });

  const { performSearch, trackSearchEvent, getSearchHistory } = useSearchIntegration({
    ticketContext,
    persistSession: true
  });

  // Initialize tabs
  useEffect(() => {
    if (tabs.length === 0) {
      createNewTab();
    } else if (activeTabId === null && tabs.length > 0) {
      setActiveTabId(tabs[0].id);
    }
  }, [tabs.length, activeTabId]);

  // Auto-save session
  useEffect(() => {
    if (config.autoSave && tabs.length > 0) {
      const saveTimeout = setTimeout(() => {
        saveCurrentSession();
      }, 2000);
      return () => clearTimeout(saveTimeout);
    }
  }, [tabs, tabStates, config.autoSave]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!config.enableKeyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      
      // Ctrl/Cmd + T: New tab
      if (isCtrlOrCmd && event.key === 't') {
        event.preventDefault();
        if (tabs.length < maxTabs) {
          createNewTab();
        }
      }
      
      // Ctrl/Cmd + W: Close tab
      if (isCtrlOrCmd && event.key === 'w') {
        event.preventDefault();
        if (activeTabId) {
          closeTab(activeTabId);
        }
      }
      
      // Ctrl/Cmd + Tab: Next tab
      if (isCtrlOrCmd && event.key === 'Tab') {
        event.preventDefault();
        switchToNextTab();
      }
      
      // Ctrl/Cmd + Shift + Tab: Previous tab
      if (isCtrlOrCmd && event.shiftKey && event.key === 'Tab') {
        event.preventDefault();
        switchToPreviousTab();
      }
      
      // Ctrl/Cmd + Number: Switch to specific tab
      if (isCtrlOrCmd && event.key >= '1' && event.key <= '9') {
        event.preventDefault();
        const tabIndex = parseInt(event.key) - 1;
        if (tabs[tabIndex]) {
          switchToTab(tabs[tabIndex].id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [config.enableKeyboardShortcuts, tabs, activeTabId, maxTabs]);

  // Sync with parent component
  useEffect(() => {
    if (onTabsChange) {
      onTabsChange(tabs);
    }
  }, [tabs, onTabsChange]);

  const createNewTab = useCallback((initialQuery: string = '', label?: string) => {
    if (tabs.length >= maxTabs) {
      alert(`Maximum ${maxTabs} tabs allowed`);
      return;
    }

    const tabId = `tab-${nextTabId.current++}`;
    const newTab: SearchTab = {
      id: tabId,
      label: label || `Search ${nextTabId.current - 1}`,
      query: initialQuery,
      filters: {},
      isActive: true,
      createdAt: new Date(),
      ticketContext
    };

    const initialState: TabState = {
      query: initialQuery,
      filters: {},
      isLoading: false,
      results: [],
      error: null,
      searchHistory: [],
      bookmarked: false
    };

    setTabs(prev => {
      const updated = prev.map(tab => ({ ...tab, isActive: false }));
      return [...updated, newTab];
    });

    setTabStates(prev => new Map(prev).set(tabId, initialState));
    setActiveTabId(tabId);

    trackSearchEvent('enhanced_tab_created', {
      tabId,
      hasInitialQuery: !!initialQuery,
      hasTicketContext: !!ticketContext,
      totalTabs: tabs.length + 1
    });

    return tabId;
  }, [ticketContext, trackSearchEvent, tabs.length, maxTabs]);

  const closeTab = useCallback((tabId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    if (tabs.length === 1) {
      // Don't close the last tab, just clear it
      setTabStates(prev => {
        const updated = new Map(prev);
        const currentState = updated.get(tabId);
        if (currentState) {
          updated.set(tabId, {
            ...currentState,
            query: '',
            results: [],
            error: null,
            searchHistory: []
          });
        }
        return updated;
      });
      return;
    }

    // Save tab to recently closed if it has content
    const tabState = tabStates.get(tabId);
    if (tabState && (tabState.query || tabState.results.length > 0)) {
      // In a real app, save to recently closed tabs
      console.log('Tab saved to recently closed:', tabId);
    }

    setTabs(prev => {
      const filtered = prev.filter(tab => tab.id !== tabId);
      // If we're closing the active tab, activate the next available tab
      if (activeTabId === tabId && filtered.length > 0) {
        const currentIndex = prev.findIndex(tab => tab.id === tabId);
        const nextIndex = Math.min(currentIndex, filtered.length - 1);
        const nextTab = filtered[nextIndex];
        setActiveTabId(nextTab.id);
      }
      return filtered;
    });

    setTabStates(prev => {
      const updated = new Map(prev);
      updated.delete(tabId);
      return updated;
    });

    tabInputRefs.current.delete(tabId);

    trackSearchEvent('enhanced_tab_closed', {
      tabId,
      remainingTabs: tabs.length - 1
    });
  }, [tabs, activeTabId, tabStates, trackSearchEvent]);

  const switchToTab = useCallback((tabId: string) => {
    setTabs(prev => prev.map(tab => ({
      ...tab,
      isActive: tab.id === tabId
    })));
    setActiveTabId(tabId);

    // Focus input
    const inputRef = tabInputRefs.current.get(tabId);
    if (inputRef) {
      setTimeout(() => inputRef.focus(), 0);
    }

    trackSearchEvent('enhanced_tab_switched', { tabId });
  }, [trackSearchEvent]);

  const switchToNextTab = useCallback(() => {
    if (!activeTabId) return;
    const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
    const nextIndex = (currentIndex + 1) % tabs.length;
    switchToTab(tabs[nextIndex].id);
  }, [activeTabId, tabs, switchToTab]);

  const switchToPreviousTab = useCallback(() => {
    if (!activeTabId) return;
    const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
    const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
    switchToTab(tabs[prevIndex].id);
  }, [activeTabId, tabs, switchToTab]);

  const duplicateTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    const tabState = tabStates.get(tabId);
    
    if (tab && tabState) {
      const newTabId = createNewTab(tabState.query, `${tab.label} (Copy)`);
      
      // Copy state to new tab
      if (newTabId) {
        setTabStates(prev => {
          const updated = new Map(prev);
          const newState = updated.get(newTabId);
          if (newState) {
            updated.set(newTabId, {
              ...newState,
              filters: { ...tabState.filters },
              results: [...tabState.results],
              searchHistory: [...tabState.searchHistory]
            });
          }
          return updated;
        });
      }

      trackSearchEvent('enhanced_tab_duplicated', {
        originalTabId: tabId,
        newTabId
      });
    }
  }, [tabs, tabStates, createNewTab, trackSearchEvent]);

  const bookmarkTab = useCallback((tabId: string) => {
    setTabStates(prev => {
      const updated = new Map(prev);
      const state = updated.get(tabId);
      if (state) {
        updated.set(tabId, { ...state, bookmarked: !state.bookmarked });
      }
      return updated;
    });

    trackSearchEvent('tab_bookmarked', { tabId });
  }, [trackSearchEvent]);

  const saveCurrentSession = useCallback(() => {
    const session: TabSession = {
      id: `session_${Date.now()}`,
      name: `Session ${new Date().toLocaleString()}`,
      tabs: tabs.map(tab => ({ ...tab })),
      createdAt: new Date(),
      lastUsed: new Date()
    };

    setSavedSessions(prev => [session, ...prev.slice(0, 9)]); // Keep last 10 sessions
    
    trackSearchEvent('tab_session_saved', {
      sessionId: session.id,
      tabCount: tabs.length
    });
  }, [tabs, trackSearchEvent]);

  const loadSession = useCallback((session: TabSession) => {
    setTabs(session.tabs);
    setActiveTabId(session.tabs.find(tab => tab.isActive)?.id || session.tabs[0]?.id || null);
    
    // Initialize tab states
    const newTabStates = new Map<string, TabState>();
    session.tabs.forEach(tab => {
      newTabStates.set(tab.id, {
        query: tab.query,
        filters: tab.filters,
        isLoading: false,
        results: [],
        error: null,
        searchHistory: [],
        bookmarked: false
      });
    });
    setTabStates(newTabStates);

    setShowSessionManager(false);
    
    trackSearchEvent('tab_session_loaded', {
      sessionId: session.id,
      tabCount: session.tabs.length
    });
  }, [trackSearchEvent]);

  const handleTabDragStart = useCallback((tabId: string, event: React.DragEvent) => {
    setDraggedTab(tabId);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleTabDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleTabDrop = useCallback((targetTabId: string, event: React.DragEvent) => {
    event.preventDefault();
    
    if (!draggedTab || draggedTab === targetTabId) {
      setDraggedTab(null);
      return;
    }

    const dragIndex = tabs.findIndex(tab => tab.id === draggedTab);
    const dropIndex = tabs.findIndex(tab => tab.id === targetTabId);

    if (dragIndex !== -1 && dropIndex !== -1) {
      const newTabs = [...tabs];
      const [draggedTabObj] = newTabs.splice(dragIndex, 1);
      newTabs.splice(dropIndex, 0, draggedTabObj);
      setTabs(newTabs);
    }

    setDraggedTab(null);
    
    trackSearchEvent('tab_reordered', {
      draggedTabId: draggedTab,
      targetTabId,
      newPosition: dropIndex
    });
  }, [draggedTab, tabs, trackSearchEvent]);

  const exportTabs = useCallback(() => {
    const exportData = {
      tabs: tabs.map(tab => ({
        ...tab,
        state: tabStates.get(tab.id)
      })),
      config,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `search-tabs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    trackSearchEvent('tabs_exported', { tabCount: tabs.length });
  }, [tabs, tabStates, config, trackSearchEvent]);

  const importTabs = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        if (importData.tabs && Array.isArray(importData.tabs)) {
          const importedTabs = importData.tabs.map((tabData: any) => ({
            ...tabData.tab || tabData,
            id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }));
          
          setTabs(prev => [...prev, ...importedTabs.slice(0, maxTabs - prev.length)]);
          
          trackSearchEvent('tabs_imported', { 
            importedCount: importedTabs.length 
          });
        }
      } catch (error) {
        console.error('Failed to import tabs:', error);
      }
    };
    reader.readAsText(file);
    
    // Clear the input
    event.target.value = '';
  }, [maxTabs, trackSearchEvent]);

  const activeTabState = activeTabId ? tabStates.get(activeTabId) : null;
  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <div className={`enhanced-search-tabs ${className} ${isMaximized ? 'maximized' : ''}`}>
      {/* Tab Header Bar */}
      <div className="tab-header-bar">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <div 
            className="tab-list"
            style={{ maxWidth: `${tabs.length * 200}px` }}
          >
            {tabs.map(tab => {
              const tabState = tabStates.get(tab.id);
              const isActive = tab.id === activeTabId;
              
              return (
                <div
                  key={tab.id}
                  className={`tab-header ${isActive ? 'active' : ''} ${tabState?.isLoading ? 'loading' : ''} ${tabState?.bookmarked ? 'bookmarked' : ''}`}
                  onClick={() => switchToTab(tab.id)}
                  draggable
                  onDragStart={(e) => handleTabDragStart(tab.id, e)}
                  onDragOver={handleTabDragOver}
                  onDrop={(e) => handleTabDrop(tab.id, e)}
                >
                  <div className="tab-content">
                    <div className="tab-icon">
                      {tabState?.isLoading ? (
                        <RotateCw size={14} className="spinning" />
                      ) : tabState?.bookmarked ? (
                        <Bookmark size={14} className="bookmarked-icon" />
                      ) : (
                        <Search size={14} />
                      )}
                    </div>
                    
                    <span className="tab-label" title={tab.query || tab.label}>
                      {tab.label}
                    </span>

                    {tabState && tabState.results.length > 0 && (
                      <span className="result-count">
                        ({tabState.results.length})
                      </span>
                    )}
                  </div>

                  {/* Tab Actions */}
                  <div className="tab-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        bookmarkTab(tab.id);
                      }}
                      className="bookmark-tab-button"
                      title="Bookmark tab"
                    >
                      <Bookmark size={10} />
                    </button>
                    
                    {tabs.length > 1 && (
                      <button
                        onClick={(e) => closeTab(tab.id, e)}
                        className="close-tab-button"
                        title="Close tab"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tab Controls */}
        <div className="tab-controls">
          <button
            onClick={() => createNewTab()}
            disabled={tabs.length >= maxTabs}
            className="control-button"
            title="New tab (Ctrl+T)"
          >
            <Plus size={16} />
          </button>

          <button
            onClick={() => setShowSessionManager(!showSessionManager)}
            className="control-button"
            title="Session manager"
          >
            <History size={16} />
          </button>

          <button
            onClick={() => setShowTabSettings(!showTabSettings)}
            className="control-button"
            title="Tab settings"
          >
            <Settings size={16} />
          </button>

          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="control-button"
            title={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Session Manager */}
      {showSessionManager && (
        <div className="session-manager">
          <div className="session-header">
            <h4>Session Manager</h4>
            <div className="session-actions">
              <button onClick={saveCurrentSession} className="save-session-btn">
                <Download size={14} />
                Save Current
              </button>
              <label className="import-session-btn">
                <Upload size={14} />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={importTabs}
                  style={{ display: 'none' }}
                />
              </label>
              <button onClick={exportTabs} className="export-session-btn">
                <Download size={14} />
                Export
              </button>
            </div>
          </div>
          
          <div className="saved-sessions">
            {savedSessions.map(session => (
              <div key={session.id} className="session-item">
                <div className="session-info">
                  <div className="session-name">{session.name}</div>
                  <div className="session-meta">
                    {session.tabs.length} tabs • {session.lastUsed.toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => loadSession(session)}
                  className="load-session-btn"
                >
                  Load
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showTabSettings && (
        <div className="tab-settings">
          <h4>Tab Settings</h4>
          <div className="setting-group">
            <label className="setting-item">
              <input
                type="checkbox"
                checked={config.autoSave}
                onChange={(e) => setConfig(prev => ({ ...prev, autoSave: e.target.checked }))}
              />
              Auto-save sessions
            </label>
            
            <label className="setting-item">
              <input
                type="checkbox"
                checked={config.enableKeyboardShortcuts}
                onChange={(e) => setConfig(prev => ({ ...prev, enableKeyboardShortcuts: e.target.checked }))}
              />
              Enable keyboard shortcuts
            </label>
            
            <label className="setting-item">
              <input
                type="checkbox"
                checked={config.showTabPreview}
                onChange={(e) => setConfig(prev => ({ ...prev, showTabPreview: e.target.checked }))}
              />
              Show tab previews
            </label>
          </div>
        </div>
      )}

      {/* Active Tab Content */}
      {activeTab && activeTabState && (
        <div className="active-tab-content">
          {/* This would contain the SearchPanel or other search interface */}
          <div className="tab-search-area">
            <div className="search-input-container">
              <Search className="search-icon" size={18} />
              <input
                ref={(ref) => {
                  if (ref) {
                    tabInputRefs.current.set(activeTab.id, ref);
                  }
                }}
                type="text"
                value={activeTabState.query}
                onChange={(e) => {
                  setTabStates(prev => {
                    const updated = new Map(prev);
                    const state = updated.get(activeTab.id);
                    if (state) {
                      updated.set(activeTab.id, { ...state, query: e.target.value });
                    }
                    return updated;
                  });
                }}
                placeholder={ticketContext 
                  ? `Search for solutions related to "${ticketContext.issueType}"...`
                  : "Search knowledge base..."
                }
                className="tab-search-input"
              />
            </div>
          </div>

          {/* Tab Results would go here */}
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="shortcuts-help">
        <div className="shortcuts-list">
          <kbd>Ctrl+T</kbd> New tab
          <kbd>Ctrl+W</kbd> Close tab
          <kbd>Ctrl+Tab</kbd> Next tab
          <kbd>Ctrl+1-9</kbd> Switch to tab
        </div>
      </div>
    </div>
  );
};

export default EnhancedSearchTabs;