---
title: "[SQL] Logical I/O 와 Physical I/O"
date: "2026-03-16T05:41:05.000Z"
category: "Database | SQL | OS/SQL Tuning"
source: "https://hyungyun.tistory.com/entry/SQL-Logical-IO-%EC%99%80-Physical-IO"
description: "오늘은 DB 성능과 굉장히 밀접한 관련이 있는 I/O 에 대해서 공부해보려고 합니다. SQL 튜닝에서는 굉장히 중요한 부분이고, 제 생각에는 성능 튜닝의 관점에서는 어디서 Physical I/O 를 줄여 SQL 성능을 높이느냐 라고 "
---

오늘은 DB 성능과 굉장히 밀접한 관련이 있는 I/O 에 대해서 공부해보려고 합니다. SQL 튜닝에서는 굉장히 중요한 부분이고, 제 생각에는 성능 튜닝의 관점에서는 어디서 Physical I/O 를 줄여 SQL 성능을 높이느냐 라고 생각합니다. 

아래는 일전에 작성해 둔 MySQL InnoDB Buffer Pool 에 대한 내용입니다. Oracle, MySQL,Maria 각 아키텍처의 구조가 다르지만 Memory, Disk 튜닝과 성능의 관점에서의 큰 틀은 유사하기 때문에 참고하시면 좋을 것 같아 첨부합니다. 

 [\[MySQL\] InnoDB\_Buffer Pool 이란?

안녕하세요. 오늘은 MySQL 과 MariaDB 에서 성능으로 중요한 부분을 차지하고 있는 InnoDB\_Buffer\_Pool 에 대해서 공부 해보고, Size를 어떻게 조정하는 것이 좋은지 공부 해보겠습니다. 성능에 중요한 부

hyungyun.tistory.com](https://hyungyun.tistory.com/entry/MySQL-InnoDBBuffer-Pool-%EC%9D%B4%EB%9E%80)

참고 : Real MySQL 8.0

* * *

## 개요

MySQL 8.0 에서도, 항상 강조하는 내용은 Disk I/O가 SQL 성능을 결정한다고 이야기 합니다. 그 이유는 자주 수행하는 쿼리를 수행할 때 마다 Disk 에서 가져오게 되면 비효율적인 I/O를 유발시키게 되고, 성능을 저하 시키게 됩니다. 이런 이유로 자우 사용하는 쿼리의 경우 Disk 에서 읽어오는 것이 아닌 Memory 영역에 캐싱해두어 같은 블록에 대한 반복적인 I/O Call을 감소시키는것이 유의미한 효과를 줄 수 있습니다. 

이런 반복적인 I/O Call을 감소시키는 것의 근본은 Physical I/O 를 줄이는 것으로, 이제부터 Logical I/O 와 Physical I/O를 알아보겠습니다.

## Logical I/O 란?

Logical I/O란, 쿼리를 처리하는 과정에서 메모리 (InnoDB Buffer Pool / Oracle Buffer Cache) 에서 데이터를 읽는 작업입니다.

쉽게 말해 SQL을 수행하면서 읽은 총 블록 I/O가 논리적 I/O 이다.

*   동작 방식 : 실행 엔진이 조회를 위해 특정 블록을 달라고 요청하면, Database 는 **가장 먼저 빠른 공간인 메모리 공간, 즉 Buffer Pool**을 확인합니다. 이 과정에서 블록을 찾아내는 모든 행위가 Logical I/O 가 됩니다.
*   **일반적인 경우에서는, Memory I/O 와 Logical I/O 의 발생량이 같다고 봐도 무방**하지만 Direct Path I/O 를 발생시키는 병렬 처리된 쿼리나, Direct Path Insert  를 수행할 때는 Memory I/O 와 Logical I/O 에는 차이가 존재합니다. 

Logical I/O 값을 확인하기 위해서는 실행 계획을 살펴보아야 하는데, Oracle 의 경우에는 GATHER\_PLAN\_STATISTICS 힌트를 참고하여, SQL ID 를 지정해 테스트 쿼리의 Logical I/O를 확인해보았다.

```
-- Buffers 로 Logical Reads 확인.
SELECT /*+ GATHER_PLAN_STATISTICS */ /* FIND_MY_QUERY_01 */ * FROM test_user.sample_data 
WHERE name = 'USER_50000';

-- 복사한 sql_id를 첫 번째 파라미터로, 두 번째 Child Number 에는 null을 넣습니다.
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR('5526h7cb7kcas', null, 'ALLSTATS LAST'));
```

![](__MEDIA__/826a7b21ea2d7f9ba7107e0c99b7605050c052811bd113f62033993bb13b698f.png)

Query Plan

조회해보면, Table Full Scan으로 쿼리를 수행하였고 대략 4,410 건의 Logical Reads를 발생시킨 것을 확인할 수 있습니다.

여기서 SQL 튜닝 포인트를 찾으려면 Create Index를 해서 좀 더 효율적으로 쿼리를 수행시킬 수 있을 것 입니다.

![](__MEDIA__/0e4a61a221ae18dcaa469ef2e593f4b87cd133f1e8b9c21544f5ab413a47039f.png)

Index 생성 후 Logical I/O 감소

## Physical I/O란?

Physical I/O는 Memory 영역에서 찾지 못해 실제 Disk 에 접근하여 데이터를 가져오는 작업을 의미합니다. 

*   동작 방식 : SQL 구문이 실행될 당시, 메모리 영역 (Buffer Cache, Buffer Pool) 에 데이터를 조회하러 갔는데 데이터가 존재하지 않는 경우 디스크 영역에서 블록을 찾아 메모리에 올려둡니다.
*   특징 : 디스크 접근은 메모리 접근보다 수백 배에서 수만배 까지 느리기 때문에, 쿼리 성능을 저하시키는 가장 큰 원인으로 볼 수 있습니다.

정리한대로 Physical I/O는 연속해서 자주 실행할 수록 Physical I/O 가 줄어듭니다. 자주 실행할 수록 Memory 영역에 해당 테이블에 대한 블록 점유율이 증가하게 되기 때문이고 반대로 자주 실행하지 않는 경우에는 점유하고 있던 블록을 다시 디스크 영역으로 내리기 때문에 Physical I/O가 증가하게 됩니다.

만약, Physical I/O 가 발생해서 디스크에서 메모리 영역으로 데이터를 올려두었더라도, 메모리 영역에 존재하는 데이터를 읽는 행위 자체는 Logical I/O 로 이루어지기 때문에 결국 Physical I/O가 발생하든 안하든 Logical I/O는 필연적으로 발생합니다.

## 결론

보통 쿼리가 느리거나, DB 성능이 부족한 경우 Disk I/O 를 확인하는 경우가 많습니다. 여기서 디스크 용량을 늘리고 Memory (RAM)을 늘려서 하드웨어를 늘려 해소하려는 경우도 있습니다.

상황에 따라 다르겠지만 이 방법도 해결 방안이 될 수 있습니다. (비용이 넉넉하다면) 하지만, 근본적인 문제는 I/O 의 양이 많은 쿼리에 대하여 튜닝포인트를 잡고 튜닝을 진행하는 것이 근본적인 원인의 해결이 될 수 있습니다.

위에서 확인했던 Table Full Scan 에서 Create Index를 하는 경우 Logical I/O가 줄어든 튜닝 포인트,

통계, 정산 등 무거운 배치 작업에서의 Parallel Execution 튜닝포인트,

월별 파티션, 기간 별 파티션 등 테이블의 파티셔닝, Join 방식의 변경 등 여러가지 방법으로 I/O를 줄이려는 노력을 할 수 있습니다.