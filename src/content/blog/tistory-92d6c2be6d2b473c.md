---
title: "[AWS DMS] Target DB 권한 부족으로 인한 CDC Latency 증가 및 OOM 발생 사례"
date: "2026-11-04T06:39:07.000Z"
category: "Database | SQL | OS/MySQL | Maria"
source: "https://hyungyun.tistory.com/entry/AWS-DMS-Target-DB-%EA%B6%8C%ED%95%9C-%EB%B6%80%EC%A1%B1%EC%9C%BC%EB%A1%9C-%EC%9D%B8%ED%95%9C-CDC-Latency-%EC%A6%9D%EA%B0%80-%EB%B0%8F-OOM-%EB%B0%9C%EC%83%9D-%EC%82%AC%EB%A1%80"
description: "1. 개요 최근 AWS DMS를 사용하여 운영계 Source DB에서 IDC Target DB로 데이터를 마이그레이션하는 과정에서 CDC Latency가 지속적으로 증가하고, Replication Task에서 OOM(Out Of Me"
---

## 1\. 개요

최근 AWS DMS를 사용하여 운영계 Source DB에서 IDC Target DB로 데이터를 마이그레이션하는 과정에서 CDC Latency가 지속적으로 증가하고, Replication Task에서 OOM(Out Of Memory)이 발생하는 현상이 있었습니다.

당시 약 80개 테이블을 대상으로 Full Load + CDC 방식의 마이그레이션을 진행하였으며, 대용량 테이블의 경우 약 4억 건의 데이터를 보유하고 있었습니다.

초기에는 대용량 데이터 처리로 인한 복제 인스턴스의 메모리 부족 문제로 판단하여 인스턴스 사양과 Task 메모리 관련 파라미터를 조정하였으나, OOM 현상이 지속적으로 발생하였습니다.

이에 따라 AWS DMS의 CloudWatch 지표와 Task 로그를 확인하고, AWS Support 문의를 통해 원인을 분석하였습니다.

## 2\. AWS DMS 마이그레이션 환경

<table style="border-collapse: collapse; width: 100%; height: 211px;" border="1" data-ke-align="alignLeft"><tbody><tr style="height: 21px;"><td style="height: 21px; width: 46.7442%;"><span>구분</span></td><td style="height: 21px; width: 53.1395%;"><span>내용</span></td></tr><tr style="height: 17px;"><td style="height: 17px; width: 46.7442%;"><span>Migration Type</span></td><td style="height: 17px; width: 53.1395%;"><span>Full Load + CDC</span></td></tr><tr style="height: 17px;"><td style="height: 17px; width: 46.7442%;"><span>Source</span></td><td style="height: 17px; width: 53.1395%;"><span>Aurora MySQL 3.10.3</span></td></tr><tr style="height: 17px;"><td style="height: 17px; width: 46.7442%;"><span>Target</span></td><td style="height: 17px; width: 53.1395%;"><span>MySQL 8.4.x</span></td></tr><tr style="height: 21px;"><td style="height: 21px; width: 46.7442%;"><span>대상 테이블</span></td><td style="height: 21px; width: 53.1395%;"><span>약 80개</span></td></tr><tr style="height: 21px;"><td style="height: 21px; width: 46.7442%;"><span>최대 테이블 데이터</span></td><td style="height: 21px; width: 53.1395%;"><span>약 4억 건</span></td></tr><tr style="height: 17px;"><td style="height: 17px; width: 46.7442%;"><span>Replication Instance</span></td><td style="height: 17px; width: 53.1395%;"><span>dms.t3.medium -&gt; dms.c5.2xlarge -&gt; dms.t3.large</span></td></tr><tr style="height: 17px;"><td style="height: 17px; width: 46.7442%;"><span>Task MemoryLimitTotal</span></td><td style="height: 17px; width: 53.1395%;"><span>1024MB → 2048MB</span></td></tr><tr style="height: 21px;"><td style="height: 21px; width: 46.7442%;"><span>발생 현상</span></td><td style="height: 21px; width: 53.1395%;"><span>CDC Latency 증가 및 OOM</span></td></tr><tr style="height: 21px;"><td style="height: 21px; width: 46.7442%;"><span>주요 분석 지표</span></td><td style="height: 21px; width: 53.1395%;"><span>MemoryUsage, CDCLatencyTarget,SwapUsage</span></td></tr><tr style="height: 21px;"><td style="height: 21px; width: 46.7442%;"><span>확인된 문제</span></td><td style="height: 21px; width: 53.1395%;"><span>Target DB의 DMS 계정 권한 부족</span></td></tr></tbody></table>

