# 05 — Function Library (1000+)

AWECode includes a built-in library of **1000+ utility functions** you can browse, search, and insert into your code.

## Categories

Functions are organized into 30+ categories:

| Category | Count | Examples |
|----------|-------|---------|
| String | 30+ | `capitalize`, `camelCase`, `kebabCase`, `slugify`, `truncate` |
| Array | 25+ | `unique`, `chunk`, `flatten`, `shuffle`, `groupBy`, `partition` |
| Object | 15+ | `deepGet`, `deepSet`, `deepClone`, `deepMerge`, `omit`, `pick` |
| Math | 35+ | `clamp`, `gcd`, `lcm`, `isPrime`, `fibonacci`, `lerp`, `factorial` |
| Number | 20+ | `toCurrency`, `toRoman`, `bytesToSize`, `isBetween` |
| Date | 20+ | `formatDate`, `addDays`, `diffDays`, `startOfWeek`, `timeAgo` |
| Time | 5+ | `sleep`, `debounce`, `throttle` |
| Validation | 30+ | `isEmail`, `isURL`, `isIP`, `isUUID`, `isCreditCard`, `isPhone` |
| Hash/Crypto | 25+ | `md5`, `sha256`, `hmacSHA256`, `bcryptHash`, `argon2Hash`, `pbkdf2` |
| UUID | 1+ | `uuidv4` |
| Type Check | 10+ | `isString`, `isNumber`, `isArray`, `isPromise` |
| Color | 5+ | `hexToRgb`, `rgbToHex` |
| URL | 10+ | `parseQuery`, `buildQuery`, `parseURL` |
| Sort/Search | 10+ | `quickSort`, `mergeSort`, `binarySearch`, `kmpSearch` |
| Distance | 10+ | `levenshtein`, `jaroSimilarity`, `euclidean`, `cosineSim` |
| DOM | 15+ | `qs`, `qsa`, `on`, `addClass`, `copyToClipboard` |
| Promise/Async | 15+ | `retry`, `withTimeout`, `asyncPool`, `memoizeAsync` |
| Convert | 10+ | `toBool`, `toNumber`, `toArray` |
| Function | 15+ | `compose`, `pipe`, `curry`, `partial`, `once`, `memoize` |
| Linear Algebra | 12+ | `matrixMul`, `matrixInverse`, `vectorDot`, `vectorNorm` |
| Tree | 7+ | `treeBFS`, `treeDFS`, `treeInOrder`, `treeHeight` |
| Graph Algo | 8+ | `graphBFS`, `dijkstra`, `floydWarshall`, `topoSort`, `kruskalMST` |
| Stats | 9+ | `mean`, `median`, `stdDev`, `correlation`, `linearRegression` |
| Geometry | 8+ | `distance2d`, `circleArea`, `sphereVolume` |
| Bit | 12+ | `bitAnd`, `bitShl`, `bitCount`, `bitTest` |
| i18n | 4+ | `i18nPlural`, `i18nFormatNumber`, `i18nFormatCurrency` |
| Diff | 4+ | `diffLines`, `diffChars`, `patchApply` |
| Compression | 2+ | `rleEncode`, `rleDecode` |
| Sanitize | 6+ | `sanitizeSQL`, `sanitizeHTML`, `escapeRegex`, `csrfToken` |
| Encoding | 10+ | `encodeUTF8`, `encodeHTMLEntity`, `encodeUnicode` |
| JSON | 8+ | `jsonParse`, `jsonFlatten`, `jsonPath` |
| Regex | 6+ | `regexEscape`, `regexMatch`, `regexReplace` |
| Iterator | 7+ | `iteratorMap`, `iteratorFilter`, `iteratorZip` |
| Log | 7+ | `logInfo`, `logWarn`, `logTime` |
| JWT | 3+ | `jwtSign`, `jwtVerify`, `jwtDecode` |
| Data Structure | 9+ | `stackNew`, `queueNew`, `heapNew`, `trieNew`, `lruCache`, `bloomFilter` |
| ... and many more | | |

## Implemented vs Catalog

Functions come in two flavors:

- **Implemented** (200+) — full TypeScript code you can copy/paste and use immediately
- **Catalog** (800+) — metadata, signature, parameters, returns, and example. Useful for discovery; you implement the body yourself.

## Using the Function Library

### From the UI

1. Open the **Functions** tab in the right panel
2. Search by name or description in the search box
3. Filter by category using the dropdown
4. Click any function to see full details:
   - Signature
   - Parameters (name, type, description)
   - Returns
   - Example
   - Complexity (when applicable)
   - Implementation (if available)
5. Click **Insert** to drop the function at your cursor in the editor
6. Click **Copy** to copy the code to your clipboard

### From the API

```bash
# List all functions (first 100)
curl http://your-host/api/aweai/functions

# Search functions
curl 'http://your-host/api/aweai/functions?q=sort'

# Get a specific function by ID
curl 'http://your-host/api/aweai/functions?id=str-capitalize'

# List categories
curl 'http://your-host/api/aweai/functions?categories=1'

# Get stats
curl 'http://your-host/api/aweai/functions?stats=1'
```

## Adding Your Own Functions

To add a function, edit `src/lib/awecode/functions.ts` and add a new entry to the `implementedFunctions` or `moreTemplates` array. Each entry needs:
- `id` — unique identifier
- `name`, `category`, `description`
- `signature`, `parameters`, `returns`
- `example`, `tags`
- `code` — the actual implementation (for implemented functions)

## Function Quality

All implemented functions:
- Are written in TypeScript with proper types
- Include JSDoc-style comments where helpful
- Are tested for the common case
- Have O(...) complexity noted where relevant
- Are pure functions (no side effects) unless noted

## Performance Notes

- The function catalog is loaded once on first request and cached
- Search uses simple `includes()` — works well for 1000 functions
- For larger libraries, consider adding a search index
