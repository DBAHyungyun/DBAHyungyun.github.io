---
title: "데이터 웨어하우스 AWS Redshift 란?"
date: "2026-05-27T07:00:40.000Z"
category: "Cloud/AWS"
source: "https://hyungyun.tistory.com/entry/%EB%8D%B0%EC%9D%B4%ED%84%B0-%EC%9B%A8%EC%96%B4%ED%95%98%EC%9A%B0%EC%8A%A4-AWS-Redshift-%EB%9E%80"
description: "오늘은 AWS 에서 제공하는 DW, Data warehouse인 Redshift에 대해서 공부해보려고 합니다. DW 에 대한 필요성이 급증하고, 사용량이 증가함에 따라서 공부하고 정리하는 시간을 가지면 좋을 것 같아 공부한 내용을 포"
---

오늘은 AWS 에서 제공하는 DW, Data warehouse인 Redshift에 대해서 공부해보려고 합니다.

DW 에 대한 필요성이 급증하고, 사용량이 증가함에 따라서 공부하고 정리하는 시간을 가지면 좋을 것 같아 공부한 내용을 포스팅해보려 합니다. 

### 개요

DW란? 

Data Warehouse 로 기업의 다양한 테이터를 통합하여 정보에 입각하여 보다 쉽고 정확하게 의사 결정을 내릴 수 있도록 분석 가능한 정보의 중앙 리포지토리 입니다.

쉽게 생각하면 가공된 데이터들이 모여있는 데이터 집합소라고 생각하면 됩니다.

이렇게 가공된 데이터들을 어플리케이션이나 시스템 내부에 관리하며 데이터 엔지니어가 BI나 SQL을 활용해 데이터를 액세스 하는 방식으로 사용됩니다. 

일반적인 Database가 아닌 ata warehouse가 필요한 이유는 대규모 데이터를 조회하고 접근한다는 점입니다. 

Data Warehouse 그 자체로도 용량이 크고 조회되는 속도가 빨라 운영 시스템의 Database보다 대용량 데이터 관리에 효율적입니다. 

Database 점유율에서 DW는 Snowflake, Databricks, Google BigQuery, Redshift 순으로 점유하고 있고, 대부분의 기업과 국가에서 Snowflake와 Databaricks를 주로 사용하고 있습니다.

### AWS Redshift란 ?

AWS Redshift는 Amazon Web Services(AWS)에서 제공하는 완전관리형 클라우드 데이터 웨어하우스(Data Warehouse) 서비스로, 대규모 데이터를 빠르게 분석할 수 있도록 설계된 페타바이트(PB) 규모의 분석 플랫폼입니다.

![](__MEDIA__/2c6ae5c708bdf336900f3ffbb42ca9d8f7c7b28989d8a74d1c5d9975272213d6.png)

AWS Redshift 인스턴스

Redshift의 아키텍처는 아래와 같습니다. 크게 Leader Node, Compute Node 로 구성되어 있습니다. 

![](__MEDIA__/45072113095ba59f62b8a05eec1c3ba9f21ac7cc5c0d988250acf32f92e36b36.png)

Redshift 기본 아키텍처

리더 노드 (Leader Node) 

*   클라이언트 프로그램과 일어나는 통신을 비롯해 컴퓨팅 노드와 일어나는 모든 통신을 관리
*   구문을 분석하여 데이터베이스 작업, 복합 쿼리의 결과를 얻는데 필요한 실행계획을 작성
*   쿼리를 컴파일하고, SQL 문을 컴퓨팅 노드에 배포, 모든 쿼리는 리더 노드에서만 실행

컴퓨트 노드 (Compute Node)

*   실행 계획을 리더 노드에게 전달받아, 컴파일 코드를 실행한 후 최종 집계를 위해 중간 결과를 리더 노드에게 전송
*   컴퓨트 노드마다 전용 CPU와 메모리가 따로 있고, 워크로드가 증가할 떄 노드 수를 늘리거나 노드 유형을 업그레이드, 혹은 두 가지 방법을 모두 사용해 클러스터의 컴퓨팅 용량을 증가

여기서, 컴퓨트 노드는 다수의 Slice로 분할됩니다. 분할된 Slice는 다시 각각 노드의 메모리 및 디스크 공간으로 할당되고, 노드에 할당되는 워크로드를 처리한다. 

