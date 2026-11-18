---
title: "[AWS] Aurora MySQL 3.04.X → 3.10.X 업그레이드 과정 및 고려사항"
date: "2026-11-18T05:59:42.000Z"
category: "Cloud/AWS"
source: "https://hyungyun.tistory.com/entry/AWS-Aurora-MySQL-304X-%E2%86%92-310X-%EC%97%85%EA%B7%B8%EB%A0%88%EC%9D%B4%EB%93%9C-%EA%B3%BC%EC%A0%95-%EB%B0%8F-%EA%B3%A0%EB%A0%A4%EC%82%AC%ED%95%AD"
description: "안녕하세요. 오늘은 실제 운영 환경에서 진행했던 Amazon Aurora MySQL 엔진 버전 업그레이드 과정에 대해서 정리해보려고 합니다. 기존 Aurora MySQL 3.04 계열의 LTS(Long-Term Support) 지원 "
---

안녕하세요. 오늘은 실제 운영 환경에서 진행했던 **Amazon Aurora MySQL 엔진 버전 업그레이드 과정**에 대해서 정리해보려고 합니다.

기존 Aurora MySQL 3.04 계열의 LTS(Long-Term Support) 지원 종료 일정에 따라 엔진 업그레이드가 필요했으며, 이번 작업에서는 **3.04.X → 3.10.X** 버전으로 변경하였습니다.

운영 환경의 Database는 애플리케이션 서비스와 직접 연결되어 있기 때문에 단순히 엔진 버전만 변경하는 것이 아니라, Release Note, Parameter 변경 사항 및 서비스 영향도를 함께 검토해야 합니다.

이번 글에서는 업그레이드 과정에서 중요하게 확인했던 사항들을 중심으로 정리하겠습니다.

## 1\. 업그레이드 배경 및 환경

Aurora MySQL은 AWS에서 제공하는 MySQL 호환 관리형 데이터베이스 서비스입니다.

이번 작업의 AS-IS 버전인 Aurora MySQL 3.04 계열은 2026년 10월 31일 Standard Support 종료가 예정되어 있었습니다.

이에 따라 지원 종료 이전에 새로운 LTS 버전으로 전환하고자 업그레이드를 진행하였습니다.

<table style="border-collapse: collapse; width: 100%;" border="1" data-ke-align="alignLeft"><tbody><tr><td><span>구분</span></td><td><span>AS-IS</span></td><td><span>TO-BE</span></td></tr><tr><td><span>Database</span></td><td><span>Aurora MySQL</span></td><td><span>Aurora MySQL</span></td></tr><tr><td><span>Engine Version</span></td><td><span>3.04.x</span></td><td><span>3.10.x</span></td></tr><tr><td><span>MySQL Compatibility</span></td><td><span>8.0.28</span></td><td><span>8.0.42</span></td></tr><tr><td><span>LTS</span></td><td><span>Yes</span></td><td><span>Yes</span></td></tr><tr><td><span>Parameter Group Family</span></td><td><span>aurora-mysql8.0</span></td><td><span>aurora-mysql8.0</span></td></tr><tr><td><span>Upgrade 방식</span></td><td><span>-</span></td><td><span>In-place Upgrade</span></td></tr></tbody></table>

이번 작업은 Aurora MySQL 3 계열 내 **Minor Version Upgrade**로, MySQL 5.7에서 8.0으로 변경하는 Major Version Upgrade와는 차이가 있습니다.

다만 같은 Major Version 내 업그레이드라고 하더라도 엔진 내부 동작이나 기본 Parameter 값에 변경 사항이 존재할 수 있으므로 사전 검토가 필요합니다.

## 2\. 업그레이드 사전 검토

운영 환경에 적용하기 전 약 2~3주 동안 개발·검증 환경을 대상으로 업그레이드 준비 및 검토를 진행하였습니다.

주요 검토 항목은 다음과 같습니다.

