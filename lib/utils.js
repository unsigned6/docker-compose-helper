require('colors');
const child_process = require('child_process');
const fs            = require('fs');
const path          = require('path');
const YAML          = require('yaml');

const systemDir = process.cwd();

async function get_compose_files() {
    const configPath = path.join(systemDir, '.dch.json')
    try {
        if (await fs.existsSync(configPath)) {
            const config = require(configPath);

            return config.composeFiles;
        } else {
            const files = fs.readdirSync(systemDir).filter(file => file.endsWith('.yml'));

            return files;
        }
    } catch (error) {
        console.error('Failed to get compose files.'.red);
        console.error(error?.message?.red);
        process.exit(1)
    }
}

function get_services(composeFiles) {
    const services = [];
    const usedComposeFiles = []
    for (const file of composeFiles) {
        try {
            const fileString = fs.readFileSync(file).toString();
            const fileObject = YAML.parse(fileString);
    
            if (!fileObject.services || !fileObject.version) continue;
            services.push(...Object.keys(fileObject.services));
            usedComposeFiles.push(file);
        } catch (error) {
            console.log(`File ${file} has yaml errors, skipping`.red);
            console.log(error?.message?.red);
            continue;
        }
    }

    console.log(`Used compose files: ${usedComposeFiles.join(', ')}`.bold);

    return Array.from(new Set(services)).sort();
}

function run_command(command, args, callback) {
    console.log(`Executing command:\ndocker-compose ${args.join(' ')}`.green.bold);
    console.log('Start process.'.bold);
    const child = child_process.spawn(command, args, { cwd: systemDir, shell: true, stdio: 'inherit' });

    child.on('close', code => {
        if (callback) callback(code);
        console.log('Finish process.'.bold);
    });
}

module.exports = {
    get_compose_files,
    get_services,
    run_command
}