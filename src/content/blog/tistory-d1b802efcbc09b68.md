---
title: "[PostgreSQL] PostgreSQL 기본 아키텍처 - 2"
date: "2026-10-20T07:31:03.000Z"
category: "Database | SQL | OS/PostgreSQL"
source: "https://hyungyun.tistory.com/entry/PostgreSQL-PostgreSQL-%EA%B8%B0%EB%B3%B8-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98-2"
description: "안녕하세요. 오늘은 지난 포스팅에 이어서 PostgreSQL의 기본 아키텍처를 공부하고, 정리해보려고 합니다. 지난 포스팅과 함께 보면 좋을 듯하여 첨부합니다. [PostgreSQL] PostgreSQL 기본 아키텍처 - 1 안녕하세"
---

안녕하세요. 오늘은 지난 포스팅에 이어서 PostgreSQL의 기본 아키텍처를 공부하고, 정리해보려고 합니다.

지난 포스팅과 함께 보면 좋을 듯하여 첨부합니다.

 [참고 자료 · hyungyun.tistory.com](https://hyungyun.tistory.com/entry/PostgreSQL-PostgreSQL-%EA%B8%B0%EB%B3%B8-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98-1)

지난번에는 WAL Buffer에 대한 간략한 개념을 공부했는데요.

이번에는 WAL이 필요한 이유, UPDATE 처리 과정, COMMIT 의 의미 및 과정 등 쿼리가 수행되고 변경 사항이 적용될 때에, 내부 동작에 대해서 공부해보려 합니다. WAL Log에 대한 내용이 대부분이니 참고하면 좋을 듯 합니다. 

엔진은 Aurora PostgreSQL 의 16.10 버전을 기준으로 테스트 하고 작성하였습니다. 간단하게 중간 중간 PostgreSQL 과의 차이점도 기재해두었으니 참고하면 좋을 것 같습니다.

### WAL 개념 및 쓰임

WAL은 **Write-Ahead Logging**의 약자로, 데이터 페이지를 영구 저장하기 전에 관련 변경 로그를 먼저 영구 저장하는 방식입니다.

데이터를 수정할 때마다 변경된 페이지를 모두 저장하면 I/O 부담이 커질 수 있어서, PostgreSQL은 복구에 필요한 로그를 먼저 저장하고, 데이터 페이지의 기록은 별도로 진행합니다.

장애가 발생해 일부 변경이 데이터 파일에 반영되지 않았더라도, 저장된 WAL을 재생하여 복구할 수 있습니다. 이처럼 변경을 다시 적용하는 작업을 Redo라고 합니다.

즉, **WAL은 단순한 SQL 실행 이력이 아니라 데이터 복구에 필요한 변경 기록**으로 이해하면 좋습니다. 

### WAL과 WAL Buffer는 어떻게 다를까요?

앞에서 WAL과 WAL Buffer라는 표현을 함께 사용했는데요. 이름은 비슷하지만 의미는 조금 달라요.

<table style="color: #333333; text-align: start; border-collapse: collapse; width: 100%;" border="1" data-ke-align="alignLeft"><tbody><tr><td><span>용어</span></td><td><span>의미</span></td></tr><tr><td><span>WAL</span></td><td><span>변경 로그를 먼저 영구 저장하는 방식과 그 로그를 가리켜요</span></td></tr><tr><td><span>WAL Record</span></td><td><span>개별 변경에 대해 생성되는 로그 기록이에요</span></td></tr><tr><td><span>WAL Buffer</span></td><td><span>생성된 WAL Record를 저장 경로로 내보내기 전에 보관하는 공유 메모리 공간이에요</span></td></tr><tr><td><span>LSN</span></td><td><span>WAL 안에서 기록의 위치를 나타내요</span></td></tr></tbody></table>

쉽게 생각하면 **WAL Record는 기록 내용, WAL Buffer는 잠시 보관하는 공간, LSN은 기록의 위치**라고 구분하면 됩니다.

WAL Buffer는 메모리이기 때문에, 여기에 기록이 들어갔다는 사실만으로 장애 시 보존까지 보장되는 것은 아니에요. 이후 저장 과정과 COMMIT의 대기 조건을 함께 봐야 합니다.

아래 공식문서를 함께 참고하면 좋을 것 같아서 첨부합니다.

 [참고 자료 · www.postgresql.org](https://www.postgresql.org/docs/16/runtime-config-wal.html)

### UPDATE 실행시 내부 동작 방식

사전에 생성한 inventory 테이블에 재고를 1개 줄이는 UPDATE 구문을 실행할때 내부 동작 방식으로는,

```
UPDATE wal_lab.inventory
SET stock = stock - 1
WHERE item_id = 1;
```

Backend Process는 대상 페이지에 접근하고, 가시성과 Lock 경합을 고려하고 변경 작업을 수행합니다. 일반적인 Heap Table에서는 새로운 Row Version을 만들고, 필요한 WAL Record도 생성합니다. 도식화해서 표현하면 아래와 같습니다.

```
UPDATE 실행
    ↓
대상 페이지 접근 및 가시성·Lock 확인
    ↓
행 버전 변경 + 필요한 WAL Record 생성
    ├─ 메모리의 데이터 페이지 변경
    └─ 변경 로그 생성
```

여기서 중요한 내용은**WAL은 COMMIT 시점에만 생성되는 것이 아니라** UPDATE를 수행하는 과정에서도 생성됩니다.

또한 일반적으로 PostgreSQL에서 Dirty Page는 파**일로 기록할 변경이 남아 있는 페이지**를 뜻합니다. **미커밋 페이지라는 의미는 아니므로**, COMMIT 이후에도 Dirty 상태일 수 있습니다.

### Commit 의 개념과 쓰임

COMMIT은 트랜잭션의 변경을 확정하는 작업입니다. 하지만 데이터 페이지가 모두 저장되었다는 의미와는 구분해야 합니다.

일반 PostgreSQL에서는 fsync = on, synchronous\_commit = on인 경우 필요한 WAL의 로컬 영구 저장을 기다려요. 동기 복제가 설정되어 있다면 Standby의 응답도 기다릴 수 있습니다.

여기서 synchronous\_commit 파라미터란 트랜잭션 커밋이 성공했다고 클라이언트에게 응답하기 전에, WAL (Write-Ahead Log) 기록을 어디까지 완료해야 하는지 결정하는 설정으로, 기본값은 ON 입니다.

ON 상태일 때는 WAL Log가 로컬 디스크에 완전히 Flush 된 것을 확인한 후에 클라이언트에게 성공 응답을 보냅니다.

Aurora PostgreSQL은 로그 기반의 분산 스토리지를 사용합니다.

데이터는 3개 AZ에 총 6개의 복사본으로 유지되며, 일반적인 동기 COMMIT에서는 필요한 로그에 대해 6개 중 4개의 저장 확인을 받은 뒤 성공을 응답합니다. 이를 쓰기 쿼럼(Write Quorum)이라고 하는데요.

여기서 4개는 기록할 복사본의 수가 아니라, 쓰기가 완료되었다고 인정하기 위해 필요한 최소 확인 수예요. 또한 이 복사본 수는 DB 인스턴스나 Reader의 개수와는 다릅니다.

따라서 COMMIT의 저장 확인을 이해할 때는 일반 PostgreSQL의 로컬 WAL 저장과 Aurora의 분산 스토리지 쓰기 쿼럼을 구분해서 보면 좋겠습니다.

간략하게 두 엔진간의 차이점을 설명하면 아래와 같습니다. 

```
일반 PostgreSQL
변경 로그 → 필요한 WAL 영구 저장 → 동기 COMMIT 응답
데이터 페이지 기록은 별도 진행

Aurora PostgreSQL
변경 로그 → 분산 스토리지 전송 → 필요한 저장 확인 → 동기 COMMIT 응답
페이지 반영은 스토리지 계층에서 처리
```

WAL Log VS Binary Log

지난 글에서는 MySQL의 Binary Log와 PostgreSQL의 WAL을 연결해서 설명했는데요. 역할을 조금 더 나눠보면 아래와 같습니다.

<table style="border-collapse: collapse; width: 100%; height: 78px;" border="1" data-ke-align="alignLeft"><tbody><tr style="height: 17px;"><td style="height: 17px;"><span>비교 관점</span></td><td style="height: 17px;"><span>PostgreSQL</span></td><td style="height: 17px;"><span>MySQL</span></td></tr><tr style="height: 21px;"><td style="height: 21px;"><span>장애 복구를 위한 변경 재적용</span></td><td style="height: 21px;"><span>WAL</span></td><td style="height: 21px;"><span>InnoDB Redo Log</span></td></tr><tr style="height: 21px;"><td style="height: 21px;"><span>복제·시점 복구</span></td><td style="height: 21px;"><span>WAL을 활용하는 복제·복구 체계</span></td><td style="height: 21px;"><span>Binary Log를 활용하는 복제·복구 체계</span></td></tr></tbody></table>

WAL은 장애 복구 관점에서는 Redo Log와 가깝고, 복제·시점 복구에서는 Binary Log와 역할 일부가 겹칩니다. 이 부분에서는 유사한 부분이 있다는 생각이 들지만,  **WAL을 Binary Log와 완전히 같은 개념으로 대응시키지는 않는 것이 좋습니다.**

### 마무리

이번에는 WAL이 필요한 이유와 UPDATE부터 COMMIT까지의 내부 동작을 살펴봤습니다.

핵심은 **데이터 페이지의 변경과 트랜잭션의 확정, 그리고 저장 과정이 각각 구분된다는 점**이에요. COMMIT이 성공했다고 해서 변경된 데이터 페이지까지 모두 저장된 것은 아니라는 점도 함께 알아봤습니다.

다음 포스팅에서는 이 질문을 이어서 **MVCC와 VACUUM**을 공부해보려고 해요. 여러번 다룬 주제이긴 하나, MVCC 와 함께 연관지어 다루면 더 좋을 것 같아 한번 더 상세하게 기록해볼까 합니다.