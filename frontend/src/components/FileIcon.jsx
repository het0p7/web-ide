import { Icon } from '@iconify/react';

// ---------------------------------------------------------------------------
// 1. SPECIAL FILENAME MAP  (checked before extension — highest priority)
// ---------------------------------------------------------------------------
const FILENAME_ICONS = {
  // npm / node
  'package.json':          'vscode-icons:file-type-npm',
  'package-lock.json':     'vscode-icons:file-type-npm',
  '.npmrc':                'vscode-icons:file-type-npm',
  '.nvmrc':                'vscode-icons:file-type-npm',

  // git
  '.gitignore':            'vscode-icons:file-type-git',
  '.gitattributes':        'vscode-icons:file-type-git',
  '.gitmodules':           'vscode-icons:file-type-git',
  '.gitkeep':              'vscode-icons:file-type-git',

  // docker
  'dockerfile':            'vscode-icons:file-type-docker',
  'docker-compose.yml':    'vscode-icons:file-type-docker',
  'docker-compose.yaml':   'vscode-icons:file-type-docker',
  '.dockerignore':         'vscode-icons:file-type-docker',

  // env / dotenv
  '.env':                  'vscode-icons:file-type-dotenv',
  '.env.local':            'vscode-icons:file-type-dotenv',
  '.env.development':      'vscode-icons:file-type-dotenv',
  '.env.production':       'vscode-icons:file-type-dotenv',
  '.env.staging':          'vscode-icons:file-type-dotenv',
  '.env.test':             'vscode-icons:file-type-dotenv',
  '.env.example':          'vscode-icons:file-type-dotenv',

  // TypeScript config
  'tsconfig.json':         'vscode-icons:file-type-tsconfig',
  'tsconfig.base.json':    'vscode-icons:file-type-tsconfig',
  'tsconfig.app.json':     'vscode-icons:file-type-tsconfig',
  'tsconfig.node.json':    'vscode-icons:file-type-tsconfig',

  // Vite
  'vite.config.js':        'vscode-icons:file-type-vite',
  'vite.config.ts':        'vscode-icons:file-type-vite',
  'vite.config.mjs':       'vscode-icons:file-type-vite',

  // Webpack
  'webpack.config.js':     'vscode-icons:file-type-webpack',
  'webpack.config.ts':     'vscode-icons:file-type-webpack',

  // ESLint
  '.eslintrc':             'vscode-icons:file-type-eslint',
  '.eslintrc.js':          'vscode-icons:file-type-eslint',
  '.eslintrc.cjs':         'vscode-icons:file-type-eslint',
  '.eslintrc.json':        'vscode-icons:file-type-eslint',
  '.eslintrc.yml':         'vscode-icons:file-type-eslint',
  '.eslintrc.yaml':        'vscode-icons:file-type-eslint',
  'eslint.config.js':      'vscode-icons:file-type-eslint',
  'eslint.config.ts':      'vscode-icons:file-type-eslint',

  // Prettier
  '.prettierrc':           'vscode-icons:file-type-prettier',
  '.prettierrc.js':        'vscode-icons:file-type-prettier',
  '.prettierrc.json':      'vscode-icons:file-type-prettier',
  '.prettierrc.yml':       'vscode-icons:file-type-prettier',
  '.prettierignore':       'vscode-icons:file-type-prettier',
  'prettier.config.js':    'vscode-icons:file-type-prettier',

  // Babel
  'babel.config.js':       'vscode-icons:file-type-babel',
  'babel.config.json':     'vscode-icons:file-type-babel',
  '.babelrc':              'vscode-icons:file-type-babel',
  '.babelrc.js':           'vscode-icons:file-type-babel',

  // Jest / Vitest
  'jest.config.js':        'vscode-icons:file-type-jest',
  'jest.config.ts':        'vscode-icons:file-type-jest',
  'jest.config.cjs':       'vscode-icons:file-type-jest',
  'vitest.config.js':      'vscode-icons:file-type-jest',
  'vitest.config.ts':      'vscode-icons:file-type-jest',

  // Tailwind
  'tailwind.config.js':    'vscode-icons:file-type-tailwind',
  'tailwind.config.ts':    'vscode-icons:file-type-tailwind',
  'tailwind.config.cjs':   'vscode-icons:file-type-tailwind',

  // PostCSS
  'postcss.config.js':     'vscode-icons:file-type-postcss',
  'postcss.config.mjs':    'vscode-icons:file-type-postcss',

  // Makefile
  'makefile':              'vscode-icons:file-type-makefile',
  'gnumakefile':           'vscode-icons:file-type-makefile',

  // Readme / License / Changelog
  'readme.md':             'vscode-icons:file-type-readme',
  'readme':                'vscode-icons:file-type-readme',
  'license':               'vscode-icons:file-type-license',
  'licence':               'vscode-icons:file-type-license',
  'license.md':            'vscode-icons:file-type-license',
  'licence.md':            'vscode-icons:file-type-license',
  'changelog.md':          'vscode-icons:file-type-changelog',
  'changelog':             'vscode-icons:file-type-changelog',

  // Vercel / Next
  'next.config.js':        'vscode-icons:file-type-next',
  'next.config.ts':        'vscode-icons:file-type-next',
  'next.config.mjs':       'vscode-icons:file-type-next',
  'vercel.json':           'vscode-icons:file-type-vercel',

  // Prisma
  'schema.prisma':         'vscode-icons:file-type-prisma',

  // GraphQL
  'schema.graphql':        'vscode-icons:file-type-graphql',
};

