---
title: "MS SQL Always On 설치 가이드 - 1"
date: "2025-01-20T08:28:14.000Z"
category: "Database | SQL | OS/MS-SQL"
source: "https://hyungyun.tistory.com/entry/MS-SQL-Always-On-%EC%84%A4%EC%B9%98-%EA%B0%80%EC%9D%B4%EB%93%9C-1"
description: "오늘은 Always On 설치 테스트를 진행해보려고 합니다. 저도 SQLTAG 라는 책으로 공부하였고, 여러 블로그를 참고해서 여러번 설치한 방법을 공유하는거라 공식적인 정답이라고 보긴 어려울 수 있지만, 최대한 현업에서 사용하는 방"
---

오늘은 Always On 설치 테스트를 진행해보려고 합니다.

저도 SQLTAG 라는 책으로 공부하였고, 여러 블로그를 참고해서 여러번 설치한 방법을 공유하는거라 공식적인 정답이라고 보긴 어려울 수 있지만, 최대한 현업에서 사용하는 방법으로 가이드 진행하는점 참고 바랍니다. 

양이 많은 관계로 3번의 포스팅으로 나누어서 진행해보려고 하고, 포스팅 이후에는 Always On 환경에서 테스트를 몇가지 진행해보려 합니다.

오늘은 Always On 설치 전 준비 사항인 도메인 설정과 필수 설치 구성 마법사에 대해서 포스팅하고, 그다음 포스팅에서는 윈도우 클러스터 구성, 그리고 마지막 포스팅에서는 SQL Server 에서의 구성 마무리로 진행해보려고 합니다. 

아래는 Always On 구성하기 전에 읽어보기 좋을 것 같아서, 이전에 작성했던 Always On 구성을 참고하면 좋을 것 같아 링크 남깁니다. 

