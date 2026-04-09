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

# session-context.md 날짜 검증
if [ -f "session-context.md" ]; then
  DATE=$(head -2 session-context.md | grep -oP '\d{4}-\d{2}-\d{2}' | head -1)
  [ "$DATE" != "$TODAY" ] && echo "❌ session-context.md: $DATE (오늘: $TODAY)" || echo "✅ session-context.md OK"
fi

# NEXT_SESSION_START.md 날짜 검증
if [ -f "docs/NEXT_SESSION_START.md" ]; then
  DATE=$(head -2 docs/NEXT_SESSION_START.md | grep -oP '\d{4}-\d{2}-\d{2}' | head -1)
  [ "$DATE" != "$TODAY" ] && echo "❌ NEXT_SESSION_START.md: $DATE (오늘: $TODAY)" || echo "✅ NEXT_SESSION_START.md OK"
fi

# CLAUDE.md 날짜 검증
if [ -f "CLAUDE.md" ]; then
  DATE=$(head -2 CLAUDE.md | grep -oP '\d{4}-\d{2}-\d{2}' | head -1)
  [ "$DATE" != "$TODAY" ] && echo "❌ CLAUDE.md: $DATE (오늘: $TODAY)" || echo "✅ CLAUDE.md OK"
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
