---
title: "[AWS Aurora] 리더 인스턴스와 라이터 인스턴스란?"
date: "2026-04-02T07:45:50.000Z"
category: "Cloud/AWS"
source: "https://hyungyun.tistory.com/entry/AWS-Aurora-%EB%A6%AC%EB%8D%94-%EC%9D%B8%EC%8A%A4%ED%84%B4%EC%8A%A4%EC%99%80-%EB%9D%BC%EC%9D%B4%ED%84%B0-%EC%9D%B8%EC%8A%A4%ED%84%B4%EC%8A%A4%EB%9E%80"
description: "안녕하세요. 오늘은 AWS Aurora MySQL 환경에서의 Redaer Instance, Writer Instance에 대해서 정리해보려고 합니다. 이전에 작성했던, 일반 MySQL과 Aurora MySQL의 차이점을 참고하면 더욱"
---

안녕하세요. 오늘은 AWS Aurora MySQL 환경에서의 Redaer Instance, Writer Instance에 대해서 정리해보려고 합니다.

이전에 작성했던, 일반 MySQL과 Aurora MySQL의 차이점을 참고하면 더욱 이해하기에 쉬울 것 같아 첨부합니다. 

 [참고 자료 · hyungyun.tistory.com](https://hyungyun.tistory.com/entry/AWS-AWS-RDS-MySQL-vs-AWS-Aurora-MySQL)

### 개요

온프레미스 환경에서 MySQL 부하분산을 위해서 Master-Slave 을 구성해 Master 에서는 Writer 작업만, Slave 환경에서는 Read 작업만 수행하게 하는 경우가 대부분 입니다.

이와 유사하게 Aurora MySQL 에서도 Writer Instance, Reader Instance로 구성되어 특정 인스턴스에서만 쓰기 작업이 가능하도록, 읽기 작업이 가능하도록 설정하여 운영하곤 합니다.

또한, Aurora 의 경우에는모든 인스턴스(Writer, Reader)가 모든 가용 영역에 걸쳐 복제된 Cluster Volume을 공유합니다. 디스크 볼륨을 공유하기 때문에 Writer 와 Reader 인스턴스는 각자의 로컬 디스크에서 데이터를 가져올 필요 없이 공동의 디스크 볼륨에서 데이터를 입력, 조회 할 수 있습니다.

아래 캡처 사진을 참고하면 보통 하나의 클러스터 안에, 라이터 인스턴스 1개와 사용 용도에 따라 여러개의 리더 인스턴스를 생성하여 부하를 분산시켜 운영하는 경우가 대부분입니다. 만약 조회가 많은 시스템이라면 리더 인스턴스를 늘리면서 운영하면 좋습니다.

![](__MEDIA__/cec11a1f5b3b17947bd203ed13fe5836ba25feb529d28dc385a5a4dcc4a306ea.png)

라이터 인스턴스, 리더 인스턴스

### Writer Instance란? 

Writer Instance는 Aurora MySQL 내부 환경에서 단 하나만 존재하는, 데이터의 삽입,변경 등 데이터의 변경을 수행하는 인스턴스 입니다.

*   역할 : 모든 DDL (CREATE, ALTER 등) 과 DML (INSERT, UPDATE, DELETE) 을 처리하며 필요시에는 읽기 SELECT 작업도 수행이 가능한 인스턴스입니다.
*   저장 방식 : 쓰기 작업 시 6개의 스토리지 노드에 Redo 로그를 전송하며, 4개 노드가 ACK를 보내면 커밋이 완료됩니다.
*   메모리 캐시 : 라이터 인스턴스는 재부팅 되어도 페이지 캐시가 유지되어, 성능 저하를 최소화 시킵니다.
*   장애 조치 : 기존 라이터 인스턴스에 장애 상황이 발생하는 경우 생성된 리더 인스턴스에서 장애 조치 우선 순위에 맞춰 라이터 인스턴스로 승격돼 장애 상황을 최소화 시킵니다. 이는, Aurora MySQL이 기존의 온프레미스와는 다르게 공유 볼륨을 사용하고 있어 순단시간이 적다는 장점을 활요한 것 입니다. 보통 FailOver 가 발생하게 되면 DownTime이 소요되고 각각의 볼륨에 동일한 데이터가 존재해야 안정성을 보장할 수 있지만 Aurora 의 경우에는 공유 볼륨을 활용하여 리더 인스턴스에서도 라이터 인스턴스에 적재된 데이터와 동일한 값을 보장받을 수 있습니다. 

![](__MEDIA__/cb0a3d8b3068cae8dad4b65617c3c48b4c0b9311133c0b196a35ff90b7b74333.png)

Failover 장애 조치 우선 순위

일반적으로 실무에서는 쓰기 작업만 가능한 Writer Instance에는 APP 에서 쓰기만을 작업시키고, Reader Instance에서는 읽기 작업만을 수행시켜 부하를 분산 시켜주는 것이 일반적인 시스템입니다. 

### Reader Instance란 ?

Aurora MySQL의 Reader Instance는 온프레미스 MySQL에서 Slave 로 예를 들어볼 수 있습니다. Aurora 환경에서는 단일 클러스터 내에 최대 15대까지 구성할 수 있는 읽기 전용 노드이며, Writer 인스턴스와 동일한 스토리지 볼륨을 물리적으로 공유합니다.

*   역할 : 데이터베이스에서 SELECT 쿼리를 전담하여, 조회 작업을 목적으로 사용합니다.
*   고가용성 확보 : Writer 인스턴스에 장애가 발생했을 때, 데이터 손실 없이 즉각적으로 새로운 Writer로 승격되는 예비 서버 역할을 합니다. 예비 서버의 우선순위는 장애 조치 순서로 결정할 수 있습니다.
*   디스크 쓰기(I/O) 제로: Reader는 자신만의 독립적인 데이터 디스크를 가지지 않고 Writer가 데이터를 기록하는 공유 스토리지를 바라보고 읽기 작업만을 수행합니다. 따라서 디스크에 데이터를 기록하는 물리적인 I/O 부하가 전혀 발생하지 않습니다.

만약 읽기 전용인 인스턴스에서 DML 작업을 수행하면 아래와 같은 에러가 발생합니다. 

![](__MEDIA__/25d778696593c010f8df8dd590ccb93c9745f0dab7d07d0c613d51f22259145c.png)

리더 인스턴스에서 Insert 수행

### 결론 

Reader와 Writer 인스턴스의 분리는 부하를 분산 시켜 효율적인 시스템 운영을 가능하게 도와줍니다.

장애 조치를 대비하여 장애 조치 우선 순위를 높여놓은 리더 인스턴스의 유형을 Writer와 동일하게 맞추어 전환이 발생하는 장애 상황에서도 유연하게 대처하는 것이 대부분입니다.

오늘은 Master Slave와 비슷한 개념인 AWS 에서의 Writer, Reader에 대해서 공부 정리해보았습니다.