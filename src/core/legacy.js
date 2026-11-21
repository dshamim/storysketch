// One-time carry-over from the tool's former name (Crayon Poser): browser autosave and settings kept
// under "crayon-poser/…" are copied to "storysketch/…". Nothing is deleted, and an existing new key wins.
(() => {
  try {
    const OLD = 'crayon-poser/', NEW = 'storysketch/';
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(OLD) && localStorage.getItem(NEW + k.slice(OLD.length)) == null) localStorage.setItem(NEW + k.slice(OLD.length), localStorage.getItem(k));
    }
  } catch (e) { /* storage blocked: nothing to carry over */ }
})();
