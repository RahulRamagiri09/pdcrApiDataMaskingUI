/**
 * Format duration in seconds to a human-readable string
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 *
 * Examples:
 * - 50 seconds → "50 sec"
 * - 70 seconds → "1 min 10 sec"
 * - 125 seconds → "2 min 5 sec"
 * - 60 seconds → "1 min"
 */
export const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) {
    return '-';
  }

  const totalSeconds = Math.round(seconds);

  if (totalSeconds < 60) {
    return `${totalSeconds} sec`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${remainingSeconds} sec`;
};
