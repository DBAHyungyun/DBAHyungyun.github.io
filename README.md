# 김형윤 DBA 기술 블로그

Astro 5.18.2 기반 GitHub Pages용 정적 사이트입니다. 2026-11-05 공개 티스토리 Sitemap·RSS에서 발견한 게시글 64개와 이미지·첨부 자산 335개를 로컬로 이전했습니다. 원본 수정·삭제, GitHub 원격 저장소 생성·push, 외부 배포는 하지 않았습니다.

## 현재 결과와 증거

- `migration/report.json`: 발견 64 / 변환 64 / 자산 335 / 수집 실패 0
- `migration/url-map.json`: 원본 문자 URL·숫자 URL → 새 URL, 제목·작성일·원래 카테고리
- `migration/assets.json`: 원격 자산 URL → 로컬 SHA-256 기반 파일
- `migration/validation.json`: 빌드 결과의 내부 링크·이미지 수·코드 블록 수·원본 대비 코드 텍스트 검사
- `backup/`: 원본 HTML, RSS, Sitemap. Git 추적 제외. 댓글·스킨·비공개 글·보호 글까지 보존한 계정 전체 백업은 아닙니다.

138개 HTML 페이지(글 64개, 숫자 경로 안내 64개, 기타 10개)를 생성합니다. 루트 및 `/dba-blog/` 경로에서 빌드·자동 검증을 수행했습니다. 브라우저의 모바일 화면·검색 조작·원본 대비 시각 검수는 아직 수행하지 않았습니다. 코드 텍스트의 앞뒤 공백 및 줄바꿈 형식은 정규화하여 비교합니다. 본문 전체의 의미·수식·표 병합·이미지 캡션 동일성은 자동 검증만으로 보장하지 않습니다.

## 실행

Node.js 24, pnpm 11.25.0을 사용합니다. 의존성은 lockfile로 고정했습니다. 최신 Astro를 추종하지 않고 이번 구현에서 실제 빌드한 5.x를 사용했습니다.

```shell
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm verify
```

PowerShell에서 프로젝트 사이트를 점검하는 예시입니다. `SITE_URL`은 사용자의 실제 계정으로 바꿉니다.

```powershell
$env:SITE_URL = 'https://YOUR-ACCOUNT.github.io'
$env:BASE_PATH = '/dba-blog/'
$env:ASTRO_TELEMETRY_DISABLED = '1'
pnpm build
pnpm verify
pnpm preview
```

기본값은 `https://example.invalid`, `noindex,nofollow`, robots Disallow입니다. 실제 공개 시 `PUBLIC_PUBLISH=true`와 올바른 주소가 필요합니다. noindex는 접근 제어가 아닙니다. 검토 전 산출물을 외부 호스팅에 올리지 마세요.

## 정보 구조와 디자인

| 경로 | 역할 |
|---|---|
| `/` | 소개, 최근 기술 기록, 프로젝트 진입 |
| `/blog/` | 본문 포함 검색, 카테고리 필터 |
| `/blog/tistory-<id>/` | Markdown 본문, 작성일, 원문 링크, canonical·BlogPosting |
| `/projects/` | 주요 프로젝트 후보 4개 |
| `/projects/<id>/` | 배경·역할·분석·조치·결과·후속 조치 |
| `/about/` | 소개와 기술 분야 |
| `/resume/` | 이력서 통합을 위한 검토 초안 |
| `/rss.xml`, `/sitemap-index.xml` | 피드와 검색엔진 발견 |

화이트 배경에 블랙·회색 글자와 구분선, 밝은 코드 영역을 사용한 여유 있는 디자인으로 구성했습니다. 외부 폰트·분석 추적기를 사용하지 않습니다. 모바일 메뉴, 이미지 크기, 코드와 표의 가로 스크롤을 고려했습니다.

## 카테고리

원본 카테고리 10개를 그대로 보존했습니다. 상위 `Database | SQL | OS`, `Cloud`와 PostgreSQL, Oracle, MS-SQL, MySQL | Maria, SQL Tuning, SQLD & SQLP, SQL 개발공부, Linux OS, AWS, Azure입니다.

