import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";
import ErrorBoundary from "./components/blocks/utils/ErrorBoundary.tsx";
import Sidebar from "./components/layout/Sidebar.tsx";
import ContentEditor from "./components/blocks/ContentEditor.tsx";
import WorkspaceSelector from "./components/workspace/WorkspaceSelector.tsx";
import { Settings, CircleX } from "lucide-react";
import { WorkspaceService } from "./services/workspaceService.ts";
import { FileService } from "./services/FileService.ts";
import Textarea from "./components/blocks/utils/Textarea.tsx";
import Tooltip from "./components/blocks/utils/Tooltip.tsx";

import { ModalDialog } from "./components/blocks/ModalDialog.tsx";

import "./App.css";
import LoadingDots from "./components/blocks/utils/LoadingDots.tsx";

interface PageWrapperProps {
  workspace: any;
  onWorkspaceChange?: (workspace: any) => void;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ workspace }) => {
  const { pageId } = useParams();
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load initial page based on either URL pageId or stored path
  useEffect(() => {
    const loadPage = async () => {
      try {
        if (pageId) {
          // Try to load page by ID from URL
          const pagePath = await FileService.findPagePathById(workspace, pageId);
          if (pagePath) {
            setCurrentPath(pagePath);
            return;
          }
        }

        // If no pageId in URL or invalid pageId, try loading from localStorage
        const savedPath = localStorage.getItem("anote_current_page");
        if (savedPath) {
          try {
            const { metadata } = await FileService.readPage(workspace, savedPath);
            if (metadata?.id) {
              navigate(`/page/${metadata.id}`, { replace: true });
              setCurrentPath(savedPath);
              return;
            }
          } catch (error) {
            console.error("Error loading saved page:", error);
          }
        }

        // If nothing works, load the first available page
        const pages = await FileService.listPages(workspace);
        if (pages.length > 0) {
          const firstPage = pages[0].name;
          const { metadata } = await FileService.readPage(workspace, firstPage);
          if (metadata?.id) {
            navigate(`/page/${metadata.id}`, { replace: true });
            setCurrentPath(firstPage);
          }
        }
      } catch (error) {
        console.error("Error during page loading:", error);
      }
    };

    loadPage();
  }, [workspace, pageId, navigate]);

  const handlePageSelect = async (path: string) => {
    try {
      // Read the page metadata to get its ID
      const { metadata } = await FileService.readPage(workspace, path);
      if (metadata?.id) {
        navigate(`/page/${metadata.id}`);
        setCurrentPath(path);
        localStorage.setItem("anote_current_page", path);
      }
    } catch (error) {
      console.error("Error handling page selection:", error);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        workspace={workspace}
        currentPath={currentPath}
        onPageSelect={handlePageSelect}
      />
      <div className="flex-1 overflow-auto">
        <ContentEditor
          workspace={workspace}
          currentPath={currentPath}
          onPathChange={handlePageSelect}
        />
      </div>
      <ModalDialog
        isOpen={false}
        title=""></ModalDialog>
    </div>
  );
};

const App: React.FC = () => {
  const [workspace, setWorkspace] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleWorkspaceReady = (handle: any) => {
    setWorkspace(handle);
  };

  const SettingsContent = (
    <div className="w-72 py-3 px-4">
      <h2 className="text-lg font-semibold text-gray-800">Workspace Settings</h2>
      <div className="text-sm text-gray-600 my-4 truncate">Current workspace:<br></br> <span className="font-mono text-[0.8em] inline-block px-[7px] rounded bg-gray-100 border-2">{workspace?.name}</span></div>
      <button
        onClick={() => {
          WorkspaceService.clearStoredWorkspace();
          setWorkspace(null);
          setIsSettingsOpen(false);
        }}
        className="bg-red-50 border-2 border-red-300 text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors text-sm font-medium">
        Change Workspace
      </button>
    </div>
  );

  if (!workspace) {
    return <WorkspaceSelector onWorkspaceReady={handleWorkspaceReady} />;
  }

  if (!workspace) {
    return <WorkspaceSelector onWorkspaceReady={handleWorkspaceReady} />;
  }
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to="/page"
              replace
            />
          }
        />
        <Route
          path="/page"
          element={<PageWrapper workspace={workspace} />}
        />
        <Route
          path="/page/:pageId"
          element={<PageWrapper workspace={workspace} />}
        />
      </Routes>

      <div className="fixed bottom-4 right-4 z-[1000]">
        <Tooltip
          content={SettingsContent}
          visible={isSettingsOpen}
          onClickOutside={() => setIsSettingsOpen(false)}
          interactive={true}
          trigger="click"
          theme="light"
          placement="top-end"
          className="settings-tooltip"
          offset={[0, 10]}>
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-2 rounded-lg border-2 shadow-sm transition-all ${isSettingsOpen ? "border-sky-600 bg-sky-400 text-white scale-125" : "bg-white "}`}>
            <Settings className={`w-5 h-5 ${isSettingsOpen ? "text-white" : "text-gray-400"}`} strokeWidth={isSettingsOpen ? 2.5 : 1.5} />
          </button>
        </Tooltip>
      </div>
    </BrowserRouter>
  );
};

export default App;
