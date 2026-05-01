# Combat Strategy Reference

전투 시 이 문서를 참조해 클래스별 최적 스킬 순서와 상황별 대응을 결정합니다.

## 클래스별 스킬 우선순위

`get_skill_tree` 결과를 확인 후 아래 우선순위 적용.

### Fighter
1. **Power Strike** — 적 HP > 50%일 때 고데미지
2. **Shield Bash** — 다수 적 조우 시 (스턴 효과)
3. **Basic Attack** — 쿨다운 중 폴백

### Ranger
1. **Aimed Shot** — 단일 고데미지 (항상 우선)
2. **Multi-Shot** — 적 2마리 이상일 때
3. **Basic Attack** — 폴백

### Cleric
1. **Sacred Flame** — 데미지 + 자가 회복 (HP < 70%면 최우선)
2. **Divine Strike** — HP 충분할 때 공격 위주
3. **Heal** — HP < 50% 긴급 회복

### Wizard
1. **Fireball** — 적 그룹 공격 (2마리 이상)
2. **Magic Missile** — 단일 신뢰 데미지
3. **Basic Attack** — 마나 소진 시 폴백

### Bard
1. **Inspiring Melody** — 전투 시작 시 버프 선행
2. **Dissonant Whispers** — 버프 후 공포 디버프
3. **Vicious Mockery** — 기본 폴백

### Thief
1. **Backstab** — 디버프/스턴 직후 반드시 사용
2. **Evasion** — 적이 강공격 예고 시
3. **Pickpocket** — 비전투 탐험 중 추가 골드

### Paladin
1. **Divine Smite** — 고데미지 버스트 (HP > 60%일 때)
2. **Lay on Hands** — 긴급 자가 회복 (HP < 40%)
3. **Holy Strike** — 기본 데미지

### Druid
1. **Entangle** — 전투 시작 즉시 (군중 제어)
2. **Wild Shape → Shred** — Entangle 후 추가 데미지
3. **Healing Spell** — HP < 60%

## 상태이상 대응

| 상태이상 | 대응 |
|----------|------|
| 중독(Poisoned) | 해독제 있으면 즉시 사용; 없으면 빠른 처치 우선 |
| 기절(Stunned) — 내가 적에게 | 이 턴 최강 스킬 사용 (적이 무방비) |
| 약화(Weakened) — 적에게 | 올인 공격 (추가 데미지 적용 중) |
| 화상(Burned) | 평상시 플레이 (크게 영향 없음) |
| 공포(Feared) — 내가 | 이동 제한, 기본 공격만 가능 → 이번 턴 방어 |

## 보스전 프로토콜

1. **개전**: 최강 스킬 즉시 사용
2. **중반** (보스 HP 50-30%): 내 HP < 60%면 방어 자세로 전환
3. **분노** (보스 HP < 20%): 내 HP 무관 올인 공격
4. **긴급 후퇴**: 내 HP < 20% → 즉시 후퇴 (살아서 재도전)

## 후퇴 결정 트리

```
내 HP < 20%? → YES → 즉시 후퇴
내 HP < 30% + 회복 아이템 없음? → YES → 후퇴
적이 명백히 강함 (레벨 3단계 이상 차)? → YES → 후퇴
위 모두 NO → 계속 전투
```
