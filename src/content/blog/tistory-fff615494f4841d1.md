---
title: "[MySQL] Performance Schema, Information Schema 란?"
date: "2026-03-13T05:00:42.000Z"
category: "Database | SQL | OS/MySQL | Maria"
source: "https://hyungyun.tistory.com/entry/MySQL-Performance-Schema-Information-Schema-%EB%9E%80"
description: "이번에는 MySQL 에서 성능정보를 파악하고, 확인하는데 가장 중요한 스키마인 Information_Schema 와 Performance_Schema를 공부해볼까 합니다. 사실 가장 기본이 되는 내용이고, MySQL, Maria 에서"
---

이번에는 MySQL 에서 성능정보를 파악하고, 확인하는데 가장 중요한 스키마인 Information\_Schema 와 Performance\_Schema를 공부해볼까 합니다.

사실 가장 기본이 되는 내용이고, MySQL, Maria 에서 Trouble Shooting 에는 절대 빠지지 않는 내용입니다. 

아래는 Information\_schema, Performance\_schema 에 대한 공식 문서이고 아래 정리하는 내용들과 참고해서 보면 좋을 것 같습니다. 

 [참고 자료 · dev.mysql.com](https://dev.mysql.com/doc/refman/9.6/en/performance-schema.html)

 [참고 자료 · dev.mysql.com](https://dev.mysql.com/doc/refman/8.4/en/information-schema.html)

* * *

## 개요

DB에 장애가 발생하거나, 어플리케이션에 문제가 발생하면 모니터링 솔루션을 활용하는 경우 모니터링 프로그램을 활용할 수 있지만, 모니터링 툴에 익숙하지 않거나 가공되지 않은 MySQL의 원본 데이터를 보기 위해서는 Information\_Schema와 Performance\_schema를 참고해야 합니다.

이 두가지 스키마는 장애를 추적할 때 사용하거나, 내부적으로 저장된 오브젝트 들을 조회한다는 점에서 공통점이 있지만 근본적으로 다른 두 스키마의 역할과 결정적인 차이점, 그리고 실무에서 장애를 파악/추적할 때 어떤식으로 활용할 수 있는지 공부해보겠습니다.

## Information\_Schema란?

Information\_Schema는 MySQL 데이터베이스의 메타데이터 (Metadata) 즉, 사전적의미로 데이터를 설명하기 위한 데이터이자, 데이터를 보관하고 있는 데이터베이스입니다. 

*   핵심 역할 : 데이터 베이스 또는 테이블 이름, 열의 데이터 유형, 접근 권한과 같은 MySQL 서버에 대한 정보를 포함하는 Data Dictionary 역할도 함께 하고 있습니다.
*   표준 여부 : ANSI SQL을 표준으로 하여, MySQL 뿐 아니라 PostgreSQL, MS-SQL 에서도 information\_schema Database를 사용하고 있습니다. 
*   주요 데이터 : 주요 데이터는 Database의 정보, 오브젝트의 정보 등 사전의 형태처럼 데이터베이스의 information을 담고 있는 스키마라고 생각하면 될 것 같습니다.

![](__MEDIA__/0a7b64d650590c010bd3979d374169f950ce560ea7fa3caac39008ff08c178e7.png)

공식문서에 나와있는 Information\_Schema Table

위 캡처 사진 처럼 Information\_schema 테이블에는 굉장히 많은 테이블이 존재합니다. 이중에서도 단적인 예시로, 생성된 Table에 대한 정보를 확인하고 싶다면 아래 쿼리로 확인할 수 있다. 

아래 테이블을 조회하고, 조건을 지정해주어 실제로 원하는 테이블에 대한 메타데이터 정보를 알 수 있으며, TABLE\_ROWS, DATA\_LENGTH 등 테이블 데이터 정보들도 출력됩니다. 

```
SELECT * FROM INFORMATION_SCHEMA.TABLES;
```

![](__MEDIA__/5fa0ea7cdfbd8046d18d5e90fc5d643e8094f52473989e3781ef8569b86b4477.png)

Information\_schema의 테이블 조회

## Performance Schema란?

Performance\_Schema는 Database 내부에서 발생하는 모든 이벤트를 기록하고, 서버를 이벤트를 모니터링 하기 위한 목적으로 생성된 스키마 입니다. 성능 스키마는 정보 제공을 목적으로 하는 Information\_Schema 와는 성격이 다르고 오로지 성능 데이터를 중점으로 사용자에게 제공하는 역할을 합니다.

*   핵심 역할 : 특정 쿼리가 실행되는데 자원을 얼마나 많이 사용하였는지, 디스크를 얼마나 읽었는지 Lock을 유발하는 트랜잭션은 무엇인지, 동적인 성능 지표를 수집하고 사용자에게 제공합니다.
*   특징 : 수집된 이벤트는 데이터베이스의 테이블에 저장되지만, 기본적으로 성능 스키마의 테이블은 디스크에 영구 저장 공간을 사용하지 않는 메모리 내 테이블로, 서버 시작 시 내용이 새로 채워지고 서버 종료 시 휘발됩니다.
*   주요 데이터 : 서버 이벤트를 모니터링하지만, 이벤트란 서버에서 소요되는 모든 작업을 의미하고, 일반적으로 함수 호출, Lock, SQL 실행 구문, 파일 및 데이블 I/O 등 여러가지 이벤트를 수집합니다.

Performance\_Schema를 사용하려면 파라미터에서 설정해 ON으로 변경해야 합니다. 성능 정보를 수집하더라도 데이터베이스에 미치는 영향 자체가 굉장히 미비하기 때문에 꼭 설정하는 것을 추천드립니다. 

![](__MEDIA__/f5753259b4f37e786b0890dd98746a8332f3add544e268ee185839499e5f471a.png)

performance\_schema 활성화

실제로 performance\_schema의 events\_statements\_summary\_by\_digest 테이블을 참조해서 SQL 수행 횟수, Index 사용 여부, 실행 시간을 확인할 수 있습니다. 현재의 대부분의 DB 모니터링 솔루션은 해당 시스템 테이블을 사용한다고 봐도 무방합니다.

전체 데이터를 조회할 경우 아래와 같이 출력됩니다. 

![](__MEDIA__/6f4117e9ca094aefb9c9d669a22febafd08f5f476d03eba87daa4fc7bf0a989e.png)

events\_statements\_summary\_by\_digest 조회 결과

위 테이블에서는 실행된 SQL 문장 이벤트들을 통계로 요약해서 보여줍니다. Literal 한 상수 값으로 표현하지 않고, 상수나 문자열을 모두 ? 로 치환하여 바인드 처리한 상태로 요약해서 보여주는데 쿼리들이 평균 시간이 얼마나 걸렸는지, 실행 횟수는 어느정도 인지 파악하기 좋은 테이블입니다.

보통 위 테이블에서 중요하게 보는 컬럼은, 아래와 같습니다. 

*   DIGEST\_TEXT: 물음표로 치환된 쿼리 원문
*   COUNT\_STAR: 쿼리의 총 실행 횟수
*   SUM\_TIMER\_WAIT: 이 쿼리를 실행하는 데 쓴 총합 소요 시간
*   AVG\_TIMER\_WAIT: 이 쿼리의 평균 소요 시간 (SUM / COUNT)
*   SUM\_NO\_INDEX\_USED: 인덱스를 타지 않고 테이블 풀 스캔을 수행한 횟수
*   SUM\_CREATED\_TMP\_DISK\_TABLES: 디스크에 임시 테이블을 만든 횟수 

```
SELECT 
    DIGEST_TEXT AS query,
    COUNT_STAR AS exec_count
FROM performance_schema.events_statements_summary_by_digest
-- WWHERE SCHEMA_NAME = '검색하고 싶은 스키마 이름'
ORDER BY COUNT_STAR DESC
LIMIT 5;
```

위 쿼리문을 수행하면 수행 횟수 별 TOP 5 쿼리를 확인할 수 있습니다. 조회하고 싶은 SCHEMA\_NAME 을 색인하여 검색하면 됩니다. 

## 결론

과거에는 Lock 잠금 정보도 information\_schema 에서 조회가 가능하였습니다. 하지만, 최근에는 MySQL의 Information\_schema 에서 조회되던 자료들을 Performance\_Schema 에서 조회할 수 있도록 변경하는 과정을 거치고 있습니다. 앞으로도 성능 개선, 성능 모니터링 등 성능 관련한 지표들은 performance\_schema 쪽으로 이전되어 performance\_schema 에서 조회되도록 할 예정으로 보입니다.

이런 내용을 참고하면서, performance\_schema 테이블을 잘 활용하여 빠르게 문제를 식별하고 해결할 수 있을 것이래 생각됩니다.