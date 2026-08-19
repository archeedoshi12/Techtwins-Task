const { spawn } = require('child_process');
const path = require('path');

function run(script) {
  const proc = spawn('node', [path.join(__dirname, script)], { stdio: 'inherit' });
  proc.on('exit', (code) => {
    console.error(`[start] ${script} exited with code ${code}. Restarting...`);
    setTimeout(() => run(script), 1000);
  });
}

run('index.js');
run('worker.js');
