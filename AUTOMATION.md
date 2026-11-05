# 티스토리 신규 글 자동 게시와 계정명 변경

## 동작

GitHub Actions가 매시간 17분(UTC 기준, 한국도 매시간 17분)에 티스토리 Sitemap·RSS를 확인합니다. 새 공개 글만 가져와 이미지·코드·링크를 변환하고 빌드·검증한 뒤 bot이 Commit·Push합니다. 같은 workflow의 deploy job이 Pages에 배포하므로 GITHUB_TOKEN으로 만든 Push가 다른 workflow를 자동 실행하지 않는 제약을 피합니다. PC나 Codex를 켜둘 필요가 없습니다. 스케줄은 지연될 수 있고 장기간 저장소 활동이 없으면 GitHub 정책에 따라 중지될 수 있습니다.

새 공개 글을 추가하고, 기존 글은 원본의 공개 상태를 확인하여 게시를 내릴 수 있습니다. 기존 공개 글의 본문 수정은 덮어쓰지 않습니다. 비공개/보호 글은 수집하지 않습니다. Sitemap·RSS에서 발견되지 않는 글은 자동 이전을 보장하지 않습니다. 기존 Markdown의 수동 수정은 유지합니다. 실패 시 Commit·배포하지 않고 이전 사이트를 유지합니다. 반복 실패 시 Actions 로그를 확인하세요. 동시 Push가 발생해 push가 거절되면 강제로 덮어쓰지 않으며 다음 실행에서 재시도합니다.

개인 액세스 토큰은 불필요합니다. workflow의 `contents: write`, deploy job의 `pages: write`, `id-token: write`로 동작합니다. 저장소 규칙이 main 직접 Push를 금지하면 추가 조정이 필요합니다. 액션에서 403이 발생하면 Settings → Actions → General의 Workflow permissions와 main 보호 규칙을 확인하세요. 권한을 모든 서비스에 광범위하게 부여하지 않습니다.

업로드된 새 workflow부터 main Push 시 사이트 자동 배포도 수행합니다. 수동 실행에서는 publish와 sync 체크로 즉시 수집·공개할 수 있습니다. 새 공개 글은 별도 사람 검수 없이 자동 공개된다는 점을 전제로 사용합니다. 자동화를 멈추려면 Actions → Build and deploy Pages → 메뉴 → Disable workflow를 사용하세요.

## 원하는 주소로 변경

1. GitHub 우측 프로필 → Settings → Account → Change username에서 `DBAHyungyun` 사용 가능 여부 확인 후 변경합니다. 계정 로그인/확인이 필요하므로 계정 소유자가 진행해야 합니다.
2. 블로그 저장소 Settings → General → Repository name을 `DBAHyungyun.github.io`로 변경합니다.
3. 저장소 Settings → Secrets and variables → Actions → Variables에서 SITE_URL은 `https://dbahyungyun.github.io`, BASE_PATH는 `/`로 바꿉니다.
4. GitHub Desktop → Repository → Repository settings → Remote에서 새 주소 `https://github.com/DBAHyungyun/DBAHyungyun.github.io.git`로 연결을 갱신합니다. 회사·집 PC 각각 갱신합니다.
5. Pages Source가 GitHub Actions인지 확인하고 Actions를 수동 실행합니다. 성공 후 `https://dbahyungyun.github.io/`에서 홈·글·이미지·RSS·canonical을 확인합니다.

원래 사용자명은 다른 사람이 사용할 수 있게 되고 기존 프로필 링크는 유지되지 않을 수 있습니다. 다른 로컬 저장소와 LinkedIn 등의 GitHub 링크도 갱신합니다. 기존 Pages 주소의 리디렉션은 보장하지 않습니다. 이름 변경 전에는 현재 SITE_URL과 BASE_PATH를 그대로 유지하여 기존 사이트가 동작하도록 합니다.

## 검증 범위

실제 공개 글 64개로 신규 수집을 실행해 변화가 없는 것을 확인했습니다. 격리된 모의 티스토리 응답으로 새 글·이미지·코드 수집, 카드 정리, 재실행 중복 방지와 기존 수동 수정 보존을 확인했습니다. 루트 경로 빌드와 기존 64개 글·98개 코드 블록 검사도 통과했습니다. GitHub 서버의 예약 실행과 실제 새 글 발행 후 자동 게시까지는 운영에서 별도 확인이 필요합니다.

## 원본 삭제·비공개 전환 확인

수집 후 `scripts/reconcile-source.mjs`가 원본 숫자 URL과 문자 URL을 모두 조회합니다. 하나라도 동일 글의 공개 본문이 확인되면 유지합니다. 두 URL 모두 실제 티스토리의 권한 없음/페이지 없음 응답 또는 명시적인 보호글 화면일 때만 후보로 기록합니다. 로그인하지 않은 응답만으로 삭제와 비공개를 항상 구별할 수는 없으므로 원본이 더 이상 공개되지 않는 것으로 처리합니다.

서로 다른 실행에서 최소 15분 간격으로 2번 확인한 뒤 Markdown과 URL 매핑에서 제외합니다. 예약 실행이 정상 동작한다면 다음 확인 주기까지 보통 1시간 이상 걸릴 수 있으며 지연될 수 있습니다. 수동 수집도 동일 규칙을 지켜 15분 이내 재실행만으로는 내리지 않습니다. RSS/Sitemap에 안 보인다는 이유만으로 내리지 않으며, 403/429/5xx·타임아웃·일반 CDN 오류·홈 리디렉션은 판단 보류입니다. 확인 가능한 공개 글이 없거나 전체의 10%(최소 허용 3건)를 넘는 동시 비공개 후보가 나오면 대량 변경을 보류합니다. 별칭이 하나뿐인 글도 자동 삭제하지 않습니다.

확인 상태는 migration/source-state.json, 게시를 내린 이력은 migration/removed-posts.json에 저장합니다. 제거한 글만 쓰던 이미지도 현재 src 파일 전체에서 참조가 없는 경우에 한해 제거합니다. 공유 이미지와 직접 추가한 파일은 보존합니다. 글이 다시 공개되고 Sitemap/RSS에서 발견되면 신규 수집 경로로 복원됩니다. 이 동기화는 원본 티스토리를 변경하지 않습니다.

이는 공개 정적 사이트에서 글과 전용 자산을 내리는 기능입니다. GitHub에서 로그인하여 비공개 글을 읽는 기능이나 과거 Commit·백업·검색엔진 캐시 제거가 아닙니다. 이미 공개된 저장소의 과거 기록은 남습니다.

검증: 두 번 확인·간격·공개 복귀·별칭 공개·403/429/500/타임아웃·일괄 오류 보류, 격리된 파일 기반 통합 검사(본문/매핑 제거·공유 및 수동 이미지 보존)를 수행했습니다.
