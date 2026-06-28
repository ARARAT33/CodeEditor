# 13 — Terminal

AWECode includes a real terminal that executes shell commands in a sandboxed environment on the server.

## How It Works

1. You type a command in the terminal input
2. AWECode sends it to `POST /api/terminal` on the server
3. The server runs the command in `/tmp/awecode-workspace`
4. stdout, stderr, and exit code are returned
5. Output is displayed in the terminal panel

The terminal is **stateful per session** — your working directory persists between commands.

## Allowed Commands

For security, only these commands are allowed:

### File utilities
`ls`, `pwd`, `cat`, `echo`, `head`, `tail`, `wc`, `grep`, `find`, `sort`, `uniq`, `cut`, `tr`, `awk`, `sed`

### Programming languages
- **JavaScript/TypeScript**: `node`, `deno`, `bun`, `tsx`, `ts-node`, `tsc`
- **Python**: `python`, `python3`
- **Ruby**: `ruby`
- **PHP**: `php`
- **Perl**: `perl`
- **Go**: `go`
- **Rust**: `rustc`, `cargo`
- **C/C++**: `gcc`, `g++`, `clang`, `clang++`, `make`, `cmake`
- **Java**: `javac`, `java`, `kotlin`, `kotlinc`

### Database
`sql`, `sqlite3`

### System info
`date`, `whoami`, `uname`, `env`

### Hashing/encoding
`md5sum`, `sha256sum`, `sha1sum`, `base64`

### Data processing
`jq`, `yq`

### Package managers
`git`, `npm`, `npx`, `yarn`, `pnpm`

### Network
`curl`, `wget`

## Examples

### Run JavaScript
```sh
$ node -e 'console.log(1 + 1)'
2
```

### Run Python
```sh
$ python3 -c 'print([x**2 for x in range(5)])'
[0, 1, 4, 9, 16]
```

### List files
```sh
$ ls -la
total 8
drwxr-xr-x  2 user user 4096 Jun 29 12:00 .
drwxr-xr-x  3 user user 4096 Jun 29 12:00 ..
```

### Pipe commands
```sh
$ echo "hello world" | tr 'a-z' 'A-Z'
HELLO WORLD
```

### Compile and run C
```sh
$ echo 'int main(){printf("hi\n");return 0;}' > hi.c
$ gcc hi.c -o hi
$ ./hi
hi
```

### Hash a string
```sh
$ echo -n "password" | sha256sum
5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8  -
```

## Keyboard Shortcuts

- `Enter` — Run command
- `↑` / `↓` — Navigate command history
- `Ctrl+L` — Clear terminal

## Limitations

- **Timeout**: Commands are killed after 15 seconds
- **Output size**: stdout/stderr are capped at 100KB each
- **Working directory**: Always under `/tmp/awecode-workspace`
- **No interactive input**: Commands that require stdin (like `python` REPL) won't work
- **No root access**: Commands run as the server user

## Use Cases

- Quickly test code snippets in any language
- Validate JSON (`cat file.json | jq .`)
- Hash strings for security checks
- Run build tools (npm, cargo, make)
- Inspect files (cat, head, grep)
- Git operations (status, log, diff)
- Download files (curl, wget)
