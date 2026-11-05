---
title: "AWS CloudWatch를 활용한 모니터링 방법"
date: "2026-02-05T02:09:35.000Z"
category: "Cloud/AWS"
source: "https://hyungyun.tistory.com/entry/AWS-CloudWatch%EB%A5%BC-%ED%99%9C%EC%9A%A9%ED%95%9C-%EB%AA%A8%EB%8B%88%ED%84%B0%EB%A7%81-%EB%B0%A9%EB%B2%95"
description: "오늘은 AWS 에서 기본으로 제공하는, CloudWatch를 활용하여 Aurora MySQL을 모니터링 하는 방법에 대해 알아보려고 합니다. 우선, CloudWatch란 ? Amazon CloudWatch는 Amazon Web Ser"
---

오늘은 AWS 에서 기본으로 제공하는, CloudWatch를 활용하여 Aurora MySQL을 모니터링 하는 방법에 대해 알아보려고 합니다.

우선, CloudWatch란 ?

Amazon CloudWatch는 Amazon Web Services(AWS) 리소스와 AWS에서 실행하는 애플리케이션을 실시간으로 모니터링하고 애플리케이션 성능, 운영 상태 및 리소스 사용률에 대한 시스템 전반의 관찰성을 제공하는 다양한 도구를 제공하는 클라우드 모니터링 입니다. 

