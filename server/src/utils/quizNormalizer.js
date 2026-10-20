/**
 * Normalize text for fuzzy comparison of quiz answers
 * - Removes Vietnamese diacritics / accents
 * - Converts to lowercase
 * - Strips redundant whitespace
 */
export function normalizeAnswer(str) {
  if (!str) return '';
  return str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export function compareAnswers(userAnswer, correctAnswer) {
  return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
}
