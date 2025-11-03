/**
 * Converts word numbers to digits (e.g., "four" -> "4", "twenty" -> "20")
 */
export function convertWordToNumber(word: string): string {
  const wordMap: { [key: string]: string } = {
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
    'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
    'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14',
    'fifteen': '15', 'sixteen': '16', 'seventeen': '17', 'eighteen': '18', 'nineteen': '19',
    'twenty': '20', 'thirty': '30', 'forty': '40', 'fifty': '50',
    'sixty': '60', 'seventy': '70', 'eighty': '80', 'ninety': '90',
    'hundred': '100'
  };
  
  const lower = word.toLowerCase().trim();
  
  // Direct match
  if (wordMap[lower]) return wordMap[lower];
  
  // Handle compound numbers like "twenty-five" or "twenty five"
  const parts = lower.split(/[\s-]+/);
  if (parts.length === 2 && wordMap[parts[0]] && wordMap[parts[1]]) {
    return (parseInt(wordMap[parts[0]]) + parseInt(wordMap[parts[1]])).toString();
  }
  
  // Return original if not a word number
  return word;
}
