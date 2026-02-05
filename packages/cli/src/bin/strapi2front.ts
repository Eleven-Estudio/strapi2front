import { Command } from 'commander';
import pc from 'picocolors';
import { initCommand } from '../commands/init.js';
import { syncCommand } from '../commands/sync.js';

const program = new Command();

// ASCII Art Logo
const logo = `
     _                   _ ___   __                 _
 ___| |_ _ __ __ _ _ __ (_)__ \\ / _|_ __ ___  _ __ | |_
/ __| __| '__/ _\` | '_ \\| | / /| |_| '__/ _ \\| '_ \\| __|
\\__ \\ |_| | | (_| | |_) | ||_| |  _| | | (_) | | | | |_
|___/\\__|_|  \\__,_| .__/|_|(_) |_| |_|  \\___/|_| |_|\\__|
                  |_|
`;

program
  .name('strapi2front')
  .description('Generate TypeScript types, services, and framework actions from your Strapi schema')
  .version('0.1.0')
  .addHelpText('beforeAll', pc.cyan(logo));

// Init command
program
  .command('init')
  .description('Initialize strapi2front in your project')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .option('--url <url>', 'Strapi URL')
  .option('--token <token>', 'Strapi API token')
  .option('--framework <framework>', 'Framework to use (astro)')
  .action(initCommand);

// Sync command
program
  .command('sync')
  .description('Sync types, schemas, services, actions, and upload helpers from Strapi schema')
  .option('-f, --force', 'Force regeneration of all files')
  .option('--types-only', 'Only generate types')
  .option('--services-only', 'Only generate services')
  .option('--actions-only', 'Only generate actions')
  .option('--schemas-only', 'Only generate Zod validation schemas')
  .option('--upload-only', 'Only generate upload helpers')
  .action(syncCommand);

// If no command is provided, run init by default
const args = process.argv.slice(2);
const commands = ['init', 'sync', 'help', '--help', '-h', '--version', '-V'];
const hasCommand = args.some((arg) => commands.includes(arg));

if (args.length === 0 || !hasCommand) {
  // Show logo and run init
  console.log(pc.cyan(logo));
  initCommand({});
} else {
  // Parse args normally
  program.parse();
}
