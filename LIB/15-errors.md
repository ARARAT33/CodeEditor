# 15 — Common Errors & Solutions

Searchable database of common errors and their solutions. Use the LIB panel search to find a specific error.

## JavaScript / TypeScript

### `Cannot read property 'X' of undefined` / `undefined is not a function`
**Cause**: Trying to access a property or call a method on `undefined` or `null`.
**Solution**:
- Use optional chaining: `obj?.prop?.method()`
- Add a null check: `if (obj && obj.prop) { ... }`
- Default values: `const x = obj?.prop ?? defaultValue`

### `Maximum call stack size exceeded`
**Cause**: Infinite recursion — a function calls itself without a proper base case.
**Solution**: Add a base case that stops the recursion.

### `Promise reject unhandled`
**Cause**: A Promise rejected but no `.catch()` or `try/await/catch` handled it.
**Solution**: Always handle Promise rejections:
```js
try { await promise() } catch (e) { console.error(e) }
// or
promise().catch(e => console.error(e))
```

### `useEffect missing dependency` (React)
**Cause**: useEffect uses a variable not listed in deps array.
**Solution**: Add it to the deps array, or use `useCallback`/`useMemo` for the variable.

### `Hydration failed because the server rendered HTML didn't match the client`
**Cause**: Server-rendered HTML differs from client render. Common causes:
- Using `typeof window !== 'undefined'` checks
- `Date.now()`, `Math.random()` in render
- Browser extensions modifying HTML
- Invalid HTML nesting (e.g., `<button>` inside `<button>`, `<p>` inside `<p>`)
**Solution**:
- Move browser-only logic to `useEffect`
- Use `suppressHydrationWarning` for legitimate differences
- Fix invalid HTML nesting

## Python

### `IndentationError: expected an indented block`
**Cause**: Missing indentation after `if`, `for`, `def`, `class`, etc.
**Solution**: Add 4 spaces (or 1 tab) of indentation.

### `ModuleNotFoundError: No module named 'X'`
**Cause**: The module isn't installed.
**Solution**: `pip install X` (or `pip3 install X`).

### `KeyError: 'X'`
**Cause**: Accessing a dict key that doesn't exist.
**Solution**: Use `dict.get('X', default)` or check `if 'X' in dict`.

### `TypeError: 'NoneType' object is not iterable`
**Cause**: Trying to iterate over `None`.
**Solution**: Check for None first: `if x: for item in x: ...`

### `RecursionError: maximum recursion depth exceeded`
**Cause**: Infinite recursion.
**Solution**: Add a base case to stop recursion.

## Node.js

### `EADDRINUSE: address already in use`
**Cause**: Another process is using the port.
**Solution**: Kill the other process or use a different port.

### `Cannot find module 'X'`
**Cause**: Module not installed or wrong path.
**Solution**: `npm install X` or fix the import path.

### `EACCES: permission denied`
**Cause**: No write permission.
**Solution**: Fix file permissions or use `sudo` (last resort).

## React

### `Each child in a list should have a unique "key" prop`
**Cause**: Missing `key` prop in a mapped list.
**Solution**: Add `key={item.id}` to each list item.

### `Invalid hook call`
**Cause**: Hooks called outside a function component, or multiple React copies.
**Solution**: Make sure hooks are called at the top level of a component.

## CSS

### `flexbox not working`
**Cause**: Parent doesn't have `display: flex`.
**Solution**: Add `display: flex` to the parent.

### `z-index not working`
**Cause**: Element doesn't have `position: relative/absolute/fixed`.
**Solution**: Add `position: relative` (or other) before z-index works.

## Git

### `fatal: not a git repository`
**Cause**: Not inside a git repo.
**Solution**: Run `git init` or `cd` to the right directory.

### `merge conflict`
**Cause**: Two branches changed the same lines.
**Solution**: Open the file, look for `<<<<<<<` markers, pick the version, remove markers, then `git add` + `git commit`.

### `Permission denied (publickey)`
**Cause**: SSH key not set up with GitHub.
**Solution**: Generate a key (`ssh-keygen`), add the public key to GitHub settings.

## Network

### `CORS error`
**Cause**: Browser blocks cross-origin request.
**Solution**: Server must send `Access-Control-Allow-Origin` header, or use a proxy.

### `ERR_CONNECTION_REFUSED`
**Cause**: Server not running on the port.
**Solution**: Start the server, check the port number.

## AWECode-specific

### `Your browser does not support the File System Access API`
**Cause**: Using Firefox or Safari.
**Solution**: Use Chrome 86+ or Edge 86+ for local file access.

### `Permission denied. AWECode needs read/write access`
**Cause**: You declined the browser's permission prompt.
**Solution**: Click "Open Folder" again and click "Allow" in the prompt.

### `OAuth failed: authorization_pending`
**Cause**: GitHub OAuth device flow is waiting for you to authorize.
**Solution**: Open the verification URL in a new tab and enter the code shown.

### `Command "X" is not allowed`
**Cause**: The terminal only allows specific commands for security.
**Solution**: See LIB → Terminal for the full allowed list.