리더 노드는 각 Slice에 대한 데이터 분산을 관리하면서 쿼리 워크로드 또는 기타 데이터베이스 작업 워크로드를 각 조각으로 할당한다. 이때, 각 Slice가 병렬 방식으로 실행되어 작업을 완료한다.

이때, 분산키를 설정하여 테이블에 정의되어 있는 분산 키에 따라 행이 노드 조각으로 분산된다. 효율적인 키를 배포하면 Redshift가 병렬 처리를 사용하여 데이터를 로드하고 쿼리를 효율적으로 실행할 수 있다. 

아래 분산키를 설정하는 분산 스타일에 대한 AWS 공식 문서입니다. 참고하면 좋을 것 같아 첨부합니다. 

 [참고 자료 · docs.aws.amazon.com](https://docs.aws.amazon.com/ko_kr/redshift/latest/dg/c_choosing_dist_sort.html)

대량 병렬 처리 (MPP)

*   AWS Redshift는 MPP 아키텍처를 활용해 복잡한 쿼리와 방대한 양의 데이터를 빠르게 처리함
*   여러 컴퓨트 노드가 데이터의 일부에서 동일한 쿼리 코드를 실행해 병렬 처리를 극대화 함

클라이언트 / BI 도구

*   AWS Redshift는 다양한 데이터 추출, 전환, 적재 (ETL), 비즈니스 인텔리전스 (BI) 보고, 데이터 마이닝 및 분석 도구와 통합 가능
*   ODBC,JDBC 등 접속 도구를 활용해 리더 노드가 어플리케이션과 통신함 

###   
쿼리 처리 방식

![](__MEDIA__/33563cba95554fd7a2941d2ae1bcdc46c19020316b80f64fe1b8bb28f396d222.png)

AWS 공식문서에 나온 SQL 쿼리 처리 방식

Redshift는 제출된 SQL 쿼리를 구문 분석기와 쿼리 옵티마이저를 통해 라우팅하여 쿼리 실행 계획을 작성하고, 실행 엔진이 쿼리 계획을 코드로 변환한 뒤 해당 코드를 실행할 수 있도록 컴퓨팅 노드로 전송합니다.

자세한 쿼리 실행 및 워크 플로우는 아래 링크를 참고하면 좋을 것 같습니다.

 [참고 자료 · docs.aws.amazon.com](https://docs.aws.amazon.com/ko_kr/prescriptive-guidance/latest/query-lifecycle-redshift/query-processing.html)

### Redshift 의 장단점

Redshift 의 장점

*   PostgreSQL 기반의 표준 SQL을 사용하므로 학습 난이도가 낮음
*   기존 BI 도구(Tableau, Looker, Power BI 등)와 쉽게 연동 가능
*   S3에 저장된 데이터를 직접 쿼리 가능 (데이터를 Redshift로 로드하지 않고 S3에 저장된 데이터를 가져올 수 있음)
*   데이터 레이크(Data Lake)와 연계한 분석 지원
*   Concurrent Scaling 기능과 자동 백업, 스냅샷, 패치 관리 등 인프라 운영 부담 최소화

Redshift 의 단점

*   프로비저닝 클러스터 방식은 사용 여부와 관계없이 노드 단위로 고정 과금되어 초기 비용이 많이 듬
*   데이터가 커질수록 노드를 추가해야 하며, 이에 따라 비용이 선형적으로 증가 타 서비스 (Big Query, Snowflake) 에 비해 비싸다는 평가
*   분산키(Distribution Key), 정렬키(Sort Key) 설계가 잘못되면 성능이 급격히 저하
*   많은 사용자가 동시에 쿼리할 경우 큐(Queue)에 대기하여 응답 시간 지연

### 결론

결론적으로 Redshift는 AWS를 메인 클라우드로 활용하는 환경에서는 경쟁력이 있고 훌륭한 호환성을 보여주지만, 멀티클라우드와 연계할 시에는 Snowflake, Databricks와 같은 DW에 비하여 다소 아쉽다는 평가가 있습니다.

시스템과 환경에 맞는 DW를 선택하여 운영하는것이 적합할 것 같습니다.