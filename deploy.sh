#!/bin/bash
set -euo pipefail

wrangler deploy

# Parse .dev.vars and set secrets
if [[ ! -f .dev.vars ]]; then
    echo "File .dev.vars not found!"
    exit 1
fi
while IFS='=' read -r name value
do
  echo "Setting $name"
  echo $value | wrangler secret put $name
done < .dev.vars
