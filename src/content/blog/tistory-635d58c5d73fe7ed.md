---
title: "SQL 프로그래머스 코딩테스트 공부 - 8"
date: "2025-07-16T01:01:00.000Z"
category: "Database | SQL | OS/SQL 개발공부"
source: "https://hyungyun.tistory.com/entry/SQL-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%A8%B8%EC%8A%A4-%EC%BD%94%EB%94%A9%ED%85%8C%EC%8A%A4%ED%8A%B8-%EA%B3%B5%EB%B6%80-8"
description: "조건에 맞는 사용자와 총 거래금액 조회하기 프로그래머스 코딩테스트 고려한 점 2개의 테이블에서 동일한 컬럼명을 가진 컬럼이 없지만, 내용이 같은 컬럼 확인 GROUP BY 로 그룹화 된 컬럼에서 HAVING 으로 조건을 부여하여 TO"
---

조건에 맞는 사용자와 총 거래금액 조회하기 

![](__MEDIA__/42da90bb75c2bf8ecdf1352067187a6ee52ec8e6711ef4ecdf469ef260b7f2f5.png)

프로그래머스 코딩테스트

고려한 점

*   2개의 테이블에서 동일한 컬럼명을 가진 컬럼이 없지만, 내용이 같은 컬럼 확인
*   GROUP BY 로 그룹화 된 컬럼에서 HAVING 으로 조건을 부여하여 TOTAL\_PRICE 구함

제출한 쿼리

```
-- 코드를 입력하세요
SELECT A.USER_ID, A.NICKNAME,SUM(PRICE) AS TOTAL_PRICE
FROM USED_GOODS_USER  A
INNER JOIN USED_GOODS_BOARD B
ON A.USER_ID = B.WRITER_ID
WHERE B.STATUS = 'DONE'
GROUP BY A.USER_ID
HAVING TOTAL_PRICE >= 700000
ORDER BY TOTAL_PRICE ASC
```

저자 별 카테고리 별 매출액 집계하기

![](__MEDIA__/83a8b1cf96c85ba1489fc1f16afbd98d7627cf66c03f7ee01fa88935ae58560a.png)

프로그래머스 코딩테스트

고려할 점

*   테이블이 3개라 INNER JOIN 을 3번 진행하는 것
*   저자 별, 카테고리 별 매출액을 입력해야 하므로 GROUP BY 에 컬럼을 2개 기입해주어야함

제출한 쿼리

```
-- 코드를 입력하세요
SELECT A.AUTHOR_ID,B.AUTHOR_NAME,A.CATEGORY,SUM(C.SALES*A.PRICE) AS TOTAL_SALES
FROM BOOK A
INNER JOIN AUTHOR B
ON A.AUTHOR_ID = B.AUTHOR_ID
INNER JOIN BOOK_SALES C
ON A.BOOK_ID = C.BOOK_ID
WHERE DATE_FORMAT(C.SALES_DATE,'%Y-%m') = '2022-01'
GROUP BY B.AUTHOR_NAME,A.CATEGORY
ORDER BY A.AUTHOR_ID ASC, A.CATEGORY DESC
```

자동차 대여 기록에서 대여중 / 대여 가능 여부 구분하기

![](__MEDIA__/aeee194961ad7bd8dbe7e44e12b649afd369341aa88eb081cbdf24f900d90d1e.png)

프로그래머스 코딩테스트

고려할 점

*   2022년 10월 16일을 기준으로 해당되면 대여중, 해당되지 않으면 대여 가능으로 표현 CASE ~ WHEN 구문 사용
*   CASE WHEN에 서브쿼리를 활용하여 해당하는 조건에 모두 포함되는 값을 출력한다.

아쉬운 점 

*   CASE ~ WHEN 을 사용하면 조금 더 쉽게 풀었을텐데 처음에 DATEDIFF 를 사용하여 문제를 풀려고 했었다.
*   CASE ~ WHEN 구문에 대한 문법 숙지 및 특정 함수 문법에 대해서 조금 더 숙지 할 것

제출한 정답

```
-- 코드를 입력하세요
SELECT CAR_ID,
CASE WHEN CAR_ID IN (SELECT CAR_ID FROM CAR_RENTAL_COMPANY_RENTAL_HISTORY 
                    WHERE '2022-10-16' BETWEEN START_DATE AND END_DATE) THEN "대여중"
                    ELSE "대여 가능" END AS AVAILABILITY
FROM CAR_RENTAL_COMPANY_RENTAL_HISTORY 
GROUP BY CAR_ID
ORDER BY CAR_ID DESC
```