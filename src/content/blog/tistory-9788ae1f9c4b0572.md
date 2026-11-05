---
title: "SQL 프로그래머스 코딩테스트 대비 공부"
date: "2025-07-09T02:14:11.000Z"
category: "Database | SQL | OS/SQL 개발공부"
source: "https://hyungyun.tistory.com/entry/SQL-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%A8%B8%EC%8A%A4-%EC%BD%94%EB%94%A9%ED%85%8C%EC%8A%A4%ED%8A%B8-%EB%8C%80%EB%B9%84-%EA%B3%B5%EB%B6%80"
description: "서울에 위치한 식당 목록 출력하기. 문제 설명 프로그래머스 코딩테스트 문제 : REST_INFO와 REST_REVIEW 테이블에서 서울에 위치한 식당들의 식당 ID, 식당 이름, 음식 종류, 즐겨찾기수, 주소, 리뷰 평균 점수를 조회"
---

서울에 위치한 식당 목록 출력하기.

문제 설명

![](__MEDIA__/ac246b7fa6d74a3cc06ed1d15acaaaba8d0a9479a10cafce8413f562add6ece2.png)

프로그래머스 코딩테스트

문제 : 

REST\_INFO와 REST\_REVIEW 테이블에서 서울에 위치한 식당들의 식당 ID, 식당 이름, 음식 종류, 즐겨찾기수, 주소, 리뷰 평균 점수를 조회하는 SQL문을 작성해주세요. 이때 리뷰 평균점수는 소수점 세 번째 자리에서 반올림 해주시고 결과는 평균점수를 기준으로 내림차순 정렬해주시고, 평균점수가 같다면 즐겨찾기수를 기준으로 내림차순 정렬해주세요.

*   두 테이블에 공통 칼럼에 대한 REST\_ID 에 대한 JOIN 진행
*   공통 칼럼의 REST\_ID 를 기준으로 GROUP BY 이후 HAVING 조건으로 서울에 대한 조건을 필터링
*   이후 문제에 맞게 정렬

정답 : 

```
SELECT a.REST_ID,b.REST_NAME,b.FOOD_TYPE,b.FAVORITES,b.ADDRESS,ROUND(AVG(a.REVIEW_SCORE),2) AS SCORE
FROM REST_REVIEW a
INNER JOIN REST_INFO b ON a.REST_ID = b.REST_ID
GROUP BY a.REST_ID
HAVING b.ADDRESS LIKE '서울%'
ORDER BY SCORE DESC, b.FAVORITES DESC
```

인기 있는 아이스크림

![](__MEDIA__/492d43982c097d9f97273fa042b921891ce567cf467096fc4f2d2bf04e30379c.png)

프로그래머스 코딩테스트

문제가 너무 쉬워서 접근 방법은 생략하겠습니다.

정답 

```
SELECT FLAVOR FROM FIRST_HALF
ORDER BY TOTAL_ORDER DESC, SHIPMENT_ID ASC
```

문제 : 3월에 태어난 여성 회원 목록 출력하기

![](__MEDIA__/809dd7d15e9201f470d24c3dd85ca4b8aa8bc840f9e3d5bd8929ae9a36dd006f.png)

프로그래머스 코딩테스트

접근방법 

*   프로그래머스 에서는 날짜 형식을 보통 2000-00-00 이런식으로 출력하는게 대부분이라 날짜 포맷을 알고 있는게 중요함 DATE\_FORMAT (DATE칼럼,'%Y-%m-%d')
*   NULL인 경우에는 출력 대상에서 제외 시켜야하므로 IS NOT NULL 로 NULL 값을 제외하는 옵션 추가

정답 

```
SELECT MEMBER_ID,MEMBER_NAME,GENDER,DATE_FORMAT(DATE_OF_BIRTH,'%Y-%m-%d') AS DATE_OF_BIRTH
FROM MEMBER_PROFILE 
WHERE DATE_FORMAT(DATE_OF_BIRTH,'%m') = '03' AND GENDER = 'W' AND TLNO IS NOT NULL 
ORDER BY MEMBER_ID ASC
```