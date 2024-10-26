const WORKSPACE_DB = 'anote_workspace_db';
const WORKSPACE_STORE = 'workspace_handles';
const HANDLE_KEY = 'current_handle';

export class WorkspaceService {
  static async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(WORKSPACE_DB, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(WORKSPACE_STORE)) {
          db.createObjectStore(WORKSPACE_STORE);
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
      const transaction = db.transaction(WORKSPACE_STORE, 'readwrite');
      const store = transaction.objectStore(WORKSPACE_STORE);
      const request = store.put(handle, HANDLE_KEY);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async getStoredWorkspaceHandle() {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(WORKSPACE_STORE, 'readonly');
      const store = transaction.objectStore(WORKSPACE_STORE);
      const request = store.get(HANDLE_KEY);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async clearStoredWorkspace() {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(WORKSPACE_STORE, 'readwrite');
      const store = transaction.objectStore(WORKSPACE_STORE);
      const request = store.delete(HANDLE_KEY);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async checkWorkspaceStructure(dirHandle) {
    try {
      const entries = [];
      for await (const entry of dirHandle.values()) {
        entries.push(entry.name);
      }
      return entries.includes('pages') && entries.includes('assets');
    } catch (error) {
      console.error('Error checking workspace structure:', error);
      return false;
    }
  }

  static async createWorkspaceStructure(dirHandle) {
    try {
      // Create directories
      const pagesHandle = await dirHandle.getDirectoryHandle('pages', { create: true });
      const assetsHandle = await dirHandle.getDirectoryHandle('assets', { create: true });

      // Create welcome file
      const welcomeFileHandle = await pagesHandle.getFileHandle('welcome.md', { create: true });
      const writableStream = await welcomeFileHandle.createWritable();
      
      const welcomeContent = `# Welcome to Your Workspace!

This is your new note-taking workspace. Here's how to get started:

1. Create new pages using the + button in the sidebar
2. Upload images and files to the assets folder
3. Organize your content using the sidebar

Enjoy taking notes!`;

      await writableStream.write(welcomeContent);
      await writableStream.close();

      return true;
    } catch (error) {
      console.error('Error creating workspace structure:', error);
      return false;
    }
  }
}