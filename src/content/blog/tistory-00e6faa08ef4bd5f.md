---
title: "Oracle Lock 의 정의와 Lock Test"
date: "2025-01-09T06:50:31.000Z"
category: "Database | SQL | OS/Oracle"
source: "https://hyungyun.tistory.com/entry/Oracle-Lock-%EC%9D%98-%EC%A0%95%EC%9D%98%EC%99%80-Lock-Test"
description: "오늘은 Lock 에 대한 자세한 정의와 실제 Oracle 환경에서의 Lock을 발생시켜 볼 예정이다. Lock은 지난번 게시물에 간략하게 설명하였으나, 이 게시물에서는 좀 더 세세하게 공부하고자 한다. Lock이란 - 공유 리소스와 "
---

오늘은 Lock 에 대한 자세한 정의와 실제 Oracle 환경에서의 Lock을 발생시켜 볼 예정이다.

Lock은 지난번 게시물에 간략하게 설명하였으나, 이 게시물에서는 좀 더 세세하게 공부하고자 한다.

Lock이란   
\-  공유 리소스와 사용자 데이터를 보호할 목적으로 데이터의 무결성과 일관성을 유지하기 위해 접근을 제한하는 매커니즘을 의미한다. 

  
Lock 의 종류에는 크게 DML Lock, DDL Lock, Latch Lock, Buffer Lock 등이 있다.

DML Lock : 다중 사용자가 DML문을 실행할 때, 해당 트랜잭션이 발생시킨 데이터가 다른 사용자에 의해 변경되지 않도록 잠금을 발생시키는 것. 다중의 사용자가 동시에 데이터에 접근하더라도, 데이터의 일관성과 무결성을 유지하기 위해 사용된다. DML Lock 에는 테이블 수준의 잠금 (TX Lock) 과 행 수준의 잠금 (Row Lock) 이 존재한다.

\- 특정 행을 대상으로 하는 DML 작업 (INSERT, UPDATE, DELETE)이 실행될 때 발생

\- 특정 DML 작업을 진행할 때, 테이블 전체에 대한 잠금이 진행되는 경우 발생 (대량의 데이터 삽입이나, 병렬 작업 진행)

DDL Lock : 테이블, 인덱스, 뷰 등과 같은 객체의 구조를 변경하는 DDL 작업이 수행될 때 해당 객체에 대해 적용되는 잠금으로 DML과 마찬가지로 데이터의 일관성과 무결성을 보장하고, 동시에 여러 사용자가 DDL을 실행할 때 발생하는 충돌을 방지한다.

Latch Lock : 메모리 구조의 동시성을 제어하기 위해 사용되는 가벼운 Lock. 메모리 내의 데이터 구조(공유 메모리 영역, 로그 버퍼, 데이터 캐시 등) 에 대한 무결성을 보호한다.

Buffer Lock : 데이터 블록 (buffer) 의 접근을 관리하기 위한 Lcck. (이런게 있다 정도만 습득)

\----------------------------------------------------------------------------------------------------------------

실습 환경 : CensOS 7.9 | Oracle 11g 11.2.0.1.0

![](__MEDIA__/cc38917fafccb9af247b59c407b2f8c95b29280492a9ca4f052f4281e893a5c8.png)

실습 환경 정보

실습에 사용할 TEST Table을 생성 (Column Type은 임의로 설정하셔도 무방합니다.)

![](__MEDIA__/f142427833f9c9fcee8d57b68f7026b1d799d72e8e6f5fb6b595dbc2aa7a6ce1.png)

TEST 테이블 생성

생성된 Table에 임시 데이터 3건을 INSERT 해주겠습니다. 

![](__MEDIA__/d5663ec853913fbba4d9eb6e36b712777da9e78e260b9cbf19a59824695003ba.png)

INSERT 이후 SELECT

다중세선의 환경을 보여주기 위해, Mobaxterm에 연결된 세션과 Putty 로 연결된 세션 2가지를 열어줍니다. 

오라클은 autocommit 이 디폴트값으로 OFF 로 설정되어 있어서 commit 명령어를 치지 않으면 다른 세션에서 적용되지 않습니다. commit 명령어로 적용시키고 확인해보면

![](__MEDIA__/520c7f7069c34e45ec848e1255b0a7c8d191a97c8b7294fe44fa3853d813282e.png)

다른 세션을 하나 더 열어 commit 명령어 입력 전

commit 명령어를 입력하니 다른 세션에서도 정상적으로 TEST 테이블이 조회가 됩니다! 

![](__MEDIA__/2517cf3783b14622d5753af6f9481555db844e4856b96793b1477734bd496c55.png)

commit 명령어 입력 후 조회 시 정상 조회

이제 다른 세션에서 update 를 해주고 putty 로 열려있는 세션에서 update를 추가로 입력하게 된다면, 데이터 무결성과 일관성을 위해 Lock이 발생 되는 것을 볼 수 있다.

![](__MEDIA__/a8ea7a8109304c9999426e0e3c3bf93b0a44195667601f09f83b9d660a1be1b6.png)

Lock Session 발생

이 Lock Session은 v$lock 과 v$session 에서 확인이 가능하다.

![](__MEDIA__/c18913a9c583786c722bd2d95c4025523515c13903f2b8fe36ad77cac5587894.png)

v$lock 조회

하지만, 이렇게 조회하게 되면, TYPE을 제외하고 식별하기에 쉽지가 않다.  아래 쿼리문을 참고하여, blocking\_session 이 NOT NULL 인 결과값을 조회하자. (단, 정말 특수한 상황의 오라클 버그 및 특정 상황에서 Blocking\_session 값이 NULL 인 경우도 있다.)

<table style="border-collapse: collapse; width: 100.116%; height: 88px;" border="1" data-ke-align="alignLeft"><tbody><tr><td style="width: 100%;">SELECT&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;b.blocking_session,&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;a.sid&nbsp;AS&nbsp;waiting_session,&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;a.event,&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;a.wait_time,&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;a.seconds_in_wait&nbsp;<br>FROM&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;v$session&nbsp;a&nbsp;<br>JOIN&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;v$session&nbsp;b&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;ON&nbsp;a.blocking_session&nbsp;=&nbsp;b.sid&nbsp;<br>WHERE&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;a.blocking_session&nbsp;IS&nbsp;NOT&nbsp;NULL;</td></tr></tbody></table>

![](__MEDIA__/9bf55ba11ee3ef6e97dca596ae4c124847fbad044b5c49927e46bb525c02164e.png)

lock session 조회

이렇게 발생된 Lock Session 을 Kill 해도 물론 해소가 되지만, 트랜잭션이 롤백되고 데이터 일관성에 영향을 줄 가능성이 존재하기 때문에 웬만하면 Holder 가 되는 세션에 commit 명령어를 입력해서 DML이 마무리 되게끔 해줘야 한다. 

![](__MEDIA__/c6e7bb98ab0436d99e824cca337d9c903b5955c134e73e93566d6063461855ec.png)

commit 결과

Commit 하여, 다른 세션에 대한 update 는 수행 되었지만 또 commit 을 해주지 않아 또 빨간 상자내의 값은 SELECT 하였을 때 변경되지 않은 모습이다.

꼭 commit 하는 습관을 가지어 데이터의 무결성과 일관성을 보존 할 수 있도록 해야 할 것 같다. 

오늘은 이렇게 간단한 Lock 의 정의와 테스트를 진행해보았다. 다음에는 인덱스와 개체에 대한 공부를 해볼까 한다.