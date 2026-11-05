---
title: "[PostgreSQL] PostgreSQL 기본 아키텍처 - 1"
date: "2026-09-10T07:12:51.000Z"
category: "Database | SQL | OS/PostgreSQL"
source: "https://hyungyun.tistory.com/entry/PostgreSQL-PostgreSQL-%EA%B8%B0%EB%B3%B8-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98-1"
description: "안녕하세요. 오늘은 PostgreSQL 의 기본 아키텍처에 대해서 공부해보려고 합니다. Oracle과 호환성이 좋기도하고, Oracle을 사용하는 서비스들이 라이선스 비용등의 이유로 PostgreSQL로 마이그레이션을 진행하기도 합니"
---

안녕하세요. 오늘은 PostgreSQL 의 기본 아키텍처에 대해서 공부해보려고 합니다.

Oracle과 호환성이 좋기도하고, Oracle을 사용하는 서비스들이 라이선스 비용등의 이유로 PostgreSQL로 마이그레이션을 진행하기도 합니다. 

### 개요

기본적으로 Postgres의 경우는 사용자의 요청을 받은 Postmaster에서 클라이언트의 연결을 받아 Backend Process를 생성하고 연결이 수립된 이후에는 Client와 해당 Backend Process가 직접 통신하게 된다. 

```
                                      Client
                                        │
                                        │ Connection Request
                                        ▼
                                 ┌──────────────┐
                                 │  Postmaster  │
                                 │ (Main Server │
                                 │   Process)   │
                                 └───────┬──────┘
                                         │
                                      fork()
                                         │
                                         ▼
                                 ┌──────────────┐
                                 │   Backend    │
                                 │   Process    │
                                 └──────────────┘
                                         ▲
                                         │
                                 Client ↔ Backend
```

Postmaster : PostgreSQL 서버의 입구이자, 서버를 관리하는 부모 프로세스 직접 SQL을 실행하지는 않는다.

fork : 현재 프로세스를 기반으로 새로운 프로세스를 만드는 Unix 계열 운영체제의 프로세스 생성 방식

Backend Process : 실제 클라이언트의 SQL을 처리하는 프로세스

다만, 실제 애플리케이션 환경에서는 PgBouncer 같은 Connection Pooling 을 사용할 수 있기 때문에 애플리케이션의 연결 수와 실제 PostgreSQL Backend 수가 항상 1:1로 동일하다고 할 수는 없다.

MySQL과 가장 큰 차이점은 MySQL 은 Thread 기반 구조라면, PostgreSQL 은 Process 기반 구조로 되어 있습니다.

### PostgreSQL 기본 구조

![](__MEDIA__/9cf00b9d7e59f45b51ff2e1d624f6fa0a9c5a5813fd1e04db66060c101e5ec3a.png)

PostgreSQL 의 기본 구조

위 이미지를 보면 PostgreSQL은 크게 Backend Process, Shared Memory, Background Process, 그리고 실제 데이터를 저장하는 파일로 나누어 볼 수 있습니다. 간단하게 각 구조에 대해서 살펴보겠습니다.

### Backend Process란?

PostgreSQL은 기본적으로 **Client 연결 하나에 Backend Process 하나가 대응하는 구조**입니다.

Client가 접속하면 메인 postgres Process가 Backend Process를 생성하고, 이후 해당 Process가 SQL을 처리하여 결과를 반환합니다.

쿼리는 구문 분석과 Rewrite를 거쳐 Planner / Optimizer가 실행계획을 만들고, Executor가 실행하는 방식으로 처리됩니다.

하지만, 그림에 나와있는 **‘기본 100개’는 Process가 미리 100개 생성된다는 의미는 아닙니다.** 접속 한도인 max\_connections의 기본값이 통상 100이라는 의미이며, 실제 값은 환경에 따라 다릅니다. max\_connections 값은 서버마다 다르다는 점 참고 바랍니다.

### Local Memory 란?

Local Memory는 각 Backend Process가 개별적으로 사용하는 메모리입니다.

<table style="border-collapse: collapse; width: 100%;" border="1" data-ke-align="alignLeft"><tbody><tr><td><span>항목</span></td><td><span>역할</span></td></tr><tr><td><span>Work Memory</span></td><td><span>Sort / Hash 등의 쿼리 작업에 사용</span></td></tr><tr><td><span>Maintenance Work Memory</span></td><td><span>VACUUM, CREATE INDEX 등의 유지 관리 작업에 사용</span></td></tr><tr><td><span>Temp Buffers</span></td><td><span>세션의 임시 테이블 페이지 보관</span></td></tr><tr><td><span>Catalog Cache</span></td><td><span>테이블 정의 등 메타데이터를 Cache</span></td></tr></tbody></table>

예를 들어 **work\_mem****은 MySQL의** **sort\_buffer\_size****와** **join\_buffer\_size****가 담당하는 작업 메모리 역할에 가깝습니다.**

다만 work\_mem은 세션 전체 한도가 아니라 개별 연산의 기준이며, Hash 연산에는 hash\_mem\_multiplier도 적용됩니다. 여러 연산과 세션이 동시에 실행되면 전체 사용량이 커질 수 있습니다.

