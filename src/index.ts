#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Fix for CommonJS modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get version from package.json
const require = createRequire(import.meta.url);
const { version } = require('../package.json');

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

  // Default command - create project
  program
    .version(version)
    .description('Create a new MCP server for Commands.com')
    .argument('[name]', 'Project name')
    .option('-t, --template <type>', 'Template type (basic|api|data)', 'basic')
    .option('-l, --lang <language>', 'Language (typescript|javascript)', 'typescript')
    .option('-d, --deploy <platform>', 'Deployment platform (railway|vercel|docker)')
    .option('--author <name>', 'Author name')
    .option('--description <desc>', 'Project description')
    .action(async (name, options) => {
      await createProject(name, options);
    });

  // Set proxy URL command
  program
    .command('set-proxy <url>')
    .description('Update PROXY_URL in mcp.yaml with your deployed server URL')
    .action(async (url) => {
      await setProxyUrl(url);
    });

  await program.parseAsync();
}

async function createProject(projectName: string, options: CreateOptions) {

  function sanitizeProjectName(name: string): string {
    if (!name?.trim()) {
      throw new Error('Project name is required');
    }
    if (!/^[a-z0-9-_]+$/.test(name)) {
      throw new Error('Project name must contain only lowercase letters, numbers, hyphens, and underscores');
    }
    return name;
  }

  let config: ProjectConfig;

  if (!projectName) {
    // Interactive mode
    config = await promptForConfig(projectName);
  } else {
    // Direct mode - validate CLI argument
    try {
      projectName = sanitizeProjectName(projectName);
    } catch (error) {
      console.error(chalk.red(`❌ ${error instanceof Error ? error.message : 'Invalid project name'}`));
      console.error(chalk.gray('Use lowercase letters, numbers, hyphens, and underscores only'));
      process.exit(1);
    }

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

  await executeProjectCreation(config);
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

async function executeProjectCreation(config: ProjectConfig) {
  // Project name is already validated, safe to use directly
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
    console.log(chalk.white('   4. npm run dev  # Test locally'));
    console.log(chalk.white('   5. git init && git add . && git commit -m "Initial commit"'));
    console.log(chalk.white('   6. git remote add origin <your-github-repo-url>'));
    console.log(chalk.white('   7. git push -u origin main'));
    console.log(chalk.white('   8. Deploy to Railway/Vercel (hosts your server)'));
    console.log(chalk.white('   9. npx create-commands-mcp set-proxy <your-live-url>'));
    console.log(chalk.white('  10. Deploy to Commands.com (connects to your GitHub repo)'));
    console.log(chalk.gray('\n📚 See README.md for detailed deployment instructions'));
    
  } catch (error) {
    console.error(chalk.red('❌ Error creating project:'), error);
    process.exit(1);
  }
}

async function copyTemplate(config: ProjectConfig, targetPath: string) {
  const templatePath = path.join(__dirname, '..', 'templates', config.template);
  const commonPath = path.join(__dirname, '..', 'templates', 'common');

  // Copy common files first (base layer)
  if (await fs.pathExists(commonPath)) {
    await fs.copy(commonPath, targetPath);
  }

  // Copy template-specific files (overwrites common if needed)
  if (await fs.pathExists(templatePath)) {
    await fs.copy(templatePath, targetPath);
  }

  // Copy deployment configs in parallel (they don't conflict)
  const deploymentCopies = config.deployment.map(async (platform) => {
    const deployPath = path.join(__dirname, '..', 'templates', 'deployments', platform);
    if (await fs.pathExists(deployPath)) {
      await fs.copy(deployPath, targetPath);
    }
  });

  await Promise.all(deploymentCopies);
}

function escapeTemplateValue(value: string): string {
  // Escape special characters that could be used for injection
  return value.replace(/[{}$`\\]/g, '\\$&');
}

async function updateProjectFiles(config: ProjectConfig, targetPath: string) {
  // Generate unique server ID (8 character random string)
  const uniqueId = Math.random().toString(36).substring(2, 10);
  const serverId = `${config.name}-${uniqueId}`;
  
  // Sanitize config values for template replacement
  const safeConfig = {
    name: escapeTemplateValue(config.name),
    description: escapeTemplateValue(config.description),
    serverId: escapeTemplateValue(serverId),
    uniqueString: escapeTemplateValue(uniqueId),
    author: {
      name: escapeTemplateValue(config.author.name),
      email: escapeTemplateValue(config.author.email)
    }
  };

  // Update package.json
  const packageJsonPath = path.join(targetPath, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.name = config.name;
    packageJson.description = config.description;
    packageJson.author = `${config.author.name} <${config.author.email}>`;
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  }

  // Update commands.yaml (Commands.com command definitions)
  const commandsYamlPath = path.join(targetPath, 'commands.yaml');
  if (await fs.pathExists(commandsYamlPath)) {
    let commandsYaml = await fs.readFile(commandsYamlPath, 'utf-8');
    commandsYaml = commandsYaml
      .replace(/{{name}}/g, safeConfig.name)
      .replace(/{{description}}/g, safeConfig.description) 
      .replace(/{{unique-string}}/g, safeConfig.uniqueString)
      .replace(/{{author_name}}/g, safeConfig.author.name)
      .replace(/{{author_email}}/g, safeConfig.author.email);
    await fs.writeFile(commandsYamlPath, commandsYaml);
  }

  // Update README.md
  const readmePath = path.join(targetPath, 'README.md');
  if (await fs.pathExists(readmePath)) {
    let readme = await fs.readFile(readmePath, 'utf-8');
    readme = readme
      .replace(/{{name}}/g, safeConfig.name)
      .replace(/{{description}}/g, safeConfig.description)
      .replace(/{{author_name}}/g, safeConfig.author.name);
    await fs.writeFile(readmePath, readme);
  }

  // Update mcp.yaml
  const mcpYamlPath = path.join(targetPath, 'mcp.yaml');
  if (await fs.pathExists(mcpYamlPath)) {
    let mcpYaml = await fs.readFile(mcpYamlPath, 'utf-8');
    mcpYaml = mcpYaml
      .replace(/{{unique-string}}/g, safeConfig.uniqueString)
      .replace(/{{PROXY_URL}}/g, '{{PROXY_URL}}') // Keep placeholder for user to fill
      .replace(/{{name}}/g, safeConfig.name)
      .replace(/{{description}}/g, safeConfig.description)
      .replace(/{{author_name}}/g, safeConfig.author.name)
      .replace(/{{author_email}}/g, safeConfig.author.email);
    await fs.writeFile(mcpYamlPath, mcpYaml);
  }
}

async function setProxyUrl(url: string) {
  try {
    // Validate URL format
    try {
      new URL(url);
    } catch {
      console.error(chalk.red('❌ Invalid URL format'));
      console.error(chalk.gray('Example: https://my-server-production.up.railway.app'));
      process.exit(1);
    }

    // Check if mcp.yaml exists in current directory
    const mcpYamlPath = path.join(process.cwd(), 'mcp.yaml');
    if (!await fs.pathExists(mcpYamlPath)) {
      console.error(chalk.red('❌ mcp.yaml not found in current directory'));
      console.error(chalk.gray('Make sure you are in the root of your MCP project'));
      process.exit(1);
    }

    // Read and update mcp.yaml
    let mcpYaml = await fs.readFile(mcpYamlPath, 'utf-8');
    
    // Replace {{PROXY_URL}} placeholder with actual URL
    mcpYaml = mcpYaml.replace(/{{PROXY_URL}}/g, url);
    
    await fs.writeFile(mcpYamlPath, mcpYaml);
    
    console.log(chalk.green.bold('✅ PROXY_URL updated successfully!'));
    console.log(chalk.cyan(`🔗 Server URL: ${url}`));
    console.log(chalk.gray('\n📋 Next steps:'));
    console.log(chalk.white('   1. Commit and push your changes to git'));
    console.log(chalk.white('   2. Register at Commands.com Creator Portal'));
    console.log(chalk.white('   3. Import your MCP repo to Commands.com'));
    
  } catch (error) {
    console.error(chalk.red('❌ Error updating PROXY_URL:'), error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('create-commands-mcp')) {
  main().catch(console.error);
}

export { main };