[https://hyungyun.tistory.com/entry/MSSQL-Always-On-%EA%B5%AC%EC%84%B1%EC%9D%B4%EB%9E%80](https://hyungyun.tistory.com/entry/MSSQL-Always-On-%EA%B5%AC%EC%84%B1%EC%9D%B4%EB%9E%80)

 [MSSQL Always On 구성이란?

이번에는 MSSQL 의 Always On 구성에 대하여 알아보려고 한다. 기본적으로 Oracle 이나 Tibero 등 RDBMS 에는 RAC, TAC, HA (Active / Stand-by) 등 여러가지 구성이 있는데, 그중 MSSQL 에서는 Always On 이라는 고가용

hyungyun.tistory.com](https://hyungyun.tistory.com/entry/MSSQL-Always-On-%EA%B5%AC%EC%84%B1%EC%9D%B4%EB%9E%80)

* * *

우선 Always On 설치 테스트 기본 구성은

OS : Window Server 2019 

DB : MSSQL 2016 Enterprise(SP2)

필요 서버 총 3대 : AD 서버 (도메인서버) / AG 서버 2가지 (Always On Primary Node / Secondary Node)

아래는 필수로 설치되어야 하는 구성 마법사와 공유 폴더입니다.

\- Active Directory Domain Services (Active Directory 도메인 서비스) 

\- NET Framework 3.5 Features / NET Framework 4.7 (DB 버전에 따라 설치가 필요한 프레임 워크가 있고, 필요 없는 프레임 워크도 있음 참고하여 설치 바람)

\- Failover Clustering (장애조치 클러스터링) 

![](__MEDIA__/442f09b7602e5cb8f50b2b966bb2aa6b6c30cff6fa0eb821a093fc177b0467fe.png)

Active 도메인 서비스

![](__MEDIA__/ecc997d5fda1c310c28687fcff72966b04767ea18d186a3bf6fdc89c5c8efaa6.png)

NET Framework / Failover Clustering

우선 실습하려는 AG1 / AG2 서버에 전체 공유가 가능한 폴더를 만들어 둡니다.

추후에 이 폴더에서 Database를 생성할 것이고, 이 Database를 싱크하여 사용할 예정입니다.

![](__MEDIA__/38d5bb2205260eef8a9812606f1b6cc7ac10b40113002dc20005735ecd89fece.png)

SQL\_DATA 라는 네이밍의 공유폴더 AG2 서버에도 동일하게 만들어야 한다.

우선 Active Directory 도메인 서비스 구성 마법사를 활용해 도메인 서버를 구성하는 것이 우선이다.

AD 서버 즉, 도메인 서버에는 도메인 구성이 필요한데, 마법사를 설치하고 나면, 이 출력되는 화면에서 3번 Add a new forest (새 포리스트를 추가합니다.) 를 클릭해줍니다.

![](__MEDIA__/5f20fa3bb4ad8ad53d4b4b4a521a31abc25432d3fc77d95ca1b8d41e54a85c6a.png)

도메인 구성 마법사

root 가 되는 도메인에 대한 이름을 정해주고, Next 클릭 

![](__MEDIA__/9b51a2f1b7f3933d659ce92a15dc6dd7105185058e6102a1b28acf549108bc3d.png)

password 지정

패스워드도 지정해준 뒤 Next 클릭, 아래는 구성 마법사 과정입니다. 사진 아래 상세 설명을 참고해주세요.

![](__MEDIA__/b9c0465f77cdaada0c1d2f386fe6b8331cc094f4c9c70b84aa5d4381bb937768.png)

NetBIOS Domain name 설정

![](__MEDIA__/2cbc8c21b1990ff0061366017e90fd6649fc1189c45c4ae42b06e2d60d47def4.png)

검토 옵션 및 구성 요소 확인 -> Next 클릭

![](__MEDIA__/f0201bac7be7855f1f8b68e1ac9b93cfdd4d4501fb211082e86cb03d96c82b96.png)

install로 설치 진행

위 경로는 Dafault 옵션으로 설정해도 무방하므로, 기본 옵션으로 설정하고 다음을 누르게 되면 재시작하라는 메세지가 발생합니다. 재시작하지 않으면, 정상적으로 도메인이 설정되지 않으니 꼭 재시작 해주어야 합니다.

![](__MEDIA__/a1e36e2123e9e1838d5f2e93ddfd3d10baa7954687016aec93c553eb3c0a69e1.png)

재기동 후 정상적으로 도메인이 설정 된 모습

도메인 설정이 완료되면 AG1 / AG2 서버를 도메인 그룹에 가입시켜야 합니다.

가입시키기 전 DNS Server의 IP Number를 AD 서버로 적용시켜주고, 아래 예시 사진의 Domain Change를 눌러서 도메인을 등록시킵니다. (127.0.0.1 은 예시 이므로 실제 AD서버의 IP를 넣어주시면 됩니다.) 

![](__MEDIA__/2c97669ff5082ed889a7ec425b412b3939f5adab44e2a479c921b8929982a456.png)

IP address 에 해당하는 값을 DNS Server IP에 넣으면 됩니다.

![](__MEDIA__/f53637a3eda16a23f0604a69a7ac2ac39948c437e87c624497dfd345cfe3c8d1.png)

Domain Change 화면

Change 를 누르게 되면, 화면이 출력되면서 소속 그룹 -> 도메인 클릭 -> 도메인 입력 (example 등) 하고 버튼을 클릭하면 활성화 된다.

![](__MEDIA__/86514757fe17bf915e2fb75f61e315025d3a8b16039505f336824e33c3308be9.png)

도메인 변경 예시사진

정상적으로 도메인 변경에 대한 변경 작업이 진행 되었다면, 가입할 권한이 있는 Administrator 계정을 입력해주고 가입해주면 된다. 다만 제대로 활성화 되지 않는다면 방화벽 등 네트워크 DNS 포트를 확인해봐도 좋다.

![](__MEDIA__/5458ae4063512ca19d5b2b01d6e37cfb069d17c826947920ba418cf725c2ab5d.png)

도메인 적용

![](__MEDIA__/94a79019c0d2d16231746a81012fffa48d0c6fe647ae87fb0141d1a223ecf686.png)

최종적으로 도메인이 적용 된 화면

오늘은 이렇게 Always On 구성에 필요한 도메인 구성까지 완료 해보았으며, 안되는 부분이 있다면 댓글 남겨주시면 최대한 아는선에서 댓글 남기겠습니다.