## 3\. 장애 발생 현상

### 3.1 Replication Task OOM 발생

Full Load + CDC Task 수행 중 메모리 사용량이 지속적으로 증가하였으며, 이후 OOM이 발생하면서 Task가 실패하는 현상이 있었습니다.

초기에는 대용량 테이블의 데이터 처리 과정에서 메모리 사용량이 증가한 것으로 판단하였습니다.

이에 따라 Task의 MemoryLimitTotal 파라미터를 기존 1024MB에서 2048MB로 변경하고, Replication Instance의 사양도 증설하였습니다.

하지만 파라미터 조정 및 인스턴스 증설 이후에도 메모리 사용량 증가와 OOM 현상이 지속적으로 발생하였습니다.

```
Last Error Replication task out of memory Stop Reason FATAL_ERROR error Level FATAL
```

### 3.2 MemoryUsage 증가

CloudWatch의 MemoryUsage 지표를 확인한 결과, 일부 Replication Task에서 메모리 사용량이 지속적으로 증가하는 현상이 확인되었습니다.

특히 메모리 사용량이 증가하다가 특정 시점에 급격히 감소하는 패턴이 반복적으로 나타났습니다.

이는 Task 중지 또는 재시작 등의 이벤트와 관련이 있을 가능성이 있어, Task 실행 이력 및 로그와 함께 확인할 필요가 있었습니다.

![](__MEDIA__/d7c94f6f9c331b05fe9a12a3a29a7afccd3c0bdd0024c7b4195538e6cb45efc8.png)

※ MemoryUsage 지표는 Replication Task의 메모리 사용량을 나타내며, 복제 인스턴스 전체의 가용 메모리를 의미하는 FreeableMemory와는 구분해야 합니다.

### 3.3 CDCLatencyTarget 증가

CDCLatencyTarget 지표에서도 CDC 지연 시간이 지속적으로 증가하는 현상이 확인되었습니다.

일부 Task에서는 지연 시간이 수십 시간 이상 증가하였으며, 그래프상 약 137시간 수준까지 상승하는 구간도 확인되었습니다.

이는 Source에서 발생한 변경 데이터가 Target DB에 정상적으로 반영되지 못하고 있음을 의심할 수 있는 상황이었습니다.

다만, CDCLatencyTarget만으로는 정확한 원인을 판단할 수 없기 때문에, Task 로그와 Target DB 상태를 함께 확인하였습니다.

![](__MEDIA__/30968640dbec7e0b417745898666fbf3b048d8adb04d14bd96dc1306d182607a.png)

## 4\. 원인 분석

### 4.1 AWS DMS Task 로그 확인

Replication Task 로그를 확인한 결과, awsdms\_control 스키마에 존재하는 DMS 시스템 테이블에 대한 접근 오류가 확인되었습니다.

특히 awsdms\_apply\_exceptions 테이블과 관련된 참조 오류가 발생하였으며, 이를 통해 Target DB의 DMS 계정 권한에 문제가 있을 가능성을 확인하였습니다.

### 4.2 AWS Support 문의 결과

AWS Support 문의 결과, Full Load 이후 CDC가 정상적으로 진행되지 않고 있으며, Target MySQL의 권한 부여가 정상적으로 수행되지 않았을 때 발생할 수 있는 현상이라는 답변을 받았습니다.