1차 이전에서는 원문 재분류를 최소화합니다. 이후 `DB 제품`과 `주제(Migration, Upgrade, Tuning, Troubleshooting, HA/DR, Automation)`를 별도 태그로 분리하는 것이 좋습니다. Aurora MySQL과 일반 MySQL은 글의 대상 제품·버전 필드로 구분합니다. Lab은 실제 운영 프로젝트와 별도 유형으로 추가합니다.

## 이전 실행 계획

| 단계 | 현재 상태 | 다음 작업과 완료 기준 |
|---|---|---|
| 1. 원본 확보 | 공개 경로 수집 완료 | 관리자 백업을 추가 확보하고 공개·비공개·보호·예약 글, 첨부 수를 대조 |
| 2. 변환 | 공개 글 64개 변환 | Markdown·이미지·표·코드·수식·첨부·내부 앵커를 원문과 검수 |
| 3. 경력 통합 | 검토용 구조 구현 | 이력서·Notion 포트폴리오 원문 대조, 담당 범위·기간·성과 확정 |
| 4. 사전 검증 | 빌드·자동 검사 통과 | 모바일/데스크톱, 검색·필터, 기술 글 5개 이상과 대표 프로젝트 수동 검수 |
| 5. 외부 게시 승인 | 미승인 | 계정·저장소명·공개 범위·최종 사이트 내용을 사용자 확인 |
| 6. 최초 배포 | 미실행 | 저장소 생성, Pages Actions 설정, 실제 URL 검증 |
| 7. 유입 전환 | 미실행 | 티스토리 개별 글에 새 글 안내, 새 sitemap 제출, 검색 유입 관찰 |
| 8. 유지관리 | 계획 | 1·2·4주 후 오류·색인·유입 확인, 원본 보존 |

64개는 공개 검색 경로에서 발견한 글 수이며 전체 계정의 글 수라고 단정할 수 없습니다. RSS만으로 전체 백업을 판단하지 않습니다. 수집 스크립트 재실행은 기존 변환 파일을 덮어쓰므로 수동 수정 전 백업하고 별도 브랜치에서 비교하세요. 재수집은 순차 요청과 지연을 사용합니다. 영상 iframe·script·style은 본문에서 제거하며, 원본 HTML에는 보존되어 있습니다. 동영상·임베드가 있는 글은 별도 복원 검토가 필요합니다. 실패는 `report.json`에 기록됩니다.

## 포트폴리오 통합

이전 대화는 프로젝트 후보와 LinkedIn 주소를 확인하는 자료로만 사용했습니다. 이력서 원문·포트폴리오 파일을 확인하지 못했으므로 과거 답변의 재직 기간, 고객사 이름, 성능 개선 수치를 확정 실적으로 사용하지 않았습니다.

후보: Aurora MySQL Upgrade / KT Cloud → RDS MariaDB Migration / DMS CDC Latency·OOM / Oracle·Tibero SQL Tuning. 각각 다음을 채웁니다.

1. 현황: 제품·정확한 버전, 환경 규모, 작업 목적
2. 담당 역할: 직접 수행·협업·검토 범위와 기간
3. 분석: 증상, 실행계획·지표·로그, 가설과 배제 근거
4. 조치: 대안 비교, 선택 이유, 영향도, 복구 전략
5. 결과: 동일 조건 Before/After와 증거, 검증 범위
6. 후속: 재발 방지, 모니터링, 배운 점, 관련 기술 글

수치가 없는 성과는 수치를 만들지 않고 정성 결과로 작성합니다. 고객사·IP·계정·접속 정보·업무 SQL·스크린샷의 공개 가능 여부를 확인하고 비식별화합니다. 단순히 공개된 티스토리 자료라는 이유로 재검수를 생략하지 않습니다.

## URL·SEO 전략

새 글 주소는 원본 URL에서 생성한 안정적인 ID를 사용합니다. 제목을 변경해도 URL은 유지합니다. 기존 글끼리의 링크는 매핑에 있는 문자/숫자 URL을 새 내부 경로로 바꿉니다. URL hash는 유지하나 원래 제목 앵커와 Astro 앵커의 동일성은 수동 검수 대상입니다.

새 호스트의 `/67/` 같은 숫자 경로는 해당 글로 이동하는 HTML 안내를 제공합니다. 이것은 기존 티스토리 호스트의 HTTP 301이 아닙니다. 기존 `hyungyun.tistory.com`의 URL을 GitHub Pages에서 제어할 수 없습니다. 티스토리 쪽 301 설정 가능 여부는 현재 계정과 플랫폼에서 별도 확인해야 하며 가능한 것으로 가정하지 않았습니다.

