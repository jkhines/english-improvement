const spellingReforms = {
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

function matchCase(original, replacement) {
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

function shouldSkipNode(node) {
  if (!node.parentElement) return true;
  
  const tagName = node.parentElement.tagName;
  const skipTags = ['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'INPUT', 'NOSCRIPT', 'IFRAME'];
  
  if (skipTags.includes(tagName)) return true;
  
  let element = node.parentElement;
  while (element) {
    if (element.tagName === 'CODE' || element.tagName === 'PRE') return true;
    if (element.getAttribute('contenteditable') === 'true') return true;
    element = element.parentElement;
  }
  
  return false;
}

function transformText(text) {
  let transformed = text;
  
  for (const [original, replacement] of Object.entries(spellingReforms)) {
    const regex = new RegExp(`\\b${original}\\b`, 'gi');
    transformed = transformed.replace(regex, (match) => matchCase(match, replacement));
  }
  
  return transformed;
}

const spellingOriginals = new WeakMap();
const anglishOriginals = new WeakMap();

function collectTextNodes(root = document.body) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  const nodes = [];
  let node;
  
  while (node = walker.nextNode()) {
    if (shouldSkipNode(node)) continue;
    if (node.textContent.trim().length === 0) continue;
    nodes.push(node);
  }
  
  return nodes;
}

function applySpellingReform(root = document.body) {
  const nodesToTransform = collectTextNodes(root);
  
  nodesToTransform.forEach(node => {
    const original = spellingOriginals.get(node) || node.textContent;
    const transformed = transformText(original);
    
    if (original !== transformed) {
      if (!spellingOriginals.has(node)) {
        spellingOriginals.set(node, original);
      }
      node.textContent = transformed;
    }
  });
}

function revertSpellingReform(root = document.body) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  while (node = walker.nextNode()) {
    if (spellingOriginals.has(node)) {
      node.textContent = spellingOriginals.get(node);
      spellingOriginals.delete(node);
    }
  }
}

// Anglish translation functions below are derived from the Anglish Translator project
// (https://github.com/Bark-fa/Anglish-Translator), which is licensed under MPL-2.0.
// These functions use wordbook.js and grammar_engine.js (both MPL-2.0).

// Verify wordbook is loaded
if (typeof wordbook !== 'undefined') {
  console.log('English Improvement: Wordbook loaded successfully with', Object.keys(wordbook).length, 'entries');
} else {
  console.error('English Improvement: Wordbook not loaded!');
}

function capitaliseFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const punctuationBoundaryRegex = /[ `!@#$%^&*,.;?~()'"“”‘’:-]/;

function splitWordWithPunctuation(word) {
  let core = word;
  let leading = '';
  let trailing = '';
  
  const leadingMatch = core.match(/^[ `!@#$%^&*,.;?~()'"“”‘’:-]+/);
  if (leadingMatch) {
    leading = leadingMatch[0];
    core = core.slice(leading.length);
  }
  
  const trailingMatch = core.match(/[ `!@#$%^&*,.;?~()'"“”‘’:-]+$/);
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

function translateToAnglish(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return text;
  }
  
  const rawTokens = text.match(/\S+|\s+/g);
  if (!rawTokens) return text;
  
  const wordEntries = [];
  const wordIndexMap = [];
  
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
  const clearWhitespaceBetween = (startRaw, endRaw) => {
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
    
    let replacement;
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

function applyAnglishTranslation(root = document.body) {
  if (typeof wordbook === 'undefined') {
    console.error('English Improvement: Cannot apply Anglish - wordbook not loaded');
    return;
  }
  
  const nodesToTransform = collectTextNodes(root);
  console.log('English Improvement: Processing', nodesToTransform.length, 'text nodes for Anglish translation');
  
  let transformedCount = 0;
  nodesToTransform.forEach(node => {
    const original = anglishOriginals.get(node) || node.textContent;
    const transformed = translateToAnglish(original);
    
    if (original !== transformed) {
      if (!anglishOriginals.has(node)) {
        anglishOriginals.set(node, original);
      }
      node.textContent = transformed;
      transformedCount++;
    }
  });
  
  console.log('English Improvement: Transformed', transformedCount, 'text nodes');
}

function revertAnglishTranslation(root = document.body) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  let reverted = 0;
  while (node = walker.nextNode()) {
    if (anglishOriginals.has(node)) {
      node.textContent = anglishOriginals.get(node);
      anglishOriginals.delete(node);
      reverted++;
    }
  }
  
  console.log('English Improvement: Reverted', reverted, 'Anglish text nodes');
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('English Improvement: Received message', request.action);
    
    if (request.action === 'applyReform') {
      applySpellingReform();
      console.log('English Improvement: Applied spelling reform');
      sendResponse({ success: true });
    } else if (request.action === 'revertReform') {
      revertSpellingReform();
      console.log('English Improvement: Reverted spelling reform');
      sendResponse({ success: true });
    } else if (request.action === 'applyAnglish') {
      console.log('English Improvement: Applying Anglish translation');
      applyAnglishTranslation();
      console.log('English Improvement: Applied Anglish translation');
      sendResponse({ success: true });
    } else if (request.action === 'revertAnglish') {
      console.log('English Improvement: Reverting Anglish translation');
      revertAnglishTranslation();
      console.log('English Improvement: Reverted Anglish translation');
      sendResponse({ success: true });
    }
    
    return true;
  });
}

