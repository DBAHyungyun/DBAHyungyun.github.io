---
title: "[MySQL] Aurora MySQL Deadlock 발생 원리 및 Performance Schema를 활용한 오류 SQL 추적"
date: "2026-11-26T05:00:56.000Z"
category: "Database | SQL | OS/MySQL | Maria"
source: "https://hyungyun.tistory.com/entry/MySQL-Aurora-MySQL-Deadlock-%EB%B0%9C%EC%83%9D-%EC%9B%90%EB%A6%AC-%EB%B0%8F-Performance-Schema%EB%A5%BC-%ED%99%9C%EC%9A%A9%ED%95%9C-%EC%98%A4%EB%A5%98-SQL-%EC%B6%94%EC%A0%81"
description: "안녕하세요. 이번에는 Aurora MySQL 환경에서 Deadlock(교착 상태)을 직접 발생시키고, performance_schema.events_statements_history_long을 활용해 오류 SQL을 확인하는 과정을 정"
---

안녕하세요. 이번에는 Aurora MySQL 환경에서 **Deadlock(교착 상태)을 직접 발생시키고,** **performance\_schema.events\_statements\_history\_long****을 활용해 오류 SQL을 확인하는 과정**을 정리해 보겠습니다.

일반적으로 Deadlock이 발생한 후에는 해당 SQL이 이미 종료되어 SHOW PROCESSLIST 등에서 확인되지 않을 수 있습니다.

이러한 상황에서 과거 Deadlock이 발생한 SQL을 추적할 수 있는지 확인하기 위해 테스트를 진행했습니다.

## 1\. Deadlock이란?

Deadlock은 두 개 이상의 트랜잭션이 서로 상대방이 보유한 Lock을 기다려 작업을 진행하지 못하는 상태를 의미합니다.

InnoDB는 Deadlock을 감지하면 하나의 트랜잭션을 Victim으로 선정하여 Rollback합니다.

**Lock Wait Timeout과 Deadlock의 차이**

<table style="border-collapse: collapse; width: 100%;" border="1" data-ke-align="alignLeft"><tbody><tr><td>구분</td><td><span>Lock Wait Timeout</span></td><td><span>Dead Lock</span></td></tr><tr><td><span>원인</span></td><td><span>다른 트랜잭션의 Lock 해제 대기</span></td><td><span>트랜잭션 간 순환 대기</span></td></tr><tr><td><span>MySQL Error</span></td><td><span>1205</span></td><td><span>1213</span></td></tr><tr><td><span>SQLSTATE</span></td><td><span>HY000</span></td><td><span>40001</span></td></tr><tr><td><span>기본 Rollback</span></td><td><span>실패한 Statement</span></td><td><span>Victim 트랜잭션 전체</span></td></tr></tbody></table>

예를 들어 다음과 같은 상황에서 Deadlock이 발생할 수 있습니다.

```
Session A                    Session B
─────────                    ─────────
ID = 1 X Lock 보유           ID = 2 X Lock 보유
        ↓                            ↓
ID = 2 UPDATE 시도           ID = 1 UPDATE 시도
        ↓                            ↓
Session B 대기               Session A 대기

        ↔ DEADLOCK 발생
```

두 트랜잭션이 서로 상대방의 Lock을 기다리는 DeadLock 즉 순환 대기가 발생한 것입니다.

## 2\. 실습 환경 및 Performance Schema 설정

이번 테스트는 Aurora MySQL의 InnoDB 환경에서 진행했으며, SQL Client는 DBeaver를 사용했습니다.

먼저 Performance Schema에서 Statement 이력을 수집하는지 확인했습니다.

```
SHOW VARIABLES
WHERE Variable_name IN (
    'performance_schema',
    'performance_schema_events_statements_history_long_size',
    'innodb_deadlock_detect'
);
```

확인 당시 performance\_schema\_events\_statements\_history\_long\_size가 0으로 설정되어 있어 **10,000으로 변경**했습니다.

해당 파라미터는 저장할 Statement 이벤트의 최대 건수를 지정하며, DB Parameter Group 을 수정하고, **정적 파라미터**로서 인스턴스가 재시작 되어야 적용됩니다. 

![](__MEDIA__/a67fb63044937437ec623d186ea03e4abea5cbb2af50276d29c22f6291df7fa6.png)

추가로 events\_statements\_history\_long Consumer가 활성화되어 있는지도 확인했습니다.

```
SELECT NAME, ENABLED
FROM performance_schema.setup_consumers
WHERE NAME IN (
    'events_statements_current',
    'events_statements_history_long'
);
```

events\_statements\_history\_long이 비활성화된 경우 다음과 같이 설정할 수 있습니다.