또한 **temp\_buffers****를 MySQL의** **tmp\_table\_size****와 동일하게 보면 안 됩니다.**

전자는 세션 임시 테이블의 페이지 Buffer이고, 후자는 내부 임시 테이블의 크기를 제한하는 설정입니다.

### Shared Memory란? 

Shared Memory는 여러 Process가 함께 사용하는 메모리이며, 이미지에서는 Shared Buffers와 WAL Buffer를 중심으로 표현하고 있습니다.

Shared Buffers 는 테이블과 인덱스의 페이지를 메모리에 보관하는 공간입니다. 필요한 페이지가 있으면 재사용하고, 없으면 파일에서 읽어 적재합니다.

이미지의 내부 구성은 아래와 같이 이해하면 됩니다.

<table style="border-collapse: collapse; width: 100%;" border="1" data-ke-align="alignLeft"><tbody><tr><td>구성</td><td><span>역할</span></td></tr><tr><td><span>Buffer Table</span></td><td><span>페이지가 위치한 Buffer를 찾기 위한 매핑</span></td></tr><tr><td><span>Buffer Descriptors</span></td><td><span>Buffer의 참조 상태, Dirty 여부 등 관리</span></td></tr><tr><td><span>Buffer Pool</span></td><td><span>실제 데이터 페이지 보관</span></td></tr></tbody></table>

즉, 페이지의 **위치 정보 → 상태 정보 → 실제 내용**을 구분한 구조입니다. 

### WAL Buffer 란?

데이터 변경에 대한 WAL Record를 일시적으로 보관하는 공간입니다.

WAL은 데이터 페이지를 파일에 반영하기 전에 관련 로그를 먼저 영구 저장하는 방식으로, 장애 발생 시 변경 내용을 복구하는 데 사용됩니다.

따라서 **COMMIT이 완료되었다고 해서 변경된 데이터 페이지가 모두 Data Files에 기록된 것은 아닙니다.** 일반적인 동기 COMMIT에서는 필요한 WAL의 영구 저장을 보장하고, 데이터 페이지는 별도로 기록할 수 있습니다.

### Background Process 란?

Background Process는 데이터 기록과 유지 관리 작업을 담당합니다.

Process주요 역할

<table style="border-collapse: collapse; width: 100%;" border="1" data-ke-align="alignLeft"><tbody><tr><td><span>WAL Writer</span></td><td><span>WAL Buffer의 내용을 주기적으로 기록</span></td></tr><tr><td><span>Background Writer</span></td><td><span>일부 Dirty Buffer를 기록하여 Buffer 재사용을 도움</span></td></tr><tr><td><span>Checkpointer</span></td><td><span>Checkpoint에 필요한 페이지 기록과 동기화 수행</span></td></tr><tr><td><span>Autovacuum Launcher</span></td><td><span>Autovacuum 작업 조율</span></td></tr><tr><td><span>Autovacuum Worker</span></td><td><span>실제 VACUUM / ANALYZE 수행</span></td></tr></tbody></table>

Dirty Buffer는 메모리에서 변경되어 파일에 아직 반영되지 않은 Buffer입니다.

Background Writer는 Buffer 재사용 시 쓰기 부담을 줄여주고, Checkpointer는 장애 복구 기준점에 필요한 기록을 완료하는 역할로 구분하면 됩니다.

단, WAL과 Data Files의 기록을 Background Process만 수행하는 것은 아니고, Backend Process도 필요한 WAL Flush나 데이터 페이지 쓰기를 수행할 수 있습니다.

Autovacuum은 지난 글에서 살펴본 것처럼 불필요해진 Row Version을 정리하고, ANALYZE를 통해 실행계획에 필요한 통계정보를 수집합니다. VACUUM과 ANALYZE는 각각 별개의 작업입니다.

### 쿼리 처리 흐름

전체 구조를 쿼리 관점에서 연결하면 아래와 같습니다.

<table style="border-collapse: collapse; width: 100%;" border="1" data-ke-align="alignLeft"><tbody><tr><td>구분</td><td>기본 흐름</td></tr><tr><td><span>SELECT</span></td><td><span>SQL 요청 → 실행계획 수립 → 필요한 페이지 접근 → 결과 반환</span></td></tr><tr><td><span>UPDATE</span></td><td><span>대상 페이지 접근 → 변경 및 WAL 생성 → Buffer가 Dirty 상태로 변경</span></td></tr><tr><td><span>COMMIT</span></td><td><span>일반적인 동기 설정에서 필요한 WAL의 영구 저장을 기다린 뒤 완료</span></td></tr></tbody></table>

Dirty Page는 별도의 시점에 Data Files로 기록됩니다. COMMIT 이전에도 기록될 수 있지만, 변경사항을 기록하는 PG의 WAL Log가 먼저 영구 저장 되어야 합니다.

### 정리

이렇게 흐름도를 살펴보면서 전체적인 PostgreSQL 아키텍처를 기록했는데, 여기서 또 중요한게 MySQL의 Binary log가 있다면 PostgreSQL 에서는 WAL Log가 있습니다. 아키텍처에서 아주 중요한 부분이라 다음 포스팅에서 공부해보겠습니다.