export const getLanguageFromExtension = (fileName: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  const languageMap: Record<string, string> = {
    // Web Technologies
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
    less: "less",
    vue: "vue",

    // Backend Languages
    py: "python",
    python: "python",
    java: "java",
    c: "c",
    cpp: "cpp",
    cxx: "cpp",
    cc: "cpp",
    h: "c",
    hpp: "cpp",
    cs: "csharp",
    php: "php",
    rb: "ruby",
    ruby: "ruby",
    go: "go",
    rs: "rust",
    rust: "rust",
    swift: "swift",
    kt: "kotlin",
    kts: "kotlin",
    kotlin: "kotlin",
    scala: "scala",
    dart: "dart",
    lua: "lua",
    r: "r",
    perl: "perl",
    pl: "perl",

    // Data & Config
    json: "json",
    json5: "json",
    jsonc: "json",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    ini: "ini",
    cfg: "ini",
    conf: "ini",
    sql: "sql",

    // Documentation
    md: "markdown",
    markdown: "markdown",
    rst: "restructuredtext",
    txt: "plaintext",

    // Shell & Scripts
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    fish: "shell",
    ps1: "powershell",
    bat: "batch",
    cmd: "batch",

    // Others
    dockerfile: "dockerfile",
    graphql: "graphql",
    proto: "protobuf",
    clj: "clojure",
    cljs: "clojure",
    coffee: "coffeescript",
    elm: "elm",
    ex: "elixir",
    exs: "elixir",
    fs: "fsharp",
    fsx: "fsharp",
    haskell: "haskell",
    hs: "haskell",
    julia: "julia",
    jl: "julia",
    nim: "nim",
    pascal: "pascal",
    pas: "pascal",
    pug: "pug",
    stylus: "stylus",
    styl: "stylus",
    twig: "twig",
    vb: "vb",
    vbs: "vb",
    solidity: "solidity",
    sol: "solidity",
  };

  // Check for special filenames
  if (fileName === "Dockerfile") return "dockerfile";
  if (fileName.startsWith(".env")) return "dotenv";
  if (fileName === ".gitignore") return "ignore";
  if (fileName === ".gitattributes") return "ignore";
  if (fileName === "package.json") return "json";
  if (fileName === "tsconfig.json") return "json";
  if (fileName === "next.config.js") return "javascript";
  if (fileName === "next.config.ts") return "typescript";
  if (fileName === "tailwind.config.js") return "javascript";
  if (fileName === "tailwind.config.ts") return "typescript";
  if (fileName === "webpack.config.js") return "javascript";
  if (fileName === "vite.config.js") return "javascript";
  if (fileName === "vite.config.ts") return "typescript";

  return languageMap[extension || ""] || "plaintext";
};

export const SUPPORTED_LANGUAGES = [
  { id: "javascript", name: "JavaScript", extensions: ["js", "jsx"] },
  { id: "typescript", name: "TypeScript", extensions: ["ts", "tsx"] },
  { id: "python", name: "Python", extensions: ["py"] },
  { id: "java", name: "Java", extensions: ["java"] },
  { id: "c", name: "C", extensions: ["c", "h"] },
  { id: "cpp", name: "C++", extensions: ["cpp", "cxx", "cc", "hpp"] },
  { id: "csharp", name: "C#", extensions: ["cs"] },
  { id: "php", name: "PHP", extensions: ["php"] },
  { id: "ruby", name: "Ruby", extensions: ["rb"] },
  { id: "go", name: "Go", extensions: ["go"] },
  { id: "rust", name: "Rust", extensions: ["rs"] },
  { id: "swift", name: "Swift", extensions: ["swift"] },
  { id: "kotlin", name: "Kotlin", extensions: ["kt"] },
  { id: "scala", name: "Scala", extensions: ["scala"] },
  { id: "dart", name: "Dart", extensions: ["dart"] },
  { id: "html", name: "HTML", extensions: ["html", "htm"] },
  { id: "css", name: "CSS", extensions: ["css"] },
  { id: "scss", name: "SCSS", extensions: ["scss"] },
  { id: "sass", name: "Sass", extensions: ["sass"] },
  { id: "less", name: "Less", extensions: ["less"] },
  { id: "json", name: "JSON", extensions: ["json"] },
  { id: "xml", name: "XML", extensions: ["xml"] },
  { id: "yaml", name: "YAML", extensions: ["yaml", "yml"] },
  { id: "markdown", name: "Markdown", extensions: ["md", "markdown"] },
  { id: "sql", name: "SQL", extensions: ["sql"] },
  { id: "shell", name: "Shell", extensions: ["sh", "bash", "zsh"] },
  { id: "dockerfile", name: "Dockerfile", extensions: ["dockerfile"] },
  { id: "lua", name: "Lua", extensions: ["lua"] },
  { id: "r", name: "R", extensions: ["r"] },
  { id: "perl", name: "Perl", extensions: ["perl", "pl"] },
];
