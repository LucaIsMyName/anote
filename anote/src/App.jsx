import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import ContentEditor from './components/blocks/ContentEditor';
import WorkspaceSelector from './components/workspace/WorkspaceSelector';
import { Settings } from 'lucide-react';
import { WorkspaceService } from './services/workspaceService';

const App = () => {
  const [workspace, setWorkspace] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleWorkspaceReady = (handle) => {
    setWorkspace(handle);
  };

  if (!workspace) {
    return <WorkspaceSelector onWorkspaceReady={handleWorkspaceReady} />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar workspace={workspace} />
      
      <div className="flex-1 overflow-auto">
        <ContentEditor workspace={workspace} />
      </div>

      <button 
        onClick={() => setIsSettingsOpen(true)}
        className="fixed bottom-4 right-4 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
      >
        <Settings className="w-5 h-5 text-gray-600" />
      </button>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
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
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Change Workspace
            </button>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="px-4 py-2 ml-2 border rounded hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;