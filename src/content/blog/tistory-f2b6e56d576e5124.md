---
title: "Azure MS-SQL 이란?"
date: "2025-04-09T01:37:37.000Z"
category: "Cloud/Azure"
source: "https://hyungyun.tistory.com/entry/Azure-MS-SQL-%EC%9D%B4%EB%9E%80"
description: "요즘 여러가지 Cloud 기반 데이터베이스의 사용이 많아지고 있는 추세인데, 최근에 공부중인 Azure MS-SQL 을 포스팅해서 함께 공부해보려고 합니다. 아직 지식이 Azure 는 관련 지식이 많이 부족해서 참고용으로만 봐주시면 "
---

요즘 여러가지 Cloud 기반 데이터베이스의 사용이 많아지고 있는 추세인데, 최근에 공부중인 Azure MS-SQL 을 포스팅해서 함께 공부해보려고 합니다. 아직 지식이 Azure 는 관련 지식이 많이 부족해서 참고용으로만 봐주시면 될 것 같습니다.

* * *

참고 : [https://learn.microsoft.com/ko-kr/azure/azure-sql/azure-sql-iaas-vs-paas-what-is-overview?view=azuresql](https://learn.microsoft.com/ko-kr/azure/azure-sql/azure-sql-iaas-vs-paas-what-is-overview?view=azuresql)

 [Azure SQL란? - Azure SQL

Azure SQL 서비스 제품군 내의 다양한 옵션에 대해 알아봅니다. Azure VM의 Azure SQL 데이터베이스, Azure SQL Managed Instance 및 SQL Server.

learn.microsoft.com](https://learn.microsoft.com/ko-kr/azure/azure-sql/azure-sql-iaas-vs-paas-what-is-overview?view=azuresql)

참고2 : [https://learn.microsoft.com/ko-kr/azure/azure-sql/database/sql-database-paas-overview?view=azuresql](https://learn.microsoft.com/ko-kr/azure/azure-sql/database/sql-database-paas-overview?view=azuresql)

 [Azure SQL Database 서비스란? - Azure SQL Database

SQL Database에 대한 소개: 클라우드 환경에서 Microsoft의 관계형 데이터베이스 관리 시스템(RDBMS)의 기능과 기술 세부 정보를 살펴봅니다.

learn.microsoft.com](https://learn.microsoft.com/ko-kr/azure/azure-sql/database/sql-database-paas-overview?view=azuresql)

* * *

우산 Azure MSSQL 이란, Microsoft 의 Azure 클라우드에서 SQL Server 데이터베이스 엔진을 사용하는 관리형 데이터베이스를 의미합니다.

Azure MS-SQL 의 경우에는 선택한 배포 옵션에 따라서 3가지 서비스로 분류 할 수 있는데, 

*   Azure SQL Database (PaaS) 
*   Azure SQL Managed Instance
*   SQL Server on Azure Virtual Machines (IaaS)

이렇게 3가지로 분류 된다.

Azure SQL Database (PaaS) 의 경우는

1\. 완전한 Platform as a Service의 PaaS 형태. 사용자의 개입 없이도, 업그레이드, 패치, 백업, 모니터링과 같은 대부분의 데이터 베이스 관리 기능을 처리.

2\. 단일 데이터 베이스 또는 탄력적 풀 (Elastic Pool) 형태로 제공. 

3\. 서버리스 계층 옵션을 사용하여 자동 스케일링이 가능.

![](__MEDIA__/4967ec2df73b2bf2069a0b205df9402eca9aa11424ead42afa1f1005779505ee.png)

출처 : Microsoft 공식 홈페이지 (https://learn.microsoft.com/ko-kr/azure/azure-sql/database/sql-database-paas-overview?view=azuresql)

Azire SQL Managed Instance 의 경우는

1\. SQL Server의 데이터베이스 엔진과 거의 100% 호환되는 서비스.

2\. IaaS 와 PaaS의 중간 형태

3\. 기존 On-Prem SQL Server 에서 마이그레이션이 용이하고, 최대한 적은 마이그레이션 작업을 통해 많은 수의 앱을 On-Prem 또는 IaaS 로 마이그레이션 하려는 고객을 위해 설계 (마이그레이션이 쉽고 용이)

마지막으로 SQL Server on Azure Virtual Machines (IaaS) 은

1\. VM에 설치 된 SQL Server (IaaS)

2\. On-Prem 과 거의 동일한 관리 방식

3\. 백업,패치, 고가용성 (Always On 등) 설정은 사용자가 직접 관리.

이렇게 특징을 볼 수 있습니다. 여기서 대표적으로 많이 쓰이는 배포 옵션은 Azure SQL Database 와 Managed Instance 두가지 옵션입니다. 상대적으로 On-Prem SQL Server에 비하여 설정이 간편하고, 사용자 편의성을 많이 고려했다는 것을 알 수 있습니다. 

On-Prem 과 다른 Azure MSSQL 의 장점으로는 아래와 같습니다.

*   높은 고가용성 지원 (99.99% 의 SLA)
*   자동 백업 및 복원 용이
*   무중단 패치 및 업그레이드
*   보안 기능의 강화 (TDE, Azure Defender, RBAC 등)
*   성능 튜닝의 자동화
*   확장성 (Auto Scale 기능) 과 호환성 (On-Prem) 
*   하이브리드 시나이로 지원 (On-Prem + Cloud 연동)

이렇게 간단하게 Azure MS-SQL 에 대해서 공부해보았습니다. Cloud 와 On-Prem 의 연동성을 많이 고려하였고, 실제 운영 환경에서도 Cloud 의 전환이 용이하도록 설계 된 클라우드 환경인 것 같습니다.

다음 포스팅에서는 구성된 Azure MS-SQL 에서 직접 사용한 프로시저 명령어에 대해서 알아보겠습니다.