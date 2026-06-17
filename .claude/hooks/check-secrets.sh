#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // empty')

if [ -z "$CONTENT" ]; then
  exit 0
fi

# Block: DEEPSEEK_API_KEY referenced inside a Client Component
if echo "$CONTENT" | grep -q "use client" && echo "$CONTENT" | grep -qE "DEEPSEEK_API_KEY"; then
  echo "Blocked: DEEPSEEK_API_KEY referenced inside a Client Component ($FILE_PATH). Route this through a Server Action or app/api/ route handler instead." >&2
  exit 2
fi

# Block: hardcoded-looking secret literals
if echo "$CONTENT" | grep -qE "sk-[A-Za-z0-9]{20,}"; then
  echo "Blocked: possible hardcoded API key literal in $FILE_PATH. Use process.env instead." >&2
  exit 2
fi

exit 0
