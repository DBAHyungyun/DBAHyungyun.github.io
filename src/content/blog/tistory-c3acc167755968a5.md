---
title: "SQL 프로그래머스 코딩테스트 대비 공부 - 4"
date: "2025-07-11T23:00:33.000Z"
category: "Database | SQL | OS/SQL 개발공부"
source: "https://hyungyun.tistory.com/entry/SQL-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%A8%B8%EC%8A%A4-%EC%BD%94%EB%94%A9%ED%85%8C%EC%8A%A4%ED%8A%B8-%EB%8C%80%EB%B9%84-%EA%B3%B5%EB%B6%80-4"
description: "그룹별 조건에 맞는 식당 목록 출력하기 SQL 프로그래머스 코딩테스트 고려할점 MEMBER_PROFILE 과 REST_REVIEW 사이에 공통 컬럼인 MEMBER_ID 컬럼으로 INNER JOIN 리뷰를 가장 많이 작성한 회원의 리뷰"
---

그룹별 조건에 맞는 식당 목록 출력하기

![](__MEDIA__/5bdc2a3fcb40a18b91698979e1a83c4327ecd397baed6e53974cc86257bc47f1.png)

SQL 프로그래머스 코딩테스트

고려할점 

*   MEMBER\_PROFILE 과 REST\_REVIEW 사이에 공통 컬럼인 MEMBER\_ID 컬럼으로 INNER JOIN 
*   리뷰를 가장 많이 작성한 회원의 리뷰를 출력해야하므로, 서브쿼리를 사용하여 제일 많이 작성한 MEMBER\_ID 를 MEMBER\_PROFILE 의 MEMBER\_ID 와 비교해야함

아쉬운점

*   문제를 조금 더 꼼꼼히 읽어봐야함. 정답 작성시에 테이블 잘못 입력
*   ORDER BY 문을 수행할 시에 SELECT 하지 않은 컬럼도 가능하지만, ORDER BY 에 사용할 컬럼을 SELECT 로 자꾸 수행하려고 함 

제출한 정답 

```
-- 코드를 입력하세요
SELECT a.MEMBER_NAME, b.REVIEW_TEXT,DATE_FORMAT(b.REVIEW_DATE,'%Y-%m-%d') AS REVIEW_DATE
FROM MEMBER_PROFILE a
INNER JOIN REST_REVIEW b on a.MEMBER_ID = b.MEMBER_ID
WHERE a.MEMBER_ID =
(SELECT b.MEMBER_ID
 FROM REST_REVIEW b 
 GROUP BY b.MEMBER_ID
 ORDER BY COUNT(b.REVIEW_SCORE) DESC
 LIMIT 1)
ORDER BY b.REVIEW_DATE ASC, b.REVIEW_TEXT ASC
```

오랜 기간 보호한 동물 (1)

![](__MEDIA__/076346518b7e40b6952d7a62ef3579e9956fde3e1ea37e2b220cbda01301d5d7.png)

프로그래머스 SQL 코딩테스트

접근 방법

*   ANIMAL\_INS 와 ANIMAL\_OUTS 에서 공통된 컬럼인 ANIAML\_ID 로 LEFT OUTER JOIN 
*   LEFT OUTER JOIN 하게 되면, 입양되지 않은 동물의 경우 ANIMAL\_OUTS 의 DATETIME 값이 NULL 로 되어 있을 것이라 예상
*   ANIMAL\_OUTS 의 DATETIME 컬럼을 IS NULL 로 하여 답 출력

제출한 정답 

```
-- 코드를 입력하세요
SELECT A.NAME, A.DATETIME
FROM ANIMAL_INS A 
LEFT OUTER JOIN ANIMAL_OUTS B 
ON A.ANIMAL_ID = B.ANIMAL_ID
WHERE B.DATETIME IS NULL 
ORDER BY A.DATETIME ASC
LIMIT 3
```

보호소에서 중성화 한 동물

![](__MEDIA__/044273a8cec3d638158b51b08e0b73d2a4779c635790fb94401b8c3da9fedf78.png)

프로그래머스 SQL 튜닝

접근방법

*   ANIMAL\_INS 테이블과 ANIMAL\_OUTS 테이블의 공통 컬럼 ANIMAL\_ID 로 INNER JOIN 진행
*   조건절에서 ANIMAL\_INS의 SEX\_UPON\_INTAKE 값과 ANIMAL\_OUTS 의 SEX\_UPON\_OUTCOME 값을 비교 한 뒤 값 추출 

제출 정답 

```
-- 코드를 입력하세요
SELECT A.ANIMAL_ID, A.ANIMAL_TYPE,A.NAME
FROM ANIMAL_INS A
INNER JOIN ANIMAL_OUTS B ON A.ANIMAL_ID = B.ANIMAL_ID
WHERE A.SEX_UPON_INTAKE != B.SEX_UPON_OUTCOME
```