#!/usr/bin/env sh
set -eu

PORT="${PORT:-8545}"
CHAIN_ID="${CHAIN_ID:-63917}"
BLOCK_TIME="${BLOCK_TIME:-2}"
STATE_FILE="${STATE_FILE:-/data/crex-anvil-state.json}"
MNEMONIC="${MNEMONIC:-test test test test test test test test test test test junk}"

LOAD_STATE_ARGS=""
if [ -f "$STATE_FILE" ]; then
  LOAD_STATE_ARGS="--load-state $STATE_FILE"
fi

exec anvil \
  --host 0.0.0.0 \
  --port "$PORT" \
  --chain-id "$CHAIN_ID" \
  --block-time "$BLOCK_TIME" \
  --mnemonic "$MNEMONIC" \
  --accounts 20 \
  --balance 1000000 \
  --dump-state "$STATE_FILE" \
  --state-interval 5 \
  $LOAD_STATE_ARGS