// ---------------------------------------------------------------------------
// 2. EXTENSION MAP  (fallback when no filename match)
// ---------------------------------------------------------------------------
const EXTENSION_ICONS = {
  // JavaScript
  js:      'vscode-icons:file-type-js-official',
  mjs:     'vscode-icons:file-type-js-official',
  cjs:     'vscode-icons:file-type-js-official',
  jsx:     'vscode-icons:file-type-reactjs',

  // TypeScript
  ts:      'vscode-icons:file-type-typescript-official',
  tsx:     'vscode-icons:file-type-reactts',
  mts:     'vscode-icons:file-type-typescript-official',
  cts:     'vscode-icons:file-type-typescript-official',
  d_ts:    'vscode-icons:file-type-typescript-official', // .d.ts mapped via logic

  // Web
  html:    'vscode-icons:file-type-html',
  htm:     'vscode-icons:file-type-html',
  css:     'vscode-icons:file-type-css',
  scss:    'vscode-icons:file-type-scss',
  sass:    'vscode-icons:file-type-sass',
  less:    'vscode-icons:file-type-less',

  // Frameworks
  vue:     'vscode-icons:file-type-vue',
  svelte:  'vscode-icons:file-type-svelte',
  astro:   'vscode-icons:file-type-astro',

  // Data / Config
  json:    'vscode-icons:file-type-json',
  json5:   'vscode-icons:file-type-json5',
  yaml:    'vscode-icons:file-type-yaml',
  yml:     'vscode-icons:file-type-yaml',
  toml:    'vscode-icons:file-type-toml',
  xml:     'vscode-icons:file-type-xml',
  csv:     'vscode-icons:file-type-csv',
  env:     'vscode-icons:file-type-dotenv',

  // Documentation
  md:      'vscode-icons:file-type-markdown',
  mdx:     'vscode-icons:file-type-mdx',
  rst:     'vscode-icons:file-type-markdown',
  txt:     'vscode-icons:file-type-text',

  // Python
  py:      'vscode-icons:file-type-python',
  pyi:     'vscode-icons:file-type-python',
  pyc:     'vscode-icons:file-type-python',
  pyw:     'vscode-icons:file-type-python',

  // C / C++
  c:       'vscode-icons:file-type-c',
  cpp:     'vscode-icons:file-type-cpp',
  cc:      'vscode-icons:file-type-cpp',
  cxx:     'vscode-icons:file-type-cpp',
  h:       'vscode-icons:file-type-cheader',
  hpp:     'vscode-icons:file-type-cpp',
  hxx:     'vscode-icons:file-type-cpp',

  // Java / JVM
  java:    'vscode-icons:file-type-java',
  class:   'vscode-icons:file-type-java',
  kt:      'vscode-icons:file-type-kotlin',
  kts:     'vscode-icons:file-type-kotlin',
  gradle:  'vscode-icons:file-type-gradle',
  groovy:  'vscode-icons:file-type-groovy',
  scala:   'vscode-icons:file-type-scala',

  // Other languages
  go:      'vscode-icons:file-type-go',
  rs:      'vscode-icons:file-type-rust',
  rb:      'vscode-icons:file-type-ruby',
  php:     'vscode-icons:file-type-php',
  swift:   'vscode-icons:file-type-swift',
  cs:      'vscode-icons:file-type-csharp',
  fs:      'vscode-icons:file-type-fsharp',
  fsx:     'vscode-icons:file-type-fsharp',
  lua:     'vscode-icons:file-type-lua',
  r:       'vscode-icons:file-type-r',
  dart:    'vscode-icons:file-type-dart',
  elm:     'vscode-icons:file-type-elm',
  ex:      'vscode-icons:file-type-elixir',
  exs:     'vscode-icons:file-type-elixir',
  clj:     'vscode-icons:file-type-clojure',
  hs:      'vscode-icons:file-type-haskell',
  pl:      'vscode-icons:file-type-perl',
  pm:      'vscode-icons:file-type-perl',

  // Shell
  sh:      'vscode-icons:file-type-shell',
  bash:    'vscode-icons:file-type-shell',
  zsh:     'vscode-icons:file-type-shell',
  fish:    'vscode-icons:file-type-shell',
  bat:     'vscode-icons:file-type-bat',
  cmd:     'vscode-icons:file-type-bat',
  ps1:     'vscode-icons:file-type-powershell',
  psm1:    'vscode-icons:file-type-powershell',

  // Database
  sql:     'vscode-icons:file-type-sql',
  sqlite:  'vscode-icons:file-type-sqlite',
  db:      'vscode-icons:file-type-sqlite',

  // Images
  png:     'vscode-icons:file-type-image',
  jpg:     'vscode-icons:file-type-image',
  jpeg:    'vscode-icons:file-type-image',
  gif:     'vscode-icons:file-type-image',
  webp:    'vscode-icons:file-type-image',
  bmp:     'vscode-icons:file-type-image',
  tiff:    'vscode-icons:file-type-image',
  ico:     'vscode-icons:file-type-image',
  svg:     'vscode-icons:file-type-svg',

  // Media
  mp4:     'vscode-icons:file-type-video',
  mov:     'vscode-icons:file-type-video',
  avi:     'vscode-icons:file-type-video',
  mp3:     'vscode-icons:file-type-audio',
  wav:     'vscode-icons:file-type-audio',
  ogg:     'vscode-icons:file-type-audio',

  // Archives
  zip:     'vscode-icons:file-type-zip',
  tar:     'vscode-icons:file-type-zip',
  gz:      'vscode-icons:file-type-zip',
  rar:     'vscode-icons:file-type-zip',
  '7z':    'vscode-icons:file-type-zip',

  // Misc
  pdf:     'vscode-icons:file-type-pdf',
  log:     'vscode-icons:file-type-log',
  lock:    'vscode-icons:file-type-lock2',
  graphql: 'vscode-icons:file-type-graphql',
  gql:     'vscode-icons:file-type-graphql',
  prisma:  'vscode-icons:file-type-prisma',
  wasm:    'vscode-icons:file-type-wasm',
  proto:   'vscode-icons:file-type-proto',
};

