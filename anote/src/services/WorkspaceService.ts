const WORKSPACE_DB = 'anote_workspace_db';
const WORKSPACE_STORE = 'workspace_handles';
const HANDLE_KEY = 'current_handle';

export class WorkspaceService {
  static async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('anote_workspace_db', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('workspace_handles')) {
          db.createObjectStore('workspace_handles');
        }
      };
    });
  }

  static async verifyPermission(dirHandle) {
    const options = { mode: 'readwrite' };
    if ((await dirHandle.queryPermission(options)) === 'granted') {
      return true;
    }
    if ((await dirHandle.requestPermission(options)) === 'granted') {
      return true;
    }
    return false;
  }


  static async getDirectoryHandle() {
    try {
      const dirHandle = await window.showDirectoryPicker();
      const hasPermission = await this.verifyPermission(dirHandle);
      if (!hasPermission) {
        throw new Error('Permission denied to access the directory');
      }
      return dirHandle;
    } catch (error) {
      console.error('Error getting directory handle:', error);
      throw error;
    }
  }

  static async saveWorkspaceHandle(handle) {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('workspace_handles', 'readwrite');
      const store = transaction.objectStore('workspace_handles');
      const request = store.put(handle, 'current_handle');
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async getStoredWorkspaceHandle() {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('workspace_handles', 'readonly');
      const store = transaction.objectStore('workspace_handles');
      const request = store.get('current_handle');
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async clearStoredWorkspace() {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('workspace_handles', 'readwrite');
      const store = transaction.objectStore('workspace_handles');
      const request = store.delete('current_handle');
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async checkWorkspaceStructure(dirHandle) {
    try {
      // Only check if we have write access and if assets folder exists
      const hasPermission = await this.verifyPermission(dirHandle);
      if (!hasPermission) return false;

      // Check for assets directory
      try {
        await dirHandle.getDirectoryHandle('assets');
        return true;
      } catch {
        return false;
      }
    } catch (error) {
      console.error('Error checking workspace structure:', error);
      return false;
    }
  }

  static async createWorkspaceStructure(dirHandle) {
    try {
      // Only create assets directory
      await dirHandle.getDirectoryHandle('assets', { create: true });
      return true;
    } catch (error) {
      console.error('Error creating workspace structure:', error);
      return false;
    }
  }
}