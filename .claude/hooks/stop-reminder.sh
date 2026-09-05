#!/bin/bash
# 2026-09-05 개정: CHANGELOG.md는 동결(더 이상 갱신 안 함)이라 날짜 검증에서 제외.
# STATE.md는 "상태가 바뀔 때만" 덮어쓰므로 날짜 불일치를 에러가 아니라 정보로만 표시.
TODAY=$(TZ=Asia/Seoul date '+%Y-%m-%d')
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔒 세션 종료 하네스 검증"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# docs/STATE.md 날짜 확인 (정보용 — 세션마다 의무 갱신 아님, 실패로 취급하지 않음)
if [ -f "docs/STATE.md" ]; then
  DATE=$(head -2 docs/STATE.md | grep -Eo '[0-9]{4}-[0-9]{2}-[0-9]{2}' | head -1)
  if [ "$DATE" != "$TODAY" ]; then
    echo "ℹ️  docs/STATE.md: $DATE (오늘: $TODAY) — 상태가 안 바뀌었으면 정상"
  else
    echo "✅ docs/STATE.md OK (오늘 갱신됨)"
  fi
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
