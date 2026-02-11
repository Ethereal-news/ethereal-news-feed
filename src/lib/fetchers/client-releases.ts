import { NewNewsItem } from "../types";
import { getDefaultCategory } from "../categories";
import {
  fetchLatestRelease,
  extractVersion,
  getDescription,
  batchFetch,
} from "./github";

interface ClientRepo {
  name: string;
  owner: string;
  repo: string;
  layer: "EL" | "CL";
}

const CLIENTS: ClientRepo[] = [
  // Execution Layer (5)
  { name: "Geth", owner: "ethereum", repo: "go-ethereum", layer: "EL" },
  { name: "Erigon", owner: "ledgerwatch", repo: "erigon", layer: "EL" },
  {
    name: "Nethermind",
    owner: "NethermindEth",
    repo: "nethermind",
    layer: "EL",
  },
  { name: "Besu", owner: "hyperledger", repo: "besu", layer: "EL" },
  { name: "Reth", owner: "paradigmxyz", repo: "reth", layer: "EL" },
  // Consensus Layer (6)
  { name: "Prysm", owner: "prysmaticlabs", repo: "prysm", layer: "CL" },
  { name: "Lighthouse", owner: "sigp", repo: "lighthouse", layer: "CL" },
  { name: "Teku", owner: "ConsenSys", repo: "teku", layer: "CL" },
  {
    name: "Nimbus",
    owner: "status-im",
    repo: "nimbus-eth2",
    layer: "CL",
  },
  { name: "Lodestar", owner: "ChainSafe", repo: "lodestar", layer: "CL" },
  {
    name: "Grandine",
    owner: "grandinetech",
    repo: "grandine",
    layer: "CL",
  },
];

async function fetchClient(client: ClientRepo): Promise<NewNewsItem | null> {
  const release = await fetchLatestRelease(client.owner, client.repo);
  if (!release) return null;

  const version = extractVersion(release.tag_name);
  const title = `${client.name} ${release.tag_name}`;

  return {
    title,
    url: release.html_url,
    description: getDescription(release.body),
    source_type: "client_release",
    source_name: `${client.name} (${client.layer})`,
    category: getDefaultCategory("client_release"),
    published_at: release.published_at,
    version,
    prerelease: release.prerelease,
  };
}

export async function fetchClientReleases(): Promise<NewNewsItem[]> {
  return batchFetch(CLIENTS, fetchClient);
}
