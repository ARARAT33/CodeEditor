'use client'

// Folder Persistence — keeps the FileSystemDirectoryHandle in IndexedDB
// so the user doesn't have to re-open the folder after page refresh.
// The browser still requires user gesture to re-grant permission,
// but the handle is preserved.

import { useState, useEffect, useCallback } from 'react'

const DB_NAME = 'awecode-fs'
const STORE_NAME = 'handles'
const KEY = 'root-folder-handle'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function saveHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(handle, KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function loadHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(KEY)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => reject(req.error)
    })
  } catch (e: unknown) {
    console.warn('Failed to load folder handle from IndexedDB:', e instanceof Error ? e.message : e)
    return null
  }
}

async function clearHandle(): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (e: unknown) {
    console.warn('Failed to clear folder handle from IndexedDB:', e instanceof Error ? e.message : e)
  }
}

export interface UseFolderPersistence {
  savedFolderName: string | null
  hasSavedHandle: boolean
  persistHandle: (handle: FileSystemDirectoryHandle) => Promise<void>
  restoreHandle: () => Promise<FileSystemDirectoryHandle | null>
  clearSaved: () => Promise<void>
}

export function useFolderPersistence(): UseFolderPersistence {
  const [savedFolderName, setSavedFolderName] = useState<string | null>(null)
  const [hasSavedHandle, setHasSavedHandle] = useState(false)

  useEffect(() => {
    loadHandle().then((h) => {
      if (h) {
        setHasSavedHandle(true)
        setSavedFolderName(h.name)
      }
    })
  }, [])

  const persistHandle = useCallback(async (handle: FileSystemDirectoryHandle) => {
    await saveHandle(handle)
    setHasSavedHandle(true)
    setSavedFolderName(handle.name)
  }, [])

  const restoreHandle = useCallback(async (): Promise<FileSystemDirectoryHandle | null> => {
    const handle = await loadHandle()
    if (!handle) return null
    // Verify permission (still requires user gesture for full access)
    try {
      // @ts-ignore
      const perm = await handle.queryPermission({ mode: 'readwrite' })
      if (perm === 'granted') {
        return handle
      }
      // @ts-ignore
      const req = await handle.requestPermission({ mode: 'readwrite' })
      if (req === 'granted') {
        return handle
      }
      return null  // user denied
    } catch {
      return null
    }
  }, [])

  const clearSaved = useCallback(async () => {
    await clearHandle()
    setHasSavedHandle(false)
    setSavedFolderName(null)
  }, [])

  return {
    savedFolderName,
    hasSavedHandle,
    persistHandle,
    restoreHandle,
    clearSaved,
  }
}
