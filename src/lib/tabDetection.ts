export const generateTabId = () => {
  return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const getTabId = () => {
  let tabId = sessionStorage.getItem('tab_id');
  if (!tabId) {
    tabId = generateTabId();
    sessionStorage.setItem('tab_id', tabId);
  }
  return tabId;
};

export const isSameTab = () => {
  const currentTabId = getTabId();
  const storedTabId = localStorage.getItem('active_tab_id');
  
  if (!storedTabId) {
    localStorage.setItem('active_tab_id', currentTabId);
    return true;
  }
  
  return storedTabId === currentTabId;
};

export const setActiveTab = () => {
  const tabId = getTabId();
  localStorage.setItem('active_tab_id', tabId);
};

// Listen for tab visibility changes
export const setupTabDetection = () => {
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      setActiveTab();
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    const tabId = getTabId();
    const storedTabId = localStorage.getItem('active_tab_id');
    if (storedTabId === tabId) {
      localStorage.removeItem('active_tab_id');
    }
  });
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};
