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

# Spark 3.5 on Java 17 needs these opens or it fails on reflective access.
export PYSPARK_SUBMIT_ARGS="--driver-java-options '--add-opens=java.base/java.lang=ALL-UNNAMED --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens=java.base/java.util=ALL-UNNAMED --add-opens=java.base/sun.nio.ch=ALL-UNNAMED' pyspark-shell"

export SALES_FILES_LOCATION="${SALES_FILES_LOCATION:-$PWD/data/store_sales}"

if [[ "${1:-}" == "--regen" || ! -d "$SALES_FILES_LOCATION" ]]; then
  echo "Generating sample dataset at $SALES_FILES_LOCATION ..."
  ./.venv/bin/python generate_sample_data.py "$SALES_FILES_LOCATION"
fi

echo "Spark UI will be at http://localhost:11000  (Optima tab: /optima/)"
exec ./.venv/bin/python pysparkcode.py