<table style="border-collapse: collapse; width: 100%;" border="1" data-ke-align="alignLeft"><tbody><tr><td style="width: 36.0465%;"><span>검토 항목</span></td><td style="width: 63.9535%;"><span>주요 내용</span></td></tr><tr><td style="width: 36.0465%;"><span>Engine Version</span></td><td style="width: 63.9535%;"><span>목표 버전 및 업그레이드 지원 여부</span></td></tr><tr><td style="width: 36.0465%;"><span>Release Note</span></td><td style="width: 63.9535%;"><span>Bug Fix, 기능 및 호환성 변경 사항</span></td></tr><tr><td style="width: 36.0465%;"><span>Parameter Group</span></td><td style="width: 63.9535%;"><span>신규·변경·삭제 Parameter 확인</span></td></tr><tr><td style="width: 36.0465%;"><span>Application</span></td><td style="width: 63.9535%;"><span>연결 및 주요 SQL 영향 검토</span></td></tr><tr><td style="width: 36.0465%;"><span>Downtime</span></td><td style="width: 63.9535%;"><span>서비스 중단 가능 시간 검토</span></td></tr><tr><td style="width: 36.0465%;"><span>Recovery</span></td><td style="width: 63.9535%;"><span>백업 및 복구 방안 검토</span></td></tr><tr><td style="width: 36.0465%;">Upgrade 방식 선정</td><td style="width: 63.9535%;"><span>서비스 중단 가능 시간을 검토해 Upgrade 방안 검토</span></td></tr></tbody></table>

특히 업그레이드 전후 엔진 버전의 Release Note를 확인하여 기존 환경에 영향을 줄 수 있는 변경 사항이 있는지 검토하는 것이 중요하였고, 확보 가능한 다운 타임에 맞춰서 업그레이드 방식을 선정하는 것에도 공수가 필요했습니다.

또한, 이번 작업에서는 3.04.X 버전과 3.10.X 버전이 호환하는 MySQL 버전에도 차이가 있으므로, Aurora 자체 변경 사항과 MySQL 관련 변경 사항을 함께 고려할 필요가 있었습니다.

## 3\. Parameter Group 비교

이번 업그레이드에서 중요하게 검토했던 부분 중 하나는 **AS-IS / TO-BE Parameter 비교**입니다.

Aurora MySQL에서는 DB Cluster Parameter Group과 DB Parameter Group을 구분하여 관리합니다.

이번 업그레이드는 동일한 aurora-mysql8.0 Parameter Group Family 내에서 진행되었지만, 기존 운영 환경에 적용된 설정값과 새로운 엔진 버전의 기본값이 동일한지는 별도로 확인해야 합니다.

주요 검토 기준은 다음과 같습니다.

*   기존 User-defined Parameter의 설정값 유지 여부
*   신규 추가되거나 지원이 종료된 Parameter
*   Engine Default Value 변경 여부
*   Static / Dynamic Parameter 및 재시작 필요 여부
*   Timezone, Character Set 과 같은 주요 파라미터 정상 설정 여부

AWS CLI에서는 다음과 같이 Parameter를 확인할 수 있습니다.

```
# DB Cluster Parameter 조회
aws rds describe-db-cluster-parameters \
  --db-cluster-parameter-group-name <cluster-parameter-group-name>

# DB Instance Parameter 조회
aws rds describe-db-parameters \
  --db-parameter-group-name <db-parameter-group-name>
```

**Parameter Group에 설정된 값과 Database에 실제 적용된 값은 구분해서 확인하는 것이 중요합니다.**

특히 기존에 사용자 정의로 변경했던 Parameter는 업그레이드 이후에도 의도한 설정이 유지되는지 점검할 필요가 있습니다. 

위에 기재한 Timezone 이나 캐릭터셋이 동일한 내용입니다. 만약 Timezone을 잊은채로 한국 시간이 아닌 UTC 시간으로 적용한다면 애플리케이션에 장애를 유발할 수 있습니다.