아래는 CloudWatch가 무엇인지 간략하게 설명한 공식 문서 링크입니다. 참고하면 좋을 것 같습니다. 

 [참고 자료 · docs.aws.amazon.com](https://docs.aws.amazon.com/ko_kr/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html)

* * *

우선 CloudWatch는 크게 지표 제공, 로그, 장애 감지 등 크게 3가지 항목을 사용자에게 제공합니다.

<table style="border-collapse: collapse; width: 100%; height: 161px;" border="1" width="657" data-path-to-node="5" data-ke-align="alignLeft"><tbody><tr style="height: 23px;"><td style="height: 23px;" width="140" height="57">요소 (Component)</td><td style="height: 23px;" width="260">설명</td><td style="height: 23px;" width="257">RDS 예시</td></tr><tr style="height: 59px;"><td style="height: 59px;" width="140" height="113"><span style="color: #000000;">지표 (Metrics)</span></td><td style="height: 59px;" width="260"><span style="color: #000000;" data-path-to-node="5,1,1,0">시간 순서대로 수집되는 숫자 데이터입니다.</span></td><td style="height: 59px;" width="257"><span style="color: #000000;" data-path-to-node="5,1,2,0">CPUUtilization(%), FreeableMemory (MB),<br>Read,Write IOPS(횟수)</span></td></tr><tr style="height: 20px;"><td style="height: 20px;" width="140" height="132"><span style="color: #000000;" data-path-to-node="5,2,0,0">로그 (Logs)</span></td><td style="height: 20px;" width="260"><span style="color: #000000;" data-path-to-node="5,2,1,0">애플리케이션이나 리소스가 뱉어내는 텍스트<br>데이터입니다.</span></td><td style="height: 20px;" width="257"><span style="color: #000000;" data-path-to-node="5,2,2,0">mysql-error.log, slow_query_log</span></td></tr><tr style="height: 59px;"><td style="height: 59px;" width="140" height="132"><span style="color: #000000;" data-path-to-node="5,3,0,0">경보 (Alarms)</span></td><td style="height: 59px;" width="260"><span style="color: #000000;" data-path-to-node="5,3,1,0">지표가 특정 수치를 넘으면 알림을 보내거나 작업을 수행합니다.</span></td><td style="height: 59px;" width="257"><span style="color: #000000;" data-path-to-node="5,3,2,0">CPUUtilization 지표가 5분 동안 80% 이상이면<br>SNS로 알림 보내줘</span></td></tr></tbody></table>

그중 지표 제공에 대한 항목은 2가지 형태로 사용자에게 제공이 되는데 아래와 같이 서비스 형태로 제공되는 항목, 인스턴스의 하단에 제공되는 모니터링 항목 이렇게 나눌 수 있을 것 같습니다. 

![](__MEDIA__/d1f6faf5469c14abad6d3ad9332a2a1a60ab29ae2cfcfd03593385a4ba4c6e52.png)

CloudWatch 모니터링 화면

![](__MEDIA__/70aa2d904be140e776cde4af876858868e8a38babcd967a875acc98083491bde.png)

인스턴스 하단에 제공되는 기본 모니터링 대시보드

인스턴스의 순간적인 변화량과 현재 실시간으로 모니터링을 하고 싶다면 하단에 제공되는 기본 모니터링 대시보드에서 사용해도 무관하지만, 실제 CloudWatch 메뉴에 들어가게 되면 사용자가 원하는 모드의 대시보드, Log Management 에서 Audit Log 및 Error Log를 파악할 수 있습니다.

![](__MEDIA__/3b7ce2fb3138953b98342f629ed8710a30fd495c9c8e365374c70a9713fb7f67.png)

CloudWatch 화면

대시보드 : 사용자 편의에 맞게 지표를 추가하여 모니터링할 수 있는 대시보드, 사용자가 설정하는 경우도 있으나 자동으로 세팅된 대시보드를 사용할 수도 있음.

Log Management : 로그 그룹 혹은 데이터 소스별로 로그 데이터를 확인하는 항목

![](__MEDIA__/1c7b6686bfd1d9132089daf50ed9da5fa1ec815c25fd1ffaba64c5208c96cbbd.png)

AWS 에서 제공하는 기본 RDS 대시보드

![](__MEDIA__/3a204c62d8efa462428c5c6936961570689a892eabd917f71d143caea5bb1bfa.png)

Log Management 에서 제공하는 로그 그룹

대시보드의 경우에는 기본적으로 제공되는 화면과, 사용자가 지정할 수 있는 대시보드가 있지만 로그 그룹의 경우에는 인스턴스 생성시에 체크박스를 지정하지 않으면 생성이 되지 않습니다. 

아래와 같이 감사 로그 (Audit Log), 에러 로그 (Error Log), 느린 쿼리 로그 (Slow Query Log) 를 활성화한 경우에 Log Management 에 적재가 가능하게 됩니다. 

![](__MEDIA__/24848eb4f58df0933f5f2ae649ed98fef2fa6f0b6578f8966de31206eb055de2.png)

Log Management 설정

또한, 감사 로그에 적재되는 쿼리는 파라미터로 변경할 수 있는데 이 부분은 나중에 공부해보도록 하겠습니다.

![](__MEDIA__/99c1dcd1f5c9639aa08b7aa97dfd7d4d9dacfb6df520c4d495ef00dc015d9c42.png)

Audit Log 적재 내용 설정

마지막으로, CloudWatch 에서 설정하는 경보입니다. 해당 경보를 설정하면 생성된 ARN에 맞춰 사용자에게 알림을 전송할 수도 있고, 새로운 Email을 등록하여 SNS로 전달받을 수 있습니다. (단, 부여 및 권한이 있어야함)

테스트 용으로 진행하는 경우의 대부분은 admin 권한을 가진 IAM 계정이기 때문에 권한의 부분에서는 큰 무리가 없을 것으로 생각되고, 제공되는 지표도 Cloudwatch 가 제공하는 지표들을 바탕으로 생성이 가능합니다. 

![](__MEDIA__/43d27985e6ff43203244b50d9a07fc0004472c97b01d0159fc87b96e39a9da11.png)

ClodWatch 알람 설정

실제로 대부분의 환경에서 모니터링 툴을 사용하지만, Cloudwatch로 알람을 받아보는 경우도 적지 않습니다.

CPUUtilization, FreeableMemory, DatabaseConnections 등 다양한 항목에서 알람을 받는 경우가 있어 참고하면 좋을 것 같습니다.

![](__MEDIA__/535c2cd97a9203031781992cade13a7225701df4a90afffc12e5eec4e628753b.png)

설정된 알람 목록

이렇게 AWS 가 기본으로 제공하는 Cloudwatch 에 대한 내용을 간단히 정리해보았습니다. 모니터링 툴을 잘 활용한다면, 장애 상황에서도 빠른 대처가 가능하니 참고해서 유용하게 사용했으면 좋겠습니다.