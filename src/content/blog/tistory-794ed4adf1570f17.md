---
title: "[SQL] MySQL 쿼리 Plan 확인 방법"
date: "2026-02-10T06:12:41.000Z"
category: "Database | SQL | OS/SQL Tuning"
source: "https://hyungyun.tistory.com/entry/SQL-MySQL-%EC%BF%BC%EB%A6%AC-Plan-%ED%99%95%EC%9D%B8-%EB%B0%A9%EB%B2%95"
description: "오늘은 Database 의 성능 관리와 튜닝에서 중요한 부분을 차지하는 Query Plan 에 대해서 공부해보려고 합니다. 많은 수의 Line 과 쿼리를 전부 이해하고, 튜닝하기란 쉽지 않습니다. 이럴때 Query Plan 을 확인하"
---

오늘은 Database 의 성능 관리와 튜닝에서 중요한 부분을 차지하는 Query Plan 에 대해서 공부해보려고 합니다. 

많은 수의 Line 과 쿼리를 전부 이해하고, 튜닝하기란 쉽지 않습니다. 이럴때 Query Plan 을 확인하여, 보다 효율적인 방법으로 쿼리를 수행시키는 것이 필요한데 이때 필요한 것이 Plan 입니다. 아래는 Explain Plan에 대한 MySQL 공식 문서이므로 참고하면 좋을 것 같습니다. 

 [참고 자료 · dev.mysql.com](https://dev.mysql.com/doc/refman/8.4/en/execution-plan-information.html)

* * *

![](__MEDIA__/e15eb2a87260a97cf5e68568349a01285d349540e559dc90d48b586ec1a647e4.png)

쿼리 실행 구조 (출처 : Real MySQL 8.0)

우선 위의 사진을 살펴보면, 쿼리 실행 구조에 옵티마이저가 존재한다. 이 참고 사진을 보았을  Query Plan을 이해하기 위해서는, 옵티마이저의 개념을 우선 이해해야 한다.

옵티마이저란? 

\- 사용자의 요청으로 들어온 쿼리 문장을 테이,칼럼,인덱스,WHERE  조건에 따라 저렴한 비용으로 가장 빠르게 처리할 지를 결정하는 역할을 담당하는 내부 로직.

MySQL Query Plan 이란?

\- Query Plan(실행 계획)은 DB 옵티마이저가 사용자의 SQL을 수행하기 위해 세운 일종의 쿼리 수행 계획입니다. 

\- 실행할 쿼리 앞에 EXPLAIN이나 EXPLAIN ANALYZE 를 붙여서 수행하면 됩니다.

\- EXPLAIN 을 수행할 경우, 실제 실행계획이 아닌 예상 실행 계획을 보여주며 서버에 부하 없이 바로 출력이 가능합니다.

\- EXPLAIN ANALYZE 를 수행할 경우, 실제 실행 계획을 출력해서 시간이 더 소요되고 때로는 서버에 부하를 발생시킬 수도 있습니다. 

이 Query Plan과 옵티마이저가 중요한 이유는, 쿼리가 느릴 때 데이터가 많아서라고 짐작만 하는 게 아니라 실행 계획을 통해 어느 단계에서 인덱스를 못 탔는지, 어디서 데이터가 증가하여 부하를 야기 시키는지 수치로 증명하기 때문입니다.

Query Plan과 옵티마이저의 간단한 개념이고, 이 개념을 토대로 실습을 진행해보겠습니다. 

* * *

1\. 우선 Create Table 이후 300,000 건의 Data를 insert 해주었습니다. 

```
CREATE TABLE sales_test (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_date DATE,
    category_id INT,
    amount DECIMAL(15, 2),
    dummy_column VARCHAR(100) -- 일부러 레코드 사이즈를 키우기 위한 컬럼
);
```

![](__MEDIA__/04f6b8cc8112d2f3b90e9b2bc676084b552acfc267e0276ebd5a1e7844a7ac4a.png)

Insert Table

2\. Insert 된 300,000 건의 Data를 SELECT 구문을 활용해서 실행 계획 도출해주었습니다.

```
SELECT sale_date, SUM(amount)
FROM sales_test
WHERE category_id = 5
  AND sale_date BETWEEN '2026-01-01' AND '2026-12-31'
GROUP BY sale_date;
```

\[예상 실행 계획 | EXPLAIN 쿼리\]

![](__MEDIA__/cddd5085f00ef987c70355fe211cfbf79a06ab20d545c81503720eb409fc2085.png)

EXPLAIN Query

\[실제 실행 계획 | EXPLAIN ANALYZE 쿼리\]

![](__MEDIA__/1f048045633fabbbe2815a2f41a5bdb1d6096766b783bd7206519d5ba9b0903b.png)

EXPLAIN ANALYZE Query

캡처된 사진을 보더라도, 실제 실행 계획이 보여주는 예상치와 예상 실행 계획이 보여주는 예상치는 차이가 상당합니다. 실제 실행계획은 직접 쿼리를 끝까지 실행한 뒤, 각 단계마다 걸린 시간과 실제 처리 된 데이터 양을 기록해서  보여줍니다.

단점은, 실제 Slow Query를 EXPLAIN 하는 만큼 결과가 나올때까지 시간이 걸리고, 실제 서버에 부하를 준다는 점이 단점입니다. 

```
-> Table scan on <temporary>  (actual time=137..137 rows=73 loops=1)
    -> Aggregate using temporary table  (actual time=137..137 rows=73 loops=1)
        -> Filter: ((sales_test.category_id = 5) and (sales_test.sale_date between '2026-01-01' and '2026-12-31'))  (cost=30396 rows=3307) (actual time=1.35..120 rows=30000 loops=1)
            -> Table scan on sales_test  (cost=30396 rows=297631) (actual time=1.33..85.9 rows=300000 loops=1)
```

실행 계획을 보고 간략하게 분석해보면, 

Table scan on sales\_test : Index 가 존재하지 않아서 Table 을 Full Scan 하고 있고, 전체 300,000 행을 읽는데 85.9ms 가 소요 되었습니다.

Filter: (category\_id = 5 AND ...) : 위에서 읽어온 30만 건을 필터링해서 우리가 원하는 데이터(카테고리 5번)만 골라내고 있습니다.

Aggregate using temporary table : 골라낸 3만 건을 sale\_date별로 묶어서 SUM(amount) 계산을 하기 위해 임시 테이블을 만들었습니다.

Table scan on <temporary> : 마지막으로 임시 테이블에 정리된 최종 결과(73개 행)를 사용자에게 보여주는 단계입니다.

정리하자면, 30,000건의 데이터를 찾기 위해서 300,000건의 데이터를 모두 읽은 형태라서 비효율적입니다.

Index 를 생성하거나 조건절을 수정하여 쿼리를 튜닝하는 방법이 있습니다. 이 방법에 대해서는 다음에 공부해보려고 합니다. 

이렇게 MySQL 에서 EXPLAIN PLAN을 확인하는 방법에 대해 공부해보았습니다. 다음 글에는 Query Tuning에 대한 개인적인 공부 글을 업로드 해보려고 합니다.