---
title: "[MySQL] View란?"
date: "2026-04-15T01:49:27.000Z"
category: "Database | SQL | OS/MySQL | Maria"
source: "https://hyungyun.tistory.com/entry/MySQL-View%EB%9E%80"
description: "오늘은 Database 에서 유용하게 많이 사용되는 가상 테이블인 View에 대해서 공부하고 정리해보려고 합니다. View의 목적, 특징, 장단점을 살펴보고 실무적으로도 활용이 가능한 활용 방안에 대해서도 공부 해보겠습니다. 개요 V"
---

오늘은 Database 에서 유용하게 많이 사용되는 가상 테이블인 View에 대해서 공부하고 정리해보려고 합니다.

View의 목적, 특징, 장단점을 살펴보고 실무적으로도 활용이 가능한 활용 방안에 대해서도 공부 해보겠습니다.

### 개요

View는 하나 이상의 기본 테이블로부터 유도된 가상 테이블(Virtual Table) 로, 물리적으로 데이터를 저장하지 않고 실행 시점에 SQL 쿼리를 통해 데이터를 보여주는 역할을 합니다.

뷰는 일반적으로 단순 뷰 (Simple View), 복합 뷰 (Complex View), 인라인 뷰 (Inline View) , 구체화 된 뷰 (Materialized View)의  4가지로 정의할 수 있으며 시스템에서 요청하는 정보나, 필요에 따라서 사용 방법이 조금씩 다릅니다.

### View의 특징

View의 주요 특징은 3가지로 정리할 수 있습니다. 가상성, 독립성, 재사용성으로 정의할 수 있으며 각각의 정의는 아래와 같습니다.

*   가상성  
    \- 뷰는 디스크에 실제 데이터를 물리적으로 복사해서 쌓아두지 않는다.  
    \- 데이터베이스의 'SQL 쿼리 문장' 그 자체만의 텍스트 형태로 저장된다.  
    \- 사용자가 뷰를 호출하는 그 순간에 내장된 쿼리가 실행되어 원본 테이블로부터 실시간 데이터를 조회해서 화면에 보여준다.
*   독립성  
    \- 원본 테이블의 스키마가 변경 되더도 뷰의 정의만 수정하면 뷰를 기반으로 하는 애플리케이션이나, 쿼리를 수정할 필요가 없다.
*   재사용성 및 단순화  
    \- 복잡한 쿼리를 단순화하여, 단순 SELECT 만으로 쿼리 가독성을 향상시킨다.  
    \- 조회해야하는 테이블이나, 조건이 변경되더라도 뷰의 쿼리 문장만을 재생성하여 사용한다.

이러한 3가지 특징들을 바탕으로 뷰는 보안 관제 및 권한을 통제할 수 있고, 복잡성을 은닉해 가독성을 확보할 수 있으며, 일관된 규칙속에서 중앙 통제하여 재사용성을 극대화 할 수 있습니다.

### View의 종류

뷰는 총 4가지 종류로 이루어져 있으며, 각각 단순 뷰, 복합 뷰, 인라인 뷰, 구체화 된 뷰로 설명됩니다. 아래는 각각 뷰의 특징과

예제입니다. 

단순 뷰 (Simple View)

*   가장 기본적인 뷰의 형태로, 하나의 원본 테이블과 1:1 관계를 유지하는 뷰
*   뷰를 조회하는 쿼리가 수행되면 뷰에 정의되어 있는 SQL 구문을 실행합니다.
*   함수나 연산식을 포함하지 않으며, 상황에 따라서 DML (SELECT/UPDATE/INSERT/DELETE) 수행이 가능합니다.

```
CREATE OR REPLACE VIEW v_dev_team_basic AS
SELECT 
    emp_id, 
    name, 
    status
FROM employees
WHERE dept_id = 20;
```

복합 뷰 (Complex View) 

*   두 개 이상의 테이블을 조인 (Join) 하거나, 함수를 사용하여 생성하는 뷰
*   구조가 복잡하여 일반적으로 읽기 전용으로 사용되고 DML 수행에 제약이 존재합니다.

```
CREATE VIEW v_emp_dept_summary AS
SELECT 
    e.employee_id, 
    e.first_name, 
    d.department_name,
    (SELECT AVG(salary) FROM employees WHERE department_id = e.department_id) AS dept_avg_salary
FROM employees e
JOIN departments d ON e.department_id = d.department_id;
```

인라인 뷰 (Inline View)

*   데이터베이스 객체로 저장되는 것이 아닌, SQL 구문의 From 절 내부에서 서브쿼리 형태로 존재하는 일회성 뷰
*   인라인 뷰 안에 너무 많은 데이터를 출력하면 메모리 사용량이 증가해 전체적인 성능이 저하되므로 효율적인 조건절을 활용해 내부 데이터를 최소화 시키는 것이 중요합니다.
*   전체 데이터에서 순위를 매긴뒤, 특정 순위만을 불러올 때 자주 사용하는 뷰입니다. 

```
SELECT e.first_name, e.salary, max_sal_table.max_s
FROM employees e
JOIN (
    SELECT department_id, MAX(salary) AS max_s
    FROM employees
    GROUP BY department_id
) AS max_sal_table ON e.department_id = max_sal_table.department_id;
```

구체화 된 뷰 (Materialized View) 

*   결과를 물리적으로 저장하여 성능을 높이는 특수한 뷰 (MySQL 에서는 지원하지 않고 Oracle, PostgreSQL 에서 지원함)
*   쿼리 결과를 실제 디스크에 물리적으로 저장하는 뷰로 대량의 데이터를 매번 계산하기 어려울 때 성능 향상을 위해서 사용

```
CREATE MATERIALIZED VIEW mv_sales_summary
BUILD IMMEDIATE                  
REFRESH COMPLETE ON DEMAND       
AS
SELECT 
    product_id, 
    SUM(amount) AS total_sales,
    COUNT(*) AS sell_count
FROM sales
GROUP BY product_id;
```

### View의 장/단점

View의 장점

*   보안성 : 민감한 정보가 있는 테이블에 접근하는 접근 권한을 Revoke 하고 명시적으로 설정된 SELECT 쿼리만을 조회하도록 View를 생성하여 민감한 정보에 대한 접근을 차단, 보안성을 강화한다.
*   가독성 : 복잡한 Join이나, 함수 연산등에 대한 쿼리 정보를 View를 활용하여 은닉시키고, SELECT View를 활용하여 쿼리 가독성을 증대시킬 수 있다.
*   일관성 : 시스템의 조회 조건을 View로 중앙화하여, Join 이나 조회 조건이 변경이 필요한 경우 소스 코드의 변경 없이 View 의 조회 조건을 변경하여 시스템 일관성을 증대시킨다.

View 의 단점

*   기본 테이블의 구조가 변경되면, 그 테이블을 참조하는 뷰가 깨져 재생성 해주어야 하는 번거로움이 존재한다.
*   겉보기에는 일반적인 SELECT 쿼리이지만, 실제로는 소스 테이블의 조회하는 쿼리이기에 성능적인 부분에서 확인이 어렵다.
*   일반적인 뷰의 경우 독립적인 인덱스의 생성이 불가능하여 성능 개선점을 파악하기 어렵다.
*   소스 테이블에서의 변경이 이루어지지 않으면 특정 상황을 제외하고는 DML 사용이 제한된다.

### 마무리

이렇게 View의 특징과 종류, 장단점에 대해서 공부해보았습니다. 실무적으로는 보안 목적이나, 가독성 측면, 업무 규칙에서 일관성이 필요한 경우에 많이 사용합니다. 하지만 성능에서의 제한사항도 분명하게 존재하기 사용할 때에 주의가 필요합니다.