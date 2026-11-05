---
title: "RHEL 9.5 구성해보기"
date: "2025-01-08T02:22:05.000Z"
category: "Database | SQL | OS/Linux OS"
source: "https://hyungyun.tistory.com/entry/RHEL-95-%EA%B5%AC%EC%84%B1%ED%95%B4%EB%B3%B4%EA%B8%B0"
description: "오늘은 SQL이 아닌 OS 에서 Red Hat Enterprise Linux 9.5 iso를 다운받아 구성해보려고 합니다. 우선 Red Hat Enterprise Linux 9.5는 24년 11월 12일에 릴리즈 되었으며, 미국의 레"
---

오늘은 SQL이 아닌 OS 에서 Red Hat Enterprise Linux 9.5 iso를 다운받아 구성해보려고 합니다.

우선 Red Hat Enterprise Linux 9.5는 24년 11월 12일에 릴리즈 되었으며, 미국의 레드햇이라는 회사가 개발한 리눅스 계열의 OS로 개발자의 테스트 목적으로 무료 설치가 가능하도록 되어 있습니다. Database와 개발 등 여러 방면에서 사용하고 있지만, 현업에서는 Rocky Linux, CentOS 도 많이 사용하는듯 보입니다. (RHEL 은 요근래 8.10 버전이 많이 보이는듯 합니다. 간간히 9.4 버전도 보이는 것 같구요.)

아무튼 오늘은 iso를 직접 다운로드 받아, vmware 에서 구성을 진행해보려고 합니다. 아래 링크에서 RHEL 9.5 iso 를 다운받아 사용하였습니다. 

링크 : [https://developers.redhat.com/products/rhel/download](https://developers.redhat.com/products/rhel/download)

 [Download Red Hat Enterprise Linux at no cost | Red Hat Developer

Download Red Hat Enterprise Linux at no cost. Get access to RHEL cloud ready images, ISOs, and more.

developers.redhat.com](https://developers.redhat.com/products/rhel/download)

설치 환경은 VMware Workstation Pro 16 을 사용하였고, 아래 네모박스의 Create a New Virtual Machine 을 클릭하여 새로운 가상서버를 구성합니다. 

![](__MEDIA__/99e2df4fb8b314718e7b3735a873fe62077700cdd25683e1deb24e00e32ea388.png)

VMware 16 Pro

Custom mode 클릭 

![](__MEDIA__/4750174ff62781aec753026a527cd44d4ff6aa54f7e076fff885fc3dd9f4ffd1.png)

Custom

설치 될 iso를 등록해줍니다. 저는 Downloads 폴더내에 있는 파일을 지정해주었습니다.

![](__MEDIA__/9318c8c3ca7aee0cddc5387a66218808428e3b11ae3e74fedb7e5a5cdd0641f0.png)

iso 파일 지정

Version 에 RHEL 9 버전대가 없으므로, RHEL 8 버전으로 지정해서 설치

![](__MEDIA__/965212d2f761f777be5a06493e1f99c30ed966cad30a8762fa72d1ad106ed160.png)

RHEL 8버전 세팅

네트워크 사용하므로, Bridge 네트워크 세팅

![](__MEDIA__/1f38a006472315b4ab6b859267987eebb7a03d90f452ca1e2be65c06636bc911.png)

Bridge 세팅

다 세팅하고 실행하게 되면 아래와 같은 화면이 나오게 된다. Install Red Hat Enterprise Linux 9.5 를 선택한다.

![](__MEDIA__/3692c75904c5cebbed7099c3545fdfff25fed6e1dd4d479de0f7ed272bbe1ecf.png)

install 화면

Language 세팅하여 설정

![](__MEDIA__/9bebbfe16432febedfeff792f70e964087e6649fa8454ec01d581d02730e8d3e.png)

Language 세팅

설치 될 파티션을 지정해주고, root 패스워드는 필수 지정은 아니지만 세팅

![](__MEDIA__/9e128facee88e98eacc46693d2c18d5a8d4626bee50925655cfa957b85a914bb.png)

파티션 및 루트 세팅

설치가 완료 되었으면, 우측 하단에 시스템 재시작 버튼을 클릭해줍니다.

![](__MEDIA__/f947ec21b1612328bfd6b24704b8ba9971186cc0b09032b98d1bcef460f1cf00.png)

시스템 재시작

재시작 하게 되면 간단한 세팅을 진행하고 마무리하면 된다.

![](__MEDIA__/4d5f45b9aaee6600c75394f256cfe72506faeb99c5f6ec03e82b22c40025b342.png)

RHEL 9.5 설치 완료

이제 여기서 yum 관련 Repository 를 설치하게 되면 마무리 됩니다.

다음에는 이 설치 된 RHEL 9.5에 Oracle 19c 를 설치 해보려고 합니다.