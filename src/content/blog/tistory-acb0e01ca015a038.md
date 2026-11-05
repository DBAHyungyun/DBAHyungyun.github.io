---
title: "[MySQL] MySQL Dump vs MyDumper 대용량 MySQL/MariaDB 마이그레이션 성능 비교"
date: "2026-08-11T04:53:07.000Z"
category: "Database | SQL | OS/MySQL | Maria"
source: "https://hyungyun.tistory.com/entry/MySQL-MySQL-Dump-vs-MyDumper-%EB%8C%80%EC%9A%A9%EB%9F%89-MySQLMariaDB-%EB%A7%88%EC%9D%B4%EA%B7%B8%EB%A0%88%EC%9D%B4%EC%85%98-%EC%84%B1%EB%8A%A5-%EB%B9%84%EA%B5%90"
description: "안녕하세요 오늘은 최근 마이그레이션 프로젝트에서 MySQL Dump와 MyDumper를 사용하며 느꼈던 비교점과 장단점에 대해서 정리하고 비교해보려고 합니다. 정리에 들어가기 앞서 AWS RDS Maria 10.11.18 버전으로 테"
---

안녕하세요 오늘은 최근 마이그레이션 프로젝트에서 MySQL Dump와 MyDumper를 사용하며 느꼈던 비교점과 장단점에 대해서 정리하고 비교해보려고 합니다.

정리에 들어가기 앞서 AWS RDS Maria 10.11.18 버전으로 테스트를 진행하였고, 보통 MySQLDump를 사용하는 것이 일반적이나, 정리 및 공부를 위해 두가지 경우 모두 테스트했다는 점 참고 부탁드립니다. 

### 1\. 핵심 아키텍처 MySQLDump vs MyDumper

<table style="border-collapse: collapse; width: 100%; height: 204px;" border="1" data-ke-align="alignLeft"><tbody><tr style="height: 17px;"><td style="height: 17px;">항목</td><td style="height: 17px;">MySQLDump</td><td style="height: 17px;">MyDumper</td></tr><tr style="height: 21px;"><td style="height: 21px;">실행 구조</td><td style="height: 21px;">단일 스레드</td><td style="height: 21px;">멀티 스레드 (병렬 dump/load)</td></tr><tr style="height: 21px;"><td style="height: 21px;">출력 형식</td><td style="height: 21px;">단일 SQL 파일(또는 단일 스트림)</td><td style="height: 21px;">스키마별/테이블별 개별 파일 분리</td></tr><tr style="height: 43px;"><td style="height: 43px;">일관성 보장</td><td style="height: 43px;">--single-transaction +<br>FLUSH TABLES WITH READ LOCK</td><td style="height: 43px;">Named lock 기반 스냅샷, 전 스레드 동일 시점 보장</td></tr><tr style="height: 43px;"><td style="height: 43px;">Binlog 좌표 기록</td><td style="height: 43px;">--master-data 옵션</td><td style="height: 43px;">기본적으로 스냅샷 시점의 binlog position 기록</td></tr><tr style="height: 21px;"><td style="height: 21px;">복구 방식</td><td style="height: 21px;">mysql &lt; dump.sql (순차 실행)</td><td style="height: 21px;">myloader로 병렬 로드, 스레드 수 조절 가능</td></tr><tr style="height: 21px;"><td style="height: 21px;">대상 도구 성격</td><td style="height: 21px;">MySQL/MariaDB 공식 번들</td><td style="height: 21px;">커뮤니티 별도 설치 필요</td></tr></tbody></table>

우선 근본적인 차이는 **병렬성**입니다. mysqldump는 구조상 하나의 커넥션으로 순차 덤프하기 때문에, 수백 GB~TB급 스키마에서는 덤프/로드 시간이 선형적으로 늘어나고, mydumper는 테이블·청크 단위로 스레드를 분배해 이 병목을 해소합니다.

다만, 병목성으로 처리하다보니 스레드를 지정하는 만큼 리소스를 더 사용할 수 밖에 없습니다.

### 2\. 성능 체감 차이

*   **덤프 속도**: 대형 테이블이 많은 스키마에서 mydumper의 -t(threads) 옵션을 vCPU에 맞게끔 조정하면 mysqldump 대비 체감 가능한 수준으로 단축된다. 다만 소스 DB의 IOPS/CPU 여유가 없으면 스레드 수를 무작정 올려도 병목에 효율이 좋지 않습니다.  
    AWS RDS의 예를 들어, vCPU가 충분해 스레드를 많이 할당해도 IOPS의 여유가 200 밖에 되지 않는다면 병렬처리의 이점이 사라지게 됩니다.
*   **로드 속도**: myloader 쪽 병렬 로드 효과가 실제로는 더 크게 체감된다. mysqldump로 만든 단일 파일은 mysql 클라이언트로 순차 실행할 수밖에 없어 로드 구간이 전체 마이그레이션 시간의 대부분을 차지하는 경우가 많았습니다.
*   **RDS 환경 특성**: AWS RDS는 SUPER 권한이 없고 FLUSH TABLES WITH READ LOCK 등 일부 명령이 제한되므로, 타겟이 RDS라면 로드 단계에서 myloader의 세션 옵션(--skip-triggers, --overwrite-tables 등)과 파라미터 그룹 설정(local\_infile, foreign\_key\_checks)을 사전에 맞춰야 합니다.

### 3\. 실제 Migration 당시 고려해야하는 부분

