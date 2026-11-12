---
title: "[Oracle] 인덱스 생성 전후 실행계획 비교 및 Index Skip Scan 실습"
date: "2026-11-12T07:33:01.000Z"
category: "Database | SQL | OS/Oracle"
source: "https://hyungyun.tistory.com/entry/Oracle-%EC%9D%B8%EB%8D%B1%EC%8A%A4-%EC%83%9D%EC%84%B1-%EC%A0%84%ED%9B%84-%EC%8B%A4%ED%96%89%EA%B3%84%ED%9A%8D-%EB%B9%84%EA%B5%90-%EB%B0%8F-Index-Skip-Scan-%EC%8B%A4%EC%8A%B5"
description: "1. 개요 요즘 SQLP 자격증 취득을 위해 친절한 SQL 튜닝을 공부하면서 인덱스의 수직적 탐색과 수평적 탐색, Access Predicate와 Filter Predicate에 대해 학습하다, 추후에 기록해두면 좋을 것 같아 내용을"
---

## 1\. 개요

요즘 SQLP 자격증 취득을 위해 친절한 SQL 튜닝을 공부하면서 인덱스의 수직적 탐색과 수평적 탐색, Access Predicate와 Filter Predicate에 대해 학습하다, 추후에 기록해두면 좋을 것 같아 내용을 기록해봅니다.

이번에는 실제 Oracle 환경에서 인덱스를 생성하고, 실행계획이 어떻게 달라지는지 확인해 보았습니다.

주요 실습 내용은 다음과 같습니다.

*   Full Table Scan과 Index Range Scan 비교
*   단일 인덱스 생성 전후 실행계획 확인
*   ROWID를 이용한 테이블 접근 방식
*   복합 인덱스의 컬럼 순서에 따른 차이
*   Index Skip Scan 발생 원인 분석

## 2\. 테스트 환경

Amazon RDS for Oracle 환경에서 실습을 진행했습니다.

<table style="border-collapse: collapse; width: 100%;" border="1" data-ke-align="alignLeft"><tbody><tr><td>항목</td><td>환경</td></tr><tr><td><span>DBMS</span></td><td><span>Amazon RDS for Oracle Enterprise Edition</span></td></tr><tr><td><span>인스턴스</span></td><td><span>db.t3.small</span></td></tr><tr><td><span>테스트 계정</span></td><td><span>SQL_TUNING</span></td></tr><tr><td><span>테스트 테이블</span></td><td><span>LAB_ORDERS</span></td></tr><tr><td><span>데이터 건수</span></td><td><span>100,000건</span></td></tr></tbody></table>

실습을 위해 주문 데이터를 저장하는 LAB\_ORDERS 테이블을 생성했습니다.

```
CREATE TABLE LAB_ORDERS (
    ORDER_ID     NUMBER PRIMARY KEY,
    CUSTOMER_ID  NUMBER NOT NULL,
    ORDER_MONTH  NUMBER(6) NOT NULL,
    STATUS       VARCHAR2(10) NOT NULL,
    ORDER_DATE   DATE NOT NULL,
    AMOUNT       NUMBER(12,2),
    PADDING      VARCHAR2(100)
);
```

데이터는 총 100,000건을 생성했으며, CUSTOMER\_ID는 1,000개의 값이 반복되도록 구성했습니다.

따라서 특정 고객ID를 조회하면 약 100건의 데이터가 반환됩니다.

## 3\. Full Table Scan과 Index Range Scan 비교

### 3.1 인덱스 생성 전

먼저 CUSTOMER\_ID 컬럼에 인덱스가 없는 상태에서 조회를 진행했습니다.

```
SELECT /*+ gather_plan_statistics */
       ORDER_ID,
       CUSTOMER_ID,
       ORDER_MONTH
FROM LAB_ORDERS
WHERE CUSTOMER_ID = 100;
```

인덱스가 없는 상태에서는 TABLE ACCESS FULL 방식으로 데이터를 조회합니다.

![](__MEDIA__/3865e3faf014379a1bc0cbdd50e1188a780b9b6c4026de856e4e9fe623e40709.png)

Full Table Scan은 테이블 블록을 읽으면서 조건에 해당하는 데이터를 찾는 방식입니다.

이번 SQL은 100건만 반환하지만, 조건에 맞는 데이터를 찾기 위해 테이블의 전체 블록을 스캔해야 합니다.

### 3.2 단일 인덱스 생성

다음으로 CUSTOMER\_ID 컬럼에 단일 인덱스를 생성했습니다.

```
CREATE INDEX IDX_LAB_CUSTOMER
ON LAB_ORDERS(CUSTOMER_ID);
```

동일한 조건으로 SQL을 실행한 결과, 다음과 같은 실행계획을 확인했습니다.

![](__MEDIA__/7d5ff7d392e22b46904522cfbee4d6a3c6f2d31cff2d0fac1a63fdcd2cd16287.png)

인덱스를 생성한 이후에는 INDEX RANGE SCAN을 통해 조건에 해당하는 인덱스 엔트리를 탐색합니다.

이후 인덱스에 저장된 ROWID를 이용해 실제 테이블 블록에 접근합니다.

인덱스 탐색 과정은 다음과 같습니다.

1.  Root와 Branch 블록을 거쳐 조건에 해당하는 Leaf 블록을 탐색합니다.
2.  Leaf 블록에서 CUSTOMER\_ID = 100에 해당하는 인덱스 엔트리를 탐색합니다.
3.  인덱스에 저장된 ROWID를 이용해 테이블 데이터에 접근합니다.

이때 Root부터 Leaf 블록까지 찾아가는 과정을 **수직적 탐색**, Leaf 블록에서 조건에 해당하는 엔트리를 읽는 과정을 **수평적 탐색**이라고 합니다.

SQL 에서는 Index를 활용해 수평적 탐색을 최소화 하는 것이 주요한 튜닝 포인트 입니다.

### 3.3 실행계획 Cost 분석

인덱스 생성 후 확인한 실행계획은 다음과 같습니다.

<table style="border-collapse: collapse; width: 86.5106%;" border="1" data-ke-align="alignLeft"><tbody><tr><td style="width: 59.4186%;"><span>Operation</span></td><td style="width: 12.2093%;">Cost</td><td style="width: 14.5494%;"><span>Cardinality</span></td></tr><tr><td style="width: 59.4186%;"><span>SELECT STATEMENT</span></td><td style="width: 12.2093%;"><span>101</span></td><td style="width: 14.5494%;"><span>100</span></td></tr><tr><td style="width: 59.4186%;"><span>TABLE ACCESS BY INDEX ROWID BATCHED</span></td><td style="width: 12.2093%;"><span>101</span></td><td style="width: 14.5494%;"><span>100</span></td></tr><tr><td style="width: 59.4186%;"><span>INDEX RANGE SCAN</span></td><td style="width: 12.2093%;"><span>1</span></td><td style="width: 14.5494%;"><span>100</span></td></tr></tbody></table>

INDEX RANGE SCAN의 Cost는 1이지만, 상위 연산자인 TABLE ACCESS BY INDEX ROWID BATCHED의 Cost는 101로 나타났습니다.

이는 인덱스를 탐색하는 비용뿐 아니라 ROWID를 이용해 실제 테이블에 접근하는 비용까지 포함되기 때문입니다.

또한 실행계획의 Cost는 실제 I/O 횟수가 아닌 옵티마이저의 예상 비용입니다.

따라서 Cost만으로 성능을 판단하기보다는 Buffers, Reads, A-Rows 등의 실제 실행 통계를 함께 확인해야 합니다.

## 4\. 복합 인덱스와 Index Skip Scan

### 4.1 복합 인덱스 생성

이번에는 두 개의 컬럼으로 구성된 복합 인덱스를 살펴보겠습니다.

```
CREATE INDEX IDX_LAB_MONTH_CUST
ON LAB_ORDERS(ORDER_MONTH, CUSTOMER_ID);
```

해당 인덱스는 ORDER\_MONTH를 선두 컬럼으로 사용하고, 동일한 월 내에서 CUSTOMER\_ID 순서로 정렬됩니다.

복합 인덱스에서는 컬럼 순서에 따라 인덱스 탐색 범위가 달라질 수 있습니다.

특히 선두 컬럼에 동등 조건이 존재하는 경우 후행 컬럼까지 활용하여 탐색 범위를 좁히는 데 유리합니다.

![](__MEDIA__/bf848b55c2cdc6519fcac1ae40dc47f8ec4f9864ca031a2c37c5830c4bf2766a.png)

이렇게 복합 인덱스를 생성하여 인덱스의 선두 컬럼과 후행 컬럼까지 조회되면 더 높은 효율로 쿼리를 실행할 수 있습니다.

### 4.2 Index Skip Scan 확인

단일 인덱스를 삭제하고 복합 인덱스로 Skip Scan을 확인해보겠습니다. 다음 SQL을 실행하게 된다면, 

```
SELECT /*+ gather_plan_statistics */
    ORDER_ID,
    CUSTOMER_ID,
    ORDER_MONTH
FROM LAB_ORDERS
WHERE CUSTOMER_ID = 100;
```

실행 결과 다음과 같은 실행계획을 확인했습니다.

![](__MEDIA__/5a428f21b366f8d6bf8d905f3207e35670d280a821a0a5565096107ed9e4c8e7.png)

실행계획의 Cost와 Cardinality는 다음과 같습니다.

<table style="border-collapse: collapse; width: 88.7209%;" border="1" data-ke-align="alignLeft"><tbody><tr><td style="width: 64.7674%;"><span>Operation</span></td><td style="width: 10.1163%;">Cost</td><td style="width: 13.8371%;"><span>Cardinality</span></td></tr><tr><td style="width: 64.7674%;"><span>SELECT STATEMENT</span></td><td style="width: 10.1163%;"><span>104</span></td><td style="width: 13.8371%;"><span>100</span></td></tr><tr><td style="width: 64.7674%;"><span>TABLE ACCESS BY INDEX ROWID BATCHED</span></td><td style="width: 10.1163%;"><span>104</span></td><td style="width: 13.8371%;"><span>100</span></td></tr><tr><td style="width: 64.7674%;"><span>INDEX SKIP SCAN</span></td><td style="width: 10.1163%;"><span>4</span></td><td style="width: 13.8371%;"><span>100</span></td></tr></tbody></table>

일반적으로 복합 인덱스의 선두 컬럼에 동등 조건이 없으면 후행 컬럼을 이용한 효율적인 Range Scan이 어려울 수 있습니다.

하지만 Oracle은 이러한 상황에서 INDEX SKIP SCAN을 선택할 수 있습니다.

Skip Scan은 선두 컬럼의 서로 다른 값을 논리적인 구간으로 구분하고, 각 구간에서 후행 컬럼의 조건을 활용해 데이터를 탐색하는 방식입니다.

### 4.3 Index Skip Scan의 특징

Index Skip Scan은 다음과 같은 상황에서 효율적일 수 있습니다.

*   복합 인덱스의 선두 컬럼에 동등 조건이 없는 경우
*   선두 컬럼의 NDV가 낮은 경우 (카디널리티와 유사한 의미)
*   후행 컬럼의 검색 조건이 선택적인 경우

다만 선두 컬럼에 조건이 없다고 해서 항상 Skip Scan이 발생하는 것은 아닙니다.

옵티마이저는 데이터 분포와 통계를 바탕으로 접근 경로를 선택하므로, 실제 실행계획을 확인하는 것이 중요합니다.

## 5\. 정리

이번 실습에서는 단일 인덱스와 복합 인덱스를 이용해 Oracle의 인덱스 접근 방식을 확인했습니다.

단일 인덱스 생성 후에는 INDEX RANGE SCAN과 TABLE ACCESS BY INDEX ROWID 를 확인했으며, 인덱스 탐색 비용과 테이블 접근 비용이 구분된다는 점을 살펴보았습니다.

또한 복합 인덱스에서는 선두 컬럼에 동등 조건이 없더라도 INDEX SKIP SCAN이 선택될 수 있음을 확인했습니다.

인덱스가 존재한다고 항상 효율적인 실행계획이 만들어지는 것은 아닙니다. 조건절과 인덱스 컬럼 순서, 데이터 분포에 따라 접근 방식이 달라지므로 실행계획과 실제 I/O를 함께 분석해야 합니다.

다음에는 BETWEEN과 IN-LIST 조건을 비교하여 인덱스의 수평적 탐색 범위가 어떻게 달라지는지 실습할 예정입니다.