const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

function createSandbox(html = '<!DOCTYPE html><html><body></body></html>') {
  const dom = new JSDOM(html);
  const sandboxGlobals = {
    window: dom.window,
    document: dom.window.document,
    Node: dom.window.Node,
    NodeFilter: dom.window.NodeFilter,
    Text: dom.window.Text,
    Element: dom.window.Element,
    console,
    chrome: {
      runtime: { onMessage: { addListener: () => {} } },
      storage: {
        sync: {
          get: (_keys, callback) => callback({}),
          set: () => {},
        },
        onChanged: { addListener: () => {} },
      },
    },
  };

  sandboxGlobals.self = sandboxGlobals.window;
  sandboxGlobals.window.console = console;

  const context = vm.createContext(sandboxGlobals);
  ['wordbook.js', 'grammar_engine.js', 'dist/content.js'].forEach(file => {
    const code = fs.readFileSync(path.join(__dirname, file), 'utf-8');
    vm.runInContext(code, context);
  });

  return { context: sandboxGlobals, dom };
}

const baseSandbox = createSandbox();
const {
  translateToAnglish,
  matchCase,
  transformText,
  singulariseThenPluralise,
  pluralise,
  presentContinuous,
  applyAnglishTranslation,
  revertAnglishTranslation,
  wordbook,
} = baseSandbox.context;

const governmentAnglish = wordbook['government'];
const technologyAnglish = wordbook['technology'];
const policyAnglish = wordbook['policy'];
const multiPhraseAnglish = wordbook['a cappella'];

describe('matchCase Function', () => {
  test('preserves lowercase', () => {
    expect(matchCase('hello', 'world')).toBe('world');
  });

  test('capitalizes single word', () => {
    expect(matchCase('Hello', 'world')).toBe('World');
  });

  test('preserves uppercase words', () => {
    expect(matchCase('HELLO', 'world')).toBe('WORLD');
  });

  test('handles empty originals', () => {
    expect(matchCase('', 'world')).toBe('world');
  });
});

describe('translateToAnglish', () => {
  test('translates single word', () => {
    expect(translateToAnglish('government')).toBe(governmentAnglish);
  });

  test('preserves capitalization', () => {
    expect(translateToAnglish('Government')).toBe(matchCase('Government', governmentAnglish));
  });

  test('handles sentences', () => {
    const result = translateToAnglish('The government uses technology.');
    expect(result).toContain(governmentAnglish);
    expect(result).toContain(technologyAnglish);
    const periodCount = (result.match(/\./g) || []).length;
    expect(periodCount).toBe(1);
  });

  test('preserves complex punctuation', () => {
    const result = translateToAnglish('Hello... world?!');
    expect((result.match(/\./g) || []).length).toBe(3);
    expect(result).toContain('?!');
  });

  test('handles multi-word phrases', () => {
    expect(translateToAnglish('a cappella')).toBe(multiPhraseAnglish);
  });

  test('leaves unknown words untouched', () => {
    expect(translateToAnglish('xyzabc')).toBe('xyzabc');
  });
});

describe('Spelling Reform', () => {
  test('reforms "through" to "thru"', () => {
    expect(transformText('through')).toBe('thru');
  });

  test('reforms multiple words in sentence', () => {
    const result = transformText('I thought through the rough night');
    expect(result).toContain('thot');
    expect(result).toContain('thru');
    expect(result).toContain('ruff');
  });
});

describe('Grammar Engine', () => {
  test('converts plural forms', () => {
    expect(singulariseThenPluralise('governments')).toBe('oversights');
  });

  test('pluralizes simple word', () => {
    expect(pluralise('folkdom')).toBe('folkdoms');
  });

  test('pluralizes -y endings', () => {
    expect(pluralise('city')).toBe('cities');
  });

  test('handles present continuous', () => {
    expect(presentContinuous('using')).toBe('brooking');
  });
});