```
UPDATE performance_schema.setup_consumers
SET ENABLED = 'YES'
WHERE NAME = 'events_statements_history_long';
```

단, 상위 Consumer 및 statement/sql/update Instrument도 활성화되어 있어야 정상 수집이 가능합니다.

![](__MEDIA__/8bbb2a41d5f8bcad10ce796c03ef64847f337a2068812407560dda860c54a427.png)

## 3\. Deadlock 테스트 테이블 생성

두 트랜잭션이 서로 다른 레코드에 Lock을 획득하도록 테스트 테이블과 데이터를 생성했습니다.

```
USE bg_test;

CREATE TABLE ps_deadlock_demo (
    id INT NOT NULL,
    account_name VARCHAR(50) NOT NULL,
    balance INT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
               ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE = InnoDB;

INSERT INTO ps_deadlock_demo
    (id, account_name, balance)
VALUES
    (1, 'ACCOUNT_A', 1000),
    (2, 'ACCOUNT_B', 2000);

COMMIT;
```

초기 데이터는 다음과 같습니다.

<table style="border-collapse: collapse; width: 100%; height: 44px;" border="1" data-ke-align="alignLeft"><tbody><tr><td style="width: 12.5581%;">ID</td><td style="width: 39.5349%;"><span>ACCOUNT_NAME</span></td><td style="width: 47.7907%;"><span>BALANCE</span></td></tr><tr style="height: 17px;"><td style="height: 17px; width: 12.5581%;"><span>1</span></td><td style="height: 17px; width: 39.5349%;"><span>ACCOUNT_A</span></td><td style="height: 17px; width: 47.7907%;"><span>1,000</span></td></tr><tr style="height: 17px;"><td style="height: 17px; width: 12.5581%;"><span>2</span></td><td style="height: 17px; width: 39.5349%;"><span>ACCOUNT_B</span></td><td style="height: 17px; width: 47.7907%;"><span>2,000</span></td></tr></tbody></table>

![](__MEDIA__/f62441eceef65a61e8262c8eacac368d85ba4b620758a76261dc39b1ad059bc5.png)

## 4\. 두 세션에서 Deadlock 재현

DBeaver에서 서로 다른 DB 연결 두 개를 사용했습니다.

CONNECTION\_ID()를 통해 각 세션이 독립된 연결인지 확인하고, Auto Commit을 비활성화한 후 테스트했습니다.

```
SELECT CONNECTION_ID(), @@autocommit;
```

### ① Session A — ID 1 UPDATE

```
START TRANSACTION;

UPDATE bg_test.ps_deadlock_demo
SET balance = balance + 100
WHERE id = 1;
```

COMMIT하지 않고 ID 1번 레코드의 X Lock을 유지합니다.

### ② Session B — ID 2 UPDATE

```
START TRANSACTION;

UPDATE bg_test.ps_deadlock_demo
SET balance = balance + 200
WHERE id = 2;
```

마찬가지로 COMMIT하지 않습니다.

이제 Session A는 ID 1, Session B는 ID 2의 Lock을 각각 보유한 상태입니다.

### ③ Session A — ID 2 UPDATE

```
UPDATE bg_test.ps_deadlock_demo
SET balance = balance + 100
WHERE id = 2;
```

Session B가 ID 2의 Lock을 보유하고 있으므로 Session A는 Lock Wait 상태에 들어갑니다.

이 상태에서 쿼리가 종료될 때까지 기다리지 않고 Session B에서 다음 SQL을 실행합니다.

### ④ Session B — ID 1 UPDATE

```
UPDATE bg_test.ps_deadlock_demo
SET balance = balance + 200
WHERE id = 1;
```

Session B 또한 Session A가 보유한 ID 1의 Lock을 획득하려고 시도하면서 순환 대기가 발생합니다.

그 결과 실제로 다음과 같은 Deadlock 오류가 반환되었습니다.

```
SQL Error [1213] [40001]:
Deadlock found when trying to get lock;
try restarting transaction
```

![](__MEDIA__/fbf3096aba44812e0fd6996116da3a89461050008fb7a4dd5dcf642ec3941711.png)

InnoDB가 Deadlock을 감지하고 한 트랜잭션을 Rollback하면서 교착 상태가 해소된 것입니다.

테스트 종료 후에는 두 세션에서 ROLLBACK을 수행하여 남아 있는 트랜잭션과 잠금을 정리했습니다.

## 5\. Performance Schema에서 Deadlock SQL 확인

이제 이번 테스트의 핵심인 오류 SQL 이력을 확인했습니다.

```
SELECT
    THREAD_ID,
    EVENT_ID,
    MYSQL_ERRNO,
    RETURNED_SQLSTATE,
    MESSAGE_TEXT,
    ERRORS,
    SQL_TEXT
FROM performance_schema.events_statements_history_long
WHERE MYSQL_ERRNO = 1213
ORDER BY TIMER_START DESC
LIMIT 20;
```

**실제 조회 결과**

![](__MEDIA__/b4508fa5559f0cfd5013edd607681cf81dac956f40c741523909b0df5980d9a0.png)

Deadlock 발생 당시의 오류 SQL이 정상적으로 기록된 것을 확인했습니다.

특히 다음 항목으로 오류를 확인할 수 있습니다.

*   MYSQL\_ERRNO = 1213: Deadlock 발생
*   RETURNED\_SQLSTATE = 40001: Deadlock 관련 SQLSTATE
*   ERRORS = 1: 해당 Statement에서 오류 발생
*   SQL\_TEXT: 오류를 반환한 UPDATE 구문

이처럼 SQL 실행이 이미 종료된 이후에도 이력이 남아 있다면 Performance Schema를 통해 실패한 SQL을 확인할 수 있습니다.

## 6\. events\_statements\_history\_long의 보존 방식과 한계

추가로 events\_statements\_history\_long의 데이터 건수를 확인했습니다.

```
SELECT COUNT(*)
FROM performance_schema.events_statements_history_long;
```

조회 결과는 **10,000건**으로 계속 유지되었습니다.

![](__MEDIA__/4a6b347292aa72ca3b21af1d0fdde9e12e9419add17aebd0f9bfefdd7683afc5.png)

이는 events\_statements\_history\_long이 고정 크기의 **Circular Buffer(순환 버퍼)** 방식으로 동작하기 때문입니다.

```
최대 보관량: 10,000건
        ↓
새로운 Statement 기록
        ↓
가장 오래된 이벤트 제거
        ↓
새로운 이벤트 저장

총 10,000건 유지
```

여기서 중요한 점은 Deadlock 오류뿐 아니라 정상적으로 수행된 SQL도 저장된다는 것입니다.

즉, 새로운 오류가 발생하지 않더라도 일반적인 SELECT, INSERT, UPDATE 등이 계속 기록되면 기존 Deadlock 이력은 사라질 수 있습니다.

따라서 SQL 실행량이 많은 운영 환경에서 과거 Deadlock을 장기적으로 추적하기에는 한계가 있습니다.

Deadlock에 참여한 트랜잭션의 잠금 관계는 다음 명령어로 추가 분석할 수 있습니다.

```
SHOW ENGINE INNODB STATUS;
```

또한 장기적인 Deadlock 추적이 필요하다면 innodb\_print\_all\_deadlocks를 활성화하여 Error Log에 기록하고, CloudWatch Logs나 S3로 이관시켜 로그 데이터를 보관하는 방법도 검토할 수 있습니다.

## 7\. 마무리

이번 실습에서는 Aurora MySQL에서 의도적으로 Deadlock을 발생시키고, performance\_schema.events\_statements\_history\_long에 오류 SQL이 기록되는지 확인했습니다.

두 트랜잭션에서 서로 다른 레코드에 Lock을 획득한 후 교차 UPDATE를 수행하여 **Deadlock 오류인** **1213****을 재현**했습니다.

이를 통해 Performance Schema에서 종료된 Deadlock SQL을 사후 추적할 수 있다는 점을 확인했습니다.

다만 events\_statements\_history\_long은 순환 버퍼 방식이므로 오래된 오류 이력이 사라질 수 있으며, Deadlock에 참여한 모든 트랜잭션의 잠금 관계까지 완전하게 제공하는 것은 아닙니다.

따라서 실제 운영 환경에서는 **Performance Schema와 InnoDB Deadlock 정보, Error Log를 함께 활용하는 것이 적절하다고 생각합니다.**

* * *

### 참고 문서

*   [MySQL — Deadlocks in InnoDB](https://dev.mysql.com/doc/refman/8.0/en/innodb-deadlocks.html)
*   [MySQL — An InnoDB Deadlock Example](https://dev.mysql.com/doc/refman/8.0/en/innodb-deadlock-example.html)
*   [MySQL — events\_statements\_history\_long Table](https://dev.mysql.com/doc/refman/8.0/en/performance-schema-events-statements-history-long-table.html)
*   [AWS — Aurora MySQL 기능 권장 사항](https://docs.aws.amazon.com/ko_kr/AmazonRDS/latest/AuroraUserGuide/AuroraMySQL.BestPractices.FeatureRecommendations.html)