// Type declarations for external JavaScript files

declare const wordbook: Record<string, string>;

declare function singulariseThenPluralise(word: string): string | undefined;
declare function pluralise(word: string): string | undefined;
declare function presentContinuous(word: string): string | undefined;
declare function toPresentTenseThenPastTense(word: string): string | undefined;
declare function toPastTense(word: string): string | undefined;
declare function isVowel(ch: string): boolean;

type Mode = 'spelling' | 'anglish';
type Action = 'applyReform' | 'revertReform' | 'applyAnglish' | 'revertAnglish';

interface StorageResult {
  selectedMode?: Mode;
  extensionEnabled?: boolean;
}