AWS DMS는 Source DB에서 변경 데이터를 수집한 후 내부 처리 과정을 거쳐 Target DB에 반영합니다.

하지만 Target DB에서 CDC가 정상적으로 수행되지 않는 경우, 처리되지 못한 변경 데이터가 DMS 내부에 적체될 수 있으며, 이 과정에서 메모리 사용량이 증가할 가능성이 있다고 안내받았습니다.

또한 AWS Support에서는 **현재 발생한 OOM이 단순히 워크로드 증가로 인한 문제라고 판단하기보다는, CDC가 정상적으로 수행되지 않는 문제를 먼저 해결해야 한다**고 안내하였습니다.

### 4.3 원인 분석 결과

<table style="border-collapse: collapse; width: 100%;" border="1" data-ke-align="alignLeft"><tbody><tr><td style="width: 22.3256%;"><span>분석 항목</span></td><td style="width: 43.0233%;"><span>확인 내용</span></td><td style="width: 34.5349%;"><span>판단</span></td></tr><tr><td style="width: 22.3256%;"><span>대용량 데이터 처리</span></td><td style="width: 43.0233%;"><span>최대 약 4억 건 규모의 테이블 포함</span></td><td style="width: 34.5349%;"><span>메모리 사용량 증가 가능성</span></td></tr><tr><td style="width: 22.3256%;"><span>MemoryLimitTotal</span></td><td style="width: 43.0233%;"><span>1024MB → 2048MB</span></td><td style="width: 34.5349%;"><span>변경 후에도 OOM 발생</span></td></tr><tr><td style="width: 22.3256%;"><span>Replication Instance</span></td><td style="width: 43.0233%;"><span>인스턴스 사양 증설</span></td><td style="width: 34.5349%;"><span>증설 후에도 문제 지속</span></td></tr><tr><td style="width: 22.3256%;"><span>MemoryUsage</span></td><td style="width: 43.0233%;"><span>지속적인 증가</span></td><td style="width: 34.5349%;"><span>메모리 사용량 증가 확인</span></td></tr><tr><td style="width: 22.3256%;"><span>CDCLatencyTarget</span></td><td style="width: 43.0233%;"><span>지속적인 증가</span></td><td style="width: 34.5349%;"><span>Target 반영 지연 확인</span></td></tr><tr><td style="width: 22.3256%;"><span>Task 로그</span></td><td style="width: 43.0233%;"><span>awsdms_control 관련 접근 오류</span></td><td style="width: 34.5349%;"><span>권한 문제 확인</span></td></tr><tr><td style="width: 22.3256%;"><span>AWS Support</span></td><td style="width: 43.0233%;"><span>Target DB 권한 부족으로 CDC 처리 실패 가능성 안내</span></td><td style="width: 34.5349%;"><span>주요 원인으로 판단</span></td></tr></tbody></table>

분석 결과, **Target DB의 DMS 계정 권한 부족으로 CDC가 정상적으로 진행되지 않는 문제를 확인하였습니다.**

추가로, **CDC는 정상적으로 진행되는듯 보였던 로드 완료됨, 복제 진행중 문구 역시, 정상적으로 진행되지 않고 있었습니다.** 

**Latency로 인해 Source 에는 데이터가 Insert 되고 있었지만, Target 에는 데이터가 적재 되지 않고 있던 상황이었습니다.**

## 5\. 조치 방법

### 5.1 Target DB DMS 계정 권한 확인

AWS 공식 문서에 따르면 MySQL 호환 DB를 Target으로 사용하는 경우, DMS 계정에 대상 스키마에 대한 데이터 처리 권한과 awsdms\_control 스키마에 대한 권한이 필요합니다.

현재 DMS 계정에 부여된 권한은 다음 명령어로 확인할 수 있습니다.

```
SHOW GRANTS FOR 'dms_target'@'%';
```

