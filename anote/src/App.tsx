import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import ErrorBoundary from "./components/blocks/utils/ErrorBoundary.tsx";
import Sidebar from "./components/layout/Sidebar.tsx";
import ContentEditor from "./components/blocks/ContentEditor.tsx";
import WorkspaceSelector from "./components/workspace/WorkspaceSelector.tsx";
import { Settings, CircleX } from "lucide-react";
import { WorkspaceService } from "./services/workspaceService.ts";
import { FileService } from "./services/FileService.ts"; // Add this import

interface PageWrapperProps {
  workspace: any;
  onWorkspaceChange?: (workspace: any) => void;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ workspace, onWorkspaceChange }) => {
  const { pageId } = useParams();
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (pageId) {
      // Find page path by ID
      const findPagePath = async () => {
        const pages = await FileService.listPages(workspace);
        const pagePath = await FileService.findPagePathById(workspace, pageId);
        if (pagePath) {
          setCurrentPath(pagePath);
        } else {
          navigate("/");
        }
      };
      findPagePath();
    }
  }, [pageId, workspace, navigate]);

  const handlePageSelect = (path: string, id: string) => {
    setCurrentPath(path);
    navigate(`/page/${id}`);
  };

  return (
    <div className="flex h-screen bg-white">
      <ErrorBoundary fallback={<div>Fallback Sidebar</div>}>
        <Sidebar
          workspace={workspace}
          currentPath={currentPath}
          onPageSelect={handlePageSelect}
        />
      </ErrorBoundary>
      <ErrorBoundary fallback={<div>Fallback Content</div>}>
        <div className="flex-1 overflow-auto">
          <ContentEditor
            workspace={workspace}
            currentPath={currentPath}
            onPathChange={handlePageSelect}
          />
        </div>
      </ErrorBoundary>
    </div>
  );
};

const App: React.FC = () => {
  const [workspace, setWorkspace] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleWorkspaceReady = (handle: any) => {
    setWorkspace(handle);
  };

  if (!workspace) {
    return <WorkspaceSelector onWorkspaceReady={handleWorkspaceReady} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PageWrapper workspace={workspace} />} />
        <Route path="/page/:pageId" element={<PageWrapper workspace={workspace} />} />
      </Routes>

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
              className="absolute top-4 right-4 block p-2 text-gray-600"
            >
              <CircleX className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </BrowserRouter>
  );
};

export default App;