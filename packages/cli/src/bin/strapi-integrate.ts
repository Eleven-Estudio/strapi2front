import { Command } from 'commander';
import pc from 'picocolors';
import { initCommand } from '../commands/init.js';
import { syncCommand } from '../commands/sync.js';

const program = new Command();

// ASCII Art Logo
const logo = `
  _____ _                  _   _____       _                       _
 / ____| |                (_) |_   _|     | |                     | |
| (___ | |_ _ __ __ _ _ __ _    | |  _ __ | |_ ___  __ _ _ __ __ _| |_ ___
 \\___ \\| __| '__/ _\` | '_ \\| |   | | | '_ \\| __/ _ \\/ _\` | '__/ _\` | __/ _ \\
 ____) | |_| | | (_| | |_) | |  _| |_| | | | ||  __/ (_| | | | (_| | ||  __/
|_____/ \\__|_|  \\__,_| .__/|_| |_____|_| |_|\\__\\___|\\__, |_|  \\__,_|\\__\\___|
                     | |                             __/ |
                     |_|                            |___/
`;

program
  .name('strapi-integrate')
  .description('CLI for seamlessly integrating Strapi CMS with modern frontend frameworks')
  .version('0.1.0')
  .addHelpText('beforeAll', pc.cyan(logo));

// Init command
program
  .command('init')
  .description('Initialize strapi-integrate in your project')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .option('--url <url>', 'Strapi URL')
  .option('--token <token>', 'Strapi API token')
  .option('--framework <framework>', 'Framework to use (astro)')
  .action(initCommand);

// Sync command
program
  .command('sync')
  .description('Sync types, services, and actions from Strapi schema')
  .option('-f, --force', 'Force regeneration of all files')
  .option('--types-only', 'Only generate types')
  .option('--services-only', 'Only generate services')
  .option('--actions-only', 'Only generate actions')
  .option('--clean', 'Automatically remove orphaned files from previous structure')
  .action(syncCommand);

// Parse args
program.parse();
