# 티스토리 신규 글 자동 게시와 계정명 변경

## 동작

GitHub Actions가 매시간 17분(UTC 기준, 한국도 매시간 17분)에 티스토리 Sitemap·RSS를 확인합니다. 새 공개 글만 가져와 이미지·코드·링크를 변환하고 빌드·검증한 뒤 bot이 Commit·Push합니다. 같은 workflow의 deploy job이 Pages에 배포하므로 GITHUB_TOKEN으로 만든 Push가 다른 workflow를 자동 실행하지 않는 제약을 피합니다. PC나 Codex를 켜둘 필요가 없습니다. 스케줄은 지연될 수 있고 장기간 저장소 활동이 없으면 GitHub 정책에 따라 중지될 수 있습니다.

새 글만 동기화합니다. 티스토리에서 기존 글을 수정·삭제·비공개로 전환해도 GitHub 사본은 자동 변경·삭제하지 않습니다. 비공개/보호 글은 수집하지 않습니다. Sitemap·RSS에서 발견되지 않는 글은 자동 이전을 보장하지 않습니다. 기존 Markdown의 수동 수정은 유지합니다. 실패 시 Commit·배포하지 않고 이전 사이트를 유지합니다. 반복 실패 시 Actions 로그를 확인하세요. 동시 Push가 발생해 push가 거절되면 강제로 덮어쓰지 않으며 다음 실행에서 재시도합니다.

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
