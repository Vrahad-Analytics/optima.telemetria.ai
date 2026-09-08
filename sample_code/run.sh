#!/usr/bin/env bash
#
# Runs pysparkcode.py against the generated sample dataset with Optima enabled.
#
#   ./run.sh              generate data if missing, run, keep the UI open
#   ./run.sh --no-hold    exit as soon as the jobs finish
#   ./run.sh --regen      regenerate the dataset first
#
# Works from any directory. Uses the venv in ./.venv - do not run
# pysparkcode.py with the system python, which has no pyspark (and on this
# machine is 3.14, which PySpark 3.5 does not support).
set -euo pipefail
SELF="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
cd "$(dirname "$SELF")"

HOLD=1
REGEN=0
for arg in "$@"; do
  case "$arg" in
    --no-hold) HOLD=0 ;;
    --regen)   REGEN=1 ;;
    -h|--help) sed -n '3,10p' "$SELF" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

PY="./.venv/bin/python"
if [[ ! -x "$PY" ]]; then
  echo "error: $PWD/.venv not found." >&2
  echo "create it with:" >&2
  echo "    python3.11 -m venv .venv && ./.venv/bin/pip install -r requirements.txt" >&2
  exit 1
fi

# Spark 3.5 needs Java 17/11/8. Prefer an already-set JAVA_HOME, then the
# system helper, then Homebrew's openjdk@17.
if [[ -z "${JAVA_HOME:-}" ]]; then
  if /usr/libexec/java_home -v 17 >/dev/null 2>&1; then
    JAVA_HOME="$(/usr/libexec/java_home -v 17)"
  elif [[ -d /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ]]; then
    JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
  else
    echo "error: no Java 17 found. Install one with: brew install openjdk@17" >&2
    exit 1
  fi
fi
export JAVA_HOME
export PATH="$JAVA_HOME/bin:$PATH"

export SALES_FILES_LOCATION="${SALES_FILES_LOCATION:-$PWD/data/store_sales}"

if [[ "$REGEN" == "1" || ! -d "$SALES_FILES_LOCATION" ]]; then
  echo "Generating sample dataset at $SALES_FILES_LOCATION ..."
  "$PY" generate_sample_data.py "$SALES_FILES_LOCATION"
fi

echo "-------------------------------------------------------------"
echo " java   : $(java -version 2>&1 | head -1)"
echo " python : $("$PY" --version)"
echo " data   : $SALES_FILES_LOCATION"
echo " UI     : http://localhost:11000/optima/"
echo "-------------------------------------------------------------"

if [[ "$HOLD" == "0" ]]; then
  exec "$PY" pysparkcode.py
fi

# The SparkSession - and its web UI - die with the process, so by default keep
# the interpreter alive after the script so the UI stays browsable. compile()
# with the real filename so tracebacks still point at pysparkcode.py.
exec "$PY" - <<'PYEOF'
import time

src = open("pysparkcode.py").read()
exec(compile(src, "pysparkcode.py", "exec"), {"__name__": "__main__", "__file__": "pysparkcode.py"})

print("\n" + "=" * 61)
print(" Jobs finished. Spark UI is still up:")
print("   http://localhost:11000/optima/")
print(" Press Ctrl+C to stop Spark and close the UI.")
print("=" * 61, flush=True)
try:
    while True:
        time.sleep(3600)
except KeyboardInterrupt:
    print("\nStopping Spark.")
PYEOF
