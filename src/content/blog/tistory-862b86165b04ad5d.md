---
title: "MS SQL Always On 설치 가이드 - 2"
date: "2025-01-21T00:27:44.000Z"
category: "Database | SQL | OS/MS-SQL"
source: "https://hyungyun.tistory.com/entry/MS-SQL-Always-On-%EC%84%A4%EC%B9%98-%EA%B0%80%EC%9D%B4%EB%93%9C-2"
description: "MS SQL Always On 설치 가이드 - 1 https://hyungyun.tistory.com/entry/MS-SQL-Always-On-%EC%84%A4%EC%B9%98-%EA%B0%80%EC%9D%B4%EB%93%9C-1 M"
---

MS SQL Always On 설치 가이드 - 1 

[https://hyungyun.tistory.com/entry/MS-SQL-Always-On-%EC%84%A4%EC%B9%98-%EA%B0%80%EC%9D%B4%EB%93%9C-1](https://hyungyun.tistory.com/entry/MS-SQL-Always-On-%EC%84%A4%EC%B9%98-%EA%B0%80%EC%9D%B4%EB%93%9C-1)

 [참고 자료 · hyungyun.tistory.com](https://hyungyun.tistory.com/entry/MS-SQL-Always-On-%EC%84%A4%EC%B9%98-%EA%B0%80%EC%9D%B4%EB%93%9C-1)

오늘은 도메인 설정 및 확인 이후 윈도우 클러스터 구성을 진행해보겠습니다.

Always On 설치 테스트 기본 구성

OS : Window Server 2019 

DB : MSSQL 2016 Enterprise(SP2)

필요 서버 총 3대 : AD 서버 (도메인서버) / AG 서버 2가지 (Always On Primary Node / Secondary Node)

* * *

AG 서버의 경우 클러스터링 설치가 필요하다. AG1 / AG2 서버 동일하게 진행하여 설치 해주면 된다.

![](__MEDIA__/fcb9e3fbb1b351b345db4bff43d2de6e8ac2e0925b22f6cd13e07414f4bd7c8d.png)

Failover Clustering 설치 화면

설치를 하게 되면 서버 관리자에 이와 같은 메뉴가 생길 것이다. 클릭하고 진행해주게 된다.

![](__MEDIA__/b8e53500136d6560678b88cf90ff29dd662ff782d6a1593fcf2687f4fd3b15e6.png)

장애조치 클러스터 매니저 (Failover Cluster Manager)

설치가 완료되어 해당 메뉴를 클릭하게 되면, 구성 유효성 검사라는 항목이 나오게 된다. 클릭하여 유효성 검사를 진행한다.

![](__MEDIA__/18cb1648fb2954a08c0e4dcc10d9fc9f12418f26c93ffa35af31ad3f25ec5122.png)

구성 유효성 검사

Enter name에 장애조치 클러스터에 등록하려는 서버 이름을 입력하고 add 해주면 된다. 우측에 있는 Browse 를 클릭하여 서버를 등록해줘도 무방하다. 등록한 이후 다음클릭

![](__MEDIA__/1c2c6e68a565608b343af37d4ad8c518ff64d3ab4a912605acd743f60e8f8643.png)

클러스터 서버 등록

등록된 서버를 유효성 검사 마법사를 통해 실제로 유효성 검사를 진행하고, 테스트가 마무리 된다면 유효성 검사 보고서를 확인 할 수 있는데, 네트워크가 경고 표시 되는 경우가 있지만 설치에는 무방하므로 마침을 클릭해준다.

![](__MEDIA__/7288df4c32c6e3a1d349c64990fac17ee756b5700354a26f20c12cb94e8b28ec.png)

유효성 검사 진행

![](__MEDIA__/6f9aa8f4d550fdc19ebc937f90a1e335880de2be26d82a7d3ad887bb6672a07a.png)

유효성 검사 보고서

유효성 검사 마법사가 종료되면, 클러스터 만들기 마법사 창이 나오게 되는데, 이 창에서 클러스터 이름을 입력하고 NetBIOS 를 본인의 네트워크에 맞게 설정하면 된다.

NetBIOS 란, 클라이언트와 서버 간의 연결을 설정 할 때 사용하는 것으로, NetBIOS 이름을 통해 서버를 식별하는 장치이다. DNS를 사용하여 NetBIOS를 사용하는 빈도가 줄었으나, 클러스터 이름을 지정하는 구간이 있으므로, 지정을 해주겠다. 

![](__MEDIA__/dfec5481233a2a2915d4dd4741698a0648547d14b025931a5f282af285ad8913.png)

클러스터 네트워크 설정

![](__MEDIA__/159c7fb8d5ff5017da5e21e02f4d284b458bab3fbf75fee6670f47453b0c2b38.png)

클러스터 설정 마무리

여기서 다음을 클릭하게 되면 클러스터 구성은 마무리 되게 된다.

![](__MEDIA__/55a349556a9f3b264320f09d00ca6c1a297acf166e5da65ebe7a0b3de8de11d5.png)

최종적으로 클러스터 구성이 마무리 된 모습

이렇게 하면 SQL Server DB에서 작업하기 전 모든 작업은 마무리 된다.

다음 포스팅에서는 이제 실제로 SQL Server DB에서 고가용성 그룹을 추가하고 실제로 Acitve 한 화면까지 표현해보도록 하겠다.