import { execSync } from 'child_process';

try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Prisma client generated successfully');
} catch (error) {
  console.error('Error generating Prisma client:', error);
  process.exit(1);
}
