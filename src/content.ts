/// <reference path="./types.d.ts" />

// Type definitions for spelling reforms
type SpellingReforms = Record<string, string>;

const spellingReforms: SpellingReforms = {
  // Rule 2A: through → thru
  'through': 'thru',
  'throughout': 'thruout',
  
  // Rule 2B: though/although → tho/altho
  'though': 'tho',
  'although': 'altho',
  
  // Rule 2C: -ought → -awt
  'thought': 'thot',
  'thoughts': 'thots',
  'thoughtful': 'thotful',
  'thoughtfully': 'thotfully',
  'thoughtfulness': 'thotfulness',
  'thoughtless': 'thotless',
  'thoughtlessly': 'thotlessly',
  'thoughtlessness': 'thotlessness',
  'brought': 'brot',
  'fought': 'fot',
  'bought': 'bot',
  'sought': 'sot',
  'taught': 'tot',
  'caught': 'cot',
  'wrought': 'rot',
  'nought': 'not',
  'ought': 'ot',
  'forethought': 'forethot',
  'afterthought': 'afterthot',
  'rethought': 'rethot',
  
  // Rule 2D: tough/rough/enough → tuff/ruff/enuff
  'tough': 'tuff',
  'tougher': 'tuffer',
  'toughest': 'tuffest',
  'toughness': 'tuffness',
  'toughen': 'tuffen',
  'toughened': 'tuffened',
  'toughening': 'tuffening',
  'rough': 'ruff',
  'rougher': 'ruffer',
  'roughest': 'ruffest',
  'roughly': 'ruffly',
  'roughness': 'ruffness',
  'roughen': 'ruffen',
  'roughened': 'ruffened',
  'roughening': 'ruffening',
  'enough': 'enuff',
  
  // Rule 2E: cough → coff
  'cough': 'coff',
  'coughs': 'coffs',
  'coughing': 'coffing',
  'coughed': 'coffed',
  
  // Rule 2F: dough/bough → doe/bow
  'dough': 'doe',
  'doughs': 'does',
  'bough': 'bow',
  'boughs': 'bows',
  
  // Rule 2G: thorough/borough → thoro/boro
  'thorough': 'thoro',
  'thoroughly': 'thoroly',
  'thoroughness': 'thoroness',
  'thoroughfare': 'thorofare',
  'thoroughfares': 'thorofares',
  'borough': 'boro',
  'boroughs': 'boros',
  
  // Rule 3A: great → grate
  'great': 'grate',
  'greatly': 'grately',
  'greatness': 'grateness',
  'greater': 'grater',
  'greatest': 'gratest',
  
  // Rule 3B: break → brake
  'break': 'brake',
  'breaking': 'braking',
  'breaks': 'brakes',
  'broken': 'braken',
  'breaker': 'braker',
  'breakers': 'brakers',
  'breakup': 'brakeup',
  'breakups': 'brakeups',
  'breakdown': 'brakedown',
  'breakdowns': 'brakedowns',
  'breakthrough': 'brakethru',
  'breakthroughs': 'brakethrus',
  'breakfast': 'brakefest',
  'breakfasts': 'brakefests',
  'breakaway': 'brakeaway',
  'breakaways': 'brakeaways',
  'unbreakable': 'unbrakeable',
  'breakage': 'brakage',
  'breakages': 'brakages',
  'breakpoint': 'brakepoint',
  'breakpoints': 'brakepoints',
  'outbreak': 'outbrake',
  'outbreaks': 'outbrakes',
  'daybreak': 'daybrake',
  'heartbreak': 'heartbrake',
  'heartbreaking': 'heartbraking',
  'heartbroken': 'heartbraken',
  'icebreaker': 'icebraker',
  'icebreakers': 'icebrakers',
  'windbreak': 'windbrake',
  'windbreaks': 'windbrakes',
  'jailbreak': 'jailbrake',
  'jailbreaks': 'jailbrakes',
  'tiebreaker': 'tiebraker',
  'tiebreakers': 'tiebrakers',
  
  // Rule 3C: steak → stake
  'steak': 'stake',
  'steaks': 'stakes'
};

