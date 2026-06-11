from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from database import get_db, xp_for_next_level, seed_user_data
from deps import get_user_id

router = APIRouter(tags=["character"])

class CharacterInput(BaseModel):
    name: str
    class_name: str

CLASS_EMOJIS = {
    "Adventurer": "⚔️",
    "Scholar": "📚",
    "Warrior": "🛡️",
    "Mage": "🧙",
    "Rogue": "🗡️",
    "Ranger": "🏹",
    "Fairy": "🧚",
    "Enchantress": "🔮",
    "Princess": "👑",
    "Witch": "🧙‍♀️",
    "Healer": "💊",
}

CLASS_STATS = {
    "Adventurer": {"strength": 5, "endurance": 5, "focus": 5, "agility": 5, "luck": 5},
    "Scholar":    {"strength": 3, "endurance": 4, "focus": 9, "agility": 5, "luck": 4},
    "Warrior":    {"strength": 9, "endurance": 8, "focus": 4, "agility": 4, "luck": 3},
    "Mage":       {"strength": 3, "endurance": 3, "focus": 10, "agility": 6, "luck": 6},
    "Rogue":      {"strength": 6, "endurance": 5, "focus": 6, "agility": 9, "luck": 5},
    "Ranger":     {"strength": 5, "endurance": 6, "focus": 6, "agility": 8, "luck": 7},
    "Fairy":      {"strength": 4, "endurance": 4, "focus": 7, "agility": 8, "luck": 9},
    "Enchantress": {"strength": 3, "endurance": 3, "focus": 10, "agility": 6, "luck": 8},
    "Princess":   {"strength": 5, "endurance": 5, "focus": 6, "agility": 6, "luck": 8},
    "Witch":      {"strength": 4, "endurance": 4, "focus": 9, "agility": 7, "luck": 6},
    "Healer":     {"strength": 4, "endurance": 7, "focus": 8, "agility": 5, "luck": 6},
}

@router.get("/character")
def get_character(user_id: str = Depends(get_user_id)):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM character WHERE user_id = ?", (user_id,)
    ).fetchone()
    conn.close()
    if not row:
        return None
    return dict(row)

@router.post("/character", status_code=201)
def create_character(data: CharacterInput, user_id: str = Depends(get_user_id)):
    stats = CLASS_STATS.get(data.class_name, CLASS_STATS["Adventurer"])
    emoji = CLASS_EMOJIS.get(data.class_name, "🧚")
    conn = get_db()
    conn.execute("DELETE FROM character WHERE user_id = ?", (user_id,))
    conn.execute("""
        INSERT INTO character (user_id, name, class_name, level, xp, xp_to_next_level,
            strength, endurance, focus, agility, luck, avatar_emoji,
            total_tasks_completed, total_xp_earned, streak_days)
        VALUES (?, ?, ?, 1, 0, 100, ?, ?, ?, ?, ?, ?, 0, 0, 0)
    """, (user_id, data.name, data.class_name, stats["strength"], stats["endurance"],
          stats["focus"], stats["agility"], stats["luck"], emoji))
    conn.commit()
    row = conn.execute(
        "SELECT * FROM character WHERE user_id = ?", (user_id,)
    ).fetchone()
    conn.close()
    # Seed starter tasks, quests and boss for this new user
    seed_user_data(user_id)
    return dict(row)

@router.get("/character/stats")
def get_character_stats(user_id: str = Depends(get_user_id)):
    conn = get_db()
    char = conn.execute(
        "SELECT * FROM character WHERE user_id = ?", (user_id,)
    ).fetchone()
    tasks = conn.execute("""
        SELECT priority, COUNT(*) as cnt FROM tasks
        WHERE user_id = ? AND completed = 1 GROUP BY priority
    """, (user_id,)).fetchall()
    bosses_defeated = conn.execute(
        "SELECT COUNT(*) FROM bosses WHERE user_id = ? AND defeated = 1", (user_id,)
    ).fetchone()[0]
    daily_done = conn.execute(
        "SELECT COUNT(*) FROM daily_quests WHERE user_id = ? AND completed = 1", (user_id,)
    ).fetchone()[0]
    conn.close()

    by_priority = {"low": 0, "medium": 0, "high": 0, "legendary": 0}
    for row in tasks:
        by_priority[row["priority"]] = row["cnt"]

    streak = char["streak_days"] if char else 0
    total_tasks = char["total_tasks_completed"] if char else 0
    total_xp = char["total_xp_earned"] if char else 0

    return {
        "total_tasks_completed": total_tasks,
        "total_xp_earned": total_xp,
        "streak_days": streak,
        "tasks_by_priority": by_priority,
        "bosses_defeated": bosses_defeated,
        "daily_quests_completed": daily_done,
    }
