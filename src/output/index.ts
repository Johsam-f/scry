import type { Finding, OutputFormat } from '../types';
import { formatAsTable, formatSummary } from './formatters/table';
import { formatAsJSON, formatDetailedJSON } from './formatters/json';
import { formatAsMarkdown, formatDetailedMarkdown } from './formatters/markdown';
import { formatAsCompact } from './formatters/compact';

export interface RenderOptions {
  format: OutputFormat;
  showSummary?: boolean;
  showExplanations?: boolean;
  showFixes?: boolean;
  detailed?: boolean;
}

export function render(findings: Finding[], filesScanned: number, duration: number, options: RenderOptions): string {
  const { format, showSummary = true, showExplanations = false, showFixes = false } = options;

  let output = '';

  switch (format) {
    case 'json':
      output = options.detailed ? formatDetailedJSON(findings) : formatAsJSON(findings, filesScanned, duration);
      break;

    case 'markdown':
      output = (showExplanations || showFixes) 
        ? formatDetailedMarkdown(findings, filesScanned, duration)
        : formatAsMarkdown(findings, filesScanned, duration);
      break;

    case 'compact':
      output = formatAsCompact(findings, filesScanned, duration);
      break;

    case 'table':
    default:
      output = formatAsTable(findings);
      if (showSummary) {
        output += formatSummary(findings, filesScanned, duration);
      }
      break;
  }

  // Add detailed information for table format if requested
  if (format === 'table' && (showExplanations || showFixes) && findings.length > 0) {
    output += formatDetails(findings, showExplanations, showFixes);
  }

  return output;
}

function formatDetails(findings: Finding[], showExplanations: boolean, showFixes: boolean): string {
  let output = '\n' + '='.repeat(45) + '\n';
  output += 'DETAILED FINDINGS\n';
  output += '='.repeat(45) + '\n\n';

  for (const finding of findings) {
    output += `[${finding.severity.toUpperCase()}] ${finding.rule}\n`;
    output += `File: ${finding.file}:${finding.line}\n`;
    output += `Message: ${finding.message}\n`;

    if (finding.snippet) {
      output += `Code: ${finding.snippet}\n`;
    }

    if (showExplanations && finding.explanation) {
      output += `\nWhy this matters:\n${finding.explanation}\n`;
    }

    if (showFixes && finding.fix) {
      output += `\nSuggested fix:\n${finding.fix}\n`;
    }

    output += '\n';
  }

  return output;
}
