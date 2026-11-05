---
title: "AWS RDS vs On-Prem RDS / Aurora MySQL 생성 가이드"
date: "2025-11-25T06:34:01.000Z"
category: "Cloud/AWS"
source: "https://hyungyun.tistory.com/entry/AWS-RDS-vs-On-Prem-RDS-Aurora-MySQL-%EC%83%9D%EC%84%B1-%EA%B0%80%EC%9D%B4%EB%93%9C"
description: "오늘은 AWS 의 가장 기본인 On-Prem RDS 와 AWS RDS의 차이점에 대해 알아보고 Aurora MySQL 인스턴스 생성 방법에 대해서 가이드 하려고 합니다. (네트워크와 Subnet 이 설정되어 있다는 가정하에) 가이드에"
---

오늘은 AWS 의 가장 기본인 On-Prem RDS 와 AWS RDS의 차이점에 대해 알아보고 Aurora MySQL 인스턴스 생성 방법에 대해서 가이드 하려고 합니다. (네트워크와 Subnet 이 설정되어 있다는 가정하에)

가이드에 앞서, On-Prem RDS 환경과 AWS Cloud RDS 환경의 장단점과 차이점을 알아본다면, 아래와 같다

<table style="border-collapse: collapse; width: 100%; height: 147px;" border="1" data-ke-align="alignLeft"><tbody><tr style="height: 21px;"><td style="width: 33.3333%; text-align: center; height: 21px;">항목</td><td style="width: 33.3333%; text-align: center; height: 21px;">On-prem RDS</td><td style="width: 33.3333%; text-align: center; height: 21px;">AWS RDS</td></tr><tr style="height: 42px;"><td style="width: 33.3333%; text-align: center; height: 42px;">운영 주체</td><td style="width: 33.3333%; text-align: center; height: 42px;">사용자 직접 관리<br>서버 + 스토리지 + 네트워크 관리</td><td style="width: 33.3333%; text-align: center; height: 42px;">AWS 관리</td></tr><tr style="height: 21px;"><td style="width: 33.3333%; text-align: center; height: 21px;">확장성</td><td style="width: 33.3333%; text-align: center; height: 21px;">물리 장비 기반 (확장성 제한)</td><td style="width: 33.3333%; text-align: center; height: 21px;">클릭/API 기반 (확장성 용이)</td></tr><tr style="height: 21px;"><td style="width: 33.3333%; text-align: center; height: 21px;">가용성</td><td style="width: 33.3333%; text-align: center; height: 21px;">HA 구성 시 사용자 직접 구성</td><td style="width: 33.3333%; text-align: center; height: 21px;">Multi-AZ, Failover AWS 제공</td></tr><tr style="height: 21px;"><td style="width: 33.3333%; text-align: center; height: 21px;">비용 구조</td><td style="width: 33.3333%; text-align: center; height: 21px;">초기 장비 + 기타 비용 (사업 운영비)&nbsp;</td><td style="width: 33.3333%; text-align: center; height: 21px;">온디멘드 기반 (유동성 존재)</td></tr><tr style="height: 21px;"><td style="width: 33.3333%; text-align: center; height: 21px;">설치/업그레이드 배포 속도</td><td style="width: 33.3333%; text-align: center; height: 21px;">수일 ~ 수개월</td><td style="width: 33.3333%; text-align: center; height: 21px;">수분 ~ 수시간</td></tr></tbody></table>

언뜻보면, AWS 가 굉장히 간편하고 장점이 많다고 생각할 수 있다. 각 시스템의 장단점이 존재하는데,

On-Prem의 경우 사용자가 직접 관리하여, OS 업그레이드, Kernel Parameter 등 사용자의 편의대로 변경이 가능하지만 AWS RDS의 경우 OS에 접근이 불가능하기 때문에 사용자 편의성이 떨어진다는 단점이 존재한다.

하지만, AWS가 직접 관리하는 경우 사용자에게 부담이 줄어들고 장애 상황에서의 유연한 대처 능력이 On-Prem 보다는 개인적으로 뛰어나다고 생각한다.

이러한 편의성에도 불구하고 AWS가 관리해주는 시스템 특성상, 보안기준이 엄격하고 시스템에 제한이 많은 금융권이나 공공기관의 경우 아직 Cloud를 사용하는데 보수적일 수 밖에 없다는 생각도 든다. 각각의 장단점을 파악하여 시스템을 구성해야 한다.

