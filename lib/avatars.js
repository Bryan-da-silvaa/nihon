/**
 * Génère un avatar SVG local pour éviter les dépendances externes.
 * Retourne une Data URL.
 */
export function getLocalAvatar(username) {
  if (!username) return "";
  
  const initial = username.charAt(0).toUpperCase();
  
  // Générer une couleur déterministe basée sur le nom
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', 
    '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'
  ];
  
  const color = colors[Math.abs(hash) % colors.length];
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="${color}" />
      <text x="50" y="50" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="50" font-weight="900" fill="white">${initial}</text>
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${typeof btoa !== 'undefined' ? btoa(svg) : Buffer.from(svg).toString('base64')}`;
}
