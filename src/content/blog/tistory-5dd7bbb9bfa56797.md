---
title: "[MySQL] Undo Log란 무엇인가?"
date: "2026-02-20T07:08:59.000Z"
category: "Database | SQL | OS/MySQL | Maria"
source: "https://hyungyun.tistory.com/entry/MySQL-Undo-Log%EB%9E%80-%EB%AC%B4%EC%97%87%EC%9D%B8%EA%B0%80"
description: "안녕하세요. 이번에는 MySQL에서 백업과 데이터 보존에 중요한 부분을 담당하고 있는 Undo Log에 관하여 공부해보려고 합니다. 공식 문서와, Real MySQL 책을 참고하였습니다. 아래 링크는 MySQL 공식 Community"
---

안녕하세요. 이번에는 MySQL에서 백업과 데이터 보존에 중요한 부분을 담당하고 있는 Undo Log에 관하여 공부해보려고 합니다.

공식 문서와, Real MySQL 책을 참고하였습니다. 

아래 링크는 MySQL 공식 Community 문서입니다. 참고하면 좋을 것 같아 첨부하였습니다. 

 [MySQL :: MySQL 8.4 Reference Manual :: 17.6.6 Undo Logs

An undo log is a collection of undo log records associated with a single read-write transaction. An undo log record contains information about how to undo the latest change by a transaction to a clustered index record. If another transaction needs to see t

dev.mysql.com](https://dev.mysql.com/doc/refman/8.4/en/innodb-undo-logs.html)

* * *

## Undo Log란 ?

\- 문자 그대로 실행한 일이나 작업을 취소 (Undo) 하기 위한 기록

\- 트랜잭션과 격리 수준을 보장하기 위해 DML (INSERT,UPDATE,DELETE) 로 변경되기 이전 버전의 데이터를 별도로 백업한다. 이렇게 백업된 데이터를 언두 로그 (Undo Log) 라고 함.

### Undo Log가 사용되는 이유

*   트랜잭션 보장 : 트랜잭션이 롤백되면, 트랜잭션 도중 변경된 데이터를 변경 전 데이터로 복구 해야 하는데 이때 Undo Log에 백업해둔 이전 버전의 데이터를 활용해 복구한다.
*   Isolation 격리 수준 보장 : 특정 커넥션에서 데이터를 변경하는 도중에 다른 커넥션에서 데이터를 조회하면 트랜잭션 격리 수준에 맞게 변경중인 레코드를 읽지 않고 언두 로그에 백업해둔 데이터를 읽어서 반환하기도 한다.

Undo Log는 InnoDB 스토리지 엔진에서 매우 중요한 역할을 담당하지만, 관리 비용도 많이 필요하다.

Undo Log의 동작 방식을 조금 더 자세히 살펴보자면, Undo 영역은 INSERT,DELETE,UPDATE 같은 문장으로 데이터를 변경했을 때 변경되기 이전의 데이터 (이전 데이터) 를 보관하는 곳이다. 

예를 들어, 업데이트 문장을 실행했다고 가정했을 때, 업데이트 문이 실행되면 트랜잭션을 커밋하지 않아도 실제 테이블의 데이터 파일 내용에는 test\_01 로 test\_name이 변경됩니다. 그리고 변경하기 이전의 값이 test\_02 였다면, Undo 영역에서는 이전의 데이터인 'test\_02' 의 데이터가 백업 되는 것 입니다.

```
UPDATE TEST set test_name = 'test_01' where t_id = '01';
```

여기서, 사용자가 Commit 하면 현재 상태인 test\_01 이 그대로 유지가 되고, Rollback 하는 경우 Undo 영역의 백업 데이터가 다시 다시 데이터 파일로 복구된다.

하지만 Commit 되었다고 해서, Undo Log에 남아 있는 데이터가 즉시 삭제되지는 않는다. 해당 데이터를 필요로 하는 다른 오래된 트랜잭션이 존재할 수 있기 때문에 더이상 이 Undo Log를 필요로 하는 트랜잭션이 남아있지 않을 때 Purge Thread에 의해 비동기적으로 삭제됩니다.

또한, Undo Log에는 INSERT Undo Log와 Update/ Delete Undo Log 등 조작 언어에 따라서 동작하는 방식에 차이가 존재합니다.

INSERT : 오직 Rollback을 위해 존재하고, 다른 트잭션의 동시성 제어 (MVCC) 조회를 위해 과거 데이터를 유지할 필요가 없어 Commit 되면 바로 삭제가 가능합니다.

Update / Delete : 트랜잭션이 Commit 되어도 바로 삭제되지 않습니다. 해당 데이터를 참조하는 다른 읽기 트랜잭션이 모두 종료된 뒤에야 Purge Thread에 의해 삭제됩니다. 

그럼 트랜잭션 단위로 늘어나는 Undo 실습을 진행해보도록 하겠습니다.

## Undo Log 실습

1\. 대략 50,000건이 Insert 되어 있는 undo\_test 테이블을 생성한 뒤, Dbeaver 툴을 이용해 AutoCommit 을 OFF 하고 여러개의 세션을 실행 시킵니다.

![](__MEDIA__/978245a5128a1f0fcabe734908342216071c8d635698f30bedc8d0627ef3825f.png)

50,000 개의 Data를 Insert한 undo\_test

2\. SHOW ENGINE INNODB STATUS 명령어로, 현재 History list length를 확인합니다.

![](__MEDIA__/cbc3c978b8191af3e4d3ef53bc4469453f075f776fd794b3b245c2ab3ff62a1c.png)

Innodb Status 조회

3\. AutoCommit 을 OFF한 상태로 START Transaction 하여, Update 구문을 수행해줍니다.

![](__MEDIA__/2a63e99bc99fe1a0d642f865054269104b48a2700861c926584de861a8b86de7.png)

트랜잭션을 열고, Update 구문을 수행

4\. SHOW ENGINE INNODB STATUS를 조회하여 History List Length를 증가한 모습을 확인합니다.

![](__MEDIA__/1f45c74952a140f3c82fbbb6526474eb34ca80890050a619cfd215f7d24f0f2c.png)

SHOW ENGINE INNODB STATUS 확인

History list length (HLL) 는 수정 작업을 수행한 트랜잭션의 Undo 로그 세그먼트 (Undo Log Segment) 의 개수를 의미하며, HLL 이 증가한다는 것은 InnoDB가 아직 정리하지 못한 이전의 데이터 조각들이 쌓여 있다는 뜻으로, Undo Log 관리가 필요한 부분이라 보시면 될 것 같습니다.

HLL이 증가한다면, 

1\. Undo Log를 거슬러 올라가 내 트랜잭션 격리 수준에 맞는 데이터를 찾아야 하고, 이에 따라 SELECT 쿼리의 성능 저하가 발생됩니다.  

2\. Update 구문이나, Delete 구문이 빈번한 시스템에서 HLL이 줄어들지 않으면 Undo Log 파일 (undo\_001, undo\_002 등) 이 계속 커집니다. (AWS의 경우에는 자동 확장이 있으나, 실시간 비용이 증가합니다.)

보통 AWS Cloudwatch에서 RollBackSegmenthistory 를 Alert 걸어 장기 트랜잭션이 있는지 모니터링 하곤 합니다. 성능에 치명적인 결함을 발생시킬 수 있으니 모니터링에 꼭 필요한 지표입니다.

이렇게 Undo Log에 대해서 공부해보았습니다. 다음에는 MySQL 아키텍처 관련한 내용을 공부해볼까 합니다.