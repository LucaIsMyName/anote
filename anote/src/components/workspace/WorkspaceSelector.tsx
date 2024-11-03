import React, { useState, useEffect } from "react";
import { Folder, AlertTriangle, Apple, Chrome, Download } from "lucide-react";
import { WorkspaceService } from "../../services/WorkspaceService.ts";

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

interface WorkspaceSelectorProps {
  onWorkspaceReady: (handle: FileSystemDirectoryHandle) => void;
}

const WorkspaceSelector = ({ onWorkspaceReady }: WorkspaceSelectorProps) => {
  const [status, setStatus] = useState("checking");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isSafari) {
      checkExistingWorkspace();
    } else {
      setStatus("safari");
    }
  }, []);

  const checkExistingWorkspace = async () => {
    try {
      const storedHandle = await WorkspaceService.getStoredWorkspaceHandle();
      if (storedHandle) {
        const hasPermission = await WorkspaceService.verifyPermission(storedHandle);
        if (hasPermission) {
          const isValid = await WorkspaceService.checkWorkspaceStructure(storedHandle);
          if (isValid) {
            onWorkspaceReady(storedHandle);
            setStatus("ready");
            return;
          }
        }
      }
      setStatus("selecting");
    } catch (error) {
      console.error("Error checking existing workspace:", error);
      setStatus("selecting");
    }
  };

  const selectDirectory = async () => {
    try {
      setStatus("selecting");
      const dirHandle = await WorkspaceService.getDirectoryHandle();

      const isExisting = await WorkspaceService.checkWorkspaceStructure(dirHandle);

      if (isExisting) {
        await WorkspaceService.saveWorkspaceHandle(dirHandle);
        onWorkspaceReady(dirHandle);
        setStatus("ready");
      } else {
        setStatus("creating");
        const created = await WorkspaceService.createWorkspaceStructure(dirHandle);
        if (created) {
          await WorkspaceService.saveWorkspaceHandle(dirHandle);
          onWorkspaceReady(dirHandle);
          setStatus("ready");
        } else {
          throw new Error("Failed to create workspace structure");
        }
      }
    } catch (error) {
      console.error("Error selecting directory:", error);
      setStatus("error");
      setErrorMessage(error.message || "Failed to setup workspace");
    }
  };

  if (status === "safari") {
    return (
      <div className="fixed inset-0 flex items-center justify-start bg-white">
        <div className="max-w-md mx-auto p-6 text-left">
          <Apple className="w-12 h-12 text-gray-800 mb-4" />
          <h2 className="text-xl font-bold mb-4">Safari Not Supported</h2>
          <p className="text-gray-600 mb-6">
            Safari doesn't support the required features for file system access. Please use one of these browsers instead:
          </p>
          <div className=" md:flex items-center gap-3">
            <a
              href="https://www.google.com/chrome/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-sky-400 text-white rounded hover:bg-sky-600 transition-colors"
            >
              <Chrome className="w-5 h-5" />
              <span>Download Chrome</span>
            </a>
            <a
              href="https://www.microsoft.com/edge"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-sky-400 text-white rounded hover:bg-sky-600 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Download Edge</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (status === "checking") {
    return (
      <div className="fixed inset-0 flex items-center bg-white">
        <div className="">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 " />
          <p className="mt-4 text-gray-600">Checking for existing workspace...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="fixed inset-0 flex items-center bg-white">
        <div className="max-w-md mx-auto p-6">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Workspace Error</h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <button
            onClick={selectDirectory}
            className="px-4 py-2 bg-sky-400 text-white rounded hover:bg-sky-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="max-w-md mx-auto p-6">
        <Folder className="w-12 h-12 text-sky-400 mb-4" />
        <h2 className="text-xl font-bold mb-4">Select Workspace Folder</h2>
        <p className="text-gray-600 mb-6">
          Choose a folder for your workspace. If it's empty, we'll set it up for you.
        </p>
        <button
          onClick={selectDirectory}
          className="px-4 py-2 bg-sky-400 text-white rounded hover:bg-sky-600"
        >
          {status === "creating" ? "Creating Workspace..." : "Select Folder"}
        </button>
      </div>
    </div>
  );
};

export default WorkspaceSelector;