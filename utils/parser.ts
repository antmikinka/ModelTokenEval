import { ParsedFile } from '../types';

/**
 * Approximates token count based on character length.
 * Fallback if explicit stats are missing.
 */
const estimateTokens = (text: string): number => {
  if (!text) return 0;
  return Math.ceil(text.trim().length / 4);
};

/**
 * Extract a clean version string from a filename or label.
 * e.g., "prompt_v4.1.txt" -> "v4.1"
 * "ucl_v1" -> "v1"
 * "baseline" -> "baseline"
 */
const extractVersion = (input: string): string => {
  const versionMatch = input.match(/_?v(\d+(\.\d+)?)/i);
  if (versionMatch) {
    return `v${versionMatch[1]}`;
  }
  // Fallback: return the input if it looks like a label (e.g. "baseline", "control")
  // Clean up extensions if present
  return input.replace(/\.txt$/, '').replace(/^prompt_/, '');
};

const parseCSV = (content: string): ParsedFile[] => {
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const results: ParsedFile[] = [];

  // Helper to get index of column
  const getIdx = (key: string) => headers.indexOf(key);
  
  const idxModel = getIdx('model');
  const idxLabel = getIdx('prompt_label');
  const idxIteration = getIdx('iteration');
  const idxMode = getIdx('input_mode');
  const idxPromptTokens = getIdx('prompt_tokens');
  const idxCompTokens = getIdx('completion_tokens');
  const idxReasTokens = getIdx('reasoning_tokens');
  const idxDuration = getIdx('duration_seconds');
  const idxValidJson = getIdx('is_valid_json');

  if (idxModel === -1) return []; // Invalid CSV for our purpose

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (cols.length < headers.length) continue;

    const modelName = cols[idxModel];
    const promptLabel = idxLabel > -1 ? cols[idxLabel] : 'Unknown';
    const iteration = idxIteration > -1 ? parseInt(cols[idxIteration], 10) : 1;
    const inputMode = idxMode > -1 ? cols[idxMode] : 'text';
    const promptTokens = idxPromptTokens > -1 ? (parseInt(cols[idxPromptTokens], 10) || 0) : 0;
    const responseTokens = idxCompTokens > -1 ? (parseInt(cols[idxCompTokens], 10) || 0) : 0;
    const thinkingTokens = idxReasTokens > -1 ? (parseInt(cols[idxReasTokens], 10) || 0) : 0;
    const duration = idxDuration > -1 ? (parseFloat(cols[idxDuration]) || 0) : 0;
    
    // Python bools "True"/"False" handling
    const rawValidJson = idxValidJson > -1 ? cols[idxValidJson].toLowerCase() : 'true';
    const isValidJson = rawValidJson === 'true';

    results.push({
      fileName: `csv-row-${i}`,
      modelName,
      promptVersion: extractVersion(promptLabel),
      iteration,
      inputMode,
      duration,
      promptTokens,
      thinkingTokens,
      responseTokens,
      totalTokens: promptTokens + responseTokens, // Note: total usually includes thinking if thinking is part of completion
      isValidJson,
      hasThinking: thinkingTokens > 0,
      content: JSON.stringify(Object.fromEntries(headers.map((h, k) => [h, cols[k]])), null, 2)
    });
  }

  return results;
};

