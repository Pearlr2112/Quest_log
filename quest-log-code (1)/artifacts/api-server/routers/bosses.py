from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from database import get_db, xp_for_next_level, boss_difficulty_to_xp
from deps import get_user_id

router = APIRouter(tags=["bosses"])

class BossInput(BaseModel):
    title: str
    description: Optional[str] = None
    difficulty: str = "normal"

class DamageInput(BaseModel):
    damage: int
    task_title: Optional[str] = None

BOSS_EMOJIS = {"normal": "👹", "hard": "🐉", "legendary": "💀"}
BOSS_HP = {"normal": 100, "hard": 250, "legendary": 500}

def boss_to_dict(row, conn):
    d = dict(row)
    d["defeated"] = bool(d["defeated"])
    tasks = conn.execute(
        "SELECT * FROM tasks WHERE boss_id = ? AND user_id = ?",
        (d["id"], d["user_id"])
    ).fetchall()
    d["tasks"] = [dict(t) for t in tasks]
    for t in d["tasks"]:
        t["completed"] = bool(t["completed"])
    return d

@router.get("/bosses")
def list_bosses(user_id: str = Depends(get_user_id)):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM bosses WHERE user_id = ? ORDER BY created_at DESC", (user_id,)
    ).fetchall()
    result = [boss_to_dict(r, conn) for r in rows]
    conn.close()
    return result

@router.post("/bosses", status_code=201)
def create_boss(data: BossInput, user_id: str = Depends(get_user_id)):
    max_hp = BOSS_HP.get(data.difficulty, 100)
    xp_reward = boss_difficulty_to_xp(data.difficulty, max_hp)
    emoji = BOSS_EMOJIS.get(data.difficulty, "👹")
    conn = get_db()
    cur = conn.execute("""
        INSERT INTO bosses (user_id, title, description, max_hp, current_hp, xp_reward,
            defeated, difficulty, emoji)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
    """, (user_id, data.title, data.description, max_hp, max_hp, xp_reward,
          data.difficulty, emoji))
    conn.commit()
    row = conn.execute("SELECT * FROM bosses WHERE id = ?", (cur.lastrowid,)).fetchone()
    result = boss_to_dict(row, conn)
    conn.close()
    return result

@router.get("/bosses/{id}")
def get_boss(id: int, user_id: str = Depends(get_user_id)):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM bosses WHERE id = ? AND user_id = ?", (id, user_id)
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Boss not found")
    result = boss_to_dict(row, conn)
    conn.close()
    return result

@router.delete("/bosses/{id}", status_code=204)
def delete_boss(id: int, user_id: str = Depends(get_user_id)):
    conn = get_db()
    conn.execute("DELETE FROM bosses WHERE id = ? AND user_id = ?", (id, user_id))
    conn.commit()
    conn.close()

@router.post("/bosses/{id}/damage")
def damage_boss(id: int, data: DamageInput, user_id: str = Depends(get_user_id)):
    conn = get_db()
    boss = conn.execute(
        "SELECT * FROM bosses WHERE id = ? AND user_id = ?", (id, user_id)
    ).fetchone()
    if not boss:
        conn.close()
        raise HTTPException(status_code=404, detail="Boss not found")
    if boss["defeated"]:
        conn.close()
        raise HTTPException(status_code=400, detail="Boss already defeated")

    new_hp = max(0, boss["current_hp"] - data.damage)
    defeated = new_hp == 0

    conn.execute(
        "UPDATE bosses SET current_hp = ?, defeated = ? WHERE id = ?",
        (new_hp, 1 if defeated else 0, id)
    )

    if defeated:
        xp_gained = boss["xp_reward"]
        char = conn.execute(
            "SELECT * FROM character WHERE user_id = ?", (user_id,)
        ).fetchone()
        if char:
            new_xp = char["xp"] + xp_gained
            new_total = char["total_xp_earned"] + xp_gained
            level_val = char["level"]
            xp_needed = char["xp_to_next_level"]
            while new_xp >= xp_needed:
                new_xp -= xp_needed
                level_val += 1
                xp_needed = xp_for_next_level(level_val)
            conn.execute("""
                UPDATE character SET xp = ?, xp_to_next_level = ?, level = ?, total_xp_earned = ?
                WHERE user_id = ?
            """, (new_xp, xp_for_next_level(level_val), level_val, new_total, user_id))

    if data.task_title:
        from database import priority_to_xp
        conn.execute("""
            INSERT INTO tasks (user_id, title, priority, xp_reward, boss_id, completed, created_at)
            VALUES (?, ?, 'medium', 75, ?, 1, datetime('now'))
        """, (user_id, data.task_title, id))

    conn.commit()
    row = conn.execute("SELECT * FROM bosses WHERE id = ?", (id,)).fetchone()
    result = boss_to_dict(row, conn)
    conn.close()
    return result