공개 시 새 canonical, sitemap, RSS의 도메인·BASE_PATH를 대조하고 Search Console에서 새 속성을 확인합니다. 티스토리 개별 글에는 해당 새 글의 안내 링크를 추가하는 방안을 권장합니다. 플랫폼에서 canonical을 실제 제어할 수 있을 때만 일관된 주소로 설정하고, 중복된 canonical 태그를 만들지 않습니다. 이전 글을 일괄 삭제하거나 모든 글을 홈페이지로 보내지 않습니다. 검색 순위 보존은 보장하지 않습니다.

## GitHub Actions 배포

`.github/workflows/deploy.yml`은 PR에서 빌드·검증하고 수동 실행에서 `publish=true`를 선택한 경우에만 `main`을 배포합니다. 사용자 확인 전 실행하지 않습니다. 최초 승인 후에는 `push: branches: [main]`을 추가해 자동 배포로 변경할 수 있으나 `PUBLIC_PUBLISH`와 배포 조건도 함께 수정해야 합니다.

저장소 Settings → Pages → Source를 GitHub Actions로 설정합니다. Variables에 `SITE_URL`, `BASE_PATH`를 설정합니다.

| 방식 | 저장소 예시 | SITE_URL | BASE_PATH |
|---|---|---|---|
| 계정 사이트 | `<account>.github.io` | `https://<account>.github.io` | `/` |
| 프로젝트 사이트 | `dba-blog` | `https://<account>.github.io` | `/dba-blog/` |
| 개인 도메인 | 선택한 저장소 | 실제 HTTPS 도메인 | `/` |

개인 도메인은 미확정입니다. CNAME과 DNS는 도메인 확정 후 설정합니다. 배포 후 홈·한글 제목 글·이미지·코드·404·RSS·sitemap·canonical을 실제 공개 URL에서 검사합니다. GitHub Free의 Pages는 공개 저장소를 사용하는 방식이므로 원문 자료·민감 파일을 제외한 소스만 업로드합니다.

복구는 이전 정상 commit을 복원한 새 commit을 배포하고 실제 URL을 재검증합니다. DB 작업이 없으므로 티스토리 원본을 유지하면 콘텐츠 접근 복구 경로를 확보할 수 있습니다. 이전 저장소 history에 민감 자료를 넣지 않는 것이 우선입니다.

## 공식 근거

- [Astro GitHub Pages 배포](https://docs.astro.build/en/guides/deploy/github/)
- [GitHub Pages 유형과 계정/프로젝트 URL](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Google URL 변경 사이트 이전](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)

공식 문서는 배포와 SEO 원칙의 근거이며 티스토리 계정의 백업·리디렉션 권한을 증명하는 자료는 아닙니다.

## 2026-11-05 디자인·링크 수정

티스토리 OpenGraph 카드 53개에 저장된 잘린 미리보기 문구를 짧은 참고 링크로 정리했습니다. 공식 링크와 일반 본문·코드·이미지는 유지합니다. 신규 수집에도 같은 변환을 적용합니다. 현재 티스토리 자동 동기화는 구성되어 있지 않습니다. 새 글을 올려도 자동 배포되지 않습니다. 향후 동기화 시 전체 재수집으로 수동 수정본을 덮어쓰는 대신 신규 글을 별도 브랜치/PR로 가져와 검수하는 방식을 권장합니다.

공개 반영: GitHub Desktop에서 변경 확인 → Commit → Push origin → Actions의 Build and deploy Pages 수동 실행(publish 체크). 현재 SITE_URL과 BASE_PATH는 기존 주소를 유지합니다.

`https://dbahyungyun.github.io/`를 사용하려면 사용 가능한 `DBAHyungyun` 사용자명 또는 Organization을 확보하고, 해당 소유자의 `DBAHyungyun.github.io` 저장소로 배포해야 합니다. 이후 SITE_URL을 `https://dbahyungyun.github.io`, BASE_PATH를 `/`로 바꾸고 로컬 remote도 갱신해야 합니다. 사용자명·소유자 변경이나 원격 배포는 이번 로컬 수정에 포함되지 않았습니다. 이름 사용 가능 여부는 확인되지 않았습니다.
