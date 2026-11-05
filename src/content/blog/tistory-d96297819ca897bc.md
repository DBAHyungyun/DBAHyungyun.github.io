---
title: "[AWS] DMS 복제 인스턴스 및 태스크 사용 방법"
date: "2026-02-25T06:35:39.000Z"
category: "Cloud/AWS"
source: "https://hyungyun.tistory.com/entry/AWS-DMS-%EB%B3%B5%EC%A0%9C-%EC%9D%B8%EC%8A%A4%ED%84%B4%EC%8A%A4-%EB%B0%8F-%ED%83%9C%EC%8A%A4%ED%81%AC-%EC%82%AC%EC%9A%A9-%EB%B0%A9%EB%B2%95"
description: "오늘은 AWS 에서 제공하는 복제 인스턴스를 활용하여, Database Migration 을 진행해보겠습니다. Migration 이란? Source Database 에서 Target Database로 데이터를 옮기는 과정입니다. 단순"
---

오늘은 AWS 에서 제공하는 복제 인스턴스를 활용하여, Database Migration 을 진행해보겠습니다. 

* * *

## Migration 이란? 

Source Database 에서 Target Database로 데이터를 옮기는 과정입니다. 단순 복사 뿐 아니라 RDBMS 엔진간의 Migration도 가능하여 Oracle to MySQL 이나, PostgreSQL to MySQL 등 엔진간의 변경, 버전 업그레이드 등 다양한 작업에서 사용되는 태스크 입니다.

또한 Zero Downtime 을 지원하여 Migration 중에도 서비스 중단 없이, Source DB를 그대로 사용할 수 있습니다. 추가로 AWS 에서는 Migration 이후 CDC (Change Data Capture) 를 지원하며 Source에 적재되는 데이터도 Target Database에 자동으로 연동됩니다. (Oracle OGG와 같은 CDC 솔루션을 의미합니다.)

![](__MEDIA__/e4e802a05090a5e8e8c2ff10ea532c3a9c04f9a946a1860d1172afbe8129b329.png)

Migration 도식화

On Premise 환경에서의 Migration 과 CDC 도 당연하게 가능하다. 위에서 기재한 Oracle의 OGG나 SharePlex, X-LOG 등 CDC 솔루션으로도 연동이 가능하지만, AWS 에서는 Migration 과 CDC를 함께 지원한다.

이런 AWS DMS를 이해하기 위해서는 필수로 알아야하는 3요소가 존재한다.

*   Replication Instance (복제 인스턴스) : 마이그레이션이나 데이터를 동기화 하는데 사용되는 관리형 Amazon EC2 인스턴스
*   Endpoint (엔드포인트) : 데이터를 어디에서 보내고(Source), 받는지 (Target) 에 대한 연결 정보
*   Database Migration Task (데이터베이스 마이그레이션 태스크) : 어떤 테이블을 옮길지, 어떻게 변환할지를 정의하는 실제 작업 단위

![](__MEDIA__/76422d036e2fc49eac15e2d5da75e777abda99a84e2cbcce9b0290e40daebe62.png)

DMS 필수 3요소

실제 Database Migration Service 에서 가장 중요하게 사용되는 3요소이며, 해당 요소들이 없다면 DMS 역시 진행할 수가 없다. 이제 실제로 Data를 Insert 한 뒤 DMS 연동 테스트를 진행해보려고 한다.

* * *

Database : Aurora MySQL 

DMS 태스크 : Aurora MySQL to Aurora MySQL (동종 DB간 DMS)