AWS 공식 문서에서 안내하는 권한 부여 예시는 다음과 같습니다.

```
GRANT ALTER, CREATE, DROP, INDEX,
      INSERT, UPDATE, DELETE, SELECT,
      CREATE TEMPORARY TABLES
ON target_schema.*
TO 'dms_target'@'%';

GRANT ALL PRIVILEGES
ON awsdms_control.*
TO 'dms_target'@'%';
```

위 SQL은 예시이며, 실제 운영 환경에서는 DMS 계정명과 스키마명을 변경하여 적용해야 합니다.

### 5.2 Replication Task 재개 및 상태 확인

Target DB의 DMS 계정 권한을 수정한 이후에는 Replication Task를 재개하고 CDC가 정상적으로 수행되는지 확인해야 합니다.

이때 다음 항목을 함께 확인하는 것이 좋습니다.

*   CDCLatencySource 및 CDCLatencyTarget 감소 여부
*   MemoryUsage 증가 추이
*   Task 로그의 권한 관련 오류 재발 여부
*   Source와 Target 데이터 정합성
*   CDC 변경 데이터의 정상 반영 여부

특히 권한 부여 이후 CDC Latency가 감소하더라도, 기존에 적체된 데이터가 모두 처리되었는지 확인할 필요가 있습니다.

또한 Full Load 이후 CDC가 정상적으로 진행되지 않았던 기간이 존재하므로, Source와 Target의 데이터 정합성도 별도로 검증하거나, 최초 Target DB의 데이터를 Truncate 하고 재적재 진행하였습니다.

**※ DBA 가 4억건 이상의 테이블을 일일히 조회하며 정합성을 검증하는 것은 사실상 어렵습니다. 저는 Target DB의 적재된 데이터를 Truncate 하고 초기 적재부터 다시 진행하였습니다.**

## 6\. 마무리

이번 사례에서는 AWS DMS를 통한 대용량 데이터 마이그레이션 과정에서 CDC Latency 증가와 OOM이 발생한 것을 다루어 보았습니다.

초기에는 대용량 데이터 처리로 인한 메모리 부족 문제로 판단하여 MemoryLimitTotal 파라미터 조정 및 Replication Instance 증설을 진행하였으나, 문제가 지속적으로 발생하였습니다.

이후 AWS Support 문의와 Task 로그 분석을 통해 Target DB의 DMS 계정에 awsdms\_control 스키마 관련 권한이 부족하다는 점을 확인하였습니다.

이를 통해 AWS DMS에서 OOM이 발생하는 경우 단순히 인스턴스 메모리 부족이나 Task 파라미터 문제만 확인하기보다는, **CDC가 정상적으로 진행되고 있는지와 Source 및 Target DB의 권한 설정도 함께 확인하는 것이 중요하다**는 점을 알 수 있었습니다.

특히 Full Load가 정상적으로 완료되었다고 하더라도 CDC까지 정상적으로 수행된다는 것을 의미하지 않기 때문에, 마이그레이션 이후에는 CDC Latency와 Task 로그를 지속적으로 확인할 필요가 있을 것 같습니다.

* * *

**참고 자료**

AWS 공식 문서 — Using a MySQL-compatible database as a target for AWS Database Migration Service

 [MySQL 호환 데이터베이스를의 대상으로 사용 AWS Database Migration Service - AWS 데이터베이스 마이그레

Aurora MySQL 8.4는 TLS 1.2용 GCM 암호 제품군만 지원합니다. 모든 CBC 모드 암호가 제거되었습니다.는 MySQL 및 Aurora MySQL 엔드포인트에 TLS 1.2를 AWS DMS 사용하고 지원되는 GCM 암호를 자동 협상합니다. 사

docs.aws.amazon.com](https://docs.aws.amazon.com/ko_kr/dms/latest/userguide/CHAP_Target.MySQL.html#CHAP_Target.MySQL.Prerequisites)