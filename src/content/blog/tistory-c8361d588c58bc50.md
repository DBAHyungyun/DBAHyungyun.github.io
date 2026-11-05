---
title: "[DMS] 복제 인스턴스 Memory 장애 분석"
date: "2026-03-31T06:57:17.000Z"
category: "Cloud/AWS"
source: "https://hyungyun.tistory.com/entry/DMS-%EB%B3%B5%EC%A0%9C-%EC%9D%B8%EC%8A%A4%ED%84%B4%EC%8A%A4-Memory-%EA%B4%80%EB%A6%AC-%EB%B0%A9%EB%B2%95"
description: "오늘은 AWS의 Migration 을 담당하는 복제 인스턴스의 메모리 관리 방법과 권장 사용량에 대해서 경험한 것을 공부해보고 공유할까 합니다. 아래는 예전에 작성했던 DMS 복제 인스턴스에 관한 글입니다. 참고하셔서 복제 인스턴스가"
---

오늘은 AWS의 Migration 을 담당하는 복제 인스턴스의 메모리 관리 방법과 권장 사용량에 대해서 경험한 것을 공부해보고 공유할까 합니다.

아래는 예전에 작성했던 DMS 복제 인스턴스에 관한 글입니다. 참고하셔서 복제 인스턴스가 어떤것인지 사전에 알면 좋을 것 같아 첨부합니다. 

 [참고 자료 · hyungyun.tistory.com](https://hyungyun.tistory.com/entry/AWS-DMS-%EB%B3%B5%EC%A0%9C-%EC%9D%B8%EC%8A%A4%ED%84%B4%EC%8A%A4-%EB%B0%8F-%ED%83%9C%EC%8A%A4%ED%81%AC-%EC%82%AC%EC%9A%A9-%EB%B0%A9%EB%B2%95)

* * *

### 개요

DMS 복제 인스턴스는 이전 글에서 어떤 용도인지 확인했습니다. 간략하게 CDC, FULLLOAD 등 데이터 마이그레이션을 지원하는 Amazon EC2 인스턴스 기반의 복제 인스턴스 입니다. 일반적인 EC2 인스턴스나 On-Prem 환경에서도 Memory 부족 현상이 발생하면 Out Of Memory가 발생하며 프로세스를 강제 종료하게 됩니다.

오늘은 이 현상이 발생했던 현상과 경험에 대해서 기록해보려고 합니다.

### 복제 인스턴스 지표

일반적으로 복제 인스턴스에서는 Memory 사용량을 체크할 때 FreeableMemory, AvailableMemory , FreeableMemory 이렇게 3가지 지표를 참고하게 됩니다. 의미가 상당히 유사하지만 각각의 지표를 살펴본다면 아래와 같습니다. 

*   FreeMemory : Linux의 MemFree에 해당하며, 커널이나 프로세스에 의해 전혀 사용되지 않는 순수 여유 메모리
*   AvailableMemory : Linux 의 MemAvailable에 해당하며, Swap 없이 새로운 애플리케이션이 즉시 사용할 수 있는 메모리의 추정치, FreeMemory에 더하여 캐시,버퍼 등 필요 시 즉시 해제하여 사용할 수 있는 메모리를 포함
*   FreeableMemory : 현재 사용중이지만 해제하여 다른 용도로 사용할 수 있는 메모리, 복제 인스턴스에 사용 중인 버퍼 및 캐시의 조합

쉽게 정리하자면, EC2 를 기반으로한 환경에서 /proc/meminfo 를 참고하여 실시간 메모리 사용량의 상세 정보를 출력합니다. 

/proc/meminfo 란 리눅스 시스템에서 메모리 사용 상태에 대한 정보를 제공하는 가상 파일로서, 해당 파일에는 Swap Memory, RAM의 정보를 담고 있습니다. 

아래는 AWS 의 DMS 지표 공식문서입니다. Memory 에 관한 지표 뿐 아니라, IOPS, Latency, Throughput 등 DMS 복제 인스턴스 성능에 주요한 지표들이 나와있으니 운영에 참고하면 좋을 것 같습니다. 

 [참고 자료 · docs.aws.amazon.com](https://docs.aws.amazon.com/ko_kr/dms/latest/userguide/CHAP_Monitoring.html#CHAP_Monitoring.Metrics)

### OOM 현상이란?

OOM 현상은 Out Of Memory문자 그대로 시스템이 사용할 수 있는 메모리(RAM)가 완전히 고갈된 상태를 의미합니다.

Linux 기반의 운영체제는 메모리가 한계치에 도달하여 시스템 전체가 장애가 발생하면, 시스템을 부하를 해소키기 위해서 Out Of Memory Killer를 통해 메모리를 가장 많이 사용하고 있는 프로세스를 강제로 종료 시킵니다.

위에서 설명한대로, DMS 역시 AWS EC2 기반의 복제 인스턴스이므로 OOM 현상이 발생 할 수 있습니다.

AWS 에서는 OOM 발생 여부를 모니터링 할 때에 FreeableMemory 와 SwapUsage를 함께 확인하는 것을 권장하고 있습니다. 만약, 물리 메모리가 부족한 현상이 발생한다면 OS가 디스크의 Swap 공간을 사용하게 되므로 SwapUsage가 함께 상승하게 됩니다. 

### 복제 인스턴스 OOM

그렇다면 복제 인스턴스에서 OOM 현상이 발견되면 어떻게 해야하는지 알아보겠습니다. 우선적으로 아래 2가지 지표를 참고하여 OOM 발생 여부를 판단해 보겠습니다.

1.  FreeableMemory가 0에 가까워지고 있는 경우
2.  SwapUsage가 지속적으로 증가하거나 변동하는 경우

![](__MEDIA__/010e6181920466cc6a48c0b6e53331a7de170e23d5056149df98aa902bb44921.png)

FreeableMemory

위 경우는 1번의 경우입니다. FreeableMemory가 점검 감소하여 모니터링 지표 수준에서 최저를 기록하고 있습니다.

![](__MEDIA__/9dc30d5b943352c25f3451e83e30bcb1e8d44ffdfa82cb9c5e08b48b51696cf7.png)

SwapUsage

(날짜 정보를 가렸지만 동일한 날짜입니다.) FreeableMemory가 감소하면서 SwapUsage가 지속적으로 증가 혹은 변동하고 있습니다.

2가지 경우로 해당 복제 인스턴스에서 Out Of Memory 현상이 발생하였고 태스크가 ' Last Error Replication task out of memory. Stop Reason FATAL\_ERROR Error Level FATAL' 에러 메세지를 출력하며 실패되었습니다.

### OOM 발생 원인

AWS DMS Replication Instance에서 OOM이 발생한 원인을 분석한 결과, **DMS 엔진 버전 업그레이드 이후 메모리 사용량이 증가한 현상**과 관련이 있는 것으로 판단하였습니다.

기존 AWS DMS 엔진 버전의 지원 종료(EOS)에 대응하기 위해 3.5.3에서 3.6.1로 업그레이드를 진행하였으며, 이후 복제 인스턴스에서 메모리 사용량이 증가하고 OOM이 발생하였습니다.

#### 1\. AWS DMS 엔진 버전 변경 이력

<table style="border-collapse: collapse; width: 100%;" border="1" data-ke-align="alignLeft"><tbody><tr><td><span>구분</span></td><td><span>내용</span></td></tr><tr><td><span>AWS 서비스</span></td><td><span>AWS Database Migration Service (DMS)</span></td></tr><tr><td><span>AS-IS 엔진 버전</span></td><td><span>3.5.3</span></td></tr><tr><td><span>TO-BE 엔진 버전</span></td><td><span>3.6.1</span></td></tr><tr><td><span>업그레이드 목적</span></td><td><span>기존 엔진 버전 EOS 대응</span></td></tr><tr><td><span>발생 현상</span></td><td><span>FreeableMemory 감소, SwapUsage 증가 및 OOM 발생</span></td></tr><tr><td><span>장애 영향</span></td><td><span>Replication Task 실패</span></td></tr><tr><td><span>AWS Support 확인 내용</span></td><td><span>이전 버전 대비 장기 트랜잭션 처리 시 메모리 사용량 증가 현상</span></td></tr></tbody></table>

#### 2\. AWS Support 문의 결과

OOM 발생 원인을 확인하기 위해 AWS Support에 문의하였으며, 다음과 같은 답변을 받았습니다.

> 메모리 사용과 관련해서는 이전 버전에 비해 장기 트랜잭션 처리 시 더 많은 메모리를 사용하고 있으며, 관련 트러블슈팅이 진행되고 있다고 안내받았습니다.

이를 통해 DMS 복제 인스턴스의 메모리 부족 현상이 단순히 인스턴스 사양이나 태스크 설정에 의해서만 발생하는 것이 아니라, **DMS 엔진 버전 변경에 따른 장기 트랜잭션 처리 시 메모리 사용량 증가와 관련될 가능성**이 있음을 확인하였습니다.

다만 AWS Support 답변만으로 특정 내부 코드 결함이 확정된 것은 아니며, 동일한 워크로드에서 버전별 메모리 사용량을 비교하는 추가 검증이 필요합니다.

#### 3\. 원인 분석 결과

분석 항목확인 내용판단

<table style="border-collapse: collapse; width: 100%;" border="1" data-ke-align="alignLeft"><tbody><tr><td><span>분석 항목</span></td><td><span>확인 내용</span></td><td><span>판단</span></td></tr><tr><td><span>엔진 버전 변경</span></td><td><span>3.5.3 → 3.6.1</span></td><td><span>장애 발생 전 주요 변경 사항</span></td></tr><tr><td><span>FreeableMemory</span></td><td><span>지속적인 감소</span></td><td><span>메모리 여유 공간 감소 확인</span></td></tr><tr><td><span>SwapUsage</span></td><td><span>증가 또는 변동</span></td><td><span>메모리 압박 징후 확인</span></td></tr><tr><td><span>Replication Task</span></td><td><span>OOM 오류로 실패</span></td><td><span>장애 증상 확인</span></td></tr><tr><td><span>장기 트랜잭션</span></td><td><span>AWS Support에서 메모리 사용량 증가 현상 안내</span></td><td><span>버전 관련 유력 원인</span></td></tr><tr><td><span>엔진 수정 사항</span></td><td><span>AWS에서 관련 트러블슈팅 진행 안내</span></td><td><span>수정 버전 및 개선 여부 확인 필요</span></td></tr></tbody></table>

**분석 결론**

이번 사례에서는 DMS 엔진 버전 업그레이드 이후 메모리 사용량 증가와 OOM이 발생하였으며, AWS Support를 통해 이전 버전 대비 장기 트랜잭션 처리 시 메모리 사용량이 증가하는 현상이 있음을 확인하였습니다.

따라서 DMS OOM 발생 시 인스턴스 사양과 태스크 메모리 설정뿐만 아니라 **엔진 버전별 메모리 처리 특성과 알려진 이슈**도 함께 검토해야 한다고 판단하였습니다.

### OOM 발생 이후 조치 방법

1.  MemoryLimitTotal 파라미터 조정  
    \- MemoryLimitTotal 파라미터는 스크에 기록되기 전에 모든 트랜잭션이 메모리에서 점유할 수 있는 최대 크기(MB 단위)를 설정하는 값으로, 값을 증가시키면 더 많은 트랜잭션 데이터를 Memory에 유지할 수 있어 디스크 스왑이 줄어들 수 있습니다.   
    다만, 설정된 복제 인스턴스 유형 대비 이 파라미터 값이 너무 크면 OOM을 유발할 수 있습니다.
2.  복제 인스턴스 Scale Up  
    \- 실제 가용 Memory를 증가시키는 방법입니다.
3.  메모리 관련 태스크 설정 최적화   
    \- LOB Size 설정, MemoryKeepTime 설정 등 메모리 관련 파라미터 설정을 변경하여 최적화가 가능합니다

### 마무리

### 마무리

기존 AWS DMS Replication Instance의 엔진 버전 EOS 대응을 위해 3.5.3에서 3.6.1 버전으로 업그레이드를 진행하였습니다.

업그레이드 이후 기존 버전에서는 발생하지 않았던 메모리 사용량 증가와 OOM 현상이 발생하였으며, 처음에는 복제 인스턴스의 메모리 부족이나 Task 설정 문제로 판단하여 원인을 분석하였습니다.

하지만 AWS Support에 문의한 결과, **이전 버전과 비교하여 장기 트랜잭션 처리 시 더 많은 메모리를 사용하는 현상이 있으며, 해당 문제에 대한 트러블슈팅이 진행 중**이라는 답변을 받았습니다. (다만, 이때 당시에는 AWS 내부에서 위 문제에 대한 정확한 인지가 되지 않아, TS 이후 배포까지 정확한 일정에 대한 안내를 받지 못했습니다.)

이를 통해 이번 OOM 현상은 단순히 복제 인스턴스의 사양이나 Task 설정 문제뿐만 아니라, DMS 엔진 버전 변경에 따른 메모리 사용량 증가와도 관련이 있을 가능성이 있다는 것을 확인하였습니다.

다만 AWS Support에서 안내받은 내용만으로 엔진 내부의 정확한 원인까지 확인된 것은 아니기 때문에, 추후 수정 버전이 릴리스된다면 업그레이드 전후 메모리 사용량을 비교하여 개선 여부를 확인할 필요가 있을 것 같습니다.

이번 사례를 통해 AWS DMS 엔진 업그레이드 시에는 버전 호환성뿐만 아니라 **FreeableMemory, SwapUsage 등의 메모리 관련 지표와 CDC Latency를 함께 확인하는 것이 중요하다**는 것을 알 수 있었습니다.

또한 OOM 발생 시 단순히 복제 인스턴스를 Scale Up하거나 메모리 관련 파라미터를 조정하기보다는, 엔진 버전별 알려진 이슈나 Release Notes 등을 함께 확인하는 것이 필요할 것 같습니다.