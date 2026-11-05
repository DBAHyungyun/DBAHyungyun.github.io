---
title: "MSSQL 주요 시스템 프로시저에 대하여"
date: "2025-01-06T06:49:23.000Z"
category: "Database | SQL | OS/MS-SQL"
source: "https://hyungyun.tistory.com/entry/MSSQL-%EC%A3%BC%EC%9A%94-%EC%8B%9C%EC%8A%A4%ED%85%9C-%ED%94%84%EB%A1%9C%EC%8B%9C%EC%A0%80%EC%97%90-%EB%8C%80%ED%95%98%EC%97%AC"
description: "MSSQL 은 크게 시스템 프로시저와 사용자 저장 프로시저 2가지로 나눌 수 있다고 생각한다. 그 중에서 오늘은 시스템 저장 프로시저에 관하여 간략하게 알아보고자 한다. 우선 프로시저의 정의부터 살펴보면 프로시저 (Procedure)"
---

MSSQL 은 크게 시스템 프로시저와 사용자 저장 프로시저 2가지로 나눌 수 있다고 생각한다.

그 중에서 오늘은 시스템 저장 프로시저에 관하여 간략하게 알아보고자 한다.

우선 프로시저의 정의부터 살펴보면

프로시저 (Procedure) 란? 

\- 컴퓨터 프로그래밍에서 특정 작업을 수행하기 위해 일련의 명령어를 모아 놓은 것.

쉽게 설명하면, 어떠한 작업을 보다 더 빠르게 수행하기 위해 사전에 명령어를 저장하는 것이라고 보면 될 것 같다.

한번 저장된 프로시저는 여러번 호출하여 재사용 할 수 있으며, 저장된 프로시저는 처음 실행 될 때 컴파일된 후 캐시되므로, 반복 사용 시 성능이 더 향상된다.

이러한 이유로 여러 DBMS 에서 프로시저를 저장하여, 호출해 사용하고 있는 것을 알 수 있다.

\-------------------------------------------------------------------------------------------------------

이번 게시물에서는 저장 프로시저에 대한 내용보다는, 실제 MSSQL 에서의 주요 시스템 프로시저를 알아보고, 실제 MSSQL 에서 이 프로시저를 수행 시킴으로서 발생하는 결과값과 실제로 어떻게 사용할지에 대해 포스팅 해보려고 한다.

MSSQL 의 시스템 프로시저는 sp\_~ 로 시작하는 네이밍을 갖고 있으며, EXEC sp\_ ~ 라는 명령어로 프로시저를 실행 시켜 볼 수 있다. 아래의 프로시저 리스트와 예제를 한번 봐보자.

1\. Database 의 정보 확인 프로시저

\- sp\_helpdb : SQL Server를 실행하는 서버의 모든 데이터베이스에 대한 정보를 표시

![](__MEDIA__/b5169cc763e2710a5a665511da574077146f1d6a8fe9e2bd01e759ef3fbd6527.png)

sp\_helpdb 실행 결과

\- sp\_help 'table\_name'; : 시스템 테이블, 사용자 테이블 또는 뷰와 같은 개체 정보를 표시

![](__MEDIA__/c7f7fcd15c6c68296998d4228198a6dfd2a40416b1d083e2735a60fe7e2baddc.png)

Test\_t 라는 테이블의 조회 결

\- sp\_tables : 현재 데이터베이스의 모든 테이블 정보를 반환하여 표시 (아래 예제부터는 예시 사진은 생략하겠습니다.)

![](__MEDIA__/437692e7748f6ceb1ddf37fd9a843b3614abdb91f93fcd30c816a9fc96702f82.png)

sp\_tables 의 조회 결과

\- sp\_helptext : 저장된 프로시저나 뷰의 텍스트를 표시 

EXEC sp\_helptext 'prodecure\_name';

\- sp\_rename : 데이터베이스 개체의 이름을 변경함

EXEC sp\_rename 'old\_name', 'new\_name';

\- sp\_who : 현재 데이터베이스의 연결 정보와 활성 세션의 상태를 표시 (비교를 위해 예제 첨부)

EXEC sp\_who

![](__MEDIA__/42a4c4f85a3e9663fc98b5af0ef74ab837724669a0bb0e3fa8ce3ae104f9c67b.png)

sp\_who 표시 화면

\- sp\_who2 : sp\_who 보다 상세한 정보를 제공하여, I/O 와 CPU 사용량을 추가로 표시함.

EXEC sp\_who2

![](__MEDIA__/0d3f11442155ec179945a4fefeeda038e09e41a1a41d8bdf9ac7365862594528.png)

sp\_who2 표시 화면

\- sp\_lock : 현재 잠금된 lock 세션의 정보를 표시

EXEC sp\_lock

\- sp\_showplan : 현재 실행중인 세션의 실행 계획 표시 (옵션 활성화 필수)

SET SHOWPLAN\_ALL ON;

SET SHOWPLAN\_ALL OFF;

\- sp\_monitor : MSSQL 의 성능 통계 정보를 표시 (CPU 사용량, I/O , 연결 정보 등)

EXEC sp\_monitor 

\- sp\_statistics : 특정 테이블이나 인덱스의 통계 정보를 표시

EXEC sp\_statistics 'table\_name';

\- sp\_updatestats : 모든 테이블 및 인덱스의 통계 정보를 업데이트하여 쿼리 성능 최적화

EXEC sp\_updatestats;

이렇게 간략하게 MSSQL 시스템 프로시저에 대하여 알아보았다.

이 외에도 정말 많은 시스템 프로시저들이 MSSQL 에는 존재하며, 이 프로시저들을 바탕으로 성능 정보를 점검, 개선이 용이합니다. 

다음에는 Lock Session 을 발생시키고, 실제 이 Lock 정보를 보면서 Kill 하고 개선시키는 테스트를 진행해보겠습니다.