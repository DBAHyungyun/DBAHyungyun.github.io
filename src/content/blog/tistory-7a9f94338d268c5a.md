---
title: "MSSQL 2016 -> MSSQL 2019 DB 업그레이드"
date: "2025-02-05T04:06:27.000Z"
category: "Database | SQL | OS/MS-SQL"
source: "https://hyungyun.tistory.com/entry/MSSQL-2016-MSSQL-2019-DB-%EC%97%85%EA%B7%B8%EB%A0%88%EC%9D%B4%EB%93%9C"
description: "오늘은 MSSQL 2016 에서 MSSQL 2019로 업그레이드를 진행해보려고 합니다. 더보기 [서버정보] OS : Window Server 2019 (VM 가상환경) DB : AS-IS | SQL Server 2016 / TO-BE"
---

오늘은 MSSQL 2016 에서 MSSQL 2019로 업그레이드를 진행해보려고 합니다. 

더보기

\[서버정보\]

OS : Window Server 2019 (VM 가상환경)

DB : AS-IS | SQL Server 2016 / TO-BE | SQL Server 2019

MSSQL 2016 설치는 2022와 방법이 동일합니다. 아래 링크를 참고해서 설치 진행했습니다.

[https://hyungyun.tistory.com/entry/MSSQL-2022-%EC%84%A4%EC%B9%98](https://hyungyun.tistory.com/entry/MSSQL-2022-%EC%84%A4%EC%B9%98)

 [MSSQL 2022 설치

오늘은 MSSQL 2022 설치를 진행해보겠습니다.  우선 설치 파일은 Microsoft 공식 홈페이지에서 다운로드가 가능합니다.(링크 : https://www.microsoft.com/ko-kr/sql-server/sql-server-downloads)실습 목적이므로, 개발

hyungyun.tistory.com](https://hyungyun.tistory.com/entry/MSSQL-2022-%EC%84%A4%EC%B9%98)

* * *

우선 MSSQL 2016 버전의 DB를 설치해주어야 합니다. 사전준비로 설치를 완료해주시면 됩니다. 

![](__MEDIA__/a07b386aeaa0bde6e86e27f7e06b783dd4f857f9b0fda353dbf8dbc90d952a0b.png)

MSSQL 2016 DB 설치

그리고 Microsoft 공식 사이트에서 2019에 해당하는 파일을 설치해줍니다.

![](__MEDIA__/8422f1174f98bdb029830ef739ff78954aa7555f4ccc5e80c2212b72f5c3d8dd.png)

MSSQL 2019 설치파일

설치 된 파일을 클릭하면, 우측 세번째 미디어 다운로드 라는 항목이 존재한다. 이 항목을 클릭하면 iso 파일을 생성할 것인지에 대한 설정창이 나오게 되는데, 여기서 iso 파일을 선택하여 다운로드 진행한다. 

![](__MEDIA__/64d11caaf78280f4cf26f5ec109a69fb79a131c14cdaf89279c8fc5c089ef484.png)

미디어 다운로드 클릭

![](__MEDIA__/3fc48a86767a42c6fa48cdbe473f9c95316d5cc346e451765842d0ab6e64c460.png)

iso 설정

다운로드 된 파일을 클릭하게 되면, setup.exe 파일이 생성되어 있을텐데, 이 파일도 클릭해준다.

파일을 클릭하면, 좌측에 여러 메뉴바가 있지만 거기에서 설치 메뉴를 클릭하고 이전 버전의 SQL Server에서 업그레이드를 클릭한다. 

![](__MEDIA__/6274ec268ec8e5b55230fcf7f28a72e6ddf98b66c2fc27f1d8a129d414ceecbd.png)

setup 파일 생성

![](__MEDIA__/8720ba9cbb1072d35995e7a743b7b34befd906d2ae5641c38f0d45e02d313565.png)

MSSQL 업그레이드

업그레이드를 클릭하게 되면, 아래와 같은 화면이 나오게 된다. 여기서 다음을 클릭

![](__MEDIA__/ef43317005919de3463487ba1adf8fc3f25346d001ac48050e5080c422bd191b.png)

MSSQL 2019 업그레이드

다음을 클릭하게 되면, 권장사항으로 업데이트를 확인

![](__MEDIA__/cbdd6b00bd0f33118715e67f2f94900f295df3903a391c1770e6ce07319ed3e9.png)

MSSQL 2019 업그레이드

다음을 클릭하면, 업데이트가 존재하는지 지정된 업데이트를 설치하게 된다.

![](__MEDIA__/4372ef77c4e2af1ca82b0a778c876d99e28c98cd39dfbfa2941ea577de1cab30.png)

MSSQL 2019 업데이트

업그레이드를 진행할 인스턴스를 선택해줍니다. (인스턴스가 여러개 있는 Database가 있을지도 모르니 선택 하는 것)

![](__MEDIA__/cdc88b3a8e89064a05a94e3f52426d59990aa210a17a56ed2766df8f755c2db5.png)

MSSQL 2019 업그레이드

선택하면, 업그레이드 기능을 선택하게 됩니다. 디폴트 선택값을 선택하고 다음 클릭 

![](__MEDIA__/e857b94be9d2cd288ea45bbd8923bf202a39aa76f0ceca57588be0ff073c05cf.png)

MSSQL 2019 업그레이드

인스턴스명과 지정된 ID를 확인 한 뒤 다음 클릭

![](__MEDIA__/cbc1e42b67a6714620114497e79af11f8195728460039e7ab5e5d3715090f83d.png)

MSSQL 2019 업그레이드

최종 업그레이드 준비가 완료됩니다. 업그레이드는 진행시 OS의 재기동이 필요하므로 영향도 있는 작업이나 시스템은 OFF 하고 진행하셔야 합니다. (MCCS 등) 

![](__MEDIA__/b31b5c68e4de12093c65f46ce669c8bc0f73fd22e250286cfa5f3ddd6842ec41.png)

MSSQL 2019 업그레이드

업그레이드 버튼을 클릭하게 되면, 업그레이드가 진행됩니다. 

![](__MEDIA__/1e05cb5c27e3c71aba0189f3f3973755b2a76263ce0234f2d4aa85578741340a.png)

MSSQL 2019 업그레이드

업그레이드가 완료되었습니다. 업그레이드를 하고, OS를 재시작하면 DB 업그레이드 작업이 마무리 됩니다.  

![](__MEDIA__/996de155c0764576040660a57d25d4bcfb5b26ee7a8a4b7752e7559828c4353d.png)

MSSQL 2019 업그레이드 완료

최종 업그레이드 된 버전을 조회해보면 2019로 업그레이드가 되었음을 확인 할 수 있습니다.

SSMS 버전이 맞지 않다면, DB 버전에 맞는 SSMS를 설치해야합니다. 다만, 현재 SSMS 버전이 최신 버전이므로 추가 설치는 하지 않았습니다. 

![](__MEDIA__/bd01e341ac9266db91fa9188480edde4ce8e98d9f64bf004d12528955b66eb99.png)

MSSQL 2019 업그레이드 완료

실제로 업그레이드 하는 과정은 간단하지만, 이에 따른 영향도나 서버에 미치는 부하 데이터베이스 동기화 등 고려해야할 사이드 이펙트는 더 많다고 생각합니다. 실제 운영 환경에서는 이러한 요소들을 고려하여 업그레이드 진행하면 될 것 같습니다.