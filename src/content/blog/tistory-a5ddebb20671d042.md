---
title: "SQL 프로그래머스 코딩테스트 대비 공부 - 7"
date: "2025-07-15T00:04:05.000Z"
category: "Database | SQL | OS/SQL 개발공부"
source: "https://hyungyun.tistory.com/entry/SQL-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%A8%B8%EC%8A%A4-%EC%BD%94%EB%94%A9%ED%85%8C%EC%8A%A4%ED%8A%B8-%EB%8C%80%EB%B9%84-%EA%B3%B5%EB%B6%80-7"
description: "언어별 개발자 분류하기 프로그래머스 코딩테스트 고려한 점 CASE ~WHEN 조건으로 각각의 비교값에 대한 결과 출력 비트연산자를 활용하여 원하는 조건값을 비교 HAVING 절을 활용하여 ALIAS 지정된, 조건이 맞는 집계된 데이터"
---

언어별 개발자 분류하기

![](__MEDIA__/0a200b019b17bdcced697fd5b3c1e6fcce9c04398ecb3e0882dda25d8bb0e27b.png)

프로그래머스 코딩테스트

고려한 점

*   CASE ~WHEN 조건으로 각각의 비교값에 대한 결과 출력
*   비트연산자를 활용하여 원하는 조건값을 비교
*   HAVING 절을 활용하여 ALIAS 지정된, 조건이 맞는 집계된 데이터에서 조건을 적용함

아쉬운 점

*   CASE ~ WHEN 함수에 대한 미숙함
*   WHERE 의 경우에는 ALIAS 사용 및 집계 된 데이터에 한해서 적용이 불가능하지만, 최초에 WHERE 로 쿼리 작성 이후 다른분의 블로그 참고하여 HAVING 으로 변경
*   성능상으로 비효율적이라 판단하여 다른 블로그 및 GPT 활용 

제출한 정답

```
-- 코드를 작성해주세요
SELECT (CASE 
WHEN (SKILL_CODE & (SELECT SUM(CODE) FROM SKILLCODES WHERE CATEGORY LIKE 'Front%'))
AND (SKILL_CODE & (SELECT CODE FROM SKILLCODES WHERE NAME = 'Python')) THEN 'A'
WHEN SKILL_CODE & (SELECT CODE FROM SKILLCODES WHERE NAME ='C#') THEN 'B'
WHEN SKILL_CODE & (SELECT SUM(CODE) FROM SKILLCODES WHERE CATEGORY like 'Front%') THEN 'C'
ELSE NULL 
END) AS GRADE, ID, EMAIL
FROM DEVELOPERS A
HAVING GRADE IS NOT NULL
ORDER BY GRADE ASC , ID
```

GPT가 제안한 성능적으로 괜찮은 수준의 쿼리

*   서브쿼리에 대한 심도 깊은 이해 필요
*   인라인뷰를 활용하여 가공된 데이터 안에서의 조회 필요

```
SELECT
  CASE
    WHEN (d.SKILL_CODE & fe_code) > 0 AND (d.SKILL_CODE & py_code) > 0 THEN 'A' -- 비트연산 fe_code와 파이썬 스킬을 가진여부 체크 
    WHEN (d.SKILL_CODE & cs_code) > 0 THEN 'B'
    WHEN (d.SKILL_CODE & fe_code) > 0 THEN 'C'
  END AS GRADE,
  d.ID,
  d.EMAIL
FROM
  DEVELOPERS d,
  (SELECT 
     SUM(CASE WHEN CATEGORY = 'Front End' THEN CODE ELSE 0 END) AS fe_code, -- Category가 Front End 인 비트연산
     MAX(CASE WHEN NAME = 'Python' THEN CODE ELSE 0 END) AS py_code,
     MAX(CASE WHEN NAME = 'C#' THEN CODE ELSE 0 END) AS cs_code
   FROM SKILLCODES
  ) sc
WHERE
  (d.SKILL_CODE & fe_code) > 0
  OR (d.SKILL_CODE & py_code) > 0
  OR (d.SKILL_CODE & cs_code) > 0
ORDER BY
  GRADE ASC, ID ASC;
```

가격대 별 상품 개수 구하기

![](__MEDIA__/0264efb67b0e8fb37c5c51f1ee10f71b14d8bb5ea36a410794e1ce1d78ddf26f.png)

프로그래머스 코딩테스트

고려한 점

*   만원 단위의 가격대 별로 상품의 개수를 출력해야 하기 때문에, 만원 아래의 자리 숫자는 버림
*   이후 가격대별로 GROUP BY 진행

제출한 정답

```
SELECT TRUNCATE(PRICE,-4) AS PRICE_GROUP, COUNT(PRODUCT_ID) AS PRODUCTS 
FROM PRODUCT
GROUP BY PRICE_GROUP
ORDER BY PRICE_GROUP ASC
```

조건에 맞는 사원 정보 조회하기

![](__MEDIA__/d860df41a085beb8085ae40410f1364b801a43d0df8a7d930ee31421ac23366a.png)

프로그래머스 문제

고려할 점

*   실제 사용하는 테이블은 HR\_EMPLOYEES, HR\_GRADE 테이블만 사용
*   그룹화 된 HAVING 조건에서 서브쿼리를 활용하여 가장 SCORE 가 높은 값 출력

쿼리를 작성하며, 실제로 성능과는 거리가 멀 수도 있다는 생각이 들었다. GROUP BY 안의 조건을 지정해줄때에도 연산이 다수 들어가서 성능적으로는 아쉬운 쿼리라는 생각이 든다.

제출한 정답

```
-- 코드를 작성해주세요
SELECT SUM(B.SCORE) AS SCORE,B.EMP_NO,A.EMP_NAME,A.POSITION,A.EMAIL
FROM HR_EMPLOYEES A
INNER JOIN HR_GRADE B
ON A.EMP_NO = B.EMP_NO
GROUP BY B.EMP_NO
HAVING SCORE = (SELECT SUM(B.SCORE)
                FROM HR_GRADE B
                GROUP BY B.EMP_NO
                ORDER BY SUM(B.SCORE) DESC
                LIMIT 1)
```