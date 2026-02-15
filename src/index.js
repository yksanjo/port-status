#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const net = require('net');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

const program = new Command();

program
  .name('port-status')
  .description('Quick port status checker with colorized output')
  .version('1.0.0');

/**
 * Check if port is available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

/**
 * Get process using port
 */
async function getPortProcess(port) {
  try {
    const { stdout } = await execPromise(`lsof -i :${port} -t`);
    const pid = stdout.trim();
    if (pid) {
      const { stdout: psOut } = await execPromise(`ps -p ${pid} -o args=`);
      return psOut.trim();
    }
  } catch {}
  return null;
}

program
  .command('status')
  .description('Check port status')
  .argument('<port>', 'Port number')
  .action(async (port) => {
    const portNum = parseInt(port);
    const available = await isPortAvailable(portNum);
    
    if (available) {
      console.log(chalk.green(`🟢 Port ${portNum} is FREE`));
    } else {
      const proc = await getPortProcess(portNum);
      console.log(chalk.red(`🔴 Port ${portNum} is BUSY`));
      if (proc) console.log(chalk.gray(`   Process: ${proc}`));
    }
  });

program.parse();
