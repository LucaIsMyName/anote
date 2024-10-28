import React, { useState } from 'react';
import ErrorBoundary from './components/blocks/utils/ErrorBoundary.tsx';
import Sidebar from './components/layout/Sidebar.tsx';
import ContentEditor from './components/blocks/ContentEditor.tsx';
import WorkspaceSelector from './components/workspace/WorkspaceSelector.tsx';
import { Settings, CircleX } from 'lucide-react';
import { WorkspaceService } from './services/workspaceService.ts';

const App = () => {
  const [workspace, setWorkspace] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleWorkspaceReady = (handle) => {
    setWorkspace(handle);
  };

  const handlePageSelect = (path) => {
    setCurrentPage(path);
  };

  if (!workspace) {
    return <WorkspaceSelector onWorkspaceReady={handleWorkspaceReady} />;
  }

  return (
    <div className="flex h-screen bg-white">
      <ErrorBoundary fallback={<div>Fallback Sidebar</div>}>
        <Sidebar
          workspace={workspace}
          currentPath={currentPage}
          onPageSelect={handlePageSelect}
        />
      </ErrorBoundary>
      <ErrorBoundary fallback={<div>Fallback Sidebar</div>}>
      <div className="flex-1 overflow-auto">
        <ContentEditor
          workspace={workspace}
          currentPath={currentPage}
          onPathChange={handlePageSelect} // Updated to match ContentEditor's prop name
        />
      </div>
      </ErrorBoundary>
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="fixed bottom-4 right-4 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
      >
        <Settings className="w-5 h-5 text-gray-600" />
      </button>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-lg flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Workspace Settings</h2>
            <p className="text-gray-600 mb-4">
              Current workspace: {workspace.name}
            </p>
            <button
              onClick={() => {
                WorkspaceService.clearStoredWorkspace();
                setWorkspace(null);
                setIsSettingsOpen(false);
              }}
              className="w-full block px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Change Workspace
            </button>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 block p-2 text-white"
            >
              <CircleX className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
