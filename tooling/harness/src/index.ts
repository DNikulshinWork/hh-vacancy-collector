import { spawn } from 'child_process';

const [cmd, ...args] = process.argv.slice(2);

if (!cmd) {
  process.stderr.write('No command provided to the harness.\n');
  process.exit(1);
}

const child = spawn(cmd, args, {
  stdio: 'inherit',
});

child.on('close', (code: number | null) => {
  process.exit(code ?? 0);
});
