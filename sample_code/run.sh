#!/usr/bin/env bash
# Runs pysparkcode.py against the generated sample dataset with Optima enabled.
#
#   ./run.sh            # generate data if missing, then run
#   ./run.sh --regen    # force regeneration of the dataset
set -euo pipefail
cd "$(dirname "$0")"

# Spark 3.5 needs a Java 17 (or 11/8) runtime; point at Homebrew's if unset.
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home}"
export PATH="$JAVA_HOME/bin:$PATH"

export SALES_FILES_LOCATION="${SALES_FILES_LOCATION:-$PWD/data/store_sales}"

if [[ "${1:-}" == "--regen" || ! -d "$SALES_FILES_LOCATION" ]]; then
  echo "Generating sample dataset at $SALES_FILES_LOCATION ..."
  ./.venv/bin/python generate_sample_data.py "$SALES_FILES_LOCATION"
fi

echo "Spark UI will be at http://localhost:11000  (Optima tab: /optima/)"
exec ./.venv/bin/python pysparkcode.py
