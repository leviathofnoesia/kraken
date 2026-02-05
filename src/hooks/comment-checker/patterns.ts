export const COMMENT_PATTERNS = {
  // Common comment patterns
  todo: [/TODO:/i, /@todo/i, /\[TODO\]/i, /待办/i, /할 일/i, /待辦/i],
  fixme: [/FIXME:/i, /@fixme/i, /\[FIXME\]/i, /修复/i, /수정/i, /修正/i],
  xxx: [/XXX:/i, /@xxx/i, /\[XXX\]/i],
  hack: [/HACK:/i, /@hack/i, /\[HACK\]/i],
  note: [/NOTE:/i, /@note/i, /\[NOTE\]/i, /注意/i, /참고/i, /註記/i],
  bug: [/BUG:/i, /@bug/i, /\[BUG\]/i],
  warning: [/WARNING:/i, /@warning/i, /\[WARNING\]/i, /경고/i],
  optimization: [/OPTIMIZE:/i, /PERFORMANCE:/i, /@optimize/i],
  refactoring: [/REFACTOR:/i, /@refactor/i],
  documentation: [/DOC:/i, /@doc/i],
}

export const EXCEPTION_PATTERNS = {
  // BDD (Behavior Driven Development)
  bdd: [
    /^\s*#\s*Given\s+/i,
    /^\s*#\s*When\s+/i,
    /^\s*#\s*Then\s+/i,
    /^\s*#\s*And\s+/i,
    /^\s*#\s*But\s+/i,
    /^\s*\/\/\s*Given\s+/i,
    /^\s*\/\/\s*When\s+/i,
    /^\s*\/\/\s*Then\s+/i,
    /^\s*\/\/\s*And\s+/i,
  ],

  // Linter directives
  linter: [
    /^\s*#\s*noqa/i,
    /^\s*\/\/\s*@ts-ignore\b/i,
    /^\s*\/\/\s*@ts-nocheck\b/i,
    /^\s*\/\/\s*@ts-check\b/i,
    /^\s*\/\/\s*eslint-disable\b/i,
    /^\s*\/\/\s*eslint-enable\b/i,
    /^\s*\/\/\s*eslint-disable-next-line\b/i,
    /^\s*\/\*\s*eslint-disable\b/i,
    /^\s*\/\*\s*eslint-enable\b/i,
    /^\s*#\s*type:\s*ignore\b/i,
    /^\s*#\s*pylint:\s*disable\b/i,
    /^\s*#\s*mypy:\s*ignore\b/i,
  ],

  // Shebangs
  shebang: [/^#!\/bin\//, /^#!\/usr\/bin\/env\s+/],

  // Copyright and license
  copyright: [
    /Copyright\s+\(c\)/i,
    /Copyright\s+\d{4}/i,
    /SPDX-License-Identifier:/i,
    /MIT License/i,
    /Apache License/i,
    /GPL License/i,
    /BSD License/i,
  ],

  // File headers
  fileHeader: [
    /^\s*File:\s+.*\.md/i,
    /^\s*Author:/i,
    /^\s*Date:\s*\d{4}-\d{2}-\d{2}/i,
    /^\s*Created:/i,
    /^\s*Modified:/i,
  ],

  // Doxygen/JSDoc/Sphinx
  documentation: [
    /^\s*\/\*\*[\s\S]*?\*\//, // JSDoc block
    /^\s*\/\*\*[\s\S]*?@param/i, // JSDoc with @param
    /^\s*\/\*\*[\s\S]*?@return/i, // JSDoc with @return
    /^\s*\/\/\/[\s\S]*?@brief/i, // Doxygen brief
    /^\s*\/\/\/[\s\S]*?@param/i, // Doxygen param
    /^\s*\/\*\*[\s\S]*?@brief/i, // Doxygen C comment
    /^\s*#\s+@param/i, // Sphinx Python
    /^\s*#\s+@return/i, // Sphinx Python
    /^\s*#\s+@type/i, // Sphinx Python
  ],

  // Inline documentation
  inlineDocs: [
    /^\s*\/\/\s*[A-Z]/, // Capitalized comment likely documentation
    /^\s*#\s*[A-Z]/, // Python capital comment
  ],

  // Import statements
  imports: [/^\s*import\s+/, /^\s*require\s*\(/, /^\s*#\s*include\s+/, /^\s*using\s+namespace/],
}

export const LANGUAGE_COMMENT_DELIMITERS = {
  javascript: {
    single: ['//'],
    multi: ['/*', '*/'],
    shebang: ['#!/usr/bin/env node', '#!/usr/bin/nodejs'],
  },
  typescript: {
    single: ['//'],
    multi: ['/*', '*/'],
    shebang: ['#!/usr/bin/env node', '#!/usr/bin/ts-node'],
  },
  python: {
    single: ['#'],
    multi: ['"""', '"""'],
    shebang: ['#!/usr/bin/env python3', '#!/usr/bin/python3'],
  },
  rust: {
    single: ['//'],
    multi: ['/*', '*/'],
    shebang: ['#!/usr/bin/env rust-script'],
  },
  go: {
    single: ['//'],
    multi: ['/*', '*/'],
  },
  java: {
    single: ['//'],
    multi: ['/*', '*/'],
  },
  cpp: {
    single: ['//'],
    multi: ['/*', '*/'],
  },
  csharp: {
    single: ['//'],
    multi: ['/*', '*/'],
  },
  ruby: {
    single: ['#'],
    multi: ['=begin', '=end'],
  },
  php: {
    single: ['//', '#'],
    multi: ['/*', '*/'],
    shebang: ['#!/usr/bin/env php'],
  },
  swift: {
    single: ['//'],
    multi: ['/*', '*/'],
  },
  kotlin: {
    single: ['//'],
    multi: ['/*', '*/'],
  },
  scala: {
    single: ['//'],
    multi: ['/*', '*/'],
  },
  shell: {
    single: ['#'],
    multi: ["<<'", "'"],
    shebang: ['#!/bin/bash', '#!/bin/sh', '#!/usr/bin/env bash'],
  },
  powershell: {
    single: ['#'],
    multi: ['<#', '#>'],
    shebang: ['#!/usr/bin/env pwsh'],
  },
  lua: {
    single: ['--'],
    multi: ['--[[', ']]'],
  },
  sql: {
    single: ['--'],
    multi: ['/*', '*/'],
  },
  html: {
    multi: ['<!--', '-->'],
  },
  css: {
    multi: ['/*', '*/'],
  },
  yaml: {
    single: ['#'],
  },
  toml: {
    single: ['#'],
  },
  json: {
    none: [],
  },
  xml: {
    multi: ['<!--', '-->'],
  },
  r: {
    single: ['#'],
  },
  matlab: {
    single: ['%'],
    multi: ['%{', '%}'],
  },
  fortran: {
    single: ['!'],
    multi: ['/*', '*/'],
  },
  cobol: {
    single: ['*'],
  },
  assembly: {
    single: [';'],
  },
}

export function getLanguageFromFile(filename: string): string | null {
  const ext = filename.split('.').pop()?.toLowerCase()
  const langMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    cpp: 'cpp',
    cxx: 'cpp',
    cc: 'cpp',
    c: 'cpp',
    cs: 'csharp',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    fish: 'shell',
    ps1: 'powershell',
    psm1: 'powershell',
    lua: 'lua',
    sql: 'sql',
    html: 'html',
    css: 'css',
    scss: 'css',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    json: 'json',
    xml: 'xml',
    r: 'r',
    m: 'matlab',
    f: 'fortran',
    f90: 'fortran',
    f95: 'fortran',
    cbl: 'cobol',
    cob: 'cobol',
    asm: 'assembly',
    s: 'assembly',
  }
  return ext ? (langMap[ext] ?? null) : null
}
