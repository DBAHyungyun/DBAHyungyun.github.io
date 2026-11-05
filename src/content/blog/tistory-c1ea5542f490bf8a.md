---
title: "[AWS] AWS RDS MySQL vs AWS Aurora MySQL"
date: "2026-01-23T05:37:31.000Z"
category: "Cloud/AWS"
source: "https://hyungyun.tistory.com/entry/AWS-AWS-RDS-MySQL-vs-AWS-Aurora-MySQL"
description: "이번에는 RDS MySQL 과 Aurora MySQL 의 아키텍처적인 차이점에 대해서 공부해볼까 합니다. AWS 의 Aurora MySQL 소개 Document를 보면 MySQL을 기반으로 한 MySQL 와 호환되는 완전 관리형 데이"
---

이번에는 RDS MySQL 과 Aurora MySQL 의 아키텍처적인 차이점에 대해서 공부해볼까 합니다.

AWS 의 Aurora MySQL 소개 Document를 보면 MySQL을 기반으로 한 MySQL 와 호환되는 완전 관리형 데이터베이스 엔진이라고 소개하며, MySQL 의 처리량을 대략 5배 최대 제공할 수 있다고 가이드 해줍니다. 이런 내용을 바탕으로 RDS MySQL 과 Aurora MySQL 의 성능 차이점과 아키텍처의 차이점에 대해서 알아보겠습니다.

* * *

우선 RDS는 AWS 에서 제공하는 완전 관리형 데이터베이스 서비스이다. (Relational Database Service)

이러한 AWS RDS는 PostgreSQL, MySQL, MariaDB, Oracle 등 여러 RDB를 지원하고, 기존 On-Premise 서버나, EC2 위에 직접 설치한 MySQL 과 내부 아키텍처가 거의 동일한 서비스를 제공한다. 

그러나, 사용자가 직접 관여하여 업그레이드, 백업, 복구 등 여러가지 업무를 직접 해야하는 On-Prem 서비스와는 달리 AWS가 백업, 패치, 복구등의 서비스를 제공하는 완전 관리형 서비스라고 볼 수 있다.

정리하자면, 오픈 소스 DB 인 MySQL을 클라우드 환경에서 쉽게 운영할 수 있도록 AWS가 관리해주는 서비스로서, 백업, 패치, 복구와 같은 운영 업무를 AWS가 지원해주는 완전 관리형 서비스라고 정의할 수 있겠다.

![](__MEDIA__/838197a113da0c6a598ebb91f030933a3e6d4212ce21b37242aff2b2ab3801e6.png)

AWS 가 지원하는 RDS 항목

