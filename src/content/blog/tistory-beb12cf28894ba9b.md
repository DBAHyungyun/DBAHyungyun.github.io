---
title: "[MySQL] InnoDB_Buffer Pool 이란?"
date: "2026-01-22T07:32:26.000Z"
category: "Database | SQL | OS/MySQL | Maria"
source: "https://hyungyun.tistory.com/entry/MySQL-InnoDBBuffer-Pool-%EC%9D%B4%EB%9E%80"
description: "안녕하세요. 오늘은 MySQL 과 MariaDB 에서 성능으로 중요한 부분을 차지하고 있는 InnoDB_Buffer_Pool 에 대해서 공부 해보고, Size를 어떻게 조정하는 것이 좋은지 공부 해보겠습니다. 성능에 중요한 부분을 차"
---

안녕하세요. 오늘은 MySQL 과 MariaDB 에서 성능으로 중요한 부분을 차지하고 있는 InnoDB\_Buffer\_Pool 에 대해서 공부 해보고, Size를 어떻게 조정하는 것이 좋은지 공부 해보겠습니다.

성능에 중요한 부분을 차지하는 만큼, 이전의 아키텍처에서 간략하게 공부 해보았지만 심화하여 공부하면 추후에도 좋을것이라 생각해 기록하게 되었습니다. 

 [참고 자료 · hyungyun.tistory.com](https://hyungyun.tistory.com/entry/MySQL-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98-1)

 [참고 자료 · hyungyun.tistory.com](https://hyungyun.tistory.com/entry/MySQL-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98-2)

간략한 아키텍처 내용은 위 링크에 있으니, 한번 보시는것도 좋을 것 같습니다.

* * *

**1\. Buffer Pool 이란?**

\- Maria, MySQL 의 InnoDB 스토리지 엔진에서 가장 중요한 핵심적인 부분으로, 디스크에 저장된 **테이블 및 인덱스 데이터를 메모리에 캐싱 (Caching)** 해 두는 메인 메모리 영역입니다.

\- DB 의 데이터는 기본적으로 디스크 (SSD/HDD) 영역에 저장됩니다. 하지만, 디스크 영역은 메모리 (RAM) 보다 수십 ~ 수백배 더 소요 됩니다. 매번 쿼리를 수행할 때 마다, Disk 에서 데이터를 불러오면 DB의 성능이 매우 저하됩니다.

\- Disk I/O 는 CPU 처리 속도보다 훨씬 느리기 때문에, 자주 사용하는 Data를 Buffer Pool 에 올려 두면, Disk I/O 를 최소화하여 메모리에서 바로 처리할 수 있어 처리 속도가 빨라집니다.

\- 하지만, Buffer Pool 역시 Memory 공간이므로 스펙에 따라 한정되어 있습니다. 자주 사용하는 데이터는 남기고 오랫동안 사용하지 않은 데이터는 메모리에서 내보내는 LRU (Least Recently Used) 알고리즘을 사용하여 관리합니다.

**2\. Buffer Pool 휘발성**

*   휘발성 데이터로, DB 를 재시작 (Restart) 하는 경우, Buffer Pool 에 캐싱되어 있던 내용이 모두 삭제 된다.
*   기본적으로는 휘발성 데이터로 재시작하는 경우 삭제 되지만, innodb\_buffer\_pool\_dump\_at\_shutdown 파라미터를 활성화 시키는 경우에 버퍼 풀에 캐시된 페이지를 기록할 수 있다.
*   DB가 시작시, 기록된 페이지를 다시 읽어 들일 수 있는 innodb\_buffer\_pool\_load\_at\_startup 기능도 추가 되었으나, 이 작업 또한 디스크에서 읽어와야 하므로 초기에 시간이 필요하다. (디스크에서 읽어오거나 Dump 된 데이터를 읽어옴)
*   Aurora MySQL 에서는 페이지 캐시와 데이터베이스가 별도의 프로세스로 관리 된다. 이를 통해 페이지 캐시가 데이터베이스와 상관 없이 Restart 되어도 유지가 된다. (Aurora MySQL 에서는 Buffer Pool 을 페이지 캐시라고도 합니다.)

**3\. Buffer Pool 의 쓰기 최적화**

*   Dirty Page : 사용자가 데이터를 UPDATE 하거나, INSERT 하면 디스크에 바로 쓰기 작업을 진행하지 않고 메모리 (Buffer Pool) 의 페이지를 먼저 수정한다. 이때, 디스크의 원본 데이터와 메모리의 데이터가 다른 상태를 Dirty 라고 표현한다.
*   Redo Log (WAL Log) : 이때 만약, MySQL/Maria RDS 가 갑자기 종료된다면, 디스크에 저장되지 않은 휘발 상태의 페이지에 위치한 Buffer Pool 이 휘발될 수 있다. 그렇기 때문에 변경 사항만 Redo Log에 빠르게 기록하여 데이터 유실을 방지한다.
*   Flushing (플러싱) : 백그라운드 스레드가 주기적으로, 혹은 메모리가 부족할 때 Dirty Page들을 모아서 디스크의 데이터 파일에 한번에 기록하는 작업

이런 방식으로 랜덤 디스크 I/O를 줄이고 성능을 향상 시킵니다.

* * *

Buffer Pool 조회 방법 (AWS MariaDB RDS db.m6g.large 기준으로 작성하였습니다.)

![](__MEDIA__/16464ad13b49304c5a7b84c107bfe52574030669ac04186581562dcb93771b75.png)

Buffer Pool Size 조회

기본적으로, Buffer\_Pool\_Size는 Byte 단위로 조회하게 되면, 위와 같은 형태로 조회가 가능합니다. 그래서 대부분, 1024를 3번 나누어 GB 형태로 보기 편하게 설정합니다.

![](__MEDIA__/cbe0d930cc0fbe27d228fa198f9836f93eb67b0d2653babae8fa86ef1878dc33.png)

GB로 변환된 innodb\_buffer\_pool\_size

위 인스턴스는 대략 3.6GB 를 메모리에서 innodb\_buffer\_pool 로 할당하여 사용하고 있다. 실제 db.m6g.large의 스펙은 8GB의 메모리를 가지고 있으며, 파라미터 값으로 관리가 된다. AWS 에서 제공하는 System Default 값의 innodb\_buffer\_pool\_size는 DBInstanceClassMemory\*3/4 이다. 대략 75%를 할당하는 것을 Default로 보고 있다.

![](__MEDIA__/26023c61c6ffbe7627b0c1c52a0f057ec4a15bca6148b837e5ef1b4acc96cfe9.png)

RDS 의 인스턴스 스펙

![](__MEDIA__/68063f1fb099300352211b6667b43349c243c726d293a9b338b1a156a78d6879.png)

설정된 파라미터 값

실제로, 대략 50%인 3.6GB를 Buffer Pool Size에 할당하고 있었고 8GB의 메모리이면 4GB 여야 되는데 왜 3.6GB라고 생각하는 분들이 있겠지만 기본적으로 메모리에 할당되는 시스템 관리 영역에 대한 부분도 할당하여 그 부분을 제외한 50%를 할당합니다.

> 일반적으로 전체 물리 메모리의 80% 정도를 InnoDB의 버퍼 풀로 설정하라는 내용도 있으나, 80% 의 수치값이 아닌, 운영체제와 각 클라이언트 스레드가 사용할 메모리, 백그라운드 메모리도 충분히 고려해서 설정해야 한다.  
> 운영체제의 전체 메모리 공간이 8GB 미만이라면 50% 정도는 InnoDB Buffer Pool로 설정하고, 나머지 메모리 공간은 MySQL 서버와 운영체제, 그리고 다른 프로그램이 사용할 수 있는 공간으로 확보해주는 것이 좋다.

지난번 게시글에서도 위와 같이 말했지만, 실제 InnoDB Buffer Pool Size를 세팅하는 것은 그리 간단한 문제가 아니다. 80%, 70% 등 수치 값으로 어떻게 해야겠다 정하는것이 아닌 시스템과 그 데이터베이스의 쓰임에 맞도록 설정해야하는 값이다.

동일한 스펙에서 서로 다른 쓰임을 보여주는 경우

1\. 기본적으로 수행하는 쿼리의 숫자가 적으며, 간간히 배치 작업을 수행하는 시스템 (상대적으로 사용량이 적음)

2\. 기본적으로 수행하는 쿼리의 숫자가 많은 시스템 (상대적으로 사용량이 많음)

이런 경우에서 동일하게 80%로 세팅하게 된다면, 1번의 경우에는 Buffer Pool 에게 너무 많은 불필요한 공간을 주게 되어 조정할 필요가 있고, 2번의 경우에는 상황에 따라서 Buffer\_pool\_size를 줄이거나, 인스턴스 스펙을 증가시켜야 하는 경우가 생길 수도 있습니다.

또한, 무분별하게 높아진 Buffer\_Pool\_size는 Dirty Page를 플러싱 할 때, 부하를 발생시킬 수 있으며 이는 DB 성능 저하로 이어질 여지가 충분합니다. 

이런 경우에는 Buffer\_Pool\_Hit\_ratio 를 통해 Buffer Pool 에서 효율적으로 데이터를 읽어 오는지 확인 할 수 있습니다. 이에 관련한 내용은 추후에 자세히 확인해보도록 하겠습니다. 

![](__MEDIA__/48049a68b5d0d90bf9fb6b81fe0f452d4f89a458aabaf282770ee8a6058d3c16.png)

Buffer Pool Hit Ratio

* * *

이렇게 간략하게 Buffer Pool 에 대한 내용을 정리, 공부 해보았습니다. 다음에는 Buffer Pool Hit Ratio 와 다른 아키텍처에 관하여 공부해볼까 합니다.