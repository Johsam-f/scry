import type { Finding } from '../../types';

export function formatAsMarkdown(findings: Finding[], filesScanned: number, duration: number): string {
  let output = '# Scry Security Scan Report\n\n';
  
  // Summary section
  output += '## Summary\n\n';
  output += `- **Files Scanned:** ${filesScanned}\n`;
  output += `- **Duration:** ${duration}ms\n`;
  output += `- **Total Issues:** ${findings.length}\n`;
  
  const high = findings.filter((f) => f.severity === 'high').length;
  const medium = findings.filter((f) => f.severity === 'medium').length;
  const low = findings.filter((f) => f.severity === 'low').length;
  
  output += `- **High Severity:** ${high}\n`;
  output += `- **Medium Severity:** ${medium}\n`;
  output += `- **Low Severity:** ${low}\n\n`;
  
  if (findings.length === 0) {
    output += '✅ **No security issues found!**\n';
    return output;
  }
  
  // Findings by severity
  output += '## Findings\n\n';
  
  // Group findings by severity
  const groupedFindings = {
    high: findings.filter((f) => f.severity === 'high'),
    medium: findings.filter((f) => f.severity === 'medium'),
    low: findings.filter((f) => f.severity === 'low')
  };
  
  // High severity
  if (groupedFindings.high.length > 0) {
    output += '### 🔴 High Severity\n\n';
    output += formatFindingsTable(groupedFindings.high);
    output += '\n';
  }
  
  // Medium severity
  if (groupedFindings.medium.length > 0) {
    output += '### 🟡 Medium Severity\n\n';
    output += formatFindingsTable(groupedFindings.medium);
    output += '\n';
  }
  
  // Low severity
  if (groupedFindings.low.length > 0) {
    output += '### 🔵 Low Severity\n\n';
    output += formatFindingsTable(groupedFindings.low);
    output += '\n';
  }
  
  return output;
}

function formatFindingsTable(findings: Finding[]): string {
  let table = '| Rule | File | Line | Message |\n';
  table += '|------|------|------|--------|\n';
  
  for (const finding of findings) {
    // Escape backslashes first, then pipes to prevent incomplete sanitization
    const rule = finding.rule.replace(/\\/g, '\\\\').replace(/\|/g, '\\|');
    const file = finding.file.replace(/\\/g, '\\\\').replace(/\|/g, '\\|');
    const message = finding.message.replace(/\\/g, '\\\\').replace(/\|/g, '\\|');
    table += `| \`${rule}\` | ${file} | ${finding.line} | ${message} |\n`;
  }
  
  return table;
}

export function formatDetailedMarkdown(findings: Finding[], filesScanned: number = 0, duration: number = 0): string {
  let output = '# Scry Security Scan - Detailed Report\n\n';
  
  if (findings.length === 0) {
    output += '✅ **No security issues found!**\n';
    if (filesScanned > 0) {
      output += `\n**Files Scanned:** ${filesScanned}\n`;
    }
    if (duration > 0) {
      output += `**Duration:** ${duration.toFixed(2)}ms\n`;
    }
    return output;
  }
  
  output += `**Total Issues:** ${findings.length}\n`;
  if (filesScanned > 0) {
    output += `**Files Scanned:** ${filesScanned}\n`;
  }
  if (duration > 0) {
    output += `**Duration:** ${duration.toFixed(2)}ms\n`;
  }
  output += '\n';
  
  // Group by severity
  const groupedFindings = {
    high: findings.filter((f) => f.severity === 'high'),
    medium: findings.filter((f) => f.severity === 'medium'),
    low: findings.filter((f) => f.severity === 'low')
  };
  
  // Detailed findings by severity
  if (groupedFindings.high.length > 0) {
    output += '## 🔴 High Severity Issues\n\n';
    output += formatDetailedFindings(groupedFindings.high);
  }
  
  if (groupedFindings.medium.length > 0) {
    output += '## 🟡 Medium Severity Issues\n\n';
    output += formatDetailedFindings(groupedFindings.medium);
  }
  
  if (groupedFindings.low.length > 0) {
    output += '## 🔵 Low Severity Issues\n\n';
    output += formatDetailedFindings(groupedFindings.low);
  }
  
  return output;
}

function formatDetailedFindings(findings: Finding[]): string {
  let output = '';
  
  for (const finding of findings) {
    output += `### ${finding.rule}\n\n`;
    output += `**File:** \`${finding.file}:${finding.line}\`\n\n`;
    output += `**Message:** ${finding.message}\n\n`;
    
    if (finding.snippet) {
      output += '**Code:**\n```javascript\n';
      output += finding.snippet.trim() + '\n';
      output += '```\n\n';
    }
    
    if (finding.explanation) {
      output += '**Explanation:**\n';
      output += finding.explanation + '\n\n';
    }
    
    if (finding.fix) {
      output += '**Fix:**\n';
      output += finding.fix + '\n\n';
    }
    
    output += '---\n\n';
  }
  
  return output;
}