*   **DEFINER 처리 :**  뷰·프로시저·트리거의 DEFINER가 소스 계정으로 박혀 있으면 타겟(RDS 등)에서 권한 오류가 납니다. (AWS나 MariaDB 기준) mysqldump는 옵션이 제한적이라 결국 사후에 sed로 치환하는 경우가 많았는데, mydumper는 최근 버전부터 --replace-definer 옵션이 정식 추가되어 별도 스크립트 없이 덤프/로드 시점에 DEFINER를 원하는 계정으로 바로 치환할 수 있습니다. 옵션이 없는 구버전을 쓰고 있다면 기존 방식대로 스키마 파일이 분리돼 있는 점을 활용해 로드 전 일괄 치환(find | xargs sed)도 가능했습니다.   
    또는, Definer를 설정한 계정으로 Restore하여 Definer의 권한 문제를 해결할 수 있었습니다.
*   **Row Count 검증 :**  멀티 스키마 마이그레이션에서는 덤프/로드 후 반드시 스키마별 row count 크로스체크가 필요합니다. mydumper는 덤프 완료 시 metadata 파일에 각 테이블의 예상 row count와 마스터 상태(binlog 정보)를 남기므로 검증 스크립트를 짜기 유용합니다. mysqldump 단일 파일에서는 이 메타 정보를 별도로 뽑아내는 부가 작업이 필요합니다.

### 4\. 언제 MyDump, MyDumper를 사용할까?

<table style="border-collapse: collapse; width: 100%;" border="1" data-ke-align="alignLeft"><tbody><tr><td>상황</td><td>사용 도구</td></tr><tr><td>수 GB 이하 소규모 스키마, 1회성 백업</td><td>mysqldump</td></tr><tr><td>별도 패키지 설치가 어려운 폐쇄망/보안 제약 환경</td><td>mysqldump</td></tr><tr><td>수십~수백 GB 이상, 다운타임 최소화가 중요한 마이그레이션</td><td>mydumper/myloader</td></tr><tr><td>스키마별/테이블별로 분리된 백업 파일이 필요한 경우 (부분 복구 목적)</td><td>mydumper/myloader</td></tr><tr><td>Cross-version, cross-engine(MariaDB→MySQL 등) 마이그레이션</td><td>mydumper/myloader (단, charset/DEFINER 사전 점검 필수)</td></tr></tbody></table>

### 5\. 실제 테스트 

실제 1,000,000 건의 데이터를 갖고 Dump 및 Restore를 진행하여 테스트를 진행해보겠습니다.

건수가 많지 않으므로, 실제 MySQLDump가 실행되고 MyDumper가 실행되는 것만 실습하는 것임을 참고 해주세요.

\-- MySQL Dump

```
-- mysqldump 
mysqldump \
  --host=<host> \
  --port=3306 \
  --user=<user> \
  --password='<pw>' \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --hex-blob \
  <schema> > <schema>.sql
```

\-- MySQL dump Restore

```
mysql \
  --host=<host> \
  --port=3306 \
  --user=<user> \
  --password='<pw>' \
  <schema> < <schema>.sql
```

\-- MyDumper 

```
mydumper \
  --host=<host> \
  --port=3306 \
  --user=<user> \
  --password='<pw>' \
  --threads=4 \
  --compress \
  --triggers \
  --routines \
  --events \
  --regex='^(<schema>)\.' \
  --outputdir=/backup/<schema>_20260811 \
  --logfile=/backup/mydumper.log
  
  -- threads 옵션으로 실제 threads 개수 조정 가능
```

\-- MyLoader 

```
myloader \
  --host=<host> \
  --port=3306 \
  --user=<user> \
  --password='<pw>' \
  --threads=8 \
  --directory=/backup/<schema>_20260811 \
  --database=<schema> \
  -o DROP \
  --logfile=/backup/myloader.log
```

MySQL Dump를 활용하여 .sql 파일로 dump 파일을 추출한 모습

![](__MEDIA__/76765cda0859e5e0fe39b91c6a75b0958033334c5cf2d9e2339f54da74f58d04.png)

MySQL Dump

MyDumper로 자동 청크 분할되어 파일이 분할돼 저장된 모습

MyLoader 옵션에서 directory 옵션을 활용하여 해당 경로의 파일을 restore 하게 된다.

![](__MEDIA__/3d51e8ec645aa16ac1ac99833efa9adf9ed62b05aa0b9f8d22022115683be148.png)

MyDumper 진행

오늘은 간단하게 MySQLdump와 MyDumper에 대해서 정리해보았습니다.

대용량 데이터를 마이그레이션 하기 위해서는 여러가지 방법을 고려할 수 있는데, 시스템과 상황에 맞게 선택하는 것이 마이그레이션 프로젝트의 첫 시작이라고 생각합니다. 아래 링크는 MySQLDump, MyDumper, Myloader 옵션에 대한 공식 문서 링크입니다.

참고하면 좋을 것 같아 첨부합니다.

 [mydumper - MyDumper documentation

Previous Usage

mydumper.github.io](https://mydumper.github.io/mydumper/docs/html/mydumper_usage.html)

 [myloader - MyDumper documentation

Previous mydumper

mydumper.github.io](https://mydumper.github.io/mydumper/docs/html/myloader_usage.html)

 [MySQL :: MySQL 8.4 Reference Manual :: 6.5.4 mysqldump — A Database Backup Program

6.5.4 mysqldump — A Database Backup Program The mysqldump client utility performs logical backups, producing a set of SQL statements that can be executed to reproduce the original database object definitions and table data. It dumps one or more MySQL da

dev.mysql.com](https://dev.mysql.com/doc/refman/8.4/en/mysqldump.html)

다음번에는 마이그레이션 이후 체크해야할 사항들과 주의해야할 사항을 중점적으로 정리해보겠습니다.