* * *

1\. AWS 에 접속하게 되면, 기본 화면에서 좌측상단에 Aurora and RDS 를 검색하여 RDS 생성 화면으로 넘어간다.

![](__MEDIA__/e579a4fd8bb2ef385e697e1719cbd90e2845e7f85bb5e3729ad789428d40056b.png)

AWS RDS 생성 가이드

2\. 해당 화면에 접속했다면 우측 상단에 데이터베이스 생성이라는 탭이 존재한다.

![](__MEDIA__/4ebbbf8c9c53047ce583a2452fb53dd2cf2c93b041913464c786bdcbf592e411.png)

AWS RDS 생성 가이드

3\. 클릭하게 된 화면에서 상단에 생성 방식을 선택한다. 표준 생성은 사용자가 직접 스토리지와 인스턴스 유형을 설정하며 생성하는 방식이고, 손쉬운 생성은 AWS 에서 지정해주는 옵션으로 생성해주게 되는 옵션이다.

손쉬운 생성으로 진행할 경우 인스턴스 유형이 필요한 것 보다 굉장히 크게 선택되므로 어지간하면 표준 생성으로 진행한다. (프리티어가 아닌 과다 과금 우려)

4\. 그 아래 원하는 엔진 옵션과 버전을 설정해준다. Aurora MySQL을 생성할 예정이므로 선택.

![](__MEDIA__/7a1e3f325519266db6f2d40d90483f6fe9344c86b4362f221c3d20ffbec76c1b.png)

AWS RDS 생성 가이드

5\. DB 클러스터 식별자를 개인이 원하는 이름으로 변경해준뒤, 마스터 사용자 이름도 원하는 네이밍으로 변경한다. (Default admin 으로 대부분 변경하지 않는다.)

6\. 자격 증명 관리의 경우에는 자체 관리를 진행해야 admin 계정에 대한 패스워드를 설정할 수 있다. 개인이 직접 설정하여 admin 계정에 대한 접근이 가능하도록 설정한다. 

![](__MEDIA__/79d1ed77290c078cba43a43aa0ec4200d5e85eccb365f340695dd25b503b0fda.png)

AWS RDS 생성

7\. DB 인스턴스 구성 화면에서, 사용량에 맞게 설정하면 된다. 

서버리스 v2 : 서버리스는 온디맨드 방식이 아닌 사용량에 따른 과금 형식이라고 생각하면 된다. 고정된 인스턴스를 사용하지 않고, 유동적인 방법으로 운영해야 하는 경우에 추천된다.

메모리 최적화 클래스 (r클래스) : 기본적으로 기업형에서 많이 사용되는 인스턴스 유형 과금량이 많고 Size가 크다.

버스터블 클래스(t 클래스) : 테스트용 RDS로 많이 사용되는 유형 과금 정도가 낮다.

![](__MEDIA__/07b744cf728853ad89f31895e0fa7d551a64cc49ee2993a8d6c91e9800aaea2d.png)

AWS RDS 인스턴스 설정

8\. 서브넷 그룹을 설정하고, (개인 서브넷이 없다면 Default 진행) 퍼블릭 액세스 권한을 허용해주어야지만 외부에서 접속이 가능하므로, 예를 선택해준다. 하단의 태그는 식별자로 개인 식별 가능하게 설정해주면 된다. 

![](__MEDIA__/67bf50ad0de89c8fe76c440f5ccff12306b9fd0bc71532330feee06aa965dcde.png)

AWS RDS 생성

9\. 마지막으로 CloudWatch 옵션을 활성화 해준다. Audit Log나 Error Log 등 Database의 중요 로그 데이터를 제공한다. 하지만 과금의 여지가 존재하니 잘 확인해서 선택하면 된다. 

![](__MEDIA__/d75fc387e6a4fd4f7a77dea8074fd90e35995c15c4b36cd6740b485a342a88b1.png)

AWS RDS

이렇게 생성된 인스턴스는 월 8만원 정도에 이용이 가능하다. (환율에 따라 달라질 여지 존재)

간단하게 AWS RDS와 On-Prem RDS의 차이점, AWS RDS 생성까지 진행해보았다. 다음에는 AWS Aurora MySQL 과 RDS MySQL의 차이점에 대해서 기록해보려고 한다.