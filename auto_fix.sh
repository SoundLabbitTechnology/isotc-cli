#!/bin/bash
TASK_PROMPT=$1
aider --message "$TASK_PROMPT" --yes
for i in {1..5}; do
  VERIFY_OUTPUT=$(isotc verify 2>&1)
  if [ $? -eq 0 ]; then
    echo "✅ 成功"
    exit 0
  fi
  echo "🚨 違反検出。AIに修復させます..."
  aider --message "エラーを修正してください: $VERIFY_OUTPUT" --yes
done
echo "❌ 修復失敗"
exit 1
