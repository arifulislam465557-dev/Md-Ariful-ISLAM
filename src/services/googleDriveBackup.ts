import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
];

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
GOOGLE_DRIVE_SCOPES.forEach((scope) => provider.addScope(scope));

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the OAuth 2.0 access token strictly in memory (never in localStorage or sessionStorage).
let cachedAccessToken: string | null = null;

export interface GoogleDriveFolderItem {
  id: string;
  name: string;
  createdTime?: string;
  webViewLink?: string;
  parents?: string[];
}

export interface GoogleDriveBackupFile {
  id: string;
  name: string;
  size: number;
  createdTime: string;
  md5Checksum?: string;
  webViewLink?: string;
  description?: string;
  mimeType?: string;
  parents?: string[];
}

export interface GoogleDriveQuotaInfo {
  limit: number;
  usage: number;
  usageInDrive: number;
  userEmail?: string;
  userName?: string;
  photoLink?: string;
}

export const DEFAULT_BACKUP_FOLDER_NAME = 'Adiba_Hospital_Backups';

export const initGoogleDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleDriveSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Drive OAuth access token.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Drive sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleDriveAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCurrentGoogleUser = (): User | null => {
  return auth.currentUser;
};

export const googleDriveSignOut = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

/**
 * Lists folders in the user's Google Drive so the Admin can select a specific backup folder.
 */
export const listGoogleDriveFolders = async (): Promise<GoogleDriveFolderItem[]> => {
  const token = await getGoogleDriveAccessToken();
  if (!token) {
    throw new Error('NOT_AUTHENTICATED');
  }

  const query = encodeURIComponent(
    "mimeType = 'application/vnd.google-apps.folder' and trashed = false"
  );
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,webViewLink,parents)&orderBy=name&pageSize=50&spaces=drive`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (res.status === 401) {
    cachedAccessToken = null;
    throw new Error('NOT_AUTHENTICATED');
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to list Google Drive folders (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    createdTime: f.createdTime,
    webViewLink: f.webViewLink,
    parents: f.parents,
  }));
};

/**
 * Creates a new folder in Google Drive and returns its metadata.
 */
export const createGoogleDriveFolder = async (
  folderName: string,
  parentId?: string
): Promise<GoogleDriveFolderItem> => {
  const token = await getGoogleDriveAccessToken();
  if (!token) {
    throw new Error('Google Drive is not connected. Please sign in with Google first.');
  }

  const cleanName = folderName.trim() || DEFAULT_BACKUP_FOLDER_NAME;
  const bodyPayload: Record<string, any> = {
    name: cleanName,
    mimeType: 'application/vnd.google-apps.folder',
    description: 'Encrypted Hospital Database & Attachments Backup Folder (Adiba Hospital Management System)',
  };
  if (parentId) {
    bodyPayload.parents = [parentId];
  }

  const createRes = await fetch(
    'https://www.googleapis.com/drive/v3/files?fields=id,name,createdTime,webViewLink,parents',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    }
  );

  if (createRes.status === 401) {
    cachedAccessToken = null;
    throw new Error('Google Drive session expired. Please sign in again.');
  }

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Drive folder: ${errText}`);
  }

  const created = await createRes.json();
  return {
    id: created.id,
    name: created.name,
    createdTime: created.createdTime,
    webViewLink: created.webViewLink,
    parents: created.parents,
  };
};

/**
 * Resolves the target backup folder in Google Drive.
 * If preferredFolderId is provided and valid, uses it; otherwise looks up or creates preferredFolderName (or Adiba_Hospital_Backups).
 */
