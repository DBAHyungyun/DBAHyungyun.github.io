export const projects=[
{id:'aurora-upgrade',title:'Aurora MySQL Engine Upgrade',area:'Upgrade · Compatibility',questions:['Source / Target Engine Version과 업그레이드 경로','Deprecated 기능·Parameter·Known Issue 검토','사전 부하 기준과 업그레이드 후 회귀 검증','Snapshot 복구·접속 전환을 포함한 복구 전략']},
{id:'mariadb-migration',title:'KT Cloud → AWS RDS MariaDB Migration',area:'Migration · Data Validation',questions:['Source / Target 버전·Character Set 및 Collation 차이','Full Load·증분 반영·Cutover 범위','Row Count·Checksum 적용 범위와 정합성 근거','실제 중단시간과 되돌리기 기준']},
{id:'dms-troubleshooting',title:'AWS DMS CDC Latency / OOM 분석',area:'Troubleshooting · Replication',questions:['증상 발생 시점과 Source / Target / Task 지표','CDC Source Latency와 Target Latency 구분','메모리·대용량 Transaction·Task Log의 상관관계','조치 전후 비교와 재발 방지 근거']},
{id:'sql-tuning',title:'Oracle / Tibero SQL Performance Tuning',area:'Performance · Execution Plan',questions:['DB Version·SQL·Bind·통계정보 조건','Access Path·Cardinality·Join·Wait 분석','Index / SQL / Hint 변경 근거와 DML 부작용','동일 조건의 Elapsed Time·Logical I/O 비교']}
];
