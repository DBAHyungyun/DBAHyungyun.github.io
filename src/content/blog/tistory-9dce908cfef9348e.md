---
title: "오라클 테이블과 옵티마이저"
date: "2025-06-13T07:35:07.000Z"
category: "Database | SQL | OS/Oracle"
source: "https://hyungyun.tistory.com/entry/%EC%98%A4%EB%9D%BC%ED%81%B4-%ED%85%8C%EC%9D%B4%EB%B8%94%EA%B3%BC-%EC%98%B5%ED%8B%B0%EB%A7%88%EC%9D%B4%EC%A0%80"
description: "오늘은 오라클의 테이블 구조를 설명하고 테이블을 생성하여, 데이터를 insert 하는 것과 오라클에서 SQL을 효율적으로 실행할 수 있는 실행 계획을 선택하는 옵티마이저에 대해서 알아보려고 합니다. 오라클의 테이블은 데이터를 저장하는"
---

오늘은 오라클의 테이블 구조를 설명하고 테이블을 생성하여, 데이터를 insert 하는 것과 오라클에서 SQL을 효율적으로 실행할 수 있는 실행 계획을 선택하는 옵티마이저에 대해서 알아보려고 합니다.

* * *

오라클의 테이블은 데이터를 저장하는 가장 기본적인 객채로, 여러가지 구성요소로 이루어져 있는데 이를 간단히 살펴보면,

*   컬럼 (Column) : 테이블의 각 열을 의미하며, 데이터 타입과 제약 조건을 가질 수 있음
*   로우 (Row) : 테이블에 저장되는 실제 데이터 단위 (레코드)
*   데이터 타입 (Data Type) :  각 칼럼에 저장 가능한 데이터의 유형을 지정 (예: VARCHAR2, NUMBER, NUMERIC, INT, DATA 등)
*   제약조건 (constraint) : 데이터의 무결성을 보장하는 규칙 (NOT NULL, PRIMARY KEY, UNIQUE, CHECK, FOREIGN KEY)
*   인덱스 (Index) : 검색 속도를 빠르게 하기 위해 사용하는 구조. 기본 인덱스와 복합 인덱스가 있음
*   파티션 (Partition) : 대용량 테이블의 성능 향상을 위해 데이터를 논리적으로 분할하는 기능
*   LOB,CLOB,BLOB 칼럼 : 대용량 텍스트, 바이너리 데이터 등을 저장하는 특별한 컬럼

이처럼 테이블은 여러가지 구성요소로 구성이 되어 있는데 실제 쿼리를 작성하여 테이블을 생성해보겠다.

```
CREATE TABLE Test_Table (
    employee_id   NUMBER(6)     PRIMARY KEY,
    first_name    VARCHAR2(20),
    last_name     VARCHAR2(25)  NOT NULL,
    email         VARCHAR2(100) UNIQUE,
    hire_date     DATE          NOT NULL,
    salary        NUMBER(8,2),
    department_id NUMBER(4)
);
```

위 쿼리문으로 실제 테이블을 생성한 뒤, 조회를 해보면 당연히 insert 된 데이터가 없어서 Row가 없다고 출력이 된다. (위에 Row를 참고해서 보면, 테이블에 실제로 저장되는 레코드 단위이다.) 

![](__MEDIA__/360748778276bcbd580cab78d7d4389bb9e653dcf9c2b1bc17dc4363347a773a.png)

Table 생성 후 조회

생성된 테이블에 대해서 desc 명령어를 활용해 확인해보면 컬럼의 Name과 NULL 여부, Type 까지 확인 할 수 있다. 

![](__MEDIA__/e6a304a93f185afafe0133f7a0af3b76dc558dc02b7e411362a70a899eff6ada.png)

테이블 desc 조회

이렇게 Data 를 Insert 해보았습니다. 그럼 아래 출력되는 값들이 Row가 되고 실제 테이블에 저장된 데이터가 됩니다. 

![](__MEDIA__/022e3f10ee047c88bbcbfc58424eb6351ecede9d10368a00f2cb4a1e8343cbe1.png)

테이블에 Insert 한 값

* * *

테스트는 간단한 테이블과 insert 문을 사용했지만, 실제로 테이블에는 정말 많은 데이터와 수많은 컬럼을 가진 복잡한 테이블이 많다. 이런 테이블을 어떤 인덱스, 어떤 방법으로 조회할지 가장 효율적인 방법을 찾도록 도와주는것이 오라클의 옵티마이저 기능이다.

오라클 옵티마이저 (Optimizer) : SQL을 가장 효율적으로 실행 할 수 있는 실행계획을 선택하는 Oracle의 핵심 기능이다.

쉽게 설명하면 Table 을 Full Scan 하는게 효율적인지, Index 를 활용하여 Index Range Scan을 진행하는것이 더 효율적인지 판단하는 기능이다. 