DMS 태스크를 실행할 때에는 여러가지 사전 준비 사항이 필요합니다. 사전 준비 사항은 AWS Document에 잘 정리 되어 있으니 정독하시어 반드시 적용해야 합니다. (Source 준비 사항과 Target 준비 사항이 모두 나와있는 Docs 입니다.)

 [참고 자료 · docs.aws.amazon.com](https://docs.aws.amazon.com/ko_kr/dms/latest/userguide/CHAP_Source.MySQL.html)

 [AWS DMS 공식 문서 · MySQL 호환 Target](https://docs.aws.amazon.com/ko_kr/dms/latest/userguide/CHAP_Target.MySQL.html)

## AWS DMS 태스크 연동 방법

### 1\. Source DB 와 Target DB를 생성.

![](__MEDIA__/8bd062c8583f527c41026fdd8eaeabacff93652adb1af289191ea902b70e8e08.png)

Source , Target DB 각각 생성

### 2\. Database Migration Service 복제 인스턴스를 생성

복제 인스턴스 사양에 따라서 복제 속도에 영향을 줄 수는 있으나, 테스트 환경에서는 차이가 없어 가장 낮은 클래스를 선택하여 생성합니다. (보안 그룹등의 설정도 있으나, VPC와 보안그룹은 세팅 되어 있다고 가정하고 테스트를 진행하겠습니다.)

만약, 보안그룹 및 VPC 가 세팅이 되어 있지 않다면 VPC를 먼저 생성하고 Source DB와 Target DB에 대한 보안그룹도 오픈해둔 뒤 테스트를 진행하는걸 권고드립니다. 

![](__MEDIA__/cdd74cacd3d139c635669cc86f78a1a36259adc37dd3308db38fe39548eee274.png)

복제 인스턴스 생성

![](__MEDIA__/cf7a7b406f00491e2f034fbdbb64072a0fd0bed7d9685df6ade3029c0a2c6fcb.png)

복제 인스턴스 생성

![](__MEDIA__/7c15b81c95154ac493a39cce9edc70244ab5e5c4e71ad67943255fc1166541cc.png)

생성된 DMS 복제 인스턴스

### 3\. Endpoint 생성

동일한 탭의 좌측 엔드포인트 탭에서 생성한 RDS에 대한 Source, Target Endpoint를 설정해준다. 소스 엔드포인트, 대상 엔드포인트 2개를 설정해야 하는데, 생성이 필요한 엔드포인트 유형을 지정하고 RDS DB 인스턴스를 설정하여 생성된 RDS 에 대하여 액세스 정보를 수동으로 액세스 정보 제공한 뒤, 사전 가이드를 참고하여 생성한 User 이름과 Password를 기재합니다. 

![](__MEDIA__/ceaf3b82f3e28de2a8415fdb6412cca1ce6529a554f49b40d5fca74401294c5a.png)

엔드포인트 설정

![](__MEDIA__/6458ad771c62a26d62966aca2c101f89beb3b959f0af1880f0dd3fdb34afb134.png)

엔드포인트 설정

![](__MEDIA__/3af1ecd85851813245d448ee8abbb1d4ba8f2b656acf8c27b878d243924910ee.png)

엔드포인트 생성 마무리

### 4.Migration Task 생성

이렇게 엔드포인트가 생성이 되었다면, 마이그레이션 태스크를 생성해주어야 합니다.

![](__MEDIA__/daf008013516d4f00e720ea2a9758e811dc5b53e8b17f6b2d5aa4dc538748137.png)

DMS 태스크 생성

![](__MEDIA__/a24f85f172e182cab7866a0add479f5a7cd89d5ac0666ef27bcbd0123eb84e09.png)

DMS 태스크 생성

마이그레이션 유형에 마이그레이션은 단순 데이터를 Source to Target으로 옮기는 것이고, 마이그레이션 및 복제는 Migration 이후 Change Data Capture 옵션으로 데이터 복제 이후 변경사항도 함께 기록하는 옵션이다. 복제는 Change Data Capture 만 지원한다.

![](__MEDIA__/b5ff44a44c1d9bbd5579e17ea7ee673742f97db4d4c25f0a490840f16217586b.png)

DMS 태스크 생성

태스크를 설정하는 데에는 여러가지 편집 모드를 지원하는데 관련된 내용을 다 설명하기에는 양이 방대하여 AWS 공식 링크를 첨부하니 참고함이 좋을 것 같다. (참고로 데이터 마이그레이션을 통해 검증 옵션을 선택하면 작업 시간이 굉장히 증가해서 잘 사용하지 않는 옵션이다.)

 [참고 자료 · docs.aws.amazon.com](https://docs.aws.amazon.com/ko_kr/dms/latest/userguide/CHAP_Tasks.Creating.html)

테이블 매핑을 활용하여, 어떤 스키마의 테이블을 마이그레이션 할지 정해준다. 저는 mig\_t 라는 스키마의 모든 테이블을 마이그레이션 하는 것으로 설정하였습니다. 

![](__MEDIA__/57c77b583a97ffc465ba3289adf608bf62c72ab49b6200f4f1cb78f1311117e3.png)

추가로 마이그레이션 전 평가 옵션을 사용하게 되면, 실제 마이그레이션을 진행하기 전에 제대로 세팅이 되어 있는지 확인이 가능하다. 

![](__MEDIA__/8ac82e18af0b6a811fb78c4378bf493dd309948adcde026ff47e1af6f7fa368f.png)

마이그레이션 전 평가 옵션

### 5\. 마이그레이션 전 평가 확인

생성된 마이그레이션 태스크를 실행하여 정상적으로 데이터가 연동되는지 확인한다. (마이그레이션 전 평가 함께 확인)

마이그레이션 전 평가 결과를 확인하며, 놓쳤던 권한이나 사전 준비사항이 있는지 한번 더 확인한다.

![](__MEDIA__/9f718763c9ba1799e88829b1ea2c92d131a76b89b35ffc4751e54d4813cfb1c3.png)

마이그레이션 전 평가 결과

### 6\. 데이터 정상 연동 확인

마이그레이션 전 평가 당시 실패된 부분을 조치하고 실행 한다면, 정상적으로 연동이 된다.

![](__MEDIA__/d6ab49752a716d40797a43400a3c2efd3a82292596bf113ed6400723af1784b8.png)

Migration+CDC 연동 성공

## 결과

데이터를 조회하거나 INSERT 하게 되면 실제로 Source Table의 데이터가 Target으로 연동이 되어 있고, 삽입된 데이터 역시 동기화 되는 모습을 볼 수 있다. 

그리고, 마이그레이션 전 평가를 통해서 실패 항목이 있더라도 해당 항목에 대한 조치를 한 뒤, Migration을 진행하면 되므로 미흡한 부분에 대한 사전 조치는 실제 Migration 전에 진행이 되면 된다.

추가로, Migration 전 평가에서 실패로 발생되는 항목 중 조건을 모두 충족하였음에도 실패로 출력되는 경우가 있으니 옵션을 확실하게 설정했다면 크로스체크한 뒤 실행하면 정상적으로 수행이 될 것이다.

오늘은 이렇게 동기종 AWS DMS 를 활용하여 복제를 해보았습니다. 타 이기종 Database 를 Migration 할 경우에는 AWS 에서 제공하는 SCT (Schema Conversion Tool)이 있습니다. 이 부분은 아키텍처와도 관련하여 더 심화적인 내용이라 다음에 다루어 보도록 하겠습니다.