// Topic intent must match the title; incidental product mentions in the body
// cannot qualify an unrelated architecture article.
const rules={
 'aurora-upgrade':{gate:/upgrade|업그레이드|모니터링|cloudwatch|dms|복구/i,exclude:/mssql|sql server/i,terms:[[/upgrade|업그레이드/i,7],[/모니터링|cloudwatch/i,6],[/aurora|rds|mariadb|mysql/i,3],[/dms|cdc/i,3]]},
 'mariadb-migration':{gate:/dump|dumper|마이그레이션|migration|정합성|checksum|문자셋/i,terms:[[/dump|dumper/i,10],[/migration|마이그레이션/i,8],[/mariadb|maria|mysql/i,4],[/정합성|checksum|문자셋|utf8mb4/i,5]]},
 'sql-tuning':{gate:/index|인덱스|옵티마이저|optimizer|실행계획|쿼리 plan|logical i\/o/i,terms:[[/index|인덱스/i,8],[/옵티마이저|optimizer|실행계획|쿼리 plan/i,7],[/logical i\/o|블록/i,6],[/oracle|오라클|tibero/i,4]]},
 'siltron-tuning':{gate:/index|인덱스|옵티마이저|optimizer|실행계획|쿼리 plan|logical i\/o/i,terms:[[/index|인덱스/i,8],[/옵티마이저|optimizer|실행계획|쿼리 plan/i,7],[/logical i\/o/i,6]]},
 'global-monitoring':{gate:/sherpa|통합 모니터링|mssql.*(?:sql handle|query hash|시스템 프로시저)/i,terms:[[/sherpa|통합 모니터링/i,9],[/sql handle|query hash|시스템 프로시저/i,6],[/sql server|mssql|oracle|tibero/i,3]]},
 'quarterly-analysis':{gate:/파싱|옵티마이저|optimizer|쿼리 plan|logical i\/o|query hash|sql handle|slow query|튜닝/i,terms:[[/파싱|literal|bind|바인드/i,8],[/튜닝|쿼리 plan|옵티마이저/i,6],[/query hash|sql handle|slow query|logical i\/o/i,6]]},
 'monitoring-schema':{gate:/메타.*설계|스키마.*설계|schema design|데이터.*정합성|수집.*검증|mongodb.*모니터링/i,terms:[[/메타|스키마|schema/i,8],[/설계|정합성|검증|모니터링/i,7],[/mongodb|postgresql/i,2]]},
 'tta-consulting':{gate:/튜닝|인덱스|index|옵티마이저|failover|always on|이중화|쿼럼/i,terms:[[/튜닝|인덱스|index|옵티마이저/i,7],[/failover|always on|이중화|쿼럼/i,6]]},
 'dms-troubleshooting':{gate:/dms|cdc/i,terms:[[/dms|cdc/i,9],[/oom|memory|메모리|권한|latency|장애/i,8]]}
};
export function relatedPosts(project,posts,limit=3){
 const rule=rules[project.id];if(!rule)return [];
 return posts.flatMap(post=>{const title=post.data.title;if(!rule.gate.test(title)||rule.exclude?.test(title))return [];
 const body=(post.body||'').replace(/```[\s\S]*?```/g,'');
 const titleScore=rule.terms.reduce((n,[re,w])=>n+(re.test(title)?w:0),0);
 const bodyScore=rule.terms.reduce((n,[re])=>n+(re.test(body)?1:0),0);
 return titleScore>=6?[{post,score:titleScore+Math.min(bodyScore,3)}]:[];
 }).sort((a,b)=>b.score-a.score||b.post.data.date.localeCompare(a.post.data.date)||a.post.id.localeCompare(b.post.id)).slice(0,limit).map(x=>x.post);
}
