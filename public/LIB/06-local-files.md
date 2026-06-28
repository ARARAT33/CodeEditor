# 06 — Local File System Access

AWECode can open and edit **real files on your computer** using the browser-native **File System Access API**. No upload, no copy — direct disk read/write.

## Browser Support

| Browser | Supported | Notes |
|---------|-----------|-------|
| Chrome 86+ | ✅ | Full support |
| Edge 86+ | ✅ | Full support |
| Opera 72+ | ✅ | Full support |
| Firefox | ❌ | Not supported (uses fallback demo files) |
| Safari | ❌ | Not supported (uses fallback demo files) |

If your browser doesn't support the API, AWECode falls back to in-memory demo files so you can still try the editor.

## How It Works

1. Click **Open Folder** in the sidebar
2. Your browser shows the native folder picker
3. Select any folder on your computer
4. AWECode reads the directory tree (recursively, up to 5 levels deep)
5. The folder appears in the sidebar file explorer
6. Click any file to open it in the editor
7. Press `Ctrl+S` to save — changes are written directly to disk

## What You Can Do

### Open a folder
- Click the folder icon in the sidebar header
- Or use the command palette: `Ctrl+Shift+P` → "Open Folder"

### Browse files
- Click folders to expand/collapse
- Use the search box at the top of the sidebar to filter files by name

### Edit files
- Click a file to open it in a new tab
- The editor loads the file content with the correct language mode (auto-detected from extension)
- Edit freely — changes stay in memory until you save

### Save files
- `Ctrl+S` — saves the current file to disk
- The status bar shows "Modified" indicator when there are unsaved changes

### Create new files
- Click the **+ (New File)** icon in the sidebar header
- Type the filename (with extension)
- The file is created on disk immediately

### Create new folders
- Click the **folder+ (New Folder)** icon in the sidebar header
- Type the folder name
- The folder is created on disk

## Permissions

The first time you open a folder, the browser will ask for permission to:
- **Read** files in that folder
- **Write** files in that folder

You can grant permission for this session only, or persist it for future visits (Chrome/Edge).

To revoke permissions:
- Click the lock icon in the browser address bar
- Or use the command palette → "Revoke File Permissions"

## Security Model

The File System Access API is designed with security in mind:
- **User-initiated only** — the file picker requires a user gesture (click)
- **Per-folder permission** — you grant access to one folder at a time, not the whole disk
- **No silent access** — the browser shows a warning before granting write access
- **Origin-bound** — permission is granted only to AWECode's origin

AWECode never:
- Reads files outside the folder you granted access to
- Uploads your files anywhere
- Sends your file contents to any external service (analysis runs server-side locally)
- Modifies files without you saving them explicitly

## Limitations

- **Folder depth**: AWECode reads up to 5 levels deep by default (configurable)
- **File size**: very large files (>10MB) may be slow to load
- **Binary files**: AWECode only handles text files; binary files are skipped
- **Hidden files**: files starting with `.` are shown by default (toggle in sidebar)
- **Symbolic links**: not followed by default (browser security)

## Troubleshooting

### "Open Folder" button does nothing
- Make sure you're using Chrome 86+ or Edge 86+
- Check that the page is served over HTTPS or localhost
- Try reloading the page

### Files don't appear
- Make sure the folder is not empty
- Check that file extensions are recognized (see `11-languages.md`)
- Some folders (like `node_modules`) are skipped automatically

### Save fails
- Check that you granted write permission (browser will re-prompt)
- Make sure the file is not read-only on disk
- Try "Save As..." from the command palette

## API Reference (JavaScript)

AWECode uses these File System Access API methods internally:

```typescript
// Show folder picker
const handle: FileSystemDirectoryHandle = await window.showDirectoryPicker()

// Iterate directory entries
for await (const [name, handle] of directoryHandle.entries()) {
  if (handle.kind === 'file') { /* ... */ }
  if (handle.kind === 'directory') { /* ... */ }
}

// Get file content
const file: File = await fileHandle.getFile()
const text: string = await file.text()

// Write to file
const writable: FileSystemWritableFileStream = await fileHandle.createWritable()
await writable.write(newText)
await writable.close()

// Create new file
const newFileHandle = await directoryHandle.getFileHandle('name.ts', { create: true })

// Create new folder
const newDirHandle = await directoryHandle.getDirectoryHandle('src', { create: true })

// Verify permission
const opts = { mode: 'readwrite' }
if ((await directoryHandle.queryPermission(opts)) === 'granted') { /* ... */ }
if ((await directoryHandle.requestPermission(opts)) === 'granted') { /* ... */ }
```
