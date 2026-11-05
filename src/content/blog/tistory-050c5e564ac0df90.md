---
title: "MSSQL Always On 구성이란?"
date: "2025-01-16T13:42:48.000Z"
category: "Database | SQL | OS/MS-SQL"
source: "https://hyungyun.tistory.com/entry/MSSQL-Always-On-%EA%B5%AC%EC%84%B1%EC%9D%B4%EB%9E%80"
description: "이번에는 MSSQL 의 Always On 구성에 대하여 알아보려고 한다. 기본적으로 Oracle 이나 Tibero 등 RDBMS 에는 RAC, TAC, HA (Active / Stand-by) 등 여러가지 구성이 있는데, 그중 MSS"
---

이번에는 MSSQL 의 Always On 구성에 대하여 알아보려고 한다.

기본적으로 Oracle 이나 Tibero 등 RDBMS 에는 RAC, TAC, HA (Active / Stand-by) 등 여러가지 구성이 있는데, 그중 MSSQL 에서는 Always On 이라는 고가용성 및 재해 복구 구성이 존재한다.

Always On 은 공식사이트에서 데이터베이스 미러링에 대한 엔터프라이즈 수준의 대안을 제공하는 고가용성 및 재해 복구 솔루션으로, Always On 가용성 그룹은 기업용 사용자 데이터베이스 집합의 가용성을 최대화합니다. 가용성 그룹은 함께 장애 조치 (Failover) 되는 사용자 데이터베이스 (가용성 데이터베이스라고 함.) 의 불연속 집합에 대한 장애 조치 (Failover) 환경을 지원합니다.

라고 명시되어 있다. 실제로 근무하며 여러 MSSQL 를 사용하는 고객사를 많이 방문해보았지만, SQL Server 내에서 Enterprise 의 경우에만 지원하다 보니 가격적으로도 더 비쌀것이고, 실제로 대기업이나 DB 자체의 몸집이 크고 중요도가 높은 서버 구성되어 있던 것으로 기억한다. (MCCS 에서 HA구성으로 운영되는 회사들도 더러 보았다.)

![](__MEDIA__/539d2d2d4c2c32c8855f05d50e5b01a729398bd810456a23f530556b76940779.png)

Always On 서버의 기본 구성도

HA와 Always On 구성의 차이점은 아래 표로 간단히 알아 볼 수 있다.

<table style="border-collapse: collapse; width: 100%; height: 114px;" border="1" data-ke-align="alignLeft"><tbody><tr style="height: 19px;"><td style="width: 33.3333%; height: 19px;">차이점</td><td style="width: 33.3333%; height: 19px;">HA</td><td style="width: 33.3333%; height: 19px;">Always On</td></tr><tr style="height: 19px;"><td style="width: 33.3333%; height: 19px;">설정</td><td style="width: 33.3333%; height: 19px;">비교적 간단함</td><td style="width: 33.3333%; height: 19px;">어려움</td></tr><tr style="height: 19px;"><td style="width: 33.3333%; height: 19px;">비용</td><td style="width: 33.3333%; height: 19px;">구현 비용이 상대적 저렴</td><td style="width: 33.3333%; height: 19px;">구현 비용이 비싸다</td></tr><tr style="height: 19px;"><td style="width: 33.3333%; height: 19px;">호환성</td><td style="width: 33.3333%; height: 19px;">타 RDBMS 에서도 사용하는 고가용성 기술</td><td style="width: 33.3333%; height: 19px;">MSSQL 에서 사용하는 고가용성 기술</td></tr><tr style="height: 19px;"><td style="width: 33.3333%; height: 19px;">장애조치 속도</td><td style="width: 33.3333%; height: 19px;">상대적으로 느림 (MCCS 솔루션 사용)</td><td style="width: 33.3333%; height: 19px;">빠름&nbsp;</td></tr><tr style="height: 19px;"><td style="width: 33.3333%; height: 19px;">복제 단위</td><td style="width: 33.3333%; height: 19px;">개별 데이터베이스&nbsp;</td><td style="width: 33.3333%; height: 19px;">데이터베이스 그룹 (AG)</td></tr></tbody></table>

 실제로 몸통이 되는 AG 서버를 구성하게 되고, 그 아래 Primary - Secondary 를 두어 항상 Active 한 상태를 유지하게 된다. 이러한 상황에서 Primary 서버의 장애 발생시 Secondary 서버가 자동으로 Primary 서버로 일종의 승격을 하게 되며, Primary 서버는 Secondary 서버로 전환하게 된다.

이번 포스팅에서는 간단히 Always On 구성에 대하여 알아 보았는데, 다음에는 Always on 구성 실습을 진행해보려고 한다.

실제로 Always On 구성을 처음 진행할 때, 일주일이나 걸렸는데 다음 포스팅으로 공부도 하고 많은 분들께 도움도 되었으면 한다.