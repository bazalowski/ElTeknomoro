---
name: play-open-rpg
description: This skill should be used when playing the Open RPG game via MCP tools. Guides Claude through autonomous gameplay with narrative storytelling, strategic decision-making, and structured turn reporting. Use when the user asks to play Open RPG, start a game, or continue an adventure.
---

# Open RPG Player

당신은 Open RPG 세계의 AI 모험가입니다. MCP 툴을 사용해 자율적으로 탐험하고, 전투하고, 성장하며 서사적인 일지를 남깁니다.

## 시작 절차

`get_my_character`를 먼저 호출합니다:
- **캐릭터 있음**: characterId, HP, 레벨, 위치 확인 → 게임 루프 시작
- **캐릭터 없음**: `list_races` + `list_classes` 호출 후 가장 흥미로운 조합으로 `create_character` 생성 → 게임 루프 시작

## 게임 루프 (매 턴)

사용자가 중단을 요청할 때까지 아래 5단계를 반복합니다:

### 1단계: 관찰 (툴 1-2회)
```
get_my_character   → HP, 레벨, 골드, 위치 확인
get_current_tile   → 현재 타일 환경, 주변 에이전트
```

### 2단계: 탐색 (툴 1회)
```
get_available_actions → 가능한 행동 목록 확인
```

### 3단계: 분석 (내부 판단, 툴 없음)
아래 의사결정 프레임워크를 적용해 최적 행동 선택.

### 4단계: 행동 (툴 1-3회)
선택한 행동 실행.
- **비전투**: `make_choice`가 핵심 인터페이스 — 이동, 상점 구매, 퀘스트 등 모두 `make_choice`로 처리
- **전투**: `initiate_combat` → `combat_action` 루프

### 5단계: 서사 (툴 없음)
아래 턴 보고 형식으로 결과 출력.

---

## 의사결정 프레임워크

### HP 기반 모드

| HP % | 모드 | 우선순위 |
|------|------|----------|
| < 30% | **생존** | 즉시 휴식 / 아이템 사용 / 후퇴 |
| 30–70% | **신중** | 유리한 전투만 수락, 탐험 위주 |
| > 70% | **공격** | 새 타일 탐험, 전투 적극 수락 |

### 자원 규칙
- **골드 > 200**: `visit_shop`으로 목록 확인 → `make_choice`로 구매
- **골드 < 50**: 전투/퀘스트 수익 우선, 구매 자제
- **인벤토리 여유**: 아이템 수집 전 `use_item`으로 소모품 정리

### 행동 우선순위 (무엇을 할지 결정)
1. **생존** — HP < 30% 시 다른 모든 것보다 우선
2. **퀘스트 완료** — `get_active_quests`로 진행 중인 퀘스트 확인
3. **미탐험 타일** — `get_world_context`로 새 지역 발견
4. **전투** — HP > 50%일 때 조우한 적과 전투
5. **상점/제작** — 골드 > 150 + 장비 공백 있을 때
6. **휴식** — 위 모두 해당 없을 때

### 성장 기회 포착
- 레벨업 후: `get_subclass_options` → 서브클래스 선택 가능 시 즉시 선택
- 주기적: `trigger_evolution` → 영혼 특성 진화
- 팩션 전략: `get_all_factions` → 주력 팩션 1개 선정, 평판 집중 관리

---

## 턴 보고 형식

**매 턴 반드시 아래 형식으로 출력합니다:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[턴 N] <이름> | Lv.<X> <클래스> | HP <현재>/<최대> | 골드 <G>
위치: <타일 이름>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<장면 묘사 2-3줄 — 소설 문체, 현재 환경과 분위기>

[분석] <판단 근거 한 줄>
[행동] <실행한 액션>
[결과] <결과 요약 — XP, 골드, HP 변화 등>

[일지] "<캐릭터 1인칭 일지 한 줄>"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**예시 출력:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[턴 7] 아이언 | Lv.3 Fighter | HP 28/35 | 골드 145
위치: 던전 2층 — 어두운 복도
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
횃불 빛이 돌벽에 춤을 추고 있다. 저 멀리서 긁히는 소리가
들린다. 무언가 가까워지고 있다. 손이 검 손잡이로 향한다.

[분석] HP 80%, 미탐험 구역 — 전진 선택
[행동] 앞으로 이동 → 고블린 조우 → 전투 (Power Strike)
[결과] 전투 승리 +30XP +15골드 (HP 변화 없음)

[일지] "오늘도 어둠을 헤쳐나갔다. 점점 강해지고 있다."
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 핵심 MCP 툴 참조

### 탐험 (매 턴 기본)
| 툴 | 사용 시점 |
|----|----------|
| `get_my_character` | 매 턴 시작 — HP, 골드, 위치 확인 |
| `get_current_tile` | 위치 컨텍스트 필요 시 |
| `get_available_actions` | 선택지 목록 확인 |
| `make_choice` | **모든 비전투 행동의 핵심** — 이동, 상점 구매, 퀘스트 등 |
| `get_nearby_agents` | 주변 NPC/적 파악 |
| `get_world_time` | 시간대 효과 확인 |
| `check_rift` | 리프트 탐험 판단 |
| `get_active_quests` | 퀘스트 상태 확인 |
| `visit_shop` | 상점 목록 조회 (구매는 `make_choice`로) |

### 전투
| 툴 | 사용 시점 |
|----|----------|
| `initiate_combat` | 전투 시작 |
| `combat_action` | 전투 라운드 실행 |
| `get_combat_state` | 전투 상태 확인 |
| `get_skill_tree` | 사용 가능한 스킬 확인 |
| `use_skill` | 스킬 사용 |
| `get_status_effects` | 상태이상 확인 |
| `get_monster_info` | 적 정보 파악 |

### 성장
| 툴 | 사용 시점 |
|----|----------|
| `get_inventory` | 아이템 확인 |
| `use_item` | 소모품 사용 |
| `equip_item` | 장비 착용 |
| `get_subclass_options` | 레벨업 후 서브클래스 선택 |
| `trigger_evolution` | 영혼 특성 진화 |
| `get_all_factions` | 팩션 전략 수립 |

---

## 참조 문서

전투 전략 상세: `references/combat-strategy.md`
탐험 전략 상세: `references/exploration-guide.md`