// ---------------------------------------------------------------------------
// 3. FOLDER MAP  (name → { closed, open } icon ids)
// ---------------------------------------------------------------------------
const FOLDER_ICONS = {
  'node_modules':  { closed: 'vscode-icons:folder-type-node',        open: 'vscode-icons:folder-type-node-open' },
  'src':           { closed: 'vscode-icons:folder-type-src',         open: 'vscode-icons:folder-type-src-open' },
  'source':        { closed: 'vscode-icons:folder-type-src',         open: 'vscode-icons:folder-type-src-open' },
  'public':        { closed: 'vscode-icons:folder-type-public',      open: 'vscode-icons:folder-type-public-open' },
  'static':        { closed: 'vscode-icons:folder-type-public',      open: 'vscode-icons:folder-type-public-open' },
  'assets':        { closed: 'vscode-icons:folder-type-images',      open: 'vscode-icons:folder-type-images-open' },
  'images':        { closed: 'vscode-icons:folder-type-images',      open: 'vscode-icons:folder-type-images-open' },
  'img':           { closed: 'vscode-icons:folder-type-images',      open: 'vscode-icons:folder-type-images-open' },
  'icons':         { closed: 'vscode-icons:folder-type-images',      open: 'vscode-icons:folder-type-images-open' },
  'components':    { closed: 'vscode-icons:folder-type-components',  open: 'vscode-icons:folder-type-components-open' },
  'pages':         { closed: 'vscode-icons:folder-type-page',        open: 'vscode-icons:folder-type-page-open' },
  'views':         { closed: 'vscode-icons:folder-type-page',        open: 'vscode-icons:folder-type-page-open' },
  '.git':          { closed: 'vscode-icons:folder-type-git',         open: 'vscode-icons:folder-type-git-open' },
  'dist':          { closed: 'vscode-icons:folder-type-dist',        open: 'vscode-icons:folder-type-dist-open' },
  'out':           { closed: 'vscode-icons:folder-type-dist',        open: 'vscode-icons:folder-type-dist-open' },
  'output':        { closed: 'vscode-icons:folder-type-dist',        open: 'vscode-icons:folder-type-dist-open' },
  'build':         { closed: 'vscode-icons:folder-type-build',       open: 'vscode-icons:folder-type-build-open' },
  'test':          { closed: 'vscode-icons:folder-type-test',        open: 'vscode-icons:folder-type-test-open' },
  'tests':         { closed: 'vscode-icons:folder-type-test',        open: 'vscode-icons:folder-type-test-open' },
  '__tests__':     { closed: 'vscode-icons:folder-type-test',        open: 'vscode-icons:folder-type-test-open' },
  'spec':          { closed: 'vscode-icons:folder-type-test',        open: 'vscode-icons:folder-type-test-open' },
  'styles':        { closed: 'vscode-icons:folder-type-css',         open: 'vscode-icons:folder-type-css-open' },
  'css':           { closed: 'vscode-icons:folder-type-css',         open: 'vscode-icons:folder-type-css-open' },
  'scss':          { closed: 'vscode-icons:folder-type-css',         open: 'vscode-icons:folder-type-css-open' },
  'hooks':         { closed: 'vscode-icons:folder-type-hook',        open: 'vscode-icons:folder-type-hook-open' },
  'context':       { closed: 'vscode-icons:folder-type-context',     open: 'vscode-icons:folder-type-context-open' },
  'utils':         { closed: 'vscode-icons:folder-type-utils',       open: 'vscode-icons:folder-type-utils-open' },
  'helpers':       { closed: 'vscode-icons:folder-type-utils',       open: 'vscode-icons:folder-type-utils-open' },
  'lib':           { closed: 'vscode-icons:folder-type-utils',       open: 'vscode-icons:folder-type-utils-open' },
  'config':        { closed: 'vscode-icons:folder-type-config',      open: 'vscode-icons:folder-type-config-open' },
  'configs':       { closed: 'vscode-icons:folder-type-config',      open: 'vscode-icons:folder-type-config-open' },
  'api':           { closed: 'vscode-icons:folder-type-route',       open: 'vscode-icons:folder-type-route-open' },
  'routes':        { closed: 'vscode-icons:folder-type-route',       open: 'vscode-icons:folder-type-route-open' },
  'router':        { closed: 'vscode-icons:folder-type-route',       open: 'vscode-icons:folder-type-route-open' },
  'middleware':    { closed: 'vscode-icons:folder-type-middleware',   open: 'vscode-icons:folder-type-middleware-open' },
  'middlewares':   { closed: 'vscode-icons:folder-type-middleware',   open: 'vscode-icons:folder-type-middleware-open' },
  'controllers':   { closed: 'vscode-icons:folder-type-controller',  open: 'vscode-icons:folder-type-controller-open' },
  'controller':    { closed: 'vscode-icons:folder-type-controller',  open: 'vscode-icons:folder-type-controller-open' },
  'models':        { closed: 'vscode-icons:folder-type-model',       open: 'vscode-icons:folder-type-model-open' },
  'model':         { closed: 'vscode-icons:folder-type-model',       open: 'vscode-icons:folder-type-model-open' },
  'services':      { closed: 'vscode-icons:folder-type-services',    open: 'vscode-icons:folder-type-services-open' },
  'service':       { closed: 'vscode-icons:folder-type-services',    open: 'vscode-icons:folder-type-services-open' },
  'store':         { closed: 'vscode-icons:folder-type-redux-store', open: 'vscode-icons:folder-type-redux-store-open' },
  'redux':         { closed: 'vscode-icons:folder-type-redux',       open: 'vscode-icons:folder-type-redux-open' },
  'docs':          { closed: 'vscode-icons:folder-type-docs',        open: 'vscode-icons:folder-type-docs-open' },
  'doc':           { closed: 'vscode-icons:folder-type-docs',        open: 'vscode-icons:folder-type-docs-open' },
  'documentation': { closed: 'vscode-icons:folder-type-docs',        open: 'vscode-icons:folder-type-docs-open' },
  'types':         { closed: 'vscode-icons:folder-type-typings',     open: 'vscode-icons:folder-type-typings-open' },
  'typings':       { closed: 'vscode-icons:folder-type-typings',     open: 'vscode-icons:folder-type-typings-open' },
  'scripts':       { closed: 'vscode-icons:folder-type-scripts',     open: 'vscode-icons:folder-type-scripts-open' },
  'script':        { closed: 'vscode-icons:folder-type-scripts',     open: 'vscode-icons:folder-type-scripts-open' },
  'logs':          { closed: 'vscode-icons:folder-type-log',         open: 'vscode-icons:folder-type-log-open' },
  'log':           { closed: 'vscode-icons:folder-type-log',         open: 'vscode-icons:folder-type-log-open' },
  'docker':        { closed: 'vscode-icons:folder-type-docker',      open: 'vscode-icons:folder-type-docker-open' },
  'functions':     { closed: 'vscode-icons:folder-type-functions',   open: 'vscode-icons:folder-type-functions-open' },
  '.vscode':       { closed: 'vscode-icons:folder-type-vscode',      open: 'vscode-icons:folder-type-vscode-open' },
  '.github':       { closed: 'vscode-icons:folder-type-github',      open: 'vscode-icons:folder-type-github-open' },
};

