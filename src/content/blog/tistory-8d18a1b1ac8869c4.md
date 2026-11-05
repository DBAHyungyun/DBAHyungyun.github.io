---
title: "MSSQL 2019 설치"
date: "2025-02-24T04:02:37.000Z"
category: "Database | SQL | OS/MS-SQL"
source: "https://hyungyun.tistory.com/entry/MSSQL-2019-%EC%84%A4%EC%B9%98"
description: "오늘은 지난번 MSSQL 2022에 이어서 2019 버전을 설치 할 일이 생겨 포스팅하면서 MSSQL 2019도 설치해보려고 합니다. 우선 서버는 가상 환경인 VM 환경을 구성하여 진행하였고, iso 파일은 아래 공식 링크에서 받아 "
---

오늘은 지난번 MSSQL 2022에 이어서 2019 버전을 설치 할 일이 생겨 포스팅하면서 MSSQL 2019도 설치해보려고 합니다.

우선 서버는 가상 환경인 VM 환경을 구성하여 진행하였고, iso 파일은 아래 공식 링크에서 받아 사용하였습니다.

\[서버환경\]

\- OS : Window Server 2019 Datacenter

\- DB : SQL Server 2019 Standard

ISO 파일 링크 주소 : [https://www.microsoft.com/ko-kr/evalcenter/download-windows-server-2019](https://www.microsoft.com/ko-kr/evalcenter/download-windows-server-2019)

DB 파일 링크 주소 : [https://www.microsoft.com/ko-kr/evalcenter/download-sql-server-2019](https://www.microsoft.com/ko-kr/evalcenter/download-sql-server-2019)

![](__MEDIA__/b3a02ffb5f852c72fb182d7f3bb8aa7f38c63ed983e95fcba65e4d696e41d13e.png)

Window 2019 iso file

해당하는 OS에 맞게 ISO 를 받아서 설치하고, 가상환경을 구성해줍니다. 

추가로 저는, Administrator OS와 DB OS를 구분하기 위헤 MSSQL2019 라는 OS를 새로 생성해주었습니다. 

![](__MEDIA__/b16fa146f1d3af4aacec955fde580b94ac72b5ed0d6a4782c3bced549cd8cad2.png)

MSSQL 2019 계정 생성

MSSQL 2019 계정으로 로그인 후 SQL Server 2019 설치 파일 다운로드

![](__MEDIA__/f0401cace4c2b92370f0f14ab0554c861ccf80702b1c9fc9fb738d505d7b3067.png)

MSSQL 2019 설치파일

SQL Server 설치 기본 클릭 

![](__MEDIA__/67138e26d91b99569ab42272a01fcabb6f82cb0440c1a42bba4287d047a87f90.png)

MSSQL 2019 설치

기본 -> 약관 수락 -> 설치 위치 지정 

![](__MEDIA__/6212dfc9d019ebc344aabf6518b33c0198bc67f03be4a374c9c2578fbab90f66.png)

MSSQL 2019 설치 / 설치 위치 지정

설치 위치를 지정하게 되면, 신규 패키지를 다운하게 된다. 

![](__MEDIA__/ad077b2968f5d17ce008b6898ddb75fe446fddfd6a0f56d40d43c65cb59e7413.png)

MSSQL 2019 패키지 설치

설치 완료 후 SQL Server Tool 인 SSMS 설치 진행 후 마무리

![](__MEDIA__/245a01cf2ca11c963051c3877099d0a0271fe4c065a703cc1450c831afc86839.png)

설치 완료 후 SSMS 설치

SELECT @@VERSION 으로 버전을 확인 해보니 정상적으로 설치 완료 된 모습

![](__MEDIA__/9c063086e71a50882c34ab5ba31deddb024d9edea6a5ff83f40aa5048e7105df.png)

설치 완료

오늘은 간단하게 MSSQL 2019 설치를 진행해보았습니다. 다음에는 아키텍쳐와 개인적으로 공부하는 포스팅을 이어서 진행하도록 하겠습니다.