기존 옵티마이저는 2가지 종류로 실행계획을 결정하였는데, 현재는 비용을 기반으로한 CBO (Cost-Based Optimizer)를 사용한다.

CBO란 ? 비용 (Cost) 를 기반으로 실행계획을 선택하는 것으로, 최신 Oracle (10g) 에서 기본값으로 사용하는 방식이다.

CBO의 작동 방식으로는

*   통계정보를 기반으로 작동한다.
*   통계 정보는 DBMS\_STATS 패키지를 이용해 수집한다.
*   CBO는 가능한 실행계획을 생성한 후, 예상 I/O, CPU 사용량 등을 기준으로 비용 (Cost)를 계산하여 가장 효율적인 계획을 선택한다.

실제로 실행 계획을 보는 방법은 여러가지가 있는데, 툴을 사용하여 Auto Trace 하는 방법, Explan plan 명령어를 사용해서 확인하는 방법, 실제 쿼리를 실행한 직후 plan을 보는 방법이 있는데 툴을 사용하는 방법을 제외하고, 확인하는 방법 2가지 방법으로 확인해보려 합니다.

```
EXPLAIN PLAN FOR select * from Test_Table;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
```

위 쿼리를 입력하면, 실행하려는 Select 문에 대한 Explan Plan이 출력 됩니다. 실제로 실행할때에는, 실행하시려는 SELECT 문을 입력하시고 실행하시면 됩니다. Explain Plan For~ 구문은 쿼리를 실제로 실행하는건 아니고 만약 쿼리를 실행한다면 옵티마이저가 어떤 실행 계획을 선택할 지 예측합니다.

즉 예상 실행 계획을 생성할 뿐, 실제 데이터를 액세스하거나 처리하지 않습니다. 

\-> 옵티마이저가 판단한 경로를 PLAN\_TABLE 이라는 내부 테이블에 저장하여, 이를 DBMS\_XPLAN.DISPLAY() 명령어로 조회하는것일 뿐이라 실제 실행시 발생하는 환경에는 영향을 받지 않을 수 있습니다. 방금 생성한 테이블에 대해서 실행 계획을 조회하면 당연하게도 Table Ful Scan 이라는 실행 계획이 출력 되네요.

![](__MEDIA__/f25aad13558f15016d4e2718174bd5b4016d82d69d3def1848f4025c5f891d98.png)

EXPLAN PLAN

```
SELECT * FROM Test_Table;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR(NULL, NULL, 'ALLSTATS LAST'));
```

쿼리를 실제로 실행하여 볼 수 있는 DBMS\_XPLAN.DISPLAY\_CURSOR 를 활용하면 아래와 같은 결과가 나옵니다.

동일하게 Table Full Scan 하여 실행 되었음을 확인 가능합니다.

![](__MEDIA__/b5bebe52bcaa75707b3ce9c39de1cc5d66586c82d16766e51d4944d68db92275.png)

Explan Plan

이처럼 쿼리 튜닝 및 성능 개선에 필요한 옵티마이저도 간략하게 알아보았습니다. 옵티마이저는 통계정보를 기반으로 달라지기 때문에, 보통 운영 DB 환경에서는 통계정보를 잘, 자주 수집하지 않는 경우도 있습니다. 그 이유는 

1\. 수집 시간과 리소스의 부담 (자원 사용량의 부탐)

\- 대형 테이블 (수천만 ~ 수억의 Row) 의 경우 통계정보 수집은 굉장히 많은 CPU, I/O 자원을 사용합니다. 업무 시간에 진행할 경우 직접적인 DB 부하와 성능 저하가 발생 할 수 있어, 업무시간 외 PM 작업 등 야간에 진행하는 편입니다.

2\. 계획 변경의 리스크

\- 통계 정보를 수집하면, 옵티마이저가 실행 계획을 변경 할 수 있습니다. 때로는, 기존에 사용하던 실행 계획이 더 안정적인데 새로운 통계가 오히려 성능을 저하시키는 계획으로 변경될 여지가 있습니다.

극단적인 예로 Index가 있음에도 Table Full Scan을 하는 것 (하지만, 이런 경우는 거의 존재하지 않습니다. 극단적인 예 입니다.)

3\. Hint 등 고정된 실행 계획 사용

\- Hint 를 명시해주어 굳이 통계정보를 갱신할 필요가 없는 경우

이런 경우들이 있습니다. 하지만 이럼에도 불구하고 통계정보 수집은 필수적으로 필요한 작업이라고 생각합니다. 옵티마이저가 항상 맞는것은 아니지만, 실행계획을 올바르게 선택하기 위해서는 정확하고 최신의 통계정보를 갖고 있어야 하기 때문입니다.

다음에는 Index 와 Oracle 쿼리 튜닝에 관련된 부분을 더 공부해보도록 하겠습니다.