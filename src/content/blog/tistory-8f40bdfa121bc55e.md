---
title: "MySQL 아키텍처 - 2"
date: "2025-12-31T00:58:35.000Z"
category: "Database | SQL | OS/MySQL | Maria"
source: "https://hyungyun.tistory.com/entry/MySQL-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98-2"
description: "이번에는,MySQL의 Redo Log, Binary Log의 심화 내용과 아키텍처적인 관점에서의 Buffer Pool Size 측정 방법과 개념에 대해서 공부해보려고 합니다. 아래는 이전에 작성했던 MySQL 아키텍처의 간단한 정리와"
---

이번에는,MySQL의 Redo Log, Binary Log의 심화 내용과 아키텍처적인 관점에서의 Buffer Pool Size 측정 방법과 개념에 대해서 공부해보려고 합니다. 

아래는 이전에 작성했던 MySQL 아키텍처의 간단한 정리와 Buffer Pool, Redo Log의 개념이 기재되어 있습니다. 참고해주세요.

 [MySQL 아키텍처 - 1

오늘은 오라클 다음으로 가장 많이 사용하고 있는, 오픈 소스형 Database 중 하나인 제가 현재 운영중인 시스템의 데이터베이스인 MySQL의 아키텍처를 공부하며 기록해보려고 합니다. RBMDS에 대한

hyungyun.tistory.com](https://hyungyun.tistory.com/entry/MySQL-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98-1)

* * *

Redo Log

*   하드웨어나 소프트웨어 등 여러 가지 문제점으로 인해 MySQL 서버가 비정상적으로 종료됐을 때 데이터 파일에 기록되지 못한 데이터를 잃지 않게 해주는 안전 장치이다.
*   PostgreSQL 같은 일부 RDBMS 에서는 WAL Log로 불리기도 한다. (Write Ahead Log의 줄임말)
*   MySQL 8.0 버전부터 InnoDB 스토리지 엔진의 Redo Log를 아카이빙 할 수 있는 기능이 추가 됐다. (On-Prem의 경우에는 특정 경로에 로그를 아카이빙 할 수 있으나, AWS 에서는 EBS 볼륨을 사용)

Redo Log는 서버가 비정상적으로 종료됐을 때, 데이터 파일에 기록되지 못한 데이터를 잃지 않게 해주는 안전장치이지만, 데이터베이스 서버에서 리두 로그가 트랜잭션이 커밋될 때마다 디스크에 기록하는 작업은 많은 부하를 유발한다.

그래서, InnoDB 스토리지 엔진에서 리두 로그를 어느 주기로 디스크에 동기화할지를 결정하는 innodb\_flush\_log\_at\_trx\_commit 시스템 변수를 제공한다.

![](__MEDIA__/93c5fa5aab7e2e04d847fa3d40cc70012016c83db37bc842cd646d3eafd18457.png)

innodb\_flush\_log\_at\_trx\_commit 조회 결과

innodb\_flush\_log\_at\_trx\_commit=0 : 1초에 한 번씩 리두 로그를 디스크로 기록(write)하고, 동기화(sync)를 실행한다. 그래서 서버가 비정상 종료되면 최대 1초 동안의 트랜잭션은 커밋됐다고 하더라도 해당 트랜잭션에서 변경한 데이터는 사라질 수 있다. 

innodb\_flush\_log\_at\_trx\_commit=1 : 매번 트랜잭션이 커밋될 때마다 디스크로 기록되고 동기화까지 수행된다. 그래서 일단 트랜잭션이 커밋되면 해당 트랜잭션에서 변경된 데이터는 사라진다. (Default)

innodb\_flush\_log\_at\_trx\_commit=2 : 매번 트랜잭션이 커밋될 때마다 디스크로 기록(write)은 되지만 실질적인 동기화(sync)는 1초에 한 번씩 실행된다. 일단 트랜잭션이 커밋되면 변경 내용이 운영체제의 메모리 버퍼로 기록되는 것이 보장된다. 그래서 MySQL 서버가 비정상 종료됐더라도 운영체제가 정상적으로 작동한다면 해당 트랜잭션의 데이터는 사라지지 않는다. MySQL 서버와 운영체제가 모두 비정상적으로 종료되면 최근 1초 동안의 트랜잭션 데이터는 사라질 수 있다. 

하지만, innodb\_flush\_log\_at\_trx\_commit 시스템 변수를 0이나 2로 설정하는 경우 디스크 동기화 작업이 항상 1초 간격으로 실행되는 것은 아니고, 최대 1초 정도 손실이 발생할 수 있다는 정도로 기억한다. 

<table style="border-collapse: collapse; width: 100%; height: 126px;" border="1" data-sheets-baot="1" data-sheets-root="1" data-ke-align="alignLeft" data-ke-style="style12"><tbody><tr style="height: 35px;"><td style="color: #1f1f1f; width: 11.9768%; height: 35px;"><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">설정값</span></td><td style="color: #1f1f1f; width: 21.6278%; height: 35px;"><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">동작 방식 (커밋 시점)</span></td><td style="color: #1f1f1f; width: 15.3488%; height: 35px;"><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">디스크 기록 (Flush)</span></td><td style="color: #1f1f1f; width: 27.3256%; height: 35px;"><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">안전성 (데이터 유실 위험)</span></td><td style="color: #1f1f1f; width: 23.6046%; height: 35px;"><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">성능 (I/O 부하)</span></td></tr><tr style="height: 38px;"><td style="color: #1f1f1f; width: 11.9768%; height: 38px; text-align: left;"><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">1</span><br><br><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">(기본값)</span></td><td style="color: #1f1f1f; width: 21.6278%; height: 38px; text-align: left;"><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">Log Buffer 내용을</span><br><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">파일에 쓰고 + 디스크에 즉시 내림</span></td><td style="color: #1f1f1f; width: 15.3488%; height: 38px; text-align: left;"><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">매 커밋마다</span><br><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">(동기 방식)</span></td><td style="color: #1f1f1f; width: 27.3256%; height: 38px; text-align: left;"><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">최상 (ACID 보장)</span><br><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">장애가 나도 데이터 유실 없음</span></td><td style="color: #1f1f1f; width: 23.6046%; height: 38px; text-align: left;"><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">느림</span><br><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">(가장 많은 Disk I/O 발생)</span></td></tr><tr style="height: 43px;"><td style="color: #1f1f1f; text-align: left; width: 11.9768%; height: 43px;"><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">0</span></td><td style="color: #1f1f1f; width: 21.6278%; height: 43px; text-align: left;"><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">아무 작업 안 함.</span><br><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">(1초마다 백그라운드 스레드가 처리)</span></td><td style="color: #1f1f1f; width: 15.3488%; height: 43px; text-align: left;"><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">1초마다</span><br><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">(주기적)</span></td><td style="color: #1f1f1f; width: 27.3256%; height: 43px; text-align: left;"><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">최하</span><br><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">MySQL 프로세스만 죽어도</span><br><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">최대 1초 분량 유실 가능</span></td><td style="color: #1f1f1f; width: 23.6046%; height: 43px; text-align: left;"><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">가장 빠름</span><br><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">(커밋 시 I/O 대기 없음)</span></td></tr><tr style="height: 10px;"><td style="color: #1f1f1f; text-align: left; width: 11.9768%; height: 10px;"><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">2</span></td><td style="color: #1f1f1f; width: 21.6278%; height: 10px; text-align: left;"><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">Log Buffer 내용을</span><br><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">메모리까지만 씀</span></td><td style="color: #1f1f1f; width: 15.3488%; height: 10px; text-align: left;"><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">1초마다</span><br><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">(주기적)</span></td><td style="color: #1f1f1f; width: 27.3256%; height: 10px; text-align: left;"><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">중간</span><br><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">MySQL 프로세스가 죽어도 안전</span><br><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">단, OS 다운(전원 차단) 시 1초 유실</span></td><td style="color: #1f1f1f; width: 23.6046%; height: 10px; text-align: left;"><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">빠름</span><br><span style="font-family: AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif;">(디스크 I/O 없이 메모리<br>복사만 함)</span></td></tr></tbody></table>

MySQL 8.0 버전 이전으로는 수동으로 Redo Log를 비활성화할 수 있는 방법이 없었지만, MySQL 8.0 버전부터는 수동으로 Redo Log를 활성화하거나 비활성화할 수 있게 됐다. 그래서 MySQL 8.0 버전부터는 데이터를 복구하거나, 대용량 데이터를 한번에 적재하는 경우 리두로그를 비활성화 하여 데이터 적재 시간을 단축시킬 수 있다.

(AWS RDS MySQL 에서는 불가능하다. 단, sync\_binlog, innodb\_flush\_log\_at\_trx\_commit 파라미터를 변경하여 대량의 데이터를 적재할 때 단축할 수 있다.)

Redo Log를 비활성화하고 데이터 적재 작업을 진행했다면, 데이터 적재 완료 후 리두 로그를 꼭 활성해주어야 안정적으로 시스템을 운영할 수 있다. 단, MySQL 서버가 비정상적으로 종료되어 데이터가 일부 손실되어도 괜찮다면 innodb\_flush\_log\_at\_trx\_commit 시스템 변수를 1이 아닌 0 또는 2로 설정해서 사용해도 된다.

* * *

Binary Log

*   데이터베이스에 변경을 가하는 모든 쿼리(DDL, DML) 의 정보를 기록하는 논리적 로그 파일입니다.
*   스토리지 엔진 (InnoDB,MyISAM 등) 이 아닌, MySQL 엔진에서 생성됩니다. 따라서 스토리지 엔진에 관계 없이 모든 변경 사항이 기록됩니다. 
*   mysql-bin-changelog.000001, mysql-bin-changelog. 000002 처럼 번호가 붙은 파일로 관리되며, 인덱스 파일이 이 파일들의 목록을 관리합니다.

Binary Log가 활용되는 방법

*   복제 (Replication) 를 위해, 복제 소스 서버의 바이너리 로그는 복제본으로 전송될 데이터 변경 사항 기록을 제공합니다. 소스는 바이너리 로그에 포함된 정보를 복제본으로 전송하고, 복제본은 해당 트랜잭션을 복제하여 소스에서 수행된 것과 동일한 데이터 변경 사항을 적용합니다.
*   특정 데이터 복구 작업(PITR) 에는 바이너리 로그를 사용해야 합니다. 백업이 복원되면 백업 이후에 기록된 바이너리 로그의 이벤트가 다시 실행됩니다. 이러한 이벤트를 통해 데이터베이스는 백업 시점부터 최신 상태로 업데이트됩니다.

![](__MEDIA__/9e1135ed9b560b4191a5dcc9241309521460beb98025b368587294b932eb5952.png)

실제 Binary Log

Redo Log의 경우에는, 주 목적이 장애 상황에 대한 복구가 우선이지만, Binary Log 의 경우에는 복제 (Replication) 및 시점 복구 (PTIR)에 더 용이합니다. 

Redo Log 의 경우에는 Log file이 순환되며, 파일 크기가 고정된 형태에서 덮어씌워지지만, Binary Log 의 경우에는 데이터가 계속 쌓이면서 지정된 보관 기간 만큼 쌓이게 됩니다.

* * *

Buffer Pool

*   InnoDB 스토리지 엔진에서 가장 핵심적인 부분, 디스크의 데이터 파일이나 인덱스 정보를 메모리에 캐시해 두는 공간이다.
*   쓰기 작업을 지연시켜 일괄 작업으로 처리할 수 있게 해주는 버퍼 역할도 같이 한다.

일반적으로 전체 물리 메모리의 80% 정도를 InnoDB의 버퍼 풀로 설정하라는 내용도 있으나, 80% 의 수치값이 아닌, 운영체제와 각 클라이언트 스레드가 사용할 메모리, 백그라운드 메모리도 충분히 고려해서 설정해야 한다.

운영체제의 전체 메모리 공간이 8GB 미만이라면 50% 정도는 InnoDB Buffer Pool로 설정하고, 나머지 메모리 공간은 MySQL 서버와 운영체제, 그리고 다른 프로그램이 사용할 수 있는 공간으로 확보해주는 것이 좋다.

![](__MEDIA__/d32cc9ade3934ab8efddbfd6836814815462d2a46536d7098900c6290763ebc0.png)

innodb Buffer Pool 조회 결과

InnoDB Buffer Pool 은 innodb\_buffer\_pool\_size 시스템 변수로 크기를 조정할 수 있으며, 동적으로 버퍼풀의 크기를 확장할 수 있다. 하지만, Buffer Pool의 크기 변경은 크리티컬한 변경이므로 가능하면 서버의 사용량이 적은 시간대에 하는것을 추천한다.

* * *

이렇게 Redo Log와 Binary Log의 개념과 내용, Buffer Pool의 기본 개념에 대해서 공부해보았다. 다음에는 성능에서 중요한 부분은 Buffer Pool의 구조와 심화 개념에 대해 공부해보려 한다.