![](__MEDIA__/eacb95e824d9d3186284d5c5ab4af20bef7622e01615efce399fae565e6ce671.png)

파라미터 비교

또한, AWS 에서 제공하는 파라미터 migration tool 도 사용해 보았습니다.

굉장히 유용했어서 업그레이드가 필요하신 분들은 확인하면 좋을 듯 합니다.

[참고 자료 · repost.aws](https://repost.aws/articles/ARYqSL-AQHQNOe2Yvj0408VQ/how-do-i-migrate-an-amazon-rds-parameter-group-to-a-new-engine-version-or-aurora-using-aws-cli)

![](__MEDIA__/ca798f9ea09ec264ffee51b74d8359984193015b6c61bacc3668ff7191e465ee.png)

지난 4월 Test 진행한 모습

## 4\. 업그레이드 방식 선정 및 운영 적용

### 4.1 업그레이드 방식 비교

Aurora MySQL의 엔진 업그레이드는 In-place Upgrade 외에도 Blue/Green Deployment, Snapshot Restore 등의 방식으로 진행할 수 있습니다.

각 방식은 작업 절차와 서비스 영향도가 다르기 때문에 운영 환경의 특성에 맞게 선택하는 것이 중요합니다.

<table style="border-collapse: collapse; width: 100%;" border="1" data-ke-align="alignLeft"><tbody><tr><td><span>구분</span></td><td>In-place Upgrade</td><td><span>Blue/Green Deployment</span></td><td><span>Snapshot Restore</span></td></tr><tr><td><span>작업 방식</span></td><td><span>기존 Cluster의 엔진 버전 변경</span></td><td><span>신규 Green 환경에서 업그레이드 후 전환</span></td><td><span>Snapshot을 신규 Cluster로 복원</span></td></tr><tr><td><span>기존 Cluster 유지</span></td><td><span>기존 Cluster 직접 변경</span></td><td><span>전환 전까지 기존 환경 유지</span></td><td><span>기존 환경 별도 유지 가능</span></td></tr><tr><td><span>Downtime</span></td><td><span>엔진 재시작 및 연결 중단 가능</span></td><td><span>Switchover 시 짧은 연결 중단</span></td><td><span>복원 및 서비스 전환 시간 필요</span></td></tr><tr><td><span>데이터 동기화</span></td><td><span>별도 동기화 불필요</span></td><td><span>Blue/Green 간 복제</span></td><td><span>Snapshot 이후 변경분 별도 고려</span></td></tr><tr><td><span>추가 작업</span></td><td><span>상대적으로 단순</span></td><td><span>Green 환경 및 복제 상태 관리</span></td><td><span>신규 Cluster 구성 및 Endpoint 전환</span></td></tr></tbody></table>

**Blue/Green Deployment**는 기존 운영 환경과 별도의 Green 환경을 생성하고, 데이터 변경 사항을 동기화하면서 신규 버전을 검증할 수 있다는 장점이 있습니다.

다운사이징에 해당하는 내용이지만, Blue/Green 을 활용했기에 관련 내용 첨부하면 좋을 듯 하여 첨부합니다.

[참고 자료 · hyungyun.tistory.com](https://hyungyun.tistory.com/entry/AWS-MySQL-Storage-%EB%8B%A4%EC%9A%B4-%EC%82%AC%EC%9D%B4%EC%A7%95)

업그레이드 완료 후 Switchover를 통해 신규 환경으로 전환하므로 서비스 중단 시간을 최소화해야 하는 환경에서 유용합니다.

반면 별도의 Green 환경을 운영해야 하므로 추가 리소스와 복제 상태, 전환 조건 등을 함께 관리해야 합니다.

**Snapshot Restore**는 특정 시점의 Snapshot을 이용하여 신규 DB Cluster를 생성하는 방식입니다.

기존 환경을 유지하면서 신규 환경을 구성할 수 있지만, Snapshot 생성 이후 발생한 데이터 변경분은 자동으로 동기화되지 않습니다.

따라서 운영 환경에서 해당 방식을 이용하려면 데이터 정합성과 애플리케이션 Endpoint 전환을 함께 고려해야 합니다.

### 4.2 In-place Upgrade 선정 배경

이번 작업에서는 **In-place Upgrade 방식**으로 운영 환경의 엔진 버전을 변경하였습니다.

해당 방식을 선택한 배경은 다음과 같이 정리할 수 있습니다.

**첫번째, 동일한 Aurora MySQL 3 계열 내 Minor Version Upgrade라는 점**

이번 작업은 Major Version을 변경하는 것이 아니라 기존 Aurora MySQL 3 계열에서 3.10.3으로 업그레이드하는 작업이었습니다.

AWS에서는 동일 Major Version의 마이너 업그레이드 시 기존 Cluster의 Engine Version을 직접 변경하는 방법을 지원하고 있습니다.

**두번째, 사전에 서비스 점검 및 중단 가능 시간을 충분히 확보했다는 점**

Blue/Green Deployment는 Downtime 최소화 측면에서 장점이 있지만, 이번 작업에서는 별도의 서비스 점검 시간을 확보하여 In-place 방식으로 진행할 수 있었습니다.

따라서 추가적인 인스턴스 비용을 지불하며 Downtime 최소화를 위해 신규 환경을 구성하는 것보다 기존 Cluster에서 업그레이드를 진행하는 방식을 선택하였습니다.

**세번째, 기존 운영 환경의 구성을 유지하면서 작업할 수 있다는 점**

In-place Upgrade는 기존 DB Cluster를 대상으로 엔진 버전을 변경하므로 별도의 신규 운영 Cluster 구성이나 Endpoint 전환 작업을 최소화할 수 있습니다.

또한 운영 적용 이전에 개발·검증 환경에서 사전 검토를 진행하였고, 업그레이드 이전 Snapshot을 생성하여 문제 발생 시 복원할 수 있도록 복구 방안을 수립하였습니다.

결과적으로 **Minor Version Upgrade, 확보된 서비스 점검 시간, 기존 환경 유지 및 Snapshot 기반 복구 정책**을 고려하여 In-place Upgrade 방식으로 진행하였습니다.

다만 In-place Upgrade가 다른 방식보다 항상 안전하거나 적합하다는 의미는 아닙니다. 서비스 중단이 허용되지 않는 환경이라면 Blue/Green Deployment 등 다른 방식을 우선 검토할 필요가 있습니다.

### 4.3 운영 환경 업그레이드

운영 환경에서는 사전에 확보한 서비스 점검 시간에 맞춰 In-place Upgrade를 진행하였습니다.

일반적인 작업 절차는 다음과 같습니다.

1.  업그레이드 대상 Cluster 및 Engine Version 확인
2.  Parameter Group과 Snapshot 상태 점검
3.  AWS RDS Console에서 목표 엔진 버전 선택
4.  서비스 점검 시간에 업그레이드 진행
5.  Cluster 및 DB Instance 상태 확인
6.  애플리케이션 연결 및 주요 기능 점검

AWS Console에서는 **RDS → Databases → 대상 DB Cluster → Modify** 메뉴를 통해 엔진 버전을 변경할 수 있습니다.

AWS CLI에서도 다음과 같이 변경할 수 있습니다.

```
aws rds modify-db-cluster \
  --db-cluster-identifier <cluster-identifier> \
  --engine-version 8.0.mysql_aurora.3.10.3 \
  --apply-immediately
```

위 명령어는 업그레이드 방법을 설명하기 위한 예시이며 실제 작업 이력을 의미하지 않습니다.

\--apply-immediately 옵션은 변경 사항을 즉시 적용하므로 운영 환경에서는 서비스 영향도를 확인한 후 사용해야 합니다.

또한, Upgrade Precheck 명령어를 활용하여 사전 CLI 환경에서 버전업을 진행할 때 사전 영향도를 파악하여 문제될 여지가 있는지 추가 검토를 진행하였습니다.

```
mysqlsh --user=[user명] --host=[엔드포인트 주소] --port=[DB Port] -- util check-for-server-upgrade --target-version=[업그레이드 버전]
```

## 5\. 업그레이드 이후 점검

업그레이드가 완료되면 목표 엔진 버전이 정상적으로 적용되었는지 확인해야 합니다.

Aurora MySQL에서는 다음 SQL을 통해 현재 버전을 조회할 수 있습니다.

```
SELECT
    AURORA_VERSION() AS aurora_version,
    VERSION() AS mysql_version;
```

이후에는 Engine Version뿐만 아니라 Parameter 적용 상태와 애플리케이션의 정상 동작 여부도 함께 확인해야 합니다.

추가적인 점검 항목은 다음과 같습니다.

<table style="border-collapse: collapse; width: 100%;" border="1" data-ke-align="alignLeft"><tbody><tr><td>점검 항목</td><td>확인 내용</td></tr><tr><td><span>Engine Version</span></td><td><span>목표 버전 적용 여부</span></td></tr><tr><td><span>Writer / Reader</span></td><td><span>Instance 상태 및 연결</span></td></tr><tr><td><span>Parameter Group</span></td><td><span>설정값 적용 여부</span></td></tr><tr><td><span>Error Log</span></td><td><span>업그레이드 이후 오류</span></td></tr><tr><td><span>DatabaseConnections</span></td><td><span>연결 수 및 재연결 상태</span></td></tr><tr><td><span>CPU / Memory</span></td><td><span>시스템 자원 사용량</span></td></tr><tr><td><span>주요 SQL</span></td><td><span>응답 시간 및 실행계획 변화</span></td></tr></tbody></table>

특히 CloudWatch와 Database Insights에서 업그레이드 전후의 주요 지표를 비교하면 성능 변화 여부를 확인하는 데 도움이 됩니다.

업그레이드 당시에 **Aurora MySQL 3.10.x 버전에서 Commit Latency가 급증하는 현상**이 있다 다른 사이트에서 공유 받아서, 해당 지표를 집중적으로 모니터링 하였습니다. 다행히 제가 업그레이드한 시스템에서는 해당 현상이 발현되지는 않았는데 AWS Support에 문의한 결과 정확한 원인 파악 중인 것으로 공유 받았습니다.

또한 In-place 업그레이드 경우에는 DB Warm-Up이 필요하지 않다는 의견이 있었으나, 직접 테스트 해보지 않았기 때문에 주요 SQL 에 대한 캐시 웜업 작업도 진행하였습니다.

다만 업그레이드 이후 I/O나 CPU 사용량에 변화가 발생했다고 해서 엔진 버전 변경이 직접적인 원인이라고 단정하진 않았고,

실제 트래픽, SQL 실행 패턴, 배치 작업 등의 변화도 함께 고려해야 합니다.

## 6\. 백업 및 롤백 정책

이번 운영 환경에서의 업그레이드를 진행하며, 업그레이드 이후 문제가 발생했을 경우를 대비하여 백업 및 롤백 정책을 수립하였습니다.

**이번 작업에서 수립한 롤백 정책은 업그레이드 이전의 수동 스냅샷을 생성하고, 필요 시 해당 스냅샷을 이용해 기존 엔진 버전으로 복원하는 방식이었습니다. (수동 스냅샷은 영구 스냅샷으로 보존됩니다.)**

Aurora MySQL은 업그레이드가 완료된 이후 기존 DB Cluster의 엔진 버전을 직접 이전 버전으로 다운그레이드하는 방식의 Rollback을 지원하지 않습니다.

따라서 문제가 발생했을 때에는 사전에 생성한 Snapshot을 이용하여 별도의 DB Cluster로 복원해야 합니다.

### 6.1 Snapshot 기반 복구 방안

이번 작업에서 검토한 복구 흐름은 다음과 같습니다.

1.  업그레이드 이전 Aurora DB Cluster의 Manual Snapshot 생성
2.  업그레이드 이후 장애 또는 호환성 문제 발생 시 롤백 여부 판단
3.  업그레이드 이전 Snapshot을 이용해 신규 DB Cluster 복원
4.  기존 엔진 버전 및 Parameter Group 적용 상태 확인
5.  Database 연결과 데이터 정합성 검증
6.  애플리케이션 Endpoint 변경 및 서비스 재전환

Snapshot을 통한 복원은 기존 DB Cluster를 직접 이전 상태로 변경하는 것이 아니라, **스냅샷** **시점의 데이터를 이용해 새로운 DB Cluster를 생성하는 방식**입니다.

따라서 복원된 DB Cluster의 Endpoint가 달라질 수 있으며, 애플리케이션의 연결 정보를 변경해야 할 수도 있습니다.

또한 Snapshot 생성 시점 이후 운영 Database에 추가되거나 변경된 데이터는 복원된 클러스터에 자동으로 반영되지 않습니다.

이 때문에 실제 롤백이 필요한 상황에서는 단순히 Snapshot을 복원하는 것뿐만 아니라, **스냅샷** **이후 발생한 데이터 변경분과 서비스 재전환 시점의 데이터 정합성**까지 함께 고려해야 합니다.

고려하는 방법에는, Data Migration이 있고 Dump Restore 방법도 있었으나, 실제로 원복하진 않고 계획만 세워 두었습니다.

복원 당시 이전 엔진 버전이 지원 대상인지도 확인해야 합니다. 지원이 종료된 엔진 버전은 동일한 버전으로 복원이 제한될 수 있기 때문입니다.

![](__MEDIA__/23167f7e5beb57e732cf194e24713115136e9f6c784625119f1c43dfbcb1f25d.png)

수동 스냅샷 생성 예시 이미지

## 7\. 마무리

이번 작업에서는 Aurora MySQL 3.04.4에서 3.10.3으로 업그레이드를 진행하면서 엔진 버전 변경 사항과 Parameter Group, 서비스 영향도를 함께 검토하였습니다.

AWS 관리형 Database는 엔진 업그레이드 절차를 비교적 간편하게 제공하지만, 실제 운영 환경에서는 사전 검증과 Downtime에 대한 고려가 필요합니다.

특히 In-place Upgrade는 단순히 이전 버전으로 되돌리는 방식의 Rollback이 어려우므로, 업그레이드 이전에 백업 및 복구 방안을 검토하는 것이 중요합니다.

결국 운영 환경에서의 Database Upgrade는 엔진 버전을 변경하는 것뿐만 아니라, **기존 설정의 유지 여부와 서비스 안정성을 함께 확인하는 과정**이라고 생각합니다.

이번에 진행했던 작업 내용을 기록해두고, 추후 유사한 업그레이드를 진행할 때 참고하려고 합니다.

## 참고 문서

*   [AWS - Aurora MySQL Release Calendar](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraMySQLReleaseNotes/AuroraMySQL.release-calendars.html)
*   [AWS - Aurora MySQL 3.04.4 Release Notes](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraMySQLReleaseNotes/AuroraMySQL.Updates.3044.html)
*   [AWS - Aurora MySQL 3.10.3 Release Notes](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraMySQLReleaseNotes/AuroraMySQL.Updates.3103.html)
*   [AWS - Aurora MySQL Minor Version Upgrade](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/AuroraMySQL.Updates.Patching.html)
*   [AWS - Aurora Blue/Green Deployments](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/blue-green-deployments.html)
*   [AWS - Restoring from a DB Cluster Snapshot](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-restore-snapshot.html)