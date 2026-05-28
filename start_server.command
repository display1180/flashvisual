#!/bin/bash
cd "$(dirname "$0")"
echo ""
echo "═══════════════════════════════════════════"
echo "  🟢  로컬 서버가 시작됩니다..."
echo "  브라우저에서 아래 주소를 열어주세요:"
echo ""
echo "  http://localhost:8000/acid_grid.html"
echo ""
echo "  종료하려면 Ctrl+C 를 누르세요"
echo "═══════════════════════════════════════════"
echo ""
open "http://localhost:8000/acid_grid.html"
python3 -m http.server 8000
