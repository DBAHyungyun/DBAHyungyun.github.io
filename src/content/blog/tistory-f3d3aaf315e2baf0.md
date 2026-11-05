---
title: "SQL 프로그래머스 코딩테스트 대비 공부 - 6"
date: "2025-07-14T01:46:37.000Z"
category: "Database | SQL | OS/SQL 개발공부"
source: "https://hyungyun.tistory.com/entry/SQL-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%A8%B8%EC%8A%A4-%EC%BD%94%EB%94%A9%ED%85%8C%EC%8A%A4%ED%8A%B8-%EB%8C%80%EB%B9%84-%EA%B3%B5%EB%B6%80-6"
description: "특정 조건을 만족하는 물고기 별 수와 최대 길이 구하기 프로그래머스 코딩테스트 고려할 점 FISH_TYPE 별 평균 길이를 구하고, 33cm 이상인 것들만 COUNT NULL 값의 경우 (10cm) 이하의 경우는 10으로 치환해서 계"
---

특정 조건을 만족하는 물고기 별 수와 최대 길이 구하기 

![](__MEDIA__/09c5c532728bd84d7639867774bba79ab751a4d68f3f543107c8373b4d2d7726.png)

프로그래머스 코딩테스트

고려할 점

*   FISH\_TYPE 별 평균 길이를 구하고, 33cm 이상인 것들만 COUNT
*   NULL 값의 경우 (10cm) 이하의 경우는 10으로 치환해서 계산

기억할 점

*   HAVING 절 이후 집계 함수 사용 기억

```
-- 코드를 작성해주세요
SELECT COUNT(*) AS FISH_COUNT, MAX(IFNULL(LENGTH,10)) MAX_LENGTH, FISH_TYPE
FROM FISH_INFO
GROUP BY FISH_TYPE
HAVING AVG(IFNULL(LENGTH,10)) >= 33
ORDER BY FISH_TYPE ASC
```

물고기 종류 별 대어 찾기

![](__MEDIA__/c9868045686bb02fe0e379f408320c3cba6c46ed9930c4e2e01fd54481778a3c.png)

SQL 프로그래머스

고려할 점 

*   물고기 종류 별 가장 큰 물고기를 구하기 위해 서브쿼리로 MAX 값에 대한 LENGTH 비

제출한 답 

```
SELECT A.ID,B.FISH_NAME,A.LENGTH FROM FISH_INFO A
INNER JOIN FISH_NAME_INFO B
ON A.FISH_TYPE = B.FISH_TYPE
WHERE A.LENGTH = (SELECT MAX(A.LENGTH)
                 FROM FISH_INFO A
                 WHERE A.FISH_TYPE = B.FISH_TYPE)
ORDER BY A.ID ASC
```

답을 제출하고 더 생각해봤는데, 이렇게 되면 FISH\_TYPE 별로 MAX(LENGTH) 를 비교하는게 아닌 것 같았다. 다른사람들의 블로그와 GPT를 활용하여 다른 답을 고민했는데, 조건절에 FISH\_TYPE 을 넣어주고 IN  조건으로 함께 비교하게 된다면 FISH\_TYPE 별로 MAX(LENGTH)를 비교 할 수 있을 것 같았다.

다시 제출한 답

```
SELECT A.ID,B.FISH_NAME,A.LENGTH
FROM FISH_INFO A
INNER JOIN FISH_NAME_INFO B
ON A.FISH_TYPE = B.FISH_TYPE
WHERE (A.LENGTH,A.FISH_TYPE) IN (SELECT MAX(A.LENGTH),A.FISH_TYPE
              FROM FISH_INFO A
                 WHERE A.FISH_TYPE = B.FISH_TYPE) 
              ORDER BY A.ID ASC
```

카테고리 별 도서 판매량 집계하기

![](__MEDIA__/b46b92a711f4a347e2832414250e7b1227ff502b0902ab8ce6d92729b11fcab3.png)

프로그래머스 코딩테스트

고려한 점

*   BOOK\_SALES 테이블의 판매량을 조회하기 위해선 BOOK 테이블과 BOOK\_SALES을 INNER JOIN 으로 묶어줘야함
*   조회된 결과인 BOOK\_SALES 테이블의 결과로 날짜별 판매량의 정보에서 WHERE 조건으로 필터링

제출한 코드

```
SELECT A.CATEGORY,SUM(SALES) AS TOTAL_SALES FROM BOOK A
INNER JOIN BOOK_SALES B
ON A.BOOK_ID = B.BOOK_ID
WHERE DATE_FORMAT(B.SALES_DATE,'%Y-%m') = '2022-01'
GROUP BY A.CATEGORY
ORDER BY A.CATEGORY ASC
```