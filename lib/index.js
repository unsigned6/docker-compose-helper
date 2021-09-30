#!/usr/bin/env node
const inquirer = require('inquirer');
const {
    get_compose_files,
    get_services,
    run_command
} = require('./utils')

inquirer.registerPrompt('checkbox-plus', require('inquirer-checkbox-plus-prompt'));
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

const commandArgument = process.argv[2];

const commandsWithServices = [
  'up',
  'stop',
  'logs',
  'build',
  'pull',
  'rm'
];

const commands = [
  'up',
  'down',
  'stop',
  'logs',
  'build',
  'ps',
  'pull',
  'rm'
]

async function main() {
    const composeFiles = await get_compose_files();
    const services = get_services(composeFiles);

    inquirer.prompt([
        {
          type: 'autocomplete',
          name: 'command',
          choices: () => commands,
          when: () => !commands.includes(commandArgument),
          source: (answers, input) => source_search(commands, answers, input)
        },
        {
          type: 'checkbox-plus',
          message: 'Choose service',
          name: 'services',
          suffix: ' (Press <space> to select, type name to search):',
          pageSize: 10,
          highlight: true,
          searchable: true,
          when : (answers) => {
            const command = answers.command || commandArgument;
            return commandsWithServices.includes(command); 
          },
          choices: async (answers) => {
            const command = answers.command || commandArgument;
            return services;
          },
          source: (answers, input) => {
            const command = answers.command || commandArgument;
            return source_search(services, answers, input)
          }
        }
      ], []).then(async (answers) => {
        const args = prepare_args(composeFiles, answers)
        run_command('docker-compose', args)
      });   
}

function prepare_args(composeFiles, answers) {
  const command = answers.command || commandArgument;
  let paramsString = `-f ${composeFiles.join(' -f ')} `
  switch (command) {
    case 'up':
      paramsString += 'up -d --force-recreate';
      break;
    case 'down':
      paramsString += 'down';
      break;
    case 'stop':
      paramsString += 'stop';
      break;
    case 'build':
      paramsString += 'build';
      break;
    case 'pull':
      paramsString += 'pull';
      break;
    case 'ps':
      paramsString += 'ps';
      break;
    case 'logs':
      paramsString += 'logs -f --tail 10';
      break;
    case 'rm':
      paramsString += 'rm -f -s';
      break;
    default:
      break;
  }
  if (answers.services) {
    paramsString = `${paramsString} ${answers.services.join(' ')}`;
  }

  return paramsString.split(' ')
}

function source_search(data_to_filter, answers, input) {
  input = input || '';

  return new Promise(resolve => {
    const data = data_to_filter.filter(item => item.includes(input))

    resolve(data);
  });
}

module.exports = main;