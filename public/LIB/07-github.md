# 07 — GitHub Integration

AWECode can connect to GitHub using a Personal Access Token (PAT) and lets you:

- Browse your repositories
- View any repo's file tree
- Clone (download) a repo to your local folder
- Edit files in AWECode and commit changes back to GitHub
- Create new branches
- View commit history

## Setup

### 1. Create a GitHub Personal Access Token

1. Go to https://github.com/settings/tokens (or Settings → Developer settings → Personal access tokens)
2. Click **Generate new token (classic)** or **Fine-grained token**
3. Select the scopes you need:
   - `repo` — for private and public repos (full control)
   - `public_repo` — for public repos only (subset of `repo`)
   - `read:user` — to list your profile
4. Click **Generate token**
5. Copy the token (starts with `ghp_...` for classic, `github_pat_...` for fine-grained)

### 2. Connect in AWECode

1. Click the **GitHub** icon in the sidebar (or command palette → "GitHub: Connect")
2. Paste your token in the input
3. Click **Connect**
4. Your username appears, along with a list of your repositories

> **Token storage**: Your token is stored in the browser's `localStorage` and sent only to GitHub's API (`api.github.com`). It is **never** sent to AWECode's server.

## Features

### Browse Repositories
- Lists up to 100 of your repositories
- Shows name, visibility (public/private), last update, default branch
- Click a repo to open its file tree

### View File Tree
- Recursively lists files in the repo
- Click any file to view its content (read-only mode)
- File contents are fetched via the GitHub Contents API

### Clone Repository
- Click **Clone** on a repo
- AWECode fetches the repo as a ZIP archive via `https://api.github.com/repos/{owner}/{repo}/zipball/{ref}`
- The ZIP is extracted in-memory and offered as a folder you can save to disk
- After saving, the folder opens in the editor — you can edit and save changes locally

### Edit and Commit
- After cloning (or opening a repo file), edit normally
- Click **Commit & Push** in the GitHub panel
- Enter a commit message
- AWECode creates a commit via the GitHub API:
  1. Gets the current SHA of the file
  2. Creates a new blob with your changes
  3. Creates a new tree with the updated file
  4. Creates a commit on top of the current HEAD
  5. Updates the ref (branch) to point to the new commit

### Create Branch
- Click **New Branch**
- Enter a branch name
- AWECode creates the branch from the current HEAD
- Switch to the new branch to make changes

### View Commit History
- Click **History** on a repo
- See the last 30 commits with author, message, and timestamp
- Click a commit to see its diff (via the GitHub compare API)

## API Endpoints Used

All requests go directly from your browser to `api.github.com`:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/user` | Get authenticated user |
| GET | `/user/repos?sort=updated&per_page=100` | List user's repos |
| GET | `/repos/{owner}/{repo}` | Get repo info |
| GET | `/repos/{owner}/{repo}/git/trees/{sha}?recursive=1` | Get file tree |
| GET | `/repos/{owner}/{repo}/contents/{path}?ref={branch}` | Get file content |
| GET | `/repos/{owner}/{repo}/zipball/{ref}` | Download repo as ZIP |
| GET | `/repos/{owner}/{repo}/commits?per_page=30` | List commits |
| POST | `/repos/{owner}/{repo}/git/blobs` | Create a blob |
| POST | `/repos/{owner}/{repo}/git/trees` | Create a tree |
| POST | `/repos/{owner}/{repo}/git/commits` | Create a commit |
| PATCH | `/repos/{owner}/{repo}/git/refs/heads/{branch}` | Update branch ref |
| POST | `/repos/{owner}/{repo}/git/refs` | Create new branch |

## Security

- **Token stored in localStorage** — clear browser data to revoke
- **Token sent only to api.github.com** — never to AWECode's server
- **HTTPS enforced** — all GitHub API requests are over HTTPS
- **No third-party sharing** — AWECode doesn't share your token with anyone

To revoke a token:
1. Go to https://github.com/settings/tokens
2. Find the token you created for AWECode
3. Click **Delete** to revoke it
4. In AWECode, click **Disconnect** to clear the stored token

## Rate Limits

GitHub's API has rate limits:
- **Authenticated requests**: 5,000 per hour
- **Unauthenticated requests**: 60 per hour (we always use authenticated)

If you hit the rate limit, AWECode shows a warning. Wait an hour for the limit to reset.

## Limitations

- **Repository size**: Cloning very large repos (>100MB) may be slow
- **Binary files**: Only text files can be edited; binary files (images, etc.) are skipped
- **Submodules**: Not supported — submodules appear as empty folders
- **LFS**: Large File Storage files are not supported (only the LFS pointer is shown)
- **Push conflicts**: If someone else pushed to the same branch, your push may fail. Pull first (clone again) to resolve
