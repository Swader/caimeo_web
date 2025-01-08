
import { deploySoulShard } from './deploy-methods';

async function main() {
  await deploySoulShard();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