function matchCase(original: string, replacement: string): string {
  if (!replacement) return replacement;
  if (!original) return replacement;
  
  if (original === original.toUpperCase() && original.length > 1) {
    return replacement.toUpperCase();
  }
  if (original[0] === original[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function shouldSkipNode(node: Node): boolean {
  if (!(node.parentElement instanceof Element)) return true;
  
  const tagName = node.parentElement.tagName;
  const skipTags = ['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'INPUT', 'NOSCRIPT', 'IFRAME'];
  
  if (skipTags.includes(tagName)) return true;
  
  let element: Element | null = node.parentElement;
  while (element) {
    if (element.tagName === 'CODE' || element.tagName === 'PRE') return true;
    if (element.getAttribute('contenteditable') === 'true') return true;
    element = element.parentElement;
  }
  
  return false;
}

function transformText(text: string): string {
  let transformed = text;
  
  for (const [original, replacement] of Object.entries(spellingReforms)) {
    const regex = new RegExp(`\\b${original}\\b`, 'gi');
    transformed = transformed.replace(regex, (match) => matchCase(match, replacement));
  }
  
  return transformed;
}

interface TextSegment {
  text: string;
  isReplaced: boolean;
  originalWord?: string;
}

function transformTextWithHighlights(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  
  // Find all matches with their positions
  const matches: Array<{ original: string; replacement: string; index: number; length: number; match: string }> = [];
  
  for (const [original, replacement] of Object.entries(spellingReforms)) {
    const regex = new RegExp(`\\b${original}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const startIndex = match.index;
      const endIndex = startIndex + match[0].length;
      
      // Check if this range overlaps with any already processed match
      let overlaps = false;
      for (const existing of matches) {
        if (!(endIndex <= existing.index || startIndex >= existing.index + existing.length)) {
          overlaps = true;
          break;
        }
      }
      
      if (!overlaps) {
        matches.push({
          original,
          replacement: matchCase(match[0], replacement),
          index: startIndex,
          length: match[0].length,
          match: match[0]
        });
      }
    }
  }
  
  // Sort matches by index
  matches.sort((a, b) => a.index - b.index);
  
  // Build segments
  let lastIndex = 0;
  for (const match of matches) {
    // Add text before match
    if (match.index > lastIndex) {
      segments.push({
        text: text.substring(lastIndex, match.index),
        isReplaced: false
      });
    }
    
    // Add replaced word
    segments.push({
      text: match.replacement,
      isReplaced: true,
      originalWord: match.match
    });
    
    lastIndex = match.index + match.length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      text: text.substring(lastIndex),
      isReplaced: false
    });
  }
  
  // If no matches, return original text as single segment
  if (segments.length === 0) {
    segments.push({ text, isReplaced: false });
  }
  
  return segments;
}

const spellingOriginals = new WeakMap<Text, string>();
const spellingReplacedNodes = new WeakMap<Node, { originalText: string; originalNode: Text }>(); // Maps replaced nodes (spans/text) to original
const anglishOriginals = new WeakMap<Text, string>();

function collectTextNodes(root: Node = document.body): Text[] {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT
  );
  
  const nodes: Text[] = [];
  let node: Node | null;
  
  while (node = walker.nextNode()) {
    if (!(node instanceof Text)) continue;
    if (shouldSkipNode(node)) continue;
    if (node.textContent.trim().length === 0) continue;
    nodes.push(node);
  }
  
  return nodes;
}

function injectHighlightStyles(): void {
  // Check if styles are already injected
  if (document.getElementById('spelling-reform-styles')) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = 'spelling-reform-styles';
  style.textContent = `
    .spelling-reform-highlight {
      background-color: #fff3cd;
      border-bottom: 2px solid #ffc107;
      padding: 1px 2px;
      border-radius: 2px;
    }
    /* Ensure highlights work inside links without breaking link functionality */
    a .spelling-reform-highlight {
      display: inline;
      text-decoration: inherit;
      color: inherit;
    }
    a:hover .spelling-reform-highlight,
    a:visited .spelling-reform-highlight,
    a:active .spelling-reform-highlight {
      background-color: #fff3cd;
      border-bottom-color: #ffc107;
    }
  `;
  document.head.appendChild(style);
}

function removeHighlightStyles(): void {
  const style = document.getElementById('spelling-reform-styles');
  if (style) {
    style.remove();
  }
}

function applySpellingReform(root: Node = document.body): void {
  injectHighlightStyles();
  
  const nodesToTransform = collectTextNodes(root);
  
  nodesToTransform.forEach(node => {
    const original = spellingOriginals.get(node) || node.textContent;
    const segments = transformTextWithHighlights(original);
    
    // Check if any segments are replaced
    const hasReplacements = segments.some(s => s.isReplaced);
    
    if (hasReplacements) {
      if (!spellingOriginals.has(node)) {
        spellingOriginals.set(node, original);
      }
      
      // Create document fragment with highlighted text
      const fragment = document.createDocumentFragment();
      
      segments.forEach(segment => {
        if (segment.isReplaced) {
          const span = document.createElement('span');
          span.className = 'spelling-reform-highlight';
          span.textContent = segment.text;
          span.setAttribute('data-original', segment.originalWord || '');
          fragment.appendChild(span);
        } else {
          fragment.appendChild(document.createTextNode(segment.text));
        }
      });
      
      // Replace the text node with the fragment
      const parent = node.parentNode;
      if (parent) {
        // Store mapping for each replaced node in the fragment
        const fragmentNodes: Node[] = [];
        for (let i = 0; i < fragment.childNodes.length; i++) {
          fragmentNodes.push(fragment.childNodes[i]);
        }
        
        parent.replaceChild(fragment, node);
        
        // Map each node in the fragment back to the original
        fragmentNodes.forEach(fragmentNode => {
          spellingReplacedNodes.set(fragmentNode, { originalText: original, originalNode: node });
        });
      }
    }
  });
}

function revertSpellingReform(root: Node = document.body): void {
  // Find all highlighted spans and text nodes that were part of replacements
  const searchRoot = root instanceof Element ? root : document.body;
  const highlightedSpans = searchRoot.querySelectorAll('.spelling-reform-highlight');
  const nodesToRevert = new Map<Node, { originalText: string; originalNode: Text }>();
  
  // Collect all nodes that need to be reverted
  highlightedSpans.forEach((span: Element) => {
    const originalData = spellingReplacedNodes.get(span);
    if (originalData) {
      nodesToRevert.set(span, originalData);
    }
  });
  
  // Also check text nodes that might be part of fragments
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT
  );
  
  let node: Node | null;
  while (node = walker.nextNode()) {
    if (!(node instanceof Text)) continue;
    // Check if this text node was part of a replacement
    const originalData = spellingReplacedNodes.get(node);
    if (originalData) {
      nodesToRevert.set(node, originalData);
    }
    // Also handle directly modified text nodes
    if (spellingOriginals.has(node)) {
      node.textContent = spellingOriginals.get(node)!;
      spellingOriginals.delete(node);
    }
  }
  
  // Group nodes by parent, then by original text
  const nodesByParent = new Map<Node, Map<string, Node[]>>();
  
  nodesToRevert.forEach((originalData, replacedNode) => {
    const parent = replacedNode.parentNode;
    if (!parent) return;
    
    if (!nodesByParent.has(parent)) {
      nodesByParent.set(parent, new Map());
    }
    const parentMap = nodesByParent.get(parent)!;
    const textKey = originalData.originalText;
    
    if (!parentMap.has(textKey)) {
      parentMap.set(textKey, []);
    }
    parentMap.get(textKey)!.push(replacedNode);
  });
  
  // Process each parent separately, in reverse order to avoid index shifting
  const parentsArray = Array.from(nodesByParent.keys());
  parentsArray.reverse();
  
  parentsArray.forEach(parent => {
    const parentMap = nodesByParent.get(parent)!;
    
    // Process each text group in reverse order
    const textKeys = Array.from(parentMap.keys()).reverse();
    
    textKeys.forEach(originalText => {
      const replacedNodes = parentMap.get(originalText)!;
      if (replacedNodes.length === 0) return;
      
      // Sort nodes by position (ascending)
      const childNodesArray = Array.from(parent.childNodes);
      const sortedNodes = replacedNodes.slice().sort((a, b) => {
        const aIndex = childNodesArray.indexOf(a as ChildNode);
        const bIndex = childNodesArray.indexOf(b as ChildNode);
        return aIndex - bIndex;
      });
      
      // Find the first node's position
      const firstNode = sortedNodes[0];
      const firstIndex = childNodesArray.indexOf(firstNode as ChildNode);
      
      if (firstIndex !== -1) {
        // Remove all nodes in this group
        sortedNodes.forEach(node => {
          if (node.parentNode === parent) {
            parent.removeChild(node);
            spellingReplacedNodes.delete(node);
          }
        });
        
        // Insert original text node at the position of the first replaced node
        const textNode = document.createTextNode(originalText);
        const remainingChildren = Array.from(parent.childNodes);
        if (firstIndex < remainingChildren.length) {
          parent.insertBefore(textNode, remainingChildren[firstIndex] as ChildNode);
        } else {
          parent.appendChild(textNode);
        }
        
        const originalData = nodesToRevert.get(firstNode);
        if (originalData) {
          spellingOriginals.delete(originalData.originalNode);
        }
      }
    });
  });
  
  // Remove highlight styles if no more highlights exist
  if (searchRoot.querySelectorAll('.spelling-reform-highlight').length === 0) {
    removeHighlightStyles();
  }
}

// Anglish translation functions below are derived from the Anglish Translator project
// (https://github.com/Bark-fa/Anglish-Translator), which is licensed under MPL-2.0.
// These functions use wordbook.js and grammar_engine.js (both MPL-2.0).

// Verify wordbook is loaded
if (typeof wordbook === 'undefined') {
  // Wordbook not loaded - translations will fail silently
}

function capitaliseFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const punctuationBoundaryRegex = /[ `!@#$%^&*,.;?~()'"""'':-]/;

interface WordToken {
  original: string;
  leading: string;
  trailing: string;
  core: string;
  lowerCore: string;
  rawIndex?: number;
  output?: string;
}

function splitWordWithPunctuation(word: string): WordToken {
  let core = word;
  let leading = '';
  let trailing = '';
  
  const leadingMatch = core.match(/^[ `!@#$%^&*,.;?~()'"""'':-]+/);
  if (leadingMatch) {
    leading = leadingMatch[0];
    core = core.slice(leading.length);
  }
  
  const trailingMatch = core.match(/[ `!@#$%^&*,.;?~()'"""'':-]+$/);
  if (trailingMatch) {
    trailing = trailingMatch[0];
    core = core.slice(0, core.length - trailing.length);
  }
  
  return {
    original: word,
    leading,
    trailing,
    core,
    lowerCore: core.toLowerCase()
  };
}

function translateToAnglish(text: string): string {
  if (typeof text !== 'string' || text.length === 0) {
    return text;
  }
  
  const rawTokens = text.match(/\S+|\s+/g);
  if (!rawTokens) return text;
  
  const wordEntries: WordToken[] = [];
  const wordIndexMap: number[] = [];
  
  rawTokens.forEach((token, idx) => {
    if (/^\s+$/.test(token)) return;
    const entry = splitWordWithPunctuation(token);
    entry.rawIndex = idx;
    entry.output = entry.core;
    entry.lowerCore = entry.core.toLowerCase();
    wordEntries.push(entry);
    wordIndexMap.push(idx);
  });
  
  const locked = new Array(wordEntries.length).fill(false);
  const clearWhitespaceBetween = (startRaw: number, endRaw: number): void => {
    for (let r = startRaw + 1; r < endRaw; r++) {
      if (/^\s+$/.test(rawTokens[r])) {
        rawTokens[r] = '';
      }
    }
  };
  
  for (let i = 0; i < wordEntries.length; i++) {
    if (locked[i]) continue;
    const current = wordEntries[i];
    const next = wordEntries[i + 1];
    const third = wordEntries[i + 2];
    
    if (next) {
      const twoKey = `${current.lowerCore} ${next.lowerCore}`;
      if (twoKey in wordbook) {
        current.output = matchCase(current.core, wordbook[twoKey]);
        const firstRaw = wordIndexMap[i];
        const secondRaw = wordIndexMap[i + 1];
        clearWhitespaceBetween(firstRaw, secondRaw);
        wordEntries[i + 1].output = '';
        locked[i + 1] = true;
        continue;
      }
    }
    
    if (next && third) {
      const threeKey = `${current.lowerCore} ${next.lowerCore} ${third.lowerCore}`;
      if (threeKey in wordbook) {
        current.output = matchCase(current.core, wordbook[threeKey]);
        const firstRaw = wordIndexMap[i];
        const secondRaw = wordIndexMap[i + 1];
        const thirdRaw = wordIndexMap[i + 2];
        clearWhitespaceBetween(firstRaw, secondRaw);
        clearWhitespaceBetween(secondRaw, thirdRaw);
        wordEntries[i + 1].output = '';
        wordEntries[i + 2].output = '';
        locked[i + 1] = true;
        locked[i + 2] = true;
        continue;
      }
    }
    
    let replacement: string | undefined;
    if (current.lowerCore in wordbook) {
      replacement = wordbook[current.lowerCore];
    } else {
      replacement = singulariseThenPluralise(current.lowerCore) ||
        toPresentTenseThenPastTense(current.lowerCore) ||
        presentContinuous(current.lowerCore);
    }
    
    if (replacement) {
      current.output = matchCase(current.core, replacement);
    }
  }
  
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  for (let i = 0; i < wordEntries.length; i++) {
    const entry = wordEntries[i];
    if (!entry.output) continue;
    const lower = entry.output.toLowerCase();
    if ((lower === 'a' || lower === 'an') && wordEntries[i + 1]) {
      const nextWord = wordEntries[i + 1].output || '';
      const normalized = nextWord.replace(/^[^a-zA-Z]+/, '');
      if (normalized) {
        const firstChar = normalized[0];
        if (firstChar && vowels.includes(firstChar.toLowerCase())) {
          entry.output = matchCase(entry.core, 'an');
        } else {
          entry.output = matchCase(entry.core, 'a');
        }
      }
    }
  }
  
  wordEntries.forEach((entry, idx) => {
    const rebuilt = `${entry.leading || ''}${entry.output || ''}${entry.trailing || ''}`;
    rawTokens[wordIndexMap[idx]] = rebuilt;
  });
  
  return rawTokens.join('');
}

function applyAnglishTranslation(root: Node = document.body): void {
  if (typeof wordbook === 'undefined') {
    return;
  }
  
  const nodesToTransform = collectTextNodes(root);
  
  nodesToTransform.forEach(node => {
    const original = anglishOriginals.get(node) || node.textContent;
    const transformed = translateToAnglish(original);
    
    if (original !== transformed) {
      if (!anglishOriginals.has(node)) {
        anglishOriginals.set(node, original);
      }
      node.textContent = transformed;
    }
  });
}

function revertAnglishTranslation(root: Node = document.body): void {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT
  );
  
  let node: Node | null;
  while (node = walker.nextNode()) {
    if (!(node instanceof Text)) continue;
    if (anglishOriginals.has(node)) {
      node.textContent = anglishOriginals.get(node)!;
      anglishOriginals.delete(node);
    }
  }
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((
    request: { action: string },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: { success: boolean }) => void
  ) => {
    if (request.action === 'applyReform') {
      applySpellingReform();
      sendResponse({ success: true });
    } else if (request.action === 'revertReform') {
      revertSpellingReform();
      sendResponse({ success: true });
    } else if (request.action === 'applyAnglish') {
      applyAnglishTranslation();
      sendResponse({ success: true });
    } else if (request.action === 'revertAnglish') {
      revertAnglishTranslation();
      sendResponse({ success: true });
    }
    
    return true;
  });
  
  // Check if extension is enabled on page load and apply automatically
  function applyOnLoad(): void {
    chrome.storage.sync.get(['extensionEnabled', 'selectedMode'], (result: { extensionEnabled?: boolean; selectedMode?: string }) => {
      const enabled = result.extensionEnabled || false;
      const mode = result.selectedMode || 'spelling';
      
      if (enabled) {
        // Small delay to ensure DOM is fully ready
        setTimeout(() => {
          if (mode === 'spelling') {
            applySpellingReform();
          } else if (mode === 'anglish') {
            applyAnglishTranslation();
          }
        }, 100);
      }
    });
  }
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyOnLoad);
  } else {
    // DOM already loaded
    applyOnLoad();
  }
  
  // Also listen for storage changes in case mode/enabled state changes after page load
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync') return;
    
    if (changes.extensionEnabled || changes.selectedMode) {
      applyOnLoad();
    }
  });
}

