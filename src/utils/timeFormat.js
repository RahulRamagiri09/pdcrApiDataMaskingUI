/**
 * Format duration in seconds to HH:MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string in HH:MM:SS format
 *
 * Examples:
 * - 50 seconds → "00:00:50"
 * - 70 seconds → "00:01:10"
 * - 125 seconds → "00:02:05"
 * - 60 seconds → "00:01:00"
 * - 3900 seconds → "01:05:00"
 * - 7265 seconds → "02:01:05"
 */
export const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) {
    return '-';
  }

  const totalSeconds = Math.round(seconds);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const hoursStr = String(hours).padStart(2, '0');
  const minutesStr = String(minutes).padStart(2, '0');
  const secsStr = String(secs).padStart(2, '0');

  return `${hoursStr}:${minutesStr}:${secsStr}`;
};
