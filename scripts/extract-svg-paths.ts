import fs from 'fs';
import path from 'path';

function extractPaths(fileName: string) {
  const filePath = path.join(process.cwd(), 'public', fileName);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract stroke paths
  const strokePaths: string[] = [];
  const strokeRegex = /<path stroke="[^"]+"[^>]+d="([^"]+)"/g;
  let match;
  while ((match = strokeRegex.exec(content)) !== null) {
    if (match[1]) {
      strokePaths.push(match[1].trim().replace(/\s+/g, ' '));
    }
  }

  // Extract fill paths
  const fillPaths: string[] = [];
  const fillRegex = /<path fill="[^"]+" d="([^"]+)"/g;
  while ((match = fillRegex.exec(content)) !== null) {
    if (match[1]) {
      fillPaths.push(match[1].trim().replace(/\s+/g, ' '));
    }
  }

  return { strokePaths, fillPaths };
}

const roles = ['logo-admin.svg', 'logo-modo.svg', 'logo-rh.svg', 'logo-staff.svg', 'logo.svg'];
const data: Record<string, { strokePaths: string[]; fillPaths: string[] }> = {};

for (const role of roles) {
  const name = role.replace('.svg', '').replace('logo-', '').toUpperCase();
  const key = name === 'LOGO' ? 'DEFAULT' : name;
  data[key] = extractPaths(role);
}

fs.writeFileSync(
  path.join(process.cwd(), 'src/lib/role-paths.ts'),
  `export const RolePaths = ${JSON.stringify(data, null, 2)} as const;`
);

console.log('✅ Extracted paths to src/lib/role-paths.ts');
