from fastapi import APIRouter, HTTPException, Depends
from datetime import date, datetime
from database import get_db, xp_for_next_level, ensure_daily_quests
from deps import get_user_id

router = APIRouter(tags=["daily"])

@router.get("/daily-quests")
def list_daily_quests(user_id: str = Depends(get_user_id)):
    today = date.today().isoformat()
    conn = get_db()
    ensure_daily_quests(conn, user_id, today)
    rows = conn.execute(
        "SELECT * FROM daily_quests WHERE user_id = ? AND quest_date = ?",
        (user_id, today)
    ).fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d["completed"] = bool(d["completed"])
        result.append(d)
    return result

@router.post("/daily-quests/{id}/complete")
def complete_daily_quest(id: int, user_id: str = Depends(get_user_id)):
    today = date.today().isoformat()
    conn = get_db()
    quest = conn.execute(
        "SELECT * FROM daily_quests WHERE id = ? AND user_id = ? AND quest_date = ?",
        (id, user_id, today)
    ).fetchone()
    if not quest:
        conn.close()
        raise HTTPException(status_code=404, detail="Daily quest not found")
    if quest["completed"]:
        conn.close()
        raise HTTPException(status_code=400, detail="Quest already completed")

    conn.execute("UPDATE daily_quests SET completed = 1 WHERE id = ?", (id,))

    xp_gained = quest["xp_reward"]
    char = conn.execute(
        "SELECT * FROM character WHERE user_id = ?", (user_id,)
    ).fetchone()
    leveled_up = False
    new_level = None

    if char:
        new_xp = char["xp"] + xp_gained
        new_total = char["total_xp_earned"] + xp_gained
        level_val = char["level"]
        xp_needed = char["xp_to_next_level"]

        while new_xp >= xp_needed:
            new_xp -= xp_needed
            level_val += 1
            leveled_up = True
            xp_needed = xp_for_next_level(level_val)

        new_level = level_val if leveled_up else None
        conn.execute("""
            UPDATE character SET xp = ?, xp_to_next_level = ?, level = ?, total_xp_earned = ?
            WHERE user_id = ?
        """, (new_xp, xp_for_next_level(level_val), level_val, new_total, user_id))

    conn.commit()
    char_updated = conn.execute(
        "SELECT * FROM character WHERE user_id = ?", (user_id,)
    ).fetchone()
    quest_updated = conn.execute("SELECT * FROM daily_quests WHERE id = ?", (id,)).fetchone()
    conn.close()

    q = dict(quest_updated)
    q["completed"] = bool(q["completed"])

    return {
        "xp_gained": xp_gained,
        "leveled_up": leveled_up,
        "new_level": new_level,
        "stat_bonus_type": None,
        "stat_bonus_value": None,
        "character": dict(char_updated) if char_updated else {},
        "task_or_quest": q,
    }