RDS MySQL은 기본적으로 오픈소스 DB MySQL과 동일한 아키텍처 구조를 가지게 된다. MySQL 아키텍처는 이전 글에서도 작성한적이 있어서 참고하면 좋을듯 하여 링크를 남겨 두겠습니다. 

 [참고 자료 · hyungyun.tistory.com](https://hyungyun.tistory.com/entry/MySQL-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98-1)

그렇다면, RDS MySQL과 Aurora MySQL의 차이점에 대해서 중점적으로 알아볼텐데, 가장 중요한 차이점은 Storage 구성방식에 있습니다.

RDS MySQL 의 Storage 구성 방식 (EBS 볼륨 방식)

*   **구조:** EC2 인스턴스에 EBS(Elastic Block Store)라는 블록 스토리지가 1:1로 연결된다.
*   **데이터 보호:** 하드웨어 장애에 대비하기 위해 RAID 미러링 등을 사용하지만, 기본적으로 단일 AZ(가용 영역) 내에 존재한다.
*   **용량 관리:** 처음 설정한 용량(예: 100GB)이 꽉 차면, 수동으로 늘리거나 오토 스케일링 설정을 해야 하며, 물리적인 볼륨 확장 작업이 필요하다.

Aurora MySQL 의 Storage 구성 방식 (단일 가상 볼륨 클러스터 볼륨 방식)

*   **구조:** 3개의 가용 영역(AZ)에 걸쳐 있는 거대한 가상 스토리지 풀(Cluster Volume)을 사용한다.
*   **데이터 보호 (6-Way Replication):** 데이터를 저장할 때 자동으로 3개의 AZ에 각각 2개씩, 총 6개의 사본(Copy)을 만들어 저장한다. (디스크 2개가 고장 나도 쓰기 가능, 3개가 고장 나도 읽기 가능) 복제 양은 클러스터의 DB 인스턴스 수와는 관계가 없다.
*   **용량 관리:** 데이터가 늘어나면 10GB 단위로 자동으로 스토리지가 확장됩니다 (최대 128TB). 사용자가 용량을 미리 산정할 필요가 없다.

정리하자면, MySQL RDS의 경우에는 최초 할당된 스토리지를 활용하고, EBS 형태의 각각 인스턴스별로 별개의 Volume을 할당하여 바라봅니다. 이후에는 할당된 Storage 를 변경, 추가할 수 없으며 Blue/Green 배포 방식 등 작업이 필요합니다.

하지만 Aurora MySQL은 자동으로 스토리지 볼륨이 확장되며, 인스턴스 모두 공유 스토리지를 바라보게 됩니다. 데이터 보호성 역시 RDS MySQL 보다 크다는것을 알 수 있습니다.

![](__MEDIA__/b879710e82f9c908739d22230a04a321233308a477bcc43c45c7764b83463bc1.png)

Aurora MySQL 에서 Shared Storage 방식

두번째는, I/O 쓰기 방식에 있다.

RDS MySQL 의 I/O 쓰기 방식

*   Double Write Buffer : Buffer Pool 에서 쓰기 작업 도중 실패를 방지하기 위해, 데이터를 임시 공간에 한 번 쓰고, 실제 공간에 한번 더 쓰기 작업을 하는 것 즉, I/O 가 2배로 발생하게 됨
*   동기화 : Multi-AZ (이중화)를 사용하면, Stnad By 서버에도 데이터를 다보내고 확인해야 하므로 쓰기 성능이 떨어진다.

Aurora MySQL 의 I/O 쓰기 방식

*   No Double Write : 스토리지에 로그만 쌓고 쓰기 작업을 종료한다. 트랜잭션 로그를 스토리지 계층으로 Write 할 때만, I/O가 발생한다.
*   비동기 병렬 처리 : 6개의 사본 중, 4개 이상만 응답하면 저장 완료 처리 한다. (쿼럼 방식) 이런 방식으로 디스크를 전부 기다릴 필요가 없다. 

세번째는, Read Replica 방식과 HA, 장애조치 입니다.

RDS MySQL의 Read Replica, 고가용성 (High Availability) 및 장애조치

*   복제 과정 : Primary DB가 Binary Log를 보내면, Reader Replica가 그 Binary Log를 토대로, 스토리지에 다시 실행한다.
*   고가용성 (High Availability) 및 장애조치 : 장애 감지 -> Read Replica 승격 -> DNS 주소 변경 -> 클라이언트 접속

Aurora MySQL의 Read Replica, 고가용성 (High Availability) 및 장애조치

*   복제 과정: 데이터를 복사해서 보내지 않습니다. Replica DB도 Primary와 똑같은 스토리지 볼륨을 바라봅니다.
*   고가용성 (High Availability) 및 장애조치 :  스토리지는 이미 공유 중이므로, 읽기 전용이었던 Replica 중 하나를 즉시 Writer로 승격시킵니다.

정리하자면, MySQL 은 EBS 형태로 각각의 스토리지를 할당받아 사용하기 때문에, 복제 과정과 장애 조치시 Active-Standby 서버의 전환 등 상대적으로 Aurora MySQL 과 차이가 발생할 수 있습니다. 

하지만, Aurora MySQL의 경우에는 Storage를 기본적으로 공유하고 있기 때문에 장애 상황에서의 승격이나, 복제 과정에서 RDS MySQL 보다 개선되는 모습을 보여주고 있습니다.

* * *

이렇게만 본다면, 모두 Aurora MySQL을 사용하면 되지 왜 RDS MySQL 을 사용할까 생각하시는 분들이 계실텐데, RDS MySQL 보다 Aurora MySQL은 약 20% 이상 인스턴스 비용이 비쌉니다.

불필요한 I/O가 없고, 스토리지 사용량이 많은 RDS를 위하여 I/O 비용을 없애고, Storage 비용을 추가하는 I/O Optimized 요금제가 나왔지만 그럼에도 기본적으로 발생되는 스토리지 비용 자체가 상당해서 어떤 금액 정책을 가지고 서비스를 선정할지 깊게 고민해봐야 합니다.

이렇게 RDS MySQL과 Aurora MySQL의 차이점에 대해서 공부 해보았습니다. 성능적으로는 Aurora MySQL이 좋고 관리하기에도 용이해 보이지만, 실제 Aurora MySQL을 운영하면서 전보다 아주 많이 안정 되었으나 간간히 버그도 발생하는 모습도 보여줍니다. 그래도 관리하게 매우 용이하니 인스턴스 금액에 대한 제한이 없다면 고려해보는 것도 운영에 좋은 옵션이 될 것 같습니다.