---
title: "[PostgreSQL] PITR과 WAL을 활용한 데이터 복구 이해"
date: "2026-11-09T02:38:17.000Z"
category: "Database | SQL | OS/PostgreSQL"
source: "https://hyungyun.tistory.com/entry/PostgreSQL-PITR%EA%B3%BC-WAL%EC%9D%84-%ED%99%9C%EC%9A%A9%ED%95%9C-%EB%8D%B0%EC%9D%B4%ED%84%B0-%EB%B3%B5%EA%B5%AC-%EC%9D%B4%ED%95%B4"
description: "1. 개요 데이터베이스를 운영하다 보면 잘못된 UPDATE 또는 DELETE 수행으로 인해 의도하지 않은 데이터가 변경되는 상황이 발생할 수 있습니다. 이러한 경우 백업을 활용하여 데이터를 복구할 수 있지만, 운영 DB 전체를 과거 "
---

## 1\. 개요

데이터베이스를 운영하다 보면 잘못된 UPDATE 또는 DELETE 수행으로 인해 의도하지 않은 데이터가 변경되는 상황이 발생할 수 있습니다.

이러한 경우 백업을 활용하여 데이터를 복구할 수 있지만, 운영 DB 전체를 과거 시점으로 복원하면 이후 발생한 정상 데이터까지 유실될 수 있습니다.

이번에는 PostgreSQL의 WAL(Write-Ahead Log)과 PITR(Point-in-Time Recovery)의 개념을 살펴보고, Amazon RDS for PostgreSQL 환경에서 잘못된 데이터가 변경되었을 때의 복구 방법을 정리해 보겠습니다.

※ 실제 장애 사례가 아닌 학습을 위한 가상 시나리오입니다.

MySQL 에서 특정 시점으로 복구를 진행한 게시글이 있어 함께 참고하면 좋을듯 하여 첨부합니다. 

위 게시글은 Aurora PostgreSQL 을 기준으로 작성하였습니다.

[참고 자료 · hyungyun.tistory.com](https://hyungyun.tistory.com/entry/AWS-Aurora-MySQL%EC%9D%98-%ED%8A%B9%EC%A0%95-%EC%8B%9C%EC%A0%90%EC%9C%BC%EB%A1%9C-%EB%B3%B5%EA%B5%AC)

* * *

## 2\. WAL(Write-Ahead Log)

WAL은 데이터베이스의 변경 사항을 실제 데이터 파일에 반영하기 전에 로그를 먼저 기록하는 방식입니다.

PostgreSQL에서는 WAL을 통해 트랜잭션의 내구성을 보장하고, 장애 발생 시 데이터베이스를 복구할 수 있습니다.

**WAL의 주요 역할**

*   장애 발생 시 WAL을 활용한 데이터 복구
*   COMMIT된 트랜잭션의 내구성 보장
*   PostgreSQL 스트리밍 복제 및 PITR에 활용

일반적으로 INSERT, UPDATE, DELETE 등의 변경 사항에 대한 WAL 레코드가 생성되며, COMMIT 과정에서 필요한 WAL이 영속 저장소에 기록됩니다.

이후 데이터 페이지가 디스크에 반영되기 전에 장애가 발생하더라도 WAL을 활용하여 필요한 변경 사항을 재적용할 수 있습니다.

참고로 PostgreSQL의 WAL과 MySQL의 Binary Log는 동일한 구조가 아닙니다. MySQL에서는 InnoDB Redo Log가 장애 복구에 사용되며, Binary Log는 주로 복제와 시점 복구에 활용됩니다.

## 3\. PITR(Point-in-Time Recovery)

PITR은 백업과 트랜잭션 로그를 활용하여 데이터베이스를 **복구 가능한 범위 내의 특정 시점으로 복원하는 기능**입니다.

Amazon RDS for PostgreSQL에서는 자동 백업을 활성화한 경우, 복구 가능한 시간 범위 내에서 PITR을 수행할 수 있습니다.

이때 PITR은 기존 운영 DB를 직접 변경하지 않고 별도의 Clone DB 인스턴스를 생성하는 방식으로 동작합니다.

### Snapshot과 PITR의 차이

구분SnapshotPITR

<table style="border-collapse: collapse; width: 100%;" border="1" data-ke-align="alignLeft"><tbody><tr><td><span>복구 시점</span></td><td><span>Snapshot 생성 시점</span></td><td><span>복구 가능한 범위 내 지정 시점</span></td></tr><tr><td><span>복구 방식</span></td><td><span>Snapshot을 이용한 복원</span></td><td><span>자동 백업 및 로그 기반 복원</span></td></tr><tr><td><span>RDS 복구 결과</span></td><td><span>신규 DB 인스턴스</span></td><td><span>신규 DB 인스턴스</span></td></tr></tbody></table>

Snapshot은 특정 시점의 데이터를 보관하는 데 유용하며, PITR은 잘못된 데이터 변경이 발생하기 직전의 상태를 복원해야 할 때 활용할 수 있습니다.

## 4\. 잘못된 UPDATE 발생 시 복구 방법

다음과 같은 상황을 가정하겠습니다.

시간발생 내용

<table style="border-collapse: collapse; width: 100%;" border="1" data-ke-align="alignLeft"><tbody><tr><td><span>09:00</span></td><td><span>정상적인 거래 발생</span></td></tr><tr><td><span>10:00</span></td><td><span>잘못된 UPDATE 수행 및 COMMIT</span></td></tr><tr><td><span>10:30</span></td><td><span>정상적인 거래 계속 발생</span></td></tr><tr><td><span>11:00</span></td><td><span>데이터 오류 발견</span></td></tr></tbody></table>

오전 10시에 WHERE 조건절이 누락된 UPDATE가 수행되었다고 가정하겠습니다.

```
UPDATE customer_accounts
SET account_status = 'INACTIVE';
```

이 경우 조건에 관계없이 모든 행의 상태가 변경될 수 있습니다.

단순히 운영 DB 전체를 오전 10시 이전으로 복원하여 교체한다면 잘못된 UPDATE는 제거할 수 있지만, 오전 10시 이후 정상적으로 처리된 거래 내역도 복원된 DB에는 존재하지 않습니다.

따라서 다음과 같은 방법을 고려할 수 있습니다.

1.  잘못된 UPDATE가 반영되기 이전 시점으로 PITR을 수행하여 별도 복구 인스턴스를 생성합니다.
2.  운영 DB와 복구 DB를 비교하여 잘못 변경된 데이터와 이후 정상 변경된 데이터를 식별합니다.
3.  업무 담당자와 복구 범위 및 데이터 정합성을 검증합니다.
4.  검증된 데이터를 기준으로 필요한 부분만 선택적으로 복구합니다.

특히 금융 시스템에서는 거래 원장이나 잔액 등 연관된 데이터의 정합성이 중요하므로, 과거 데이터를 단순히 덮어쓰는 방식은 주의해야 합니다.

또한 RDS의 PITR은 별도 인스턴스를 생성하는 기능이며, **특정 행만 자동으로 복구하는 기능은 아닙니다.** 필요한 데이터의 식별과 선택적 복구는 별도로 수행해야 합니다.

## 5\. 정리

PostgreSQL의 WAL은 트랜잭션 내구성과 장애 복구를 지원하며, PITR은 백업과 로그를 활용하여 특정 시점의 데이터베이스를 복원하는 데 사용됩니다.

잘못된 UPDATE가 발생한 경우 PITR을 활용하여 과거 시점의 데이터를 확보할 수 있지만, 이후 정상적인 거래가 발생했다면 운영 DB 전체를 과거 상태로 교체하는 것은 적절하지 않을 수 있습니다.

따라서 **별도의 PITR 복구 인스턴스를 생성하고, 정상 거래를 유지하면서 잘못 변경된 데이터만 선택적으로 복구하는 방법**을 고려해야 합니다.

데이터 복구 시에는 단순히 복원 기능의 사용 여부뿐만 아니라 정상 거래 보존과 데이터 정합성까지 함께 확인하는 것이 중요합니다.

* * *

### 참고 문서

*   [AWS — DB 인스턴스를 지정된 시간으로 복원](https://docs.aws.amazon.com/ko_kr/AmazonRDS/latest/UserGuide/USER_PIT.html)
*   [PostgreSQL — Write-Ahead Logging](https://www.postgresql.org/docs/current/wal-intro.html)
*   [PostgreSQL — Continuous Archiving and PITR](https://www.postgresql.org/docs/current/continuous-archiving.html)