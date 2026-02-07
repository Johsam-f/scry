/**
 * Environment File Exposure Rule
 * Detects .env files that may be exposed or committed to version control
 */

import { BaseRule } from './base';
import type { Finding } from '../types';

export class EnvExposureRule extends BaseRule {
  override id = 'env-exposure';
  override name = '.env File Exposure';
  override description = 'Detects potential .env file exposure risks';
  override severity: 'high' = 'high';
  override tags = ['security', 'secrets', 'configuration'];

  private patterns = [
    {
      name: 'Static .env serving',
      pattern: /(?:express\.static|serve-static|app\.use)\s*\([^)]*['".]env/gi,
      severity: 'critical' as const,
      message: '.env file potentially served as static content'
    },
    {
      name: '.env in public directory reference',
      pattern: /(?:public|static|dist|build)\/\.env/gi,
      severity: 'high' as const,
      message: '.env file referenced in public/static directory'
    },
    {
      name: 'Reading .env in client code',
      pattern: /(?:fetch|axios|http\.get|XMLHttpRequest)\s*\([^)]*['"`]\.env['"`]/gi,
      severity: 'high' as const,
      message: 'Attempting to fetch .env file from client-side code'
    },
    {
      name: '.env file path in code',
      pattern: /['"]\/?\.env(?:\.local|\.production|\.development)?['"]/gi,
      severity: 'low' as const,
      message: '.env file path reference in code (review context)'
    }
  ];

  override async check(content: string, filePath: string): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Check if file is .env itself
    if (filePath.includes('.env')) {
      findings.push({
        rule: this.id,
        severity: 'high',
        file: filePath,
        line: 1,
        column: 1,
        message: 'Environment file detected - ensure it\'s in .gitignore',
        snippet: '',
        explanation: `Environment files (.env, .env.local, .env.production) contain sensitive configuration and secrets. These files should:

1. **Never be committed to version control** - Add to .gitignore
2. **Never be deployed to production** - Use platform-specific secret management
3. **Never be served as static files** - Keep outside public directories
4. **Be kept local only** - Each environment should have its own .env

Committing .env files is one of the most common ways secrets are leaked. Even if you delete the file later, it remains in Git history.`,
        fix: `Protect your .env file:

1. Add to .gitignore:
   \`\`\`
   # .gitignore
   .env
   .env.local
   .env.*.local
   .env.production
   .env.development
   \`\`\`

2. If already committed, remove from Git history:
   \`\`\`bash
   # Remove from Git history (DANGEROUS - coordinate with team)
   git filter-branch --force --index-filter \\
     "git rm --cached --ignore-unmatch .env" \\
     --prune-empty --tag-name-filter cat -- --all
   
   # Or use BFG Repo-Cleaner (safer):
   bfg --delete-files .env
   \`\`\`

3. Use a .env.example template:
   \`\`\`
   # .env.example (safe to commit)
   DATABASE_URL=your_database_url_here
   API_KEY=your_api_key_here
   \`\`\`

4. For production, use:
   - Platform environment variables (Vercel, Netlify, Railway)
   - Secret managers (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)
   - CI/CD secret storage (GitHub Secrets, GitLab CI/CD Variables)`,
        tags: this.tags
      });
      return findings;
    }

    // Only check JavaScript/TypeScript files for dangerous patterns
    if (!/\.(js|ts|jsx|tsx|mjs|cjs)$/.test(filePath)) {
      return findings;
    }

    for (const patternConfig of this.patterns) {
      // Create a fresh regex instance to avoid state issues
      const pattern = this.createRegex(patternConfig.pattern);
      
      // Use timeout-protected execution for safety
      const matches = this.execWithTimeout(pattern, content);

      for (const match of matches) {
        // Skip if in comment using robust detection
        if (this.isInComment(content, match.index)) {
          continue;
        }

        const lineNumber = this.getLineNumber(content, match.index);

        // For low severity patterns, check context
        if (patternConfig.severity === 'low') {
          // Skip if it's just loading dotenv
          if (content.includes('dotenv') && content.substring(match.index - 50, match.index + 50).includes('dotenv')) {
            continue;
          }
        }

        findings.push(
          this.createFinding(
            patternConfig.message,
            content,
            filePath,
            lineNumber,
            this.getExplanation(patternConfig.name),
            this.getFix(patternConfig.name)
          )
        );
      }
    }

    return findings;
  }

  private getExplanation(patternName: string): string {
    switch (patternName) {
      case 'Static .env serving':
        return `Your application is configured to serve static files from a directory that may include .env files. This means:

- .env files could be downloaded by anyone via HTTP requests
- All secrets, API keys, and database credentials would be exposed
- Attackers can access http://yoursite.com/.env directly

This is a critical security vulnerability that must be fixed immediately.`;

      case '.env in public directory reference':
        return `.env files should never be placed in public, static, dist, or build directories because:

- These directories are served as static content
- Files can be accessed directly via URL
- Build processes may copy these files to production

Any secrets in a .env file in these locations are publicly accessible.`;

      case 'Reading .env in client code':
        return `Client-side code attempting to fetch a .env file is dangerous because:

- It implies .env might be accessible via HTTP
- Environment variables should be injected at build time, not fetched at runtime
- This exposes your secrets to anyone viewing the browser's network tab

Client-side code should never directly access .env files.`;

      case '.env file path in code':
        return `While referencing .env file paths is sometimes legitimate (e.g., loading with dotenv), it's important to review:

- Is this server-side code? (OK)
- Is this client-side code? (BAD)
- Is this serving the file? (BAD)
- Is this just loading config? (OK if server-side)

Ensure .env files are only accessed from server-side code and never exposed to clients.`;

      default:
        return 'Environment files contain sensitive secrets and should never be exposed or accessible via HTTP requests.';
    }
  }

  private getFix(patternName: string): string {
    switch (patternName) {
      case 'Static .env serving':
        return `Exclude .env files from static file serving:

// ❌ Insecure: May serve .env files
app.use(express.static('./'));
app.use(express.static(__dirname));

// ✅ Secure: Only serve specific public directory
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Secure: Explicitly exclude .env files
const serveStatic = require('serve-static');
app.use(serveStatic('public', {
  dotfiles: 'deny', // Deny access to dotfiles
  index: false
}));

// For nginx, add to config:
location ~ /\\.env {
  deny all;
  return 404;
}`;

      case '.env in public directory reference':
        return `Never place .env files in public directories:

1. Move .env to project root (not in public/static/dist):
   \`\`\`
   project/
   ├── .env          ✅ Root level
   ├── .gitignore
   ├── public/       ❌ Not here
   └── src/
   \`\`\`

2. Ensure build scripts don't copy .env:
   \`\`\`json
   // package.json
   {
     "scripts": {
       "build": "webpack --mode production",
       // Don't use: "cp .env dist/" ❌
     }
   }
   \`\`\`

3. Configure bundler to exclude .env:
   \`\`\`js
   // webpack.config.js
   module.exports = {
     plugins: [
       new webpack.EnvironmentPlugin(['API_KEY']), // Inject specific vars
       // Don't use CopyPlugin for .env ❌
     ]
   };
   \`\`\``;

      case 'Reading .env in client code':
        return `Never fetch .env from client-side code:

// ❌ Insecure: Client-side fetch
fetch('.env')
  .then(res => res.text())
  .then(data => console.log(data)); // NEVER DO THIS

// ✅ Secure: Use build-time environment variables
// Next.js example:
const apiKey = process.env.NEXT_PUBLIC_API_KEY;

// ✅ Secure: Create React App example:
const apiKey = process.env.REACT_APP_API_KEY;

// ✅ Secure: Vite example:
const apiKey = import.meta.env.VITE_API_KEY;

Note: Even with NEXT_PUBLIC_/REACT_APP_/VITE_ prefixes, these are exposed to clients.
Never use these prefixes for secrets. Only use for public configuration.

For secrets, call your API:
// Client calls your API
const data = await fetch('/api/data'); // API uses secret server-side`;

      case '.env file path in code':
        return `Ensure .env is only accessed server-side:

// ✅ Secure: Server-side only (Node.js)
require('dotenv').config();
const dbPassword = process.env.DB_PASSWORD;

// ✅ Secure: Specify path if needed
require('dotenv').config({ path: '.env.local' });

// ❌ Insecure: Never expose to client
// Don't bundle .env with client-side code
// Don't import .env in React/Vue components
// Don't read .env from browser

If you need environment values in frontend:
1. Use build-time injection (NEXT_PUBLIC_, REACT_APP_, VITE_)
2. Only for non-secret values
3. For secrets, fetch from your API (which reads .env server-side)`;

      default:
        return 'Ensure .env files are in .gitignore, kept in project root (not public directories), and only accessed from server-side code.';
    }
  }
}
