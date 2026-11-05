---
title: "[PostgreSQL] Vacuum 활용법과 실제 Vacuum 적용 실습"
date: "2026-07-01T02:12:22.000Z"
category: "Database | SQL | OS/PostgreSQL"
source: "https://hyungyun.tistory.com/entry/PostgreSQL-Vacuum-%ED%99%9C%EC%9A%A9%EB%B2%95%EA%B3%BC-%EC%8B%A4%EC%A0%9C-%EC%84%B1%EB%8A%A5-%EC%B0%A8%EC%9D%B4-%EC%8B%A4%EC%8A%B5"
description: "오늘은 지난 포스팅에 이어서 Vacuum이 실제 PostgreSQL DB 에 미치는 영향과 쿼리 성능에 어떤 영향을 미치는지, 실습을 통해서 알아보려고 합니다. 개념적인 부분은 아래 링크에서 정리하였으니, 한번씩 확인하시면 좋을 것 "
---

오늘은 지난 포스팅에 이어서 Vacuum이 실제 PostgreSQL DB 에 미치는 영향과 쿼리 성능에 어떤 영향을 미치는지,

실습을 통해서 알아보려고 합니다.

개념적인 부분은 아래 링크에서 정리하였으니, 한번씩 확인하시면 좋을 것 같습니다.

 [\[PostgreSQL\] PostgreSQL 기본 개념과 Vacuum이란?

최근 Aurora PostgreSQL을 업그레이드 했는데, 이 과정에서 필수로 ANALYZE를 진행해야 하는 프로세스가 있었습니다.이것을 정리하면 좋을 것 같아, ANALYZE와 항상 함께 나오는 VACUUM도 함께 정리해보려

hyungyun.tistory.com](https://hyungyun.tistory.com/entry/PostgreSQL-PostgreSQL-%EA%B8%B0%EB%B3%B8-%EA%B0%9C%EB%85%90%EA%B3%BC-Vacuum%EC%9D%B4%EB%9E%80)

환경구성 : EC2 (Red Hat Enterprise Linux release 8.10 (Ootpa) / psql (PostgreSQL) 16.14

                PostgreSQL 16.8 on x86\_64-pc-linux-gnu, compiled by x86\_64-pc-linux-gnu-gcc (GCC) 10.5.0, 64-bit

* * *

### Vacuum 실습 과정

우선 간단하게, Vacuum은 Dead Tuple이 쌓여서 이를 정리하는 과정이라고 이야기를 했는데, Dead Tuple은 Update, Delete 발생시 MVCC (다중 버전 동시성 제어) 로 인해 물리적으로 즉시 삭제되지 않고, 남겨진 데이터를 의미합니다.

실습을 위해서는 Datebase와 Table을 생성해줍니다.

```
CREATE SCHEMA IF NOT EXISTS test;

CREATE TABLE test.orders (
  order_id    bigserial PRIMARY KEY,
  customer_id integer NOT NULL,
  status      text    NOT NULL,
  amount      numeric(12,2),
  created_at  timestamptz NOT NULL
) WITH (autovacuum_enabled = false);
```

이후 생성된 테이블에 10,000,000건의 데이터를 Insert 해주겠습니다.

```
INSERT INTO test.orders (customer_id, status, amount, created_at)
SELECT
  (random()*100000)::int,
  CASE WHEN random() < 0.95 THEN 'completed'
       WHEN random() < 0.98 THEN 'pending'
       ELSE 'cancelled' END,
  round((random()*1000)::numeric, 2),
  now() - (random()*365) * interval '1 day'
FROM generate_series(1, 1000000);
```

![](__MEDIA__/47d9f6157cd33e28e0b07c9f5ca0b4945bbec55e05bd3e52542fb56ccdfab39c.png)

다음, 대량의 Update 작업을 통해 Dead Tuple을 발생 시켜 보겠습니다.

```
UPDATE test.orders SET amount = amount + 1 WHERE customer_id < 50000;
UPDATE test.orders SET amount = amount + 1 WHERE customer_id < 50000;
```

Update 작업 이후애 pg\_stat\_user\_tables 테이블을 활용해서, 실제 dead\_tuple이 얼마나 발생했는지를 확인합니다.

![](__MEDIA__/46c07efb4b41f2427c33921b3c34dbfa2744cafaaccc041a6cefe3081f650ed3.png)

이렇게 Dead Tuple을 확인하고, PG Extension 으로 pgstattuple을 생성해 Table의 Size와 물리적 디스크 사용량을 확인한다.

```
CREATE EXTENSION IF NOT EXISTS pgstattuple;

-- dead_tuple_percent, free_percent로 Bloat 정도를 확인
SELECT * FROM pgstattuple('test.orders');

-- 테이블의 물리적 크기 확인
SELECT pg_size_pretty(pg_total_relation_size('test.orders')) AS total_size;
```

![](__MEDIA__/6518757778b58eb4a5b9869733d70f6c333cc2f7df33fd46b97dfc49e7cc4efc.png)

실제 테이블 Size 확인

이제 수동으로 Vacuum을 수행하고, 결과를 재조회하게 된다면

![](__MEDIA__/ec999b2418a6ca728524feaa8a66153b9345ac76cf060854790bc8c305f69200.png)

![](__MEDIA__/163c8fcd504fb4a315e17acc52c112d45bb10e61155d699456ff3fb241b4dfd2.png)

Vacuum이 수행되며, dead\_tuple\_count, dead\_tuple\_len 등 deat tuple 관련 카운트는 감소하고, n\_dead\_tup 수치가 감소한 것이 보입니다.

하지만, 여기서 확인할 수 있는 점은 일반 Vacuum은 dead\_tuple을 정리할 수는 있지만 테이블의 물리적 크기에는 큰 변화가 없다는 점입니다. 공간을 재사용 가능한 상태로 돌렸을 뿐, OS에 반환하지는 않기 때문입니다. 물리적 크기를 실제로 줄이려면 아래와 같이 Vacuum Full 을 사용해야 하지만, 테이블에 대한 잠금이 걸리므로 운영 환경에서는 주의해야 합니다.

![](__MEDIA__/d8b05c1e0674ec7eb2ee43f399b08cfc5d20d881ae0e48c850bac2990dc5acd2.png)

이렇게 Full Vacuum을 진행하면, 실제 Table의 물리적 사이즈가 줄어든 것을 확인할 수 있습니다. 

### 마무리

이렇게 PostgreSQL의 Vacuum 에 대해서 개념 및 실습을 진행해봤는데요.

OS 에 데이터를 반환하고, 물리적 공간을 확보하기 위해서는 Full Vacuum이 필요하지만, 사실 운영 환경에서는 굉장히 위험 부담이 존재합니다. OS 사용량이 넉넉하다면 일반적인 상황에서는 일반 Vacuum을 사용해도 충분하다는 생각이 들지만, 시스템의 쓰임과 용도에 따라 다운타임을 계획해 협의하는 것이 필요합니다.