#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for CommonJS modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

interface CreateOptions {
  template: 'basic' | 'api' | 'data';
  lang: 'typescript' | 'javascript';
  deploy?: 'railway' | 'vercel' | 'docker';
  author?: string;
  description?: string;
}

interface ProjectConfig {
  name: string;
  description: string;
  author: {
    name: string;
    email: string;
  };
  template: string;
  language: string;
  deployment: string[];
}

const TEMPLATES = {
  basic: {
    name: 'Basic MCP Server',
    description: 'Simple server with ping, echo, and datetime tools',
    tools: ['ping', 'echo', 'datetime']
  },
  api: {
    name: 'API Integration Server', 
    description: 'Server with external API tools and offline fallbacks',
    tools: ['ping', 'echo', 'catfact', 'weather']
  },
  data: {
    name: 'Data Processing Server',
    description: 'Server with file processing and data transformation tools', 
    tools: ['ping', 'echo', 'jsonparse', 'csvprocess']
  }
} as const;

async function main() {
  console.log(chalk.blue.bold('🚀 Create Commands MCP Server\n'));

  program
    .version('1.0.0')
    .description('Create a new MCP server for Commands.com')
    .argument('[name]', 'Project name')
    .option('-t, --template <type>', 'Template type', 'basic')
    .option('-l, --lang <language>', 'Language', 'typescript')
    .option('-d, --deploy <platform>', 'Deployment platform')
    .option('--author <name>', 'Author name')
    .option('--description <desc>', 'Project description')
    .parse();

  const options = program.opts<CreateOptions>();
  const args = program.args;

  let projectName = args[0];
  let config: ProjectConfig;

  if (!projectName || !options.template) {
    // Interactive mode
    config = await promptForConfig(projectName);
  } else {
    // Direct mode
    config = {
      name: projectName,
      description: options.description || `MCP server created with ${options.template} template`,
      author: {
        name: options.author || 'Your Name',
        email: 'your.email@example.com'
      },
      template: options.template,
      language: options.lang,
      deployment: options.deploy ? [options.deploy] : []
    };
  }

  await createProject(config);
}

async function promptForConfig(initialName?: string): Promise<ProjectConfig> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      default: initialName || 'my-mcp-server',
      validate: (input: string) => {
        if (!input.trim()) return 'Project name is required';
        if (!/^[a-z0-9-_]+$/.test(input)) return 'Use lowercase letters, numbers, hyphens, and underscores only';
        return true;
      }
    },
    {
      type: 'input', 
      name: 'description',
      message: 'Description:',
      default: 'My MCP server for Commands.com'
    },
    {
      type: 'input',
      name: 'authorName', 
      message: 'Author name:',
      default: 'Your Name'
    },
    {
      type: 'input',
      name: 'authorEmail',
      message: 'Author email:',
      default: 'your.email@example.com',
      validate: (input: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(input) || 'Please enter a valid email address';
      }
    },
    {
      type: 'list',
      name: 'template',
      message: 'Choose template:',
      choices: [
        { name: `${TEMPLATES.basic.name} - ${TEMPLATES.basic.description}`, value: 'basic' },
        { name: `${TEMPLATES.api.name} - ${TEMPLATES.api.description}`, value: 'api' },
        { name: `${TEMPLATES.data.name} - ${TEMPLATES.data.description}`, value: 'data' }
      ],
      default: 'basic'
    },
    {
      type: 'list',
      name: 'language',
      message: 'Language:',
      choices: [
        { name: 'TypeScript (recommended)', value: 'typescript' },
        { name: 'JavaScript', value: 'javascript' }
      ],
      default: 'typescript'
    },
    {
      type: 'checkbox',
      name: 'deployment',
      message: 'Include deployment configs:',
      choices: [
        { name: 'Railway (recommended)', value: 'railway' },
        { name: 'Vercel', value: 'vercel' },
        { name: 'Docker', value: 'docker' }
      ]
    }
  ]);

  return {
    name: answers.name,
    description: answers.description,
    author: {
      name: answers.authorName,
      email: answers.authorEmail
    },
    template: answers.template,
    language: answers.language,
    deployment: answers.deployment
  };
}

async function createProject(config: ProjectConfig) {
  const targetPath = path.resolve(process.cwd(), config.name);

  console.log(chalk.cyan(`\n📁 Creating project: ${config.name}`));
  console.log(chalk.gray(`📂 Location: ${targetPath}`));
  console.log(chalk.gray(`🎨 Template: ${TEMPLATES[config.template as keyof typeof TEMPLATES].name}`));

  // Check if directory exists
  if (await fs.pathExists(targetPath)) {
    console.error(chalk.red(`❌ Directory ${config.name} already exists`));
    process.exit(1);
  }

  try {
    // Create project directory
    await fs.ensureDir(targetPath);

    // Copy template files
    await copyTemplate(config, targetPath);

    // Update package.json and other files with project config
    await updateProjectFiles(config, targetPath);

    // Success message
    console.log(chalk.green.bold('\n✅ Project created successfully!'));
    console.log(chalk.cyan('\n🚀 Next steps:'));
    console.log(chalk.white(`   1. cd ${config.name}`));
    console.log(chalk.white('   2. npm install'));
    console.log(chalk.white('   3. cp .env.example .env'));
    console.log(chalk.white('   4. npm run dev'));
    console.log(chalk.gray('\n📚 See README.md for detailed setup instructions'));
    
  } catch (error) {
    console.error(chalk.red('❌ Error creating project:'), error);
    process.exit(1);
  }
}

async function copyTemplate(config: ProjectConfig, targetPath: string) {
  const templatePath = path.join(__dirname, '..', 'templates', config.template);
  const commonPath = path.join(__dirname, '..', 'templates', 'common');

  // Copy common files first
  if (await fs.pathExists(commonPath)) {
    await fs.copy(commonPath, targetPath);
  }

  // Copy template-specific files (overwrites common if needed)
  if (await fs.pathExists(templatePath)) {
    await fs.copy(templatePath, targetPath);
  }

  // Copy deployment configs
  for (const platform of config.deployment) {
    const deployPath = path.join(__dirname, '..', 'templates', 'deployments', platform);
    if (await fs.pathExists(deployPath)) {
      await fs.copy(deployPath, targetPath);
    }
  }
}

async function updateProjectFiles(config: ProjectConfig, targetPath: string) {
  // Update package.json
  const packageJsonPath = path.join(targetPath, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.name = config.name;
    packageJson.description = config.description;
    packageJson.author = `${config.author.name} <${config.author.email}>`;
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  }

  // Update commands.yaml
  const commandsYamlPath = path.join(targetPath, 'commands.yaml');
  if (await fs.pathExists(commandsYamlPath)) {
    let commandsYaml = await fs.readFile(commandsYamlPath, 'utf-8');
    commandsYaml = commandsYaml
      .replace(/{{name}}/g, config.name)
      .replace(/{{description}}/g, config.description) 
      .replace(/{{author_name}}/g, config.author.name)
      .replace(/{{author_email}}/g, config.author.email);
    await fs.writeFile(commandsYamlPath, commandsYaml);
  }

  // Update README.md
  const readmePath = path.join(targetPath, 'README.md');
  if (await fs.pathExists(readmePath)) {
    let readme = await fs.readFile(readmePath, 'utf-8');
    readme = readme
      .replace(/{{name}}/g, config.name)
      .replace(/{{description}}/g, config.description)
      .replace(/{{author_name}}/g, config.author.name);
    await fs.writeFile(readmePath, readme);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };