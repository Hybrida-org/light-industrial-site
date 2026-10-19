// Replaces the Tailwind Play CDN. Default theme, same as the CDN had. Rebuild: docs/build-tailwind.md
module.exports = {
  content: ['./*.html', './*/*.html', './*.js', './*/*.js', '!./worker/**', '!./preview/**', '!./node_modules/**'],
};
