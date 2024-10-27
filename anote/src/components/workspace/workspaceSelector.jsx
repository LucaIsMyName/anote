import React, { useState, useEffect } from 'react';
import { Folder, AlertTriangle } from 'lucide-react';
import { WorkspaceService } from '../../services/workspaceService';

/**
 * 
 * @param {boolean} onWorkspaceReady
 * @description A component that prompts the user to select a workspace folder
 * and creates a new workspace or loads an existing one.
 */
const WorkspaceSelector = ({ onWorkspaceReady }) => {
  const [status, setStatus] = useState('checking');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    checkExistingWorkspace();
  }, []);

  const checkExistingWorkspace = async () => {
    try {
      const storedHandle = await WorkspaceService.getStoredWorkspaceHandle();
      if (storedHandle) {
        // Verify we still have permission
        const hasPermission = await WorkspaceService.verifyPermission(storedHandle);
        if (hasPermission) {
          // Verify the workspace structure is still valid
          const isValid = await WorkspaceService.checkWorkspaceStructure(storedHandle);
          if (isValid) {
            onWorkspaceReady(storedHandle);
            setStatus('ready');
            return;
          }
        }
      }
      setStatus('selecting');
    } catch (error) {
      console.error('Error checking existing workspace:', error);
      setStatus('selecting');
    }
  };


  const selectDirectory = async () => {
    try {
      setStatus('selecting');
      const dirHandle = await WorkspaceService.getDirectoryHandle();
      
      // Check if it's an existing workspace
      const isExisting = await WorkspaceService.checkWorkspaceStructure(dirHandle);
      
      if (isExisting) {
        // Use existing workspace
        await WorkspaceService.saveWorkspaceHandle(dirHandle);
        onWorkspaceReady(dirHandle);
        setStatus('ready');
      } else {
        // Create new workspace
        setStatus('creating');
        const created = await WorkspaceService.createWorkspaceStructure(dirHandle);
        if (created) {
          await WorkspaceService.saveWorkspaceHandle(dirHandle);
          onWorkspaceReady(dirHandle);
          setStatus('ready');
        } else {
          throw new Error('Failed to create workspace structure');
        }
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to setup workspace');
    }
  };

  if (status === 'checking') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
          <p className="mt-4 text-gray-600">Checking for existing workspace...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Workspace Error</h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <button
            onClick={selectDirectory}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="text-center max-w-md mx-auto p-6">
        <Folder className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-4">Select Workspace Folder</h2>
        <p className="text-gray-600 mb-6">
          Choose a folder for your workspace. If it's empty, we'll set it up for you.
        </p>
        <button
          onClick={selectDirectory}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {status === 'creating' ? 'Creating Workspace...' : 'Select Folder'}
        </button>
      </div>
    </div>
  );
};

export default WorkspaceSelector;