---
title: "SQL 프로그래머스 코딩테스트 대비 공부 - 3"
date: "2025-07-10T16:00:02.000Z"
category: "Database | SQL | OS/SQL 개발공부"
source: "https://hyungyun.tistory.com/entry/SQL-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%A8%B8%EC%8A%A4-%EC%BD%94%EB%94%A9%ED%85%8C%EC%8A%A4%ED%8A%B8-%EB%8C%80%EB%B9%84-%EA%B3%B5%EB%B6%80-3"
description: "입양 시각 구하기(1) 프로그래머스 코딩공부 고려한 점 시간대별로 입양 건수에 대한 COUNT 를 진행해야 하므로 HOUR(DATETIME) 시간별로 GROUP BY 연산 진행 -- 코드를 입력하세요 SELECT HOUR(DATETI"
---

입양 시각 구하기(1)

![](__MEDIA__/aa6f12821e8bdf803574b64dbade93bb37fc6309f1b1296f5a3f190bd98996c6.png)

프로그래머스 코딩공부

고려한 점

*   시간대별로 입양 건수에 대한 COUNT 를 진행해야 하므로 HOUR(DATETIME) 시간별로 GROUP BY 연산 진행

```
-- 코드를 입력하세요
SELECT HOUR(DATETIME) AS HOUR, COUNT(ANIMAL_ID) AS COUNT FROM ANIMAL_OUTS 
WHERE HOUR(DATETIME) BETWEEN 09 AND 19
GROUP BY HOUR(DATETIME)
ORDER BY HOUR(DATETIME) ASC
```

5월 식품들의 총매출 조회하기

![](__MEDIA__/500c8865160a551117bc6c6147c1bba7b760ae3b05239f2b295000327bc90191.png)

프로그래머스 코딩공부

접근방법 

*   우선 FOOD\_PRODUCT 테이블과 FOOD\_ORDER 테이블에서 공통으로 JOIN 가능한 PRODUCT\_ID 로 조인을 진행
*   식품 ID 와 식품 이름은 FOOD\_PRODUCT 테이블에서 조회해서 가져옴.
*   총 매출 = PRICE 와 AMOUNT 가격와 양을 곱한값이 총 매출이지만, 같은 PRODUCT\_ID 에 여러행이 있을 수 있으므로 계산된 값을 SUM으로 합치고 GROUP BY 로 그룹화 시켜줌

간과한 부분

*   총매출 구할 당시 A.PRICE \* B.AMOUNT 로만 쿼리를 작성하여 각 행의 총합을 구하지 않고 행 하나의 합만을 구했음.

정답코드 

```
-- 코드를 입력하세요
SELECT A.PRODUCT_ID,A.PRODUCT_NAME, SUM(A.PRICE*B.AMOUNT) AS TOTAL_SALES
FROM FOOD_PRODUCT A 
INNER JOIN FOOD_ORDER B ON A.PRODUCT_ID = B.PRODUCT_ID
WHERE DATE_FORMAT(B.PRODUCE_DATE,'%Y-%m') = '2022-05'
GROUP BY A.PRODUCT_ID
ORDER BY TOTAL_SALES DESC, A.PRODUCT_ID ASC
```

주문량이 많은 아이스크림들 조회하기

문제 

![](__MEDIA__/e34d6be96734aad6aeefd3920504bf7a020a738dc47b319b1c5cb9f68d8e80e2.png)

접근방법

*   상반기 아이스크림 주문량 + 7월 총 주문량의 합을 구해야 하는 문제로 공통의 맛을 가지는 FLAVOR 컬럼으로 JOIN 진행
*   이후, 그룹화를 통해 FLAVOR를 그룹화해주고 그룹핑된 TOTAL\_ORDER 를 더해주면서 LIMIT 3 으로 상위 3가지 맛을 출력함

정답코드

```
SELECT A.FLAVOR
    FROM JULY A INNER JOIN FIRST_HALF B
    ON A.FLAVOR = B.FLAVOR
    GROUP BY FLAVOR
    ORDER BY SUM(B.TOTAL_ORDER) DESC
    LIMIT 3;
```