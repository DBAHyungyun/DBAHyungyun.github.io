# 이어서 작업할 때

2026-11-05: 개인 기록장 톤으로 홈·헤더·푸터 변경. 프로젝트 8건과 DMS 사례 기록, 소개·웹 이력서를 사용자 제공 PDF 및 Notion 자료 기준으로 작성했습니다. PDF 원본은 공개하지 않습니다.

검증: 정적 빌드 143개 HTML, 기존 글 64개·이미지 335개·코드 블록 98개 검사 통과. 실제 Chrome headless의 1440px/390px에서 홈·프로젝트·프로젝트 상세·소개·이력서·글 목록을 열고 가로 넘침·브라우저 오류·검색 동작을 검사하여 통과했습니다. 모바일 홈 스크린샷도 확인했습니다.

자동화: 공개 GitHub의 40136a9 Push 실행은 build/deploy 성공. workflow에는 매시간 17분 schedule과 신규 글 수집·검증·Commit/Push·배포가 포함되어 있습니다. 실제 신규 글이 발행되어 예약 수집·Commit·배포되는 전체 운영 경로는 아직 검증되지 않았습니다.

후속 확인: 이번 변경을 원격 Push한 결과, Actions 성공 여부와 실제 https://dbahyungyun.github.io/의 변경 문구 확인. 인증이 없으면 사용자 GitHub Desktop Push가 필요합니다. 사용자에게 토큰 초기화 시각이나 자동 재개를 보장하지 않습니다.

이번 변경은 로컬 commit e803a75에 저장했으나, Git credential 인증이 없어 Push는 실패했습니다. GitHub Desktop에서 Push origin이 필요합니다.
