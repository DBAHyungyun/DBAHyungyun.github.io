---
title: "[MySQL] 동시성 제어 MVCC 란 무엇인가?"
date: "2026-03-03T05:10:29.000Z"
category: "Database | SQL | OS/MySQL | Maria"
source: "https://hyungyun.tistory.com/entry/MySQL-%EB%8F%99%EC%8B%9C%EC%84%B1-%EC%A0%9C%EC%96%B4-MVCC-%EB%9E%80-%EB%AC%B4%EC%97%87%EC%9D%B8%EA%B0%80"
description: "안녕하세요. 오늘은 데이터베이스에서 중요한 성능에 관련된 동시성 제어 (MVCC)에 관하여 공부해보고자 합니다. 이전에 포스팅 했던 MySQL Undo 를 참고하면 이해하기 더 용이할 것 같아 첨부합니다. 봐주시면 감사하겠습니다. ["
---

안녕하세요. 오늘은 데이터베이스에서 중요한 성능에 관련된 동시성 제어 (MVCC)에 관하여 공부해보고자 합니다.

이전에 포스팅 했던 MySQL Undo 를 참고하면 이해하기 더 용이할 것 같아 첨부합니다. 봐주시면 감사하겠습니다.

 [참고 자료 · hyungyun.tistory.com](https://hyungyun.tistory.com/entry/MySQL-Undo-Log%EB%9E%80-%EB%AC%B4%EC%97%87%EC%9D%B8%EA%B0%80)

참고 서적 : Real MySQL, MVCC, 트랜잭션 격리 수준 공식 문서

 [참고 자료 · dev.mysql.com](https://dev.mysql.com/doc/refman/8.4/en/innodb-multi-versioning.html)

 [참고 자료 · dev.mysql.com](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html)

* * *

## 개요

RDSMS에서 가장 중요한 것은 뭐니뭐니 해도 데이터 일 것이다. 하지만 A라는 사용자와  B라는 사용자가 동일한 테이블에서 데이터를 조회했는데 결과가 다르게 출력 된다면? 사람들은 데이터베이스를 신뢰할 수 없고 신뢰도가 떨어짐으로 인해 중요한 정보를 저장하지 않게 될 것 입니다. 어쩌면 사용 자체를 중단할수도 있습니다.

이렇게 데이터베이스에서는 트랜잭션의 핵심 요인인 ACID를 기준으로 정합성이 이루어지고 있습니다. 다만, 같은 경우에서 많은 사용자가 동일한 데이터를 조회하려고 하며 동시에 데이터가 꾸준히 업데이트 되는 상황이라면? 데이터 정합성을 위해 수정되는 테이블에 대해서 잠금, 즉 Lock을 걸어야만 했습니다.

이러한 방식은 대기 시간을 증가시켰고 데이터베이스 에서는 치명적인 성능 저하로 다가왔을겁니다.

이러한 방법을 개선하고자 사용했던 것이 MVCC 입니다. 

### MVCC (Multi Version Concurrency Control) 이란?

\- 일반적으로 레코드 레벨의 트랜잭션을 지원하는 DBMS가 제공하는 기능이며, MVCC의 가장 큰 목적은 잠금을 사용하지 않는 일관된 읽기를 제공하는데 있습니다.

\- MySQL의 InnoDB는 언두 로그 (Undo Log)를 이용하여 이 기능을 구현합니다.

좀 더 쉬운 이해를 위해 예시를 들자면, Table에 Insert 구문을 실행하면 데이터베이스의 상태는 아래 그림처럼 변경된다.

데이터 파일에 보이는 데이터와, InnoDB Buffer Pool 에 저장되는 데이터의 형태로 저장되며, 이는 사용자가 Select 구문을 수행하였을 때 김철수의 Region이 서울로 보일 것이다.

![](__MEDIA__/58e04def0b8be10c4e965cec549e3471a088940bb58411c8d4887f6e41cca8cc.png)

MVCC 설명

아래 Update 구문을 수행했다고 가정해보자. 

```
UPDATE TEST set Region = '경기' WHERE Name = '김철수';
```

UPDATE 구문이 실행되면, Commit 여부와는 관계없이 InnoDB Buffer Pool은 새로운 Update 값인 '경기' 로 업데이트 되고, Undo Log에 이전 데이터를 기록하게 된다.

여기서 실제 데이터 파일에는 체크포인트나, InnoDB 의 Write 스레드에 의해 Update 되었을 수도 있고, 업데이트 되지 않을 수도 있다. 보통 InnoDB가 ACID를 보장하기 때문에 Buffer Pool 과 데이터 파일은 동일한 상태로 봐도 무방하지만, 정확한 설명으로는 트랜잭션의 격리 수준에 따라서 다르다.

![](__MEDIA__/ce5613f889ea0e993d734840e80d1b35dd408d5ebdb9f831f56e39c678d05204.png)

MVCC 설명

### 트랜잭션 격리 수준이란?

트랜잭션의 신뢰성과 무결성을 보존하기 위해 중요한 4원칙인 ACID 중에서 Isolation, 격리 수준을 어느 정도로 유지할 지에 대한 설정값을 결정하는 요소 입니다.

따라서 설정된 격리 수준에 따라서 실제 데이터가 보여주는 값이 달라질 수도 있다는 의미입니다.

* * *

### 트랜잭션 격리 수준의 종류

1\. READ UNCOMMITTED

*   InnoDB 버퍼 풀이나 데이터 파일로부터 변경되지 않은 데이터를 읽어서 반환함. 즉, 데이터가 Commit 됐든 아니든 항상 변경된 상태의 데이터를 반환하는 형태이다.
*   매우 느슨한 형태의 트랜잭션 격리 수준이며, 만약 A 트랜잭션에서 Rollback 을 진행 할 경우 B 트랜잭션은 존재하지 않는 데이터를 바탕으로 로직을 처리하게 되어, 데이터 정합성에 문제가 발생할 수도 있음. 이렇게 쓰레기 데이터 를 읽는 현상을 Dirty Read라고 하며 일반적인 실무에서는 사용하지 않는 격리 수준

2\. READ COMMITTED

*   대부분의 RDBMS가 사용하는 트랜잭션 격리 수준으로, '커밋이 완료된 데이터만 읽는다.' 는 규칙이다.
*   만약, 데이터가 변경 되었더라도 Commit이 되지 않은 상태라면 Buffer Pool 이 아닌 Undo Log에 있는 Update 이전의 데이터를 불러 반환한다.
*   하지만, 다른 트랜잭션에서 Commit 을 수행하게 된다면 하나의 트랜잭션에서 똑같은 SELECT 쿼리를 수행하였는데 결과가 달라지는 Non-Repeatable Read 현상이 발견될 수 있다.

3\. REPEATABLE READ 

*   MySQL InnoDB 의 기본 격리 수준으로, Non-Repeatable Read 문제를 해결할 수 있는 수준이다.
*   트랜잭션이 시작될 때 자신만의 고유한 트랜잭션 ID를 부여 받고, 조회를 할 때 내 ID보다 먼저 시작된 트랜잭션이 커밋한 데이터만 읽는다는 기준 (Read View)을 정합니다. 
*   먼저 실행된 트랜잭션인 ID 10번의 트랜잭션에서, 만약 이후에 실행된 11번 트랜잭션이 실행중이라면 11번 트랜잭션이 Commit 되어도 10번 트랜잭션 이전의 시점을 Undo Log에서 찾아 항상 트랜잭션이 시작된 시점의 데이터를 읽을 수 있게 한다.
*   Non-Repeatable Read 현상이 발생하진 않으나, Phantom Read 같은 다른 트랜잭션이 새로운 데이터를 Insert 했을 때, 없던 데이터가 갑자기 발생하는 현상이 일어날 순 있다. (MySQL 의 InnoDB 엔진에서는 넥스트 키 락 등 독자적인 매커니즘으로 방지하고 있다.)

4\. SERIALIZABLE (직렬화)

*   여러 트랜잭션이 동시에 실행 되더라도, 한줄로 서서 순서대로 하나씩 실행되는 것 처럼 동작한다.
*   이 격리 수준은 가장 높은 수준의 격리 수준으로서, 간단한 SELECT 구문도 내부적으로 읽기 잠금으로 자동 변환되어 실행된다.
*   만약 Data를 SELECT 하고 있다면, 남들은 그 데이터를 수정 (UPDATE / INSERT) 할 수 없고, 다른 트랜잭션이 데이터를 수정 (UPDATE) 하고 있다면, 나는 Undo Log를 보는 대신 해당 트랜잭션이 종료될 때 까지 SELECT 쿼리도 대기해야한다.

아래는 간략하게 격리 수준에 맞춰 정리한 표입니다. 참고하면 좋을 것 같습니다.

![](__MEDIA__/35caca1d3512735f56ba46853346dd7a43633fa6b7db6e422cb9b1077ffcf681.png)

MVCC 격리 수준

## 정리

오늘은 MVCC 와 트랜잭션 격리 수준에 대해서 공부해 보았습니다.

대표적으로 4가지 격리 수준에 대해서 공부해보았지만, 실제로 SERIALIZABLE 같은 강력한 수준의 격리 수준은 실무에서 거의 사용하지 않습니다. 일반적으로 사용하는 Reapeatable Read 수준의 격리 정도를 사용하고 있고 이에 데이터 정합성과 성능 저하, Dead Lock을 방지하는 옵션도 각 RDBMS 별로 많이 조치되어 있습니다. 

다음번에는 DeadLock, Lock에 대해서 공부해보려고 합니다.