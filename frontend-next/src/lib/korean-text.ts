export function hasKoreanText(text: string | null | undefined) {
  return /[\u3131-\u318E\uAC00-\uD7A3]/.test(text ?? '');
}

export function shouldLoadKoreanText(text: string | null | undefined) {
  return Boolean(text?.trim()) && !hasKoreanText(text);
}
