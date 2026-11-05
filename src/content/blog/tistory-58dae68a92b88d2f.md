---
title: "Always On Failover 테스트"
date: "2025-02-03T01:55:42.000Z"
category: "Database | SQL | OS/MS-SQL"
source: "https://hyungyun.tistory.com/entry/Always-On-Failover-%ED%85%8C%EC%8A%A4%ED%8A%B8"
description: "이번에는 Always On 환경의 서버를 Primary -> Secondary / Secondary -> Primary 이렇게 전환 해보는 테스트를 진행하겠습니다. 일전에 구성했던 설치 가이드를 참고하여, 설치를 완료한 뒤 해당 환경"
---

이번에는 Always On 환경의 서버를 Primary -> Secondary / Secondary -> Primary 이렇게 전환 해보는 테스트를 진행하겠습니다.

일전에 구성했던 설치 가이드를 참고하여, 설치를 완료한 뒤 해당 환경에서 진행하였습니다.

[https://hyungyun.tistory.com/entry/MS-SQL-Always-On-%EC%84%A4%EC%B9%98-%EA%B0%80%EC%9D%B4%EB%93%9C-3](https://hyungyun.tistory.com/entry/MS-SQL-Always-On-%EC%84%A4%EC%B9%98-%EA%B0%80%EC%9D%B4%EB%93%9C-3)

 [MS SQL Always On 설치 가이드 - 3

AD서버 구성과 클러스터 구성은 앞전의 설치 가이드를 참고 부탁드립니다.    MS SQL Always On 설치 가이드 - 1오늘은 Always On 설치 테스트를 진행해보려고 합니다.저도 SQLTAG 라는 책으로 공부하였

hyungyun.tistory.com](https://hyungyun.tistory.com/entry/MS-SQL-Always-On-%EC%84%A4%EC%B9%98-%EA%B0%80%EC%9D%B4%EB%93%9C-3)

* * *

우선 최초로 구성하게 되면, Primary 와 Secondary 2개로 나뉘어 지는데 Primary 환경의 Always On Group 에서 우클릭하게 되면 Failover 이라는 옵션이 나온다.

![](__MEDIA__/ac93d50fba4bfd4d1b7d2070672ccfb99e45e2bea5a1a6f71f94f5854c63eb79.png)

Pirmary 의 Failover 옵션

해당 옵션을 클릭하게 되면 나오는 최초 화면으로, Next 클릭

![](__MEDIA__/43e3ff537418432b1fc952f9148225376fcc98a7200bb54d192fff3f93f4d591.png)

Failover 최초 화면

Failover를 진행할 Secondary Server를 선택해준다. 현재는 서버를 하나만 등록한 상황이므로, 해당 서버 하나만 선택해준다.

![](__MEDIA__/229c942faa084c960d4fb62bf9549c0a5bf81b663a41d8e39e483f7b17ed1f5e.png)

절체 테스트를 진행할 서버 선택

최초로 선택을 하고 넘어가게 되면, Connect 를 하지 않아서 Not Connected 상태로 남아있게 된다. 여기서 우측의 Connect 버튼클릭

![](__MEDIA__/5bae69c9c697bb0d1be002bf618dc4147fd2a1986d709249d0286fbe4023b565.png)

Connect 하기 전

Connect 를 클릭하면 실제 인스턴스에 연결하는 화면이 나오고, 연결을 진행해주면 아래와 같이 정상적으로 연결 됨을 확인 할 수 있다.

![](__MEDIA__/4aa71d0ee55fdf9399c8d26233656c9de26b33a53dc3ab22d62972fd88dc852c.png)

Secondary Replica 연결

연결 후에는 모든 세팅이 완료 되었으며, Finish 버튼을 클릭하여 Failover를 마무리 하면 된다. 

![](__MEDIA__/e4ec0acaf6f6ee6ddf9f809b83d4e270169a9e637695e71a7f6c373e591ae36d.png)

Failover 세팅 완료

Failover 위자드에 Failover 상태에 관한 메세지가 출력되며 전부 정상적으로 절체 되었음을 확인 가능하다.

![](__MEDIA__/4c396388ce6114900ceef6e8ecee58ef8bf4c53884bd77976633cc847692962c.png)

Failover 성공

기존의 Secondary 서버였던 인스턴스가 절체를 완료하여 현재 Primary 로 변경 된 것을 확인 할 수 있다.

![](__MEDIA__/36e1894c5bba205fa7008c09f8a33a14e41160a5277c7af8017ba4a65e779a31.png)

Primary 전환

현재는 이렇게 직접 Failover 하는 경우보다 MCCS 라는 프로그램을 사용하여 장애를 감지하고, 자동으로 Failover 하는 경우가 대부분이다. 하지만, Failover 되는 과정이나 직접 해봄으로서 실제 아키텍쳐를 이해해햐아 한다고 생각한다.

다음에는 실제 Table 을 생성하고 데이터를 insert 하여 SYNC 가 정상적으로 되는지 테스트를 진행하려고 한다.