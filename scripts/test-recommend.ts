import { recommend } from "@auto/core";

const queries = [
  "find recent papers on CRISPR with citations",
  "ship a landing page for my startup today",
  "refactor a large Python monorepo",
];

async function main() {
  for (const query of queries) {
    console.log("\n---", query, "---");
    const result = await recommend(query, { limit: 2 });
    console.log("Primary:", result.primary.toolId, `(${result.primary.confidence})`);
    console.log("Reason:", result.primary.reason);
    console.log(
      "Alternatives:",
      result.alternatives.map((a) => a.toolId).join(", "),
    );
    if (result.workflowTip) console.log("Workflow:", result.workflowTip);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