describe('DOM Integration', () => {
  test('translates and reverts plain paragraph', () => {
    const { context } = createSandbox('<p id="t">The government policy works.</p>');
    context.applyAnglishTranslation();
    const translated = context.document.getElementById('t').textContent;
    expect(translated.toLowerCase()).toContain(governmentAnglish);
    expect(translated.toLowerCase()).toContain(policyAnglish);
    context.revertAnglishTranslation();
    const reverted = context.document.getElementById('t').textContent;
    expect(reverted).toBe('The government policy works.');
  });

  test('translates and reverts hyperlink text', () => {
    const { context } = createSandbox('<p>Visit <a id="link" href="#">Government policy</a> today.</p>');
    context.applyAnglishTranslation();
    const linkAfter = context.document.getElementById('link').textContent;
    expect(linkAfter.toLowerCase()).toContain(governmentAnglish);
    expect(linkAfter.toLowerCase()).toContain(policyAnglish);
    context.revertAnglishTranslation();
    const linkOriginal = context.document.getElementById('link').textContent;
    expect(linkOriginal).toBe('Government policy');
  });

  test('does not duplicate punctuation in DOM nodes', () => {
    const { context } = createSandbox('<p id="p">Hello, world.</p>');
    context.applyAnglishTranslation();
    const after = context.document.getElementById('p').textContent;
    expect((after.match(/,/g) || []).length).toBe(1);
    expect((after.match(/\./g) || []).length).toBe(1);
    context.revertAnglishTranslation();
    expect(context.document.getElementById('p').textContent).toBe('Hello, world.');
  });

  test('highlights replaced words in spelling reform', () => {
    const { context } = createSandbox('<p id="p">I thought through the rough night.</p>');
    context.applySpellingReform();
    const after = context.document.getElementById('p');
    const highlights = after.querySelectorAll('.spelling-reform-highlight');
    expect(highlights.length).toBeGreaterThan(0);
    context.revertSpellingReform();
  });

  test('highlights work safely inside hyperlinks', () => {
    const { context } = createSandbox('<p>Visit <a id="link" href="https://example.com">through the rough night</a> today.</p>');
    context.applySpellingReform();
    const link = context.document.getElementById('link');
    const highlights = link.querySelectorAll('.spelling-reform-highlight');
    expect(highlights.length).toBeGreaterThan(0);
    // Verify link still has href attribute
    expect(link.getAttribute('href')).toBe('https://example.com');
    // Verify link text contains replaced words
    expect(link.textContent.toLowerCase()).toContain('thru');
    expect(link.textContent.toLowerCase()).toContain('ruff');
    // Revert and verify original text is restored
    context.revertSpellingReform();
    expect(link.textContent).toBe('through the rough night');
    expect(link.getAttribute('href')).toBe('https://example.com');
  });

  test('preserves hyperlink functionality with spelling reform highlights', () => {
    const { context } = createSandbox('<p>Click <a id="link" href="#test">through here</a> to continue.</p>');
    context.applySpellingReform();
    const link = context.document.getElementById('link');
    expect(link.getAttribute('href')).toBe('#test');
    expect(link.tagName).toBe('A');
    // Check that the link contains highlighted text
    const highlights = link.querySelectorAll('.spelling-reform-highlight');
    expect(highlights.length).toBeGreaterThan(0);
    // Verify link text was transformed
    expect(link.textContent.toLowerCase()).toContain('thru');
    context.revertSpellingReform();
    expect(link.textContent).toBe('through here');
    expect(link.getAttribute('href')).toBe('#test');
  });

  test('handles mode switching without truncation', () => {
    // Simulate: Anglish > Enable > Spelling > Anglish > Disable
    const { context } = createSandbox('<p id="p">The government thought through the rough policy.</p>');
    
    // Step 1: Apply Anglish
    context.applyAnglishTranslation();
    const afterAnglish = context.document.getElementById('p').textContent;
    expect(afterAnglish.toLowerCase()).toContain('oversight'); // government -> oversight
    
    // Step 2: Revert Anglish and apply Spelling
    context.revertAnglishTranslation();
    context.applySpellingReform();
    const afterSpelling = context.document.getElementById('p').textContent;
    expect(afterSpelling.toLowerCase()).toContain('thot'); // thought -> thot
    expect(afterSpelling.toLowerCase()).toContain('thru'); // through -> thru
    expect(afterSpelling.toLowerCase()).toContain('ruff'); // rough -> ruff
    
    // Step 3: Revert Spelling and apply Anglish again
    context.revertSpellingReform();
    context.applyAnglishTranslation();
    const afterAnglishAgain = context.document.getElementById('p').textContent;
    expect(afterAnglishAgain.toLowerCase()).toContain('oversight');
    
    // Step 4: Revert Anglish (Disable)
    context.revertAnglishTranslation();
    const final = context.document.getElementById('p').textContent;
    // Should restore to original
    expect(final).toBe('The government thought through the rough policy.');
  });

  test('preserves DOM structure with multiple text nodes when switching modes', () => {
    const { context } = createSandbox('<p id="p">Hello <a href="#test">through</a> world.</p>');
    const originalHTML = context.document.getElementById('p').innerHTML;
    
    // Apply spelling reform (should modify "Hello" and "world")
    context.applySpellingReform();
    const afterSpelling = context.document.getElementById('p');
    expect(afterSpelling.querySelector('a')).not.toBeNull();
    expect(afterSpelling.querySelector('a').getAttribute('href')).toBe('#test');
    
    // Revert spelling reform
    context.revertSpellingReform();
    const afterRevert = context.document.getElementById('p').innerHTML;
    // Should restore original structure
    expect(afterRevert).toBe(originalHTML);
  });
});

describe('Edge Cases', () => {
  test('handles empty string', () => {
    expect(translateToAnglish('')).toBe('');
  });

  test('preserves numbers', () => {
    const result = translateToAnglish('The government has 123 plans');
    expect(result).toContain('123');
  });

  test('handles punctuation-only tokens', () => {
    expect(translateToAnglish('...')).toBe('...');
  });
});