export const getOrCreateBackupFolder = async (
  accessToken: string,
  preferredFolderId?: string,
  preferredFolderName?: string
): Promise<GoogleDriveFolderItem> => {
  if (preferredFolderId) {
    try {
      const checkRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
          preferredFolderId
        )}?fields=id,name,trashed,webViewLink`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (checkRes.ok) {
        const folderMeta = await checkRes.json();
        if (folderMeta && folderMeta.id && !folderMeta.trashed) {
          return {
            id: folderMeta.id,
            name: folderMeta.name,
            webViewLink: folderMeta.webViewLink,
          };
        }
      }
    } catch {
      // Fallback to lookup by name if preferredFolderId is inaccessible
    }
  }

  const targetName = (preferredFolderName || DEFAULT_BACKUP_FOLDER_NAME).replace(/'/g, "\\'");
  const query = encodeURIComponent(
    `name = '${targetName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,webViewLink)&spaces=drive`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`Google Drive folder lookup failed (${searchRes.status}): ${errText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const existing = searchData.files[0];
    return {
      id: existing.id,
      name: existing.name,
      createdTime: existing.createdTime,
      webViewLink: existing.webViewLink,
    };
  }

  // Create default folder if not found
  const createRes = await fetch(
    'https://www.googleapis.com/drive/v3/files?fields=id,name,createdTime,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: preferredFolderName || DEFAULT_BACKUP_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        description:
          'Automated & Manual Encrypted Hospital Database Backups (Adiba Hospital Management System)',
      }),
    }
  );

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Drive backup folder: ${errText}`);
  }

  const createdFolder = await createRes.json();
  return {
    id: createdFolder.id,
    name: createdFolder.name,
    createdTime: createdFolder.createdTime,
    webViewLink: createdFolder.webViewLink,
  };
};

export const fetchGoogleDriveQuotaAndFiles = async (
  folderId?: string,
  folderName?: string
): Promise<{
  quota: GoogleDriveQuotaInfo | null;
  files: GoogleDriveBackupFile[];
  activeFolder: GoogleDriveFolderItem | null;
}> => {
  const token = await getGoogleDriveAccessToken();
  if (!token) {
    throw new Error('NOT_AUTHENTICATED');
  }

  let activeFolder: GoogleDriveFolderItem | null = null;
  try {
    activeFolder = await getOrCreateBackupFolder(token, folderId, folderName);
  } catch {
    activeFolder = null;
  }

  // Query files inside the selected folder (or any backup archives created/accessible)
  const fileFilter = activeFolder?.id
    ? `trashed = false and mimeType != 'application/vnd.google-apps.folder' and '${activeFolder.id}' in parents`
    : "trashed = false and mimeType != 'application/vnd.google-apps.folder'";

  const [aboutRes, filesRes] = await Promise.all([
    fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota,user', {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        fileFilter
      )}&fields=files(id,name,size,createdTime,md5Checksum,webViewLink,description,mimeType,parents)&orderBy=createdTime desc&pageSize=40`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    ),
  ]);

  if (aboutRes.status === 401 || filesRes.status === 401) {
    cachedAccessToken = null;
    throw new Error('NOT_AUTHENTICATED');
  }

  let quota: GoogleDriveQuotaInfo | null = null;
  if (aboutRes.ok) {
    const aboutData = await aboutRes.json();
    quota = {
      limit: Number(aboutData.storageQuota?.limit || 15 * 1024 * 1024 * 1024),
      usage: Number(aboutData.storageQuota?.usage || 0),
      usageInDrive: Number(aboutData.storageQuota?.usageInDrive || 0),
      userEmail: aboutData.user?.emailAddress,
      userName: aboutData.user?.displayName,
      photoLink: aboutData.user?.photoLink,
    };
  }

  let files: GoogleDriveBackupFile[] = [];
  if (filesRes.ok) {
    const filesData = await filesRes.json();
    files = (filesData.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      size: Number(f.size || 0),
      createdTime: f.createdTime,
      md5Checksum: f.md5Checksum,
      webViewLink: f.webViewLink,
      description: f.description,
      mimeType: f.mimeType,
      parents: f.parents,
    }));
  }

  return { quota, files, activeFolder };
};

export const uploadBackupToGoogleDrive = async (
  blob: Blob,
  filename: string,
  description: string,
  onProgress?: (percent: number) => void,
  targetFolderId?: string,
  targetFolderName?: string
): Promise<GoogleDriveBackupFile & { folderId: string; folderName: string }> => {
  const token = await getGoogleDriveAccessToken();
  if (!token) {
    throw new Error('Google Drive is not connected. Please sign in with Google first.');
  }

  if (onProgress) onProgress(10);
  const folder = await getOrCreateBackupFolder(token, targetFolderId, targetFolderName);
  if (onProgress) onProgress(25);

  const metadata = {
    name: filename,
    parents: [folder.id],
    description,
  };

  const boundary = '-------AdibaHospitalBackupBoundary' + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${blob.type || 'application/zip'}\r\n\r\n`;

  const multipartBlob = new Blob([metadataPart, blob, closeDelimiter], {
    type: `multipart/related; boundary=${boundary}`,
  });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      'POST',
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,createdTime,md5Checksum,webViewLink,description,parents'
    );
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const pct = Math.min(95, 25 + Math.round((event.loaded / event.total) * 70));
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100);
        try {
          const res = JSON.parse(xhr.responseText);
          resolve({
            id: res.id,
            name: res.name,
            size: Number(res.size || blob.size),
            createdTime: res.createdTime || new Date().toISOString(),
            md5Checksum: res.md5Checksum,
            webViewLink: res.webViewLink,
            description: res.description,
            parents: res.parents,
            folderId: folder.id,
            folderName: folder.name,
          });
        } catch {
          reject(new Error('Failed to parse Google Drive upload response.'));
        }
      } else {
        if (xhr.status === 401) {
          cachedAccessToken = null;
        }
        reject(new Error(`Google Drive upload failed (${xhr.status}): ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error while uploading backup to Google Drive.'));
    };

    xhr.send(multipartBlob);
  });
};

export const downloadBackupFromGoogleDrive = async (fileId: string): Promise<Blob> => {
  const token = await getGoogleDriveAccessToken();
  if (!token) {
    throw new Error('Google Drive is not connected. Please sign in with Google first.');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    cachedAccessToken = null;
    throw new Error('Google Drive session expired. Please sign in again.');
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to download backup from Google Drive (${res.status}): ${errText}`);
  }

  return await res.blob();
};

export const deleteBackupFromGoogleDrive = async (fileId: string): Promise<void> => {
  const token = await getGoogleDriveAccessToken();
  if (!token) {
    throw new Error('Google Drive is not connected. Please sign in with Google first.');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    cachedAccessToken = null;
    throw new Error('Google Drive session expired. Please sign in again.');
  }

  if (!res.ok && res.status !== 204) {
    const errText = await res.text();
    throw new Error(`Failed to delete file from Google Drive (${res.status}): ${errText}`);
  }
};
