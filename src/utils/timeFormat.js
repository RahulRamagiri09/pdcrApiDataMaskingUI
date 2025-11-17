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
 * - 3900 seconds → "1 hour 5 min"
 * - 7265 seconds → "2 hours 1 min 5 sec"
 */
export const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) {
    return '-';
  }

  const totalSeconds = Math.round(seconds);

  // Less than 60 seconds
  if (totalSeconds < 60) {
    return `${totalSeconds} sec`;
  }

  // Less than 1 hour (60-3599 seconds)
  if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;

    if (remainingSeconds === 0) {
      return `${minutes} min`;
    }

    return `${minutes} min ${remainingSeconds} sec`;
  }

  // 1 hour or more (3600+ seconds)
  const hours = Math.floor(totalSeconds / 3600);
  const remainingMinutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  const hourText = hours === 1 ? 'hour' : 'hours';
  let result = `${hours} ${hourText}`;

  if (remainingMinutes > 0) {
    result += ` ${remainingMinutes} min`;
  }

  if (remainingSeconds > 0) {
    result += ` ${remainingSeconds} sec`;
  }

  return result;
};
