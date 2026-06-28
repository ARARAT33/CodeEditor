// GitHub PR creation API
// POST /api/github-pr — create a new branch + commit + PR

export const runtime = 'nodejs'

interface PRRequest {
  token: string
  owner: string
  repo: string
  baseBranch: string
  newBranch: string
  files: Array<{ path: string; content: string }>
  commitMessage: string
  prTitle: string
  prBody: string
}

const GITHUB_API = 'https://api.github.com'

async function gh(endpoint: string, token: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`${GITHUB_API}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `GitHub API error: ${res.status}`)
  }
  return res.json()
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body: PRRequest = await req.json()
    const { token, owner, repo, baseBranch, newBranch, files, commitMessage, prTitle, prBody } = body

    if (!token || !owner || !repo || !files || !prTitle) {
      return Response.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Get the SHA of the base branch
    const baseRef = await gh(`/repos/${owner}/${repo}/git/refs/heads/${baseBranch}`, token)
    const baseSha = baseRef.object.sha

    // 2. Get the base commit + tree
    const baseCommit = await gh(`/repos/${owner}/${repo}/git/commits/${baseSha}`, token)
    const baseTreeSha = baseCommit.tree.sha

    // 3. Create blobs for each file
    const treeItems = []
    for (const file of files) {
      const blob = await gh(`/repos/${owner}/${repo}/git/blobs`, token, {
        method: 'POST',
        body: JSON.stringify({ content: file.content, encoding: 'utf-8' }),
      })
      treeItems.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blob.sha,
      })
    }

    // 4. Create a new tree with the file changes
    const newTree = await gh(`/repos/${owner}/${repo}/git/trees`, token, {
      method: 'POST',
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
    })

    // 5. Create a commit on top of the base
    const newCommit = await gh(`/repos/${owner}/${repo}/git/commits`, token, {
      method: 'POST',
      body: JSON.stringify({
        message: commitMessage,
        tree: newTree.sha,
        parents: [baseSha],
      }),
    })

    // 6. Create the new branch ref pointing to the new commit
    await gh(`/repos/${owner}/${repo}/git/refs`, token, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${newBranch}`, sha: newCommit.sha }),
    })

    // 7. Open a pull request
    const pr = await gh(`/repos/${owner}/${repo}/pulls`, token, {
      method: 'POST',
      body: JSON.stringify({
        title: prTitle,
        body: prBody,
        head: newBranch,
        base: baseBranch,
      }),
    })

    return Response.json({
      ok: true,
      pr: {
        number: pr.number,
        url: pr.html_url,
        branch: newBranch,
        commitSha: newCommit.sha,
      },
    })
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || 'Failed to create PR' }, { status: 500 })
  }
}