export const parseContent = (fileName: string, content: string): ParsedFile | null => {
  // Strategy 0: CSV File
  if (fileName.endsWith('.csv')) {
    // This function is designed to return one file, but CSV contains many. 
    // We might need to handle this upstream or return an array.
    // For now, if we detect CSV structure in text content (comma separated headers), we treat as CSV.
    // However, the signature returns `ParsedFile | null`. 
    // We will throw or return null here and handle CSV in the Dropzone specially, 
    // OR we modify this function signature. 
    // Let's modify the signature in `types.ts` is hard, let's keep it simple: 
    // If it's CSV, we only parse the *first* row? No, that's bad.
    // We will rely on Dropzone calling a specific `parseCSV` if extension matches.
    // If we land here with a single file expected, we fail.
    return null;
  }

  // Strategy 1: Try Parsing as JSON
  try {
    const json = JSON.parse(content);
    if (json.model && json.usage) {
      const modelName = json.model;
      const promptVersion = extractVersion(json.prompt_file || fileName);

      const thinkingTokens = json.usage.reasoning_tokens || 0;
      const responseTokens = json.usage.completion_tokens || 0;
      const promptTokens = json.usage.prompt_tokens || 0;
      const totalTokens = json.usage.total_tokens || (promptTokens + thinkingTokens + responseTokens);
      
      return {
        fileName,
        modelName,
        promptVersion,
        iteration: json.iteration || 1,
        inputMode: json.input_mode || 'text',
        duration: json.usage.duration_seconds || 0,
        promptTokens,
        thinkingTokens,
        responseTokens,
        totalTokens,
        isValidJson: json.is_valid_json ?? true,
        hasThinking: thinkingTokens > 0,
        content: JSON.stringify(json, null, 2)
      };
    }
  } catch (e) {
    // Not JSON
  }

  // Strategy 2: Text File Parsing
  try {
    const modelMatch = content.match(/=== MODEL: (.*?) ===/);
    const modelName = modelMatch ? modelMatch[1].trim() : 'Unknown Model';

    const promptLineMatch = content.match(/=== PROMPT FILE: (.*?) ===/);
    const iterationMatch = content.match(/=== ITERATION: (\d+) ===/);
    const inputModeMatch = content.match(/=== INPUT MODE: (.*?) ===/);

    const promptVersion = extractVersion(promptLineMatch ? promptLineMatch[1] : fileName);
    const iteration = iterationMatch ? parseInt(iterationMatch[1], 10) : 1;
    const inputMode = inputModeMatch ? inputModeMatch[1].trim() : 'text';

    const statsPromptMatch = content.match(/Prompt:\s*(\d+)/);
    const statsCompletionMatch = content.match(/Completion:\s*(\d+)/);
    const statsReasoningMatch = content.match(/Reasoning Tokens:\s*(\d+)/);
    const statsDurationMatch = content.match(/Duration:\s*([\d.]+)s/);
    const isValidJsonMatch = content.match(/JSON Valid:\s*(True|False)/i);

    let thinkingTokens = 0;
    let responseTokens = 0;
    let promptTokens = 0;
    let duration = 0;
    let isValidJson = true;

    // Fallback extraction
    const thinkingSplit = content.split(/=== REASONING \/ THINKING TOKENS ===/);
    const responseSplit = content.split(/=== FINAL RESPONSE ===/);
    
    let rawThinkingText = '';
    let rawResponseText = '';

    if (thinkingSplit.length > 1) {
      const partAfterThinking = thinkingSplit[1];
      const endOfThinkingIndex = partAfterThinking.indexOf('=== FINAL RESPONSE ===');
      if (endOfThinkingIndex !== -1) {
        rawThinkingText = partAfterThinking.substring(0, endOfThinkingIndex);
      } else {
        rawThinkingText = partAfterThinking;
      }
    }

    if (responseSplit.length > 1) {
      rawResponseText = responseSplit[1].split('=== STATS ===')[0];
    }

    if (statsCompletionMatch) {
      responseTokens = parseInt(statsCompletionMatch[1], 10);
    } else {
      responseTokens = estimateTokens(rawResponseText);
    }

    if (statsReasoningMatch) {
      thinkingTokens = parseInt(statsReasoningMatch[1], 10);
    } else {
      thinkingTokens = estimateTokens(rawThinkingText);
    }

    if (statsPromptMatch) {
      promptTokens = parseInt(statsPromptMatch[1], 10);
    }

    if (statsDurationMatch) {
      duration = parseFloat(statsDurationMatch[1]);
    }

    if (isValidJsonMatch) {
      isValidJson = isValidJsonMatch[1].toLowerCase() === 'true';
    }

    const hasThinking = thinkingTokens > 0;
    const totalTokens = promptTokens + thinkingTokens + responseTokens;

    return {
      fileName,
      modelName,
      promptVersion,
      iteration,
      inputMode,
      duration,
      promptTokens,
      thinkingTokens,
      responseTokens,
      totalTokens,
      isValidJson,
      hasThinking,
      content
    };

  } catch (e) {
    console.error(`Failed to parse file ${fileName}`, e);
    return null;
  }
};

export { parseCSV };