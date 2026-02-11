import { NewNewsItem } from "../types";
import { getDefaultCategory } from "../categories";
import {
  fetchLatestRelease,
  extractVersion,
  getDescription,
  batchFetch,
} from "./github";

interface ToolRepo {
  name: string;
  owner: string;
  repo: string;
}

const DEV_TOOLS: ToolRepo[] = [
  { name: "Halmos", owner: "a16z", repo: "halmos" },
  { name: "Ape", owner: "ApeWorX", repo: "ape" },
  { name: "Revm", owner: "bluealloy", repo: "revm" },
  { name: "EVMole", owner: "cdump", repo: "evmole" },
  { name: "Echidna", owner: "crytic", repo: "echidna" },
  { name: "Slither", owner: "crytic", repo: "slither" },
  { name: "solc-select", owner: "crytic", repo: "solc-select" },
  { name: "Mythril", owner: "ConsenSysDiligence", repo: "mythril" },
  { name: "Foundry DevOps", owner: "Cyfrin", repo: "foundry-devops" },
  { name: "Headlong", owner: "esaulpaugh", repo: "headlong" },
  { name: "Ethers.js", owner: "ethers-io", repo: "ethers.js" },
  {
    name: "EthereumJS Monorepo",
    owner: "ethereumjs",
    repo: "ethereumjs-monorepo",
  },
  { name: "Voltaire", owner: "evmts", repo: "voltaire" },
  { name: "Forge Std", owner: "foundry-rs", repo: "forge-std" },
  { name: "Foundry", owner: "foundry-rs", repo: "foundry" },
  {
    name: "Solidity Bytes Utils",
    owner: "GNSPS",
    repo: "solidity-bytes-utils",
  },
  {
    name: "TrueBlocks Core",
    owner: "TrueBlocks",
    repo: "trueblocks-core",
  },
  { name: "Circom", owner: "iden3", repo: "circom" },
  {
    name: "Gas Cost Estimator",
    owner: "imapp-pl",
    repo: "gas-cost-estimator",
  },
  { name: "Heimdall", owner: "Jon-Becker", repo: "heimdall-rs" },
  { name: "Nethereum", owner: "Nethereum", repo: "Nethereum" },
  { name: "Hardhat", owner: "NomicFoundation", repo: "hardhat" },
  {
    name: "OpenZeppelin Contracts",
    owner: "OpenZeppelin",
    repo: "openzeppelin-contracts",
  },
  { name: "Otterscan", owner: "otterscan", repo: "otterscan" },
  {
    name: "micro-eth-signer",
    owner: "paulmillr",
    repo: "micro-eth-signer",
  },
  { name: "noble-ciphers", owner: "paulmillr", repo: "noble-ciphers" },
  { name: "Snekmate", owner: "pcaversaccio", repo: "snekmate" },
  { name: "xdeployer", owner: "pcaversaccio", repo: "xdeployer" },
  {
    name: "VSCode Solidity Inspector",
    owner: "PraneshASP",
    repo: "vscode-solidity-inspector",
  },
  {
    name: "Prettier Solidity",
    owner: "prettier-solidity",
    repo: "prettier-plugin-solidity",
  },
  { name: "Solhint", owner: "protofire", repo: "solhint" },
  {
    name: "Semaphore",
    owner: "semaphore-protocol",
    repo: "semaphore",
  },
  { name: "Solidity", owner: "ethereum", repo: "solidity" },
  { name: "Sourcify", owner: "ethereum", repo: "sourcify" },
  { name: "BLST", owner: "supranational", repo: "blst" },
  {
    name: "Slither MCP",
    owner: "trailofbits",
    repo: "slither-mcp",
  },
  { name: "ZeroKit", owner: "vacp2p", repo: "zerokit" },
  { name: "Solady", owner: "Vectorized", repo: "solady" },
  { name: "Vyper", owner: "vyperlang", repo: "vyper" },
  { name: "Viem", owner: "wevm", repo: "viem" },
  { name: "Wagmi", owner: "wevm", repo: "wagmi" },
];

async function fetchTool(tool: ToolRepo): Promise<NewNewsItem | null> {
  const release = await fetchLatestRelease(tool.owner, tool.repo);
  if (!release) return null;

  const version = extractVersion(release.tag_name);
  const title = `${tool.name} ${release.tag_name}`;

  return {
    title,
    url: release.html_url,
    description: getDescription(release.body),
    source_type: "dev_tool_release",
    source_name: tool.name,
    category: getDefaultCategory("dev_tool_release"),
    published_at: release.published_at,
    version,
    prerelease: release.prerelease,
  };
}

export async function fetchDevToolReleases(): Promise<NewNewsItem[]> {
  return batchFetch(DEV_TOOLS, fetchTool);
}