// ---------------------------------------------------------------------------
// FileIcon component — file explorer items + editor tabs
// ---------------------------------------------------------------------------
export default function FileIcon({ name, className = '' }) {
  const lower = name.toLowerCase();

  // 1. Special full filename match (e.g. "package.json", "Dockerfile")
  const filenameIcon = FILENAME_ICONS[lower];
  if (filenameIcon) {
    return <Icon icon={filenameIcon} className={`shrink-0 ${className}`} />;
  }

  // 2. Handle compound extensions like ".d.ts"
  if (lower.endsWith('.d.ts')) {
    return <Icon icon="vscode-icons:file-type-typescript-official" className={`shrink-0 ${className}`} />;
  }

  // 3. Regular extension match
  const ext = lower.split('.').pop();
  const extIcon = EXTENSION_ICONS[ext];
  if (extIcon) {
    return <Icon icon={extIcon} className={`shrink-0 ${className}`} />;
  }

  // 4. Generic fallback
  return (
    <svg className={`shrink-0 text-neutral-400 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// FolderIcon component — exported for use in FileTree
// ---------------------------------------------------------------------------
export function FolderIcon({ name = '', isOpen = false, className = '' }) {
  const lower = name.toLowerCase();
  const match = FOLDER_ICONS[lower];

  const iconId = match
    ? (isOpen ? match.open : match.closed)
    : (isOpen ? 'vscode-icons:default-folder-opened' : 'vscode-icons:default-folder');

  return <Icon icon={iconId} className={`shrink-0 ${className}`} />;
}
