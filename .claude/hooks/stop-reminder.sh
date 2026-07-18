#!/bin/bash
TODAY=$(TZ=Asia/Seoul date '+%Y-%m-%d')
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔒 세션 종료 하네스 검증"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# CHANGELOG.md 날짜 검증
if [ -f "docs/CHANGELOG.md" ]; then
  DATE=$(head -2 docs/CHANGELOG.md | grep -oP '\d{4}-\d{2}-\d{2}' | head -1)
  [ "$DATE" != "$TODAY" ] && echo "❌ CHANGELOG.md: $DATE (오늘: $TODAY)" || echo "✅ CHANGELOG.md OK"
fi

# docs/STATE.md 날짜 검증
if [ -f "docs/STATE.md" ]; then
  DATE=$(head -2 docs/STATE.md | grep -oP '\d{4}-\d{2}-\d{2}' | head -1)
  [ "$DATE" != "$TODAY" ] && echo "❌ docs/STATE.md: $DATE (오늘: $TODAY)" || echo "✅ docs/STATE.md OK"
fi

# git 상태 검증
if git status --porcelain 2>/dev/null | grep -q '^'; then
  echo "❌ 커밋 안 된 변경사항 있음!"
else
  AHEAD=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")
  [ "$AHEAD" -gt 0 ] && echo "❌ push 안 된 커밋 ${AHEAD}개!" || echo "✅ git OK"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
exit 0
