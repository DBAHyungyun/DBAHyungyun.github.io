---
title: "MSSQL 2022 설치"
date: "2025-01-03T05:32:35.000Z"
category: "Database | SQL | OS/MS-SQL"
source: "https://hyungyun.tistory.com/entry/MSSQL-2022-%EC%84%A4%EC%B9%98"
description: "오늘은 MSSQL 2022 설치를 진행해보겠습니다. 우선 설치 파일은 Microsoft 공식 홈페이지에서 다운로드가 가능합니다. (링크 : https://www.microsoft.com/ko-kr/sql-server/sql-serve"
---

오늘은 MSSQL 2022 설치를 진행해보겠습니다. 

우선 설치 파일은 Microsoft 공식 홈페이지에서 다운로드가 가능합니다.

(링크 : [https://www.microsoft.com/ko-kr/sql-server/sql-server-downloads](https://www.microsoft.com/ko-kr/sql-server/sql-server-downloads))

![](__MEDIA__/74ef943b73bb30a1bd46e2ffbd1481d3752b91bb73cb75311b45d48fb8c63a40.png)

MSSQL 2022 설치 공식사이트

실습 목적이므로, 개발자 환경을 다운로드 해준 뒤, MSSQL 2022 에 맞는 Window Server OS 를 준비해줍니다.

호환이 가능한 Window Server OS 는 동일하게 Microsoft 공식 홈페이지에서 확인이 가능합니다.

실습 환경은 Window Server 2022를 사용하겠습니다.

(링크 : [https://learn.microsoft.com/ko-kr/troubleshoot/sql/database-engine/install/windows/use-sql-server-in-windows](https://learn.microsoft.com/ko-kr/troubleshoot/sql/database-engine/install/windows/use-sql-server-in-windows))

![](__MEDIA__/f8167d01eaa2095a80859f3a21787905afd39d6224fba5418a483051f6596198.png)

MSSQL ❘ Window Server 호환 정보

참고) Window Server 2022 iso 파일 역시 Microsoft 공식 홈페이지에서 다운이 가능합니다.

[https://www.microsoft.com/ko-kr/evalcenter/download-windows-server-2022](https://www.microsoft.com/ko-kr/evalcenter/download-windows-server-2022)

정상적으로 다운로드를 진행했다면, 아래와 같은 아이콘의 파일이 다운로드 되었을 겁니다. 

![](__MEDIA__/eb804c573f03b079f53f90192a48d38a79d0f81163465bd6ce81b98813003e62.png)

MSSQL 2022 설치파일

더블클릭해서 설치를 진행해줍시다. 

클릭시 아래와 같이 선택하는 구간이 나오는데 Basic 을 선택해줍니다. 

![](__MEDIA__/b9a7a77e5cc349fa4ba22fe438cb36fd18d8888c768ab6b62fe9bd97aea9f9e2.png)

MSSQL 2022 설치 화면

임시 라이선스 관련 안내창이 나옵니다. 설치 테스트를 진행하는 것이기 때문에 Accept 를 클릭해줍니다. (환경이 영문인 점 양해 부탁드립니다.)

![](__MEDIA__/5a9f8b8e16682a15a983416280b975eabc627cf3e23ee04c16ac2c443101e1d6.png)

MSSQL 2022 설치화면

경로를 설정해주고, 저는 디폴트 경로로 설정하였습니다. 다른 경로를 설정하고 싶다면 Browse를 클릭하여 수정해주시기 바랍니다.

![](__MEDIA__/964d98a24ff4762766b5cf09d573b99a76a90cfa8b06fc401090547ba34fa2ea.png)

MSSQL 2022 설치화면

아래와 같이 설치가 진행됩니다. 

![](__MEDIA__/4916ea9068a3320938ad3cec85022f4ec538d53206cb0f074142048ec1bd83c2.png)

MSSQL 2022 설치화면

설치가 완료되면 아래와 같은 설치 정보들이 나옵니다. 여기서 Connect Now를 클릭하시면 명령 프롬프트 창에서 바로 SQL Server 가 연결되지만, 저는 SSMS 라는 Microsoft 가 제공하는 SQL Server 통합 개발환경 툴을 사용 할 예정입니다. install SSMS를 클릭해줍니다. 

![](__MEDIA__/db785a9f7fb68cd714f88bc56c51280b0ff8101a307a5235ce967923c5ad172e.png)

MSSQL 2022 설치화면

그럼 링크로 바로 연결이 될텐데, 여기 링크에서 SSMS를 다운받아주시면 됩니다. 

(링크 : [https://learn.microsoft.com/ko-kr/sql/ssms/download-sql-server-management-studio-ssms?view=sql-server-ver16](https://learn.microsoft.com/ko-kr/sql/ssms/download-sql-server-management-studio-ssms?view=sql-server-ver16) )

![](__MEDIA__/1070eff4d850c0626efe505328542d8841f7ce4cf5e3920391522ab3095eb318.png)

SSMS 설치 화면

아래 그림과 같은 설치 파일이 생성 될 것이고, 클릭하여 Install을 진행하면 됩니다. (경로는 수정해도 무방합니다.)

![](__MEDIA__/41bf0b9dc31ee130489fcf791e7c10b0626c9fd9655aeaf5151d98f5a1cd2fd9.png)

SSMS 설치 파일

![](__MEDIA__/0b946facc49b4da15ccfc0be4673cea3c69ec9456bb8c6a7c9bb7568452c4061.png)

SSMS 설치 작업

![](__MEDIA__/991604dfe2913e954d238eaa7144156340bb5cd801e5e6991fd4dab3e6aed085.png)

SSMS 설치 완료 화면

설치하여 최초로 접속하게 되면, 아래와 같은 로그인 창이 나오게 됩니다.

여기서 Encryption 은 암호화 방식 즉, Optical 은 기본값으로 선택적으로 암호화가 적용되는 옵션이고 Mandatory는 강제로 TLS 암호화 방식을 사용하라는 옵션입니다. 따로 설정해주지 않았으니 Optical (선택적) 을 클릭하고 로그인하면 

![](__MEDIA__/f60cadd983e6cceb47e25f6358c2550380f841b0170f1f2caef2883dc95b2c4e.png)

SSMS 로그인 화면

정상적으로 설치가 된 모습입니다. 

![](__MEDIA__/a108d1f66da185d1e6b6ffe6183e75c6a54827eeeab29c202feb84b24af2646c.png)

MSSQL 설치 완료

오늘은 MSSQL 2022 버전을 설치해보았는데, 확실히 친숙한 UI 로 설치가 타 DBMS 에 비해 비교적으로 간단합니다.

하지만, Always On 구성, 대용량 데이터 처리 등 심화적인 부분은 이해하기에 충분히 어려워 많은 공부가 필요하게 됩니다.

다음 게시글에서는 설치 된 테스트 서버를 바탕으로 SQL Server 실행 / 중지 여부와 주요 파라미터를 알아보고 실습해보겠습니다.