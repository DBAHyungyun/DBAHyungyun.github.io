---
title: "[MySQL] MySQL 스토리지 엔진의 Lock (레코드 락, 갭 락, 네스트 키 락, 자동 증가 락)"
date: "2026-03-10T06:35:53.000Z"
category: "Database | SQL | OS/MySQL | Maria"
source: "https://hyungyun.tistory.com/entry/MySQL-MySQL-%EC%8A%A4%ED%86%A0%EB%A6%AC%EC%A7%80-%EC%97%94%EC%A7%84%EC%9D%98-Lock-%EB%A0%88%EC%BD%94%EB%93%9C-%EB%9D%BD-%EA%B0%AD-%EB%9D%BD-%EB%84%A4%EC%8A%A4%ED%8A%B8-%ED%82%A4-%EB%9D%BD-%EC%9E%90%EB%8F%99-%EC%A6%9D%EA%B0%80-%EB%9D%BD"
description: "오늘은 지난번에 공부한 MySQL 엔진 수준의 Lock에서 또 다른 잠금 수준인 스토리지 엔진 내부에서의 Lock 수준에 대해서 공부해보려고 합니다. 아래는 이전에 공부한 MySQL 엔진 수준의 Lock 링크이니 참고하면 좋을 것 같"
---

오늘은 지난번에 공부한 MySQL 엔진 수준의 Lock에서 또 다른 잠금 수준인 스토리지 엔진 내부에서의 Lock 수준에 대해서 공부해보려고 합니다.

아래는 이전에 공부한 MySQL 엔진 수준의 Lock 링크이니 참고하면 좋을 것 같습니다. 

 [참고 자료 · hyungyun.tistory.com](https://hyungyun.tistory.com/entry/MySQL-MySQL-%EC%97%94%EC%A7%84%EC%9D%98-Lock-%EC%88%98%EC%A4%80-%EA%B8%80%EB%A1%9C%EB%B2%8C-%EB%9D%BD-%ED%85%8C%EC%9D%B4%EB%B8%94-%EB%9D%BD-%EB%84%A4%EC%9E%84%EB%93%9C-%EB%9D%BD-%EB%A9%94%ED%83%80%EB%8D%B0%EC%9D%B4%ED%84%B0-%EB%9D%BD)

참고 서적 : Real MySQL 8.0, MySQL 공식 Community 

* * *

## InnoDB Storage 엔진 잠금이란?

InnoDB 스토리지 엔진은 MySQL에서 제공하는 잠금과는 별개로 스토리지 엔진 내부에서 레코드 기반의 잠금 방식을 탑재하고 있습니다. InnoDB는 레코드 기반의 잠금 방식 때문에 MyISAM 보다는 훨씬 뛰어난 동시성 처리를 제공할 수 있습니다. 

이전에는, SHOW ENGINE INNODB STATUS 명령으로만 RowLock을 확인하는 경우나, 직접 테이블을 생성하여 InnoDB의 잠금 정보를 Dump 하는 방법이 전부였지만 현재는 InnoDB의 트랜잭션과 잠금, 그리고 잠금 대기 중인 트랜잭션의 목록을 조회할 수 있는 방법이 도입됐습니다. MySQL 의 information\_schema 데이터베이스에 존재하는 InnoDB\_TRX, InnoDB\_LOCKS, InnoDB\_Lock\_WAITS 라는 테이블을 활용하여 어떤 트랜잭션이 잠금을 가지고 있는지, 장시간의 잠금을 가지고 있는 클라이언트를 찾아서 종료 시킬수도 있다.

오늘은 이 InnoDB Storage 엔진 잠금에 대해서 간단히 설명하고 Lock 을 찾아서 Kill 하는 쿼리까지 사용해볼까 합니다.

### 레코드 락 (Record Lock)

레코드 자체만을 잠그는 것을 레코드 락 (Record Lock, Record only Lock) 이라고 하며, 특정 레코드 (Row) 를 다른 트랜잭션이 동시에 수정 (Update) 하거나 삭제 (Delete) 하지 못하도록 잠금을 하는 일반적인 타 DBMS의 레코드 락과 동일한 역할을 합니다. 하지만, MySQL 에서는 레코드 자체가 아니라 인덱스의 레코드를 잠근다는 차이점이 존재하며, 인덱스가 하나도 없는 테이블이더라도 내부적으로 자동 생성된 클러스터 인덱스를 이용해 잠금을 설정합니다.   
  
참고) 내부적으로 자동 생성된 인덱스는 GEN\_CLUST\_INDEX 로 사용자가 어떤 인덱스를 생성하지 않아도 MySQL 엔진 내부적으로 Index를 생성해 냅니다. 조회하는 방법은 아래와 같습니다. 

```
select * from information_schema.INNODB_SYS_INDEXES where NAME = 'GEN_CLUST_INDEX'; 
-- MySQL

SELECT * FROM information_schema.INNODB_INDEXES where NAME = 'GEN_CLUST_INDEX';
-- Aurora MySQL
```

InnoDB의 잠금은 레코드를 잠그는 것이 아니라 인덱스를 잠그는 방식으로 처리 된다. 이 부분은 굉장히 중요한 부분인데 즉, 변경해야 할 레코드를 찾기 위해 검색한 인덱스의 레코드를 모두 락을 걸어야 한다. 

예를 들어, 인덱스가 존재하는 상황에서

사원 (Employee) 테이블에 10만명의 데이터가 있고, 사번 (emp\_no) 에 **기본키 (PK, PK 인덱스)** 가 설정되어 있다고 가정했을 때 아래 쿼리를 수행하면 PK 인덱스인 emp\_no 인덱스를 수행하며 사번이 1004인 직원을 찾게 됩니다.

```
-- 사번이 1004인 직원의 월급을 올려주는 쿼리
UPDATE employee SET salary = 5000 WHERE emp_no = 1004;
```

이 과정속에서 1004번 직원 1개의 인덱스 레코드에만 잠금을 수행하고 다른 99,999 행의 대해서는 잠금을 수행하지 않습니다.

다만, 인덱스가 존재하지 않는 상황에서

인덱스가 존재하지 않는 dept\_name 컬럼을 조건으로 설정하여 UPDATE 를 진행하는 경우에는 

```
-- 부서가 '영업부'인 직원의 월급을 올려주는 쿼리
UPDATE employee SET salary = 5000 WHERE dept_name = '영업부';
```

dept\_name 컬럼에 인덱스가 존재하지 않으므로, InnoDB는 1번 직원부터 10만명의 직원까지 모든 데이터를 하나하나 뒤지면서 찾아보는 Table FULL Scan을 진행해야 합니다. 이런 과정속에서 조건에 맞는 데이터가 아님에도 Table Full Scan을 통한 10만개 컬럼 모두 잠금이 발생하게 됩니다.

결과적으로 인덱스가 존재하지 않는 상황에서 인덱스가 존재하는 Update 구문을 수행하더라도 이 쿼리는 수행되지 못하고 Lock Wait 상태로 변경됩니다. 

사실 이러한 내용은 Data 가 적은 테스트 환경에서 발현하기 어렵습니다. Update 구문을 수행할 때 Index가 없는 테이블을 수정했더라도 테이블에 데이터가 적은 경우 굉장히 빠른 속도로 구문이 수행되기 때문입니다. 하지만, 운영환경의 테이블의 크기가 큰 경우나 동시성이 중요한 테이블인 경우 초당 쿼리가 쏟아지는 환경에서는 주의해야합니다.

### 갭락 (Gap Lock)

타 DBMS (Oracle, MS-SQL) 등에는 없고, MySQL InnoDB 에만 존재하는 잠금인 갭락은, 레코드 자체의 잠금이 아닌, 레코드와 바로 인접한 레코드 사이의 간격만을 잠그는 것을 의미합니다. 일전에 설명했던 트랜잭션 격리 수준 중 REPEATABLE READ 상태에서 팬텀 리드 (Phantom Read, 없던 데이터가 갑자기 나타나는 현상) 을 방지하기 위해 필요한 잠금입니다.

예를 들어 내가 10번~20번 데이터를 조회하고 있을 때, 다른 트랜잭션이 10번과 20번 사이에 새로운 데이터를 INSERT 하지 못하도록 바리케이드를 치는 역할을 합니다.

### 넥스트 키 락 (Next Key Lock)

레코드 락과 갭 락을 합쳐 놓은 형태의 잠금을 넥스트 키 락 (Next key Lock) 이라고 합니다. 특정 레코드 자체를 잠그면서, 동시에 그 레코드 앞뒤의 빈 공간 (Gap) 까지 함께 묶어서 잠급니다. InnoDB 데이터를 변경할 때 기본적으로 넥스트 키 락을 사용하며 데이터가 수정되거나 추가되는 것을 막고 정합성을 보장합니다.

하지만, 넥스트 키 락과 갭 락으로 인해 데드락이 발생하거나 다른 트랜잭션을 기다리게 만드는 일이 자주 발생하여, 가능하다면 바이너리 로그 포맷을 ROW 형태로 바꾸어 넥스트 키 락이나 갭 락을 줄이는 것이 좋습니다.

### 자동 증가 락 (Auto-Increment Lock)

자동 증가 락 (Auto-Increment Lock)을 명시적으로 획득하고 해제하는 방법은 없고, 테이블에 Auto\_Increment 컬럼이 존재할 때 발생하게 됩니다. 예를들어 여러 트랜잭션이 동시에 Insert 를 수행할 때 중복되지 않은 순차적인 숫자를 부여하기 위해 임시적으로 걸리는 락입니다.

Auto\_Increment 락은 아주 짧은 시간동안 걸렸다가 해제되는 자금이라서 대부분의 경우 문제가 되지 않습니다. 자동 증가 락에 대한 설명은 MySQL 5.0 이하 버전인 예전 버전엣서 사용하던 방식이고, MySQL 5.1 버전 이상부터는 innodb\_autoinc\_lock\_mode 라는 시스템 변수를 이용해 자동 증가 락의 작동 방식을 변경할 수 있습니다. 

## Lock 발생시 확인 방법

본문에 기재된 내용대로, Lock 확인시 InnoDB\_TRX, InnoDB\_LOCKS, InnoDB\_Lock\_WAITS 라는 테이블을 활용하여 Lock의 정보를 확인할 수 있습니다.

Lock 발생 방법은 Oracle 로 테스트한 방법이 있으니 참고하시면 좋을 것 같습니다. (트랜잭션 및 실행 과정은 거의 흡사합니다.)

 [참고 자료 · hyungyun.tistory.com](https://hyungyun.tistory.com/entry/Oracle-Lock-%EC%9D%98-%EC%A0%95%EC%9D%98%EC%99%80-Lock-Test)

Lock 테스트 과정

1\. Dbeaver Session을 3개 띄워 놓는다.

2\. Manual Commit 상태에서, Update 구문을 수행하고 Commit 되지 않은 테이블을 다른 Session 에서 Update 진행한다.

3\. 경합 상태에 놓여져 있는 세션을 확인하여 Kill 처리 한다.

### Lock Test

Lock 상태에서 Innodb\_trx 를 조회하는 경우 간략하게 trx\_state 에서 LOCK WAIT 트랜잭션을 확인할 수 있습니다. 하지만 Lock Holder 와 Waiter 의 정보는 확인할 수 없습니다. 

![](__MEDIA__/966904527543c94070b7db5c60ab2a69cec3997d115995b924bf445860026d62.png)

innodb\_trx 테이블을 조회한 결과

Innodb\_Locks 테이블을 조회하는 경우에는 lock\_type과 lock\_table, lock\_index 까지 출력 됩니다.

아래 결과를 보면 위에서 설명했던 것과 같이 PK 인덱스 및 다른 인덱스가 존재하지 않아 GEN\_CLUST\_INDEX 잠금이고 Record Lock 상태임을 알 수 있습니다. 

![](__MEDIA__/8ecbafdfe97ebe5e0370280aa589d9c886696bcdc260f23389fd4a5b7a5e5274.png)

innodb\_locks table 테이블 조회 결과

Innodb\_lock\_waits 테이블을 조회하는 경우에는 blocking\_trx\_id 와 requesting\_trx\_id 를 확인할 수 있습니다. blocking\_trx\_id 의 경우에는 Lock을 잡고 있는 Lock Holder 의 경우이고 requesting\_trx\_id 는 Lock Waiter Session  입니다.

![](__MEDIA__/03272e98aa7483358b9f71093f4755e09f32dae6dae9ac16aa2c4e356652ecc4.png)

innodb\_lock\_waits 테이블 조회 결과

하지만 실제 Lock Session을 Kill 하기 위해서는, Thread ID를 조회하여 Kill을 해야합니다. 

innodb\_lock\_waits 쿼리와 innodb\_trx 쿼리를 활용하여, Join 하게 되면 아래와 같은 결과를 확인할 수 있으며 blocking\_thread 를 구하여 Kill 하면 됩니다. 

```
SELECT 
    r.trx_id AS waiting_trx_id,
    r.trx_mysql_thread_id AS waiting_thread,
    r.trx_query AS waiting_query,
    b.trx_id AS blocking_trx_id,
    b.trx_mysql_thread_id AS blocking_thread,
    b.trx_query AS blocking_query
FROM information_schema.innodb_lock_waits w
INNER JOIN information_schema.innodb_trx b ON b.trx_id = w.blocking_trx_id
INNER JOIN information_schema.innodb_trx r ON r.trx_id = w.requesting_trx_id;
```

아래 파란색 waiting\_thread는 Lock Waiter 이고, 빨간색 blocking\_thread 는 Lock Holder 입니다.

![](__MEDIA__/6445a07694a0cf84102b463130e411b5c2c2301bf076618251ca4d9cf138ad18.png)

Lock Holder, Waiter 조회

## 마무리

이렇게 MySQL Storage Lock에 대해서 공부해보았습니다. 간단하게 Lock 을 발생시키고 조회하는 방법, Kill 하는 방법도 함께 공부해보았습니다. 

다음번에는 DeadLock 에 대해서 공부해보겠습니다.