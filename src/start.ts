import { statSync, writeFileSync, readFileSync, Stats } from 'fs';
import { createLock } from './createLock';
import { printPrettyLine } from './utils/helpers';
import { runtimeContext } from './utils/constants';
import { FileStats, HandleConversionOpts } from './types';
import path = require('path');

const cwd = process.cwd();

/** Runs a conversion flow driven by either a runtime context or a filepath to the pnpm-lock.yaml */
function handleConversion({ ctx, pnpmPath }: HandleConversionOpts) {
  if (ctx === runtimeContext.RUSH) {
    reportStats(handleConversionRUSH());
  } else {
    reportStats(handleConversionWithPath(pnpmPath));
  }
}

/** Place an npm package-lock.json file in the cwd and build Stats. */
export function generateNpm(pnpmLockPath: string): String {
  try {
    const dir = path.dirname(pnpmLockPath);
    const pnpmLock = readFileSync(`${pnpmLockPath}`, 'utf8');
    const npmLock = createLock(pnpmLock);

    process.stdout.write('Converting pnpm-lock.yaml to package-lock.json... ');
    writeFileSync(`${dir}/package-lock.json`, JSON.stringify(npmLock, null, 2));
    process.stdout.write('OK\n');

    return (`${dir}/package-lock.json`);
  } catch (e) {
    process.stdout.write('FAIL\n');
    console.error('Error', e);
    process.exit(1);
  }
}

/** Place an npm package-lock.json file in the cwd and build Stats. */
export function generateNpm2Stat(pnpmLockPath: string): Stats {
  try {
    const dir = path.dirname(pnpmLockPath);
    const pnpmLock = readFileSync(`${pnpmLockPath}`, 'utf8');
    const npmLock = createLock(pnpmLock);

    process.stdout.write('Converting pnpm-lock.yaml to package-lock.json... ');
    writeFileSync(`${dir}/package-lock.json`, JSON.stringify(npmLock, null, 2));
    process.stdout.write('OK\n');

    return statSync(`${dir}/package-lock.json`);
  } catch (e) {
    process.stdout.write('FAIL\n');
    console.error('Error', e);
    process.exit(1);
  }
}

/** Runs the conversion flow and enforces rush-specific repo structure. */
function handleConversionRUSH() {
  const rushJson = 'rush.json';
  const commonConfig = 'common/config/rush';
  const pnpmLockFile = `${commonConfig}/pnpm-lock.yaml`;

  // Ensure we are running in root of a Rush monorepo
  try {
    if (!statSync(`${cwd}/${rushJson}`).isFile() || !statSync(`${cwd}/${commonConfig}`).isDirectory())
      throw new Error();
  } catch (e) {
    console.error('Error: This command must be run in a Rush repo root');
    process.exit(1);
  }

  return handleConversionWithPath(pnpmLockFile);
}

/** Appends pnpmLock filepath to cwd and runs the conversion flow. */
export function handleConversionWithPath(pnpmLockFile: string | undefined): FileStats {
  try {
    const pnpmStat = statSync(`${cwd}/${pnpmLockFile}`);
    if (!pnpmStat.isFile()) throw new Error();

    return {
      pnpmStat,
      npmStat: generateNpm2Stat(pnpmLockFile as string)
    };
  } catch (e) {
    console.error(
      'Cannot find the pnpm-lock.yaml file. Please make sure it is available in the root of the repo.'
    );
    process.exit(1);
  }
}

/** Self-described logs to stdout. */
function reportStats({ pnpmStat, npmStat }: FileStats) {
  console.log(`\tpnpm-lock.yaml: ${pnpmStat.size} bytes`);
  console.log(`\tpackage-lock.json: ${npmStat.size} bytes`);

  printPrettyLine();
  printPrettyLine('package-lock.json SUCCESS');
  printPrettyLine(`available in ${cwd}`);
  printPrettyLine();
}

