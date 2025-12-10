/**
 * Run Full 2025 Data Pipeline
 *
 * Executes all scripts in sequence:
 * 1. fetch-osm-expanded.js
 * 2. transform-osm.js
 * 3. merge-and-dedupe.js (Overture optional)
 * 4. import-to-new-collection.js
 * 5. validate-new-collection.js
 * 6. compare-collections.js
 *
 * Run: node scripts/run-full-pipeline.js
 */

const { execSync } = require("child_process");
const path = require("path");

const SCRIPTS_DIR = __dirname;

const PIPELINE_STEPS = [
  {
    name: "Fetch Expanded OSM Data",
    script: "fetch-osm-expanded.js",
    required: true
  },
  {
    name: "Transform OSM Data",
    script: "transform-osm.js",
    required: true
  },
  {
    name: "Fetch Overture Data (Optional)",
    script: "fetch-overture.js",
    required: false,
    skipMessage: "Skipping Overture fetch - will continue with OSM only"
  },
  {
    name: "Transform Overture Data",
    script: "transform-overture.js",
    required: false
  },
  {
    name: "Merge and Deduplicate",
    script: "merge-and-dedupe.js",
    required: true
  },
  {
    name: "Import to New Collection",
    script: "import-to-new-collection.js",
    required: true
  },
  {
    name: "Validate New Collection",
    script: "validate-new-collection.js",
    required: true
  },
  {
    name: "Compare Collections",
    script: "compare-collections.js",
    required: true
  }
];

function runScript(scriptName, stepName, required) {
  const scriptPath = path.join(SCRIPTS_DIR, scriptName);

  console.log("\n" + "=".repeat(70));
  console.log(`STEP: ${stepName}`);
  console.log("=".repeat(70) + "\n");

  try {
    execSync(`node "${scriptPath}"`, {
      stdio: "inherit",
      cwd: path.join(SCRIPTS_DIR, "..")
    });
    return true;
  } catch (err) {
    if (required) {
      console.error(`\nFAILED: ${stepName}`);
      console.error(`Script: ${scriptName}`);
      return false;
    } else {
      console.log(`\nSkipped (non-critical): ${stepName}`);
      return true;
    }
  }
}

async function main() {
  console.log("\n" + "#".repeat(70));
  console.log("#" + " PICKY PLATE - 2025 DATA REFRESH PIPELINE ".padStart(50).padEnd(68) + "#");
  console.log("#".repeat(70));

  console.log("\nThis pipeline will:");
  console.log("  1. Fetch fresh restaurant data from OpenStreetMap");
  console.log("  2. Optionally fetch from Overture Maps");
  console.log("  3. Transform and merge the data");
  console.log("  4. Import to NEW 'restaurants_2025' collection");
  console.log("  5. Validate and compare with existing data");
  console.log("\nYour existing 'foodplaces' data will NOT be touched.\n");

  const startTime = Date.now();
  let success = true;

  for (const step of PIPELINE_STEPS) {
    if (!runScript(step.script, step.name, step.required)) {
      success = false;
      break;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log("\n" + "#".repeat(70));
  if (success) {
    console.log("#" + " PIPELINE COMPLETED SUCCESSFULLY ".padStart(45).padEnd(68) + "#");
  } else {
    console.log("#" + " PIPELINE FAILED ".padStart(40).padEnd(68) + "#");
  }
  console.log("#".repeat(70));
  console.log(`\nTotal time: ${elapsed} minutes\n`);

  if (success) {
    console.log("NEXT STEPS:");
    console.log("  1. Review the comparison report above");
    console.log("  2. Update your app to use 'restaurants_2025' collection");
    console.log("  3. Your old data remains safe in 'foodplaces'\n");
  }
}

main();
