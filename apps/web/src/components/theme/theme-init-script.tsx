/** Prevents theme flash; runs before React hydrates. */
export function ThemeInitScript () {
  const script = `
(function () {
  try {
    var storageKey = 'theme';
    var classList = document.documentElement.classList;
    var theme = localStorage.getItem(storageKey);
    if (theme === 'dark' || (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  } catch (e) {}
})();`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
