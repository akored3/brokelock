import solc from 'solc';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SOURCE_PATH = 'contracts/Brokelock.sol';
const source = readFileSync(SOURCE_PATH, 'utf8');

const input = {
  language: 'Solidity',
  sources: { [SOURCE_PATH]: { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    metadata: { useLiteralContent: true },
    outputSelection: {
      '*': { '*': ['abi', 'evm.bytecode.object', 'metadata'] },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

const errors = (output.errors ?? []).filter((e) => e.severity === 'error');
if (errors.length) {
  for (const e of errors) console.error(e.formattedMessage);
  process.exit(1);
}
for (const w of (output.errors ?? [])) console.warn(w.formattedMessage);

const contract = output.contracts[SOURCE_PATH].Brokelock;
// solc.version() looks like "0.8.28+commit.7893614a.Emscripten.clang";
// the verification API wants "v0.8.28+commit.7893614a".
const compilerVersion = 'v' + solc.version().split('.Emscripten')[0];

mkdirSync('out', { recursive: true });
writeFileSync(
  'out/Brokelock.json',
  JSON.stringify(
    {
      contractName: 'Brokelock',
      compilerVersion,
      abi: contract.abi,
      bytecode: '0x' + contract.evm.bytecode.object,
      metadata: contract.metadata,
    },
    null,
    2,
  ),
);
writeFileSync('out/standard-input.json', JSON.stringify(input, null, 2));

console.log(`Compiled Brokelock with solc ${compilerVersion}`);
console.log(`Bytecode size: ${contract.evm.bytecode.object.length / 2} bytes`);
