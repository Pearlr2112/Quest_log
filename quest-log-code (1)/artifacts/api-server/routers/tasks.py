from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date, timedelta
from database import get_db, xp_for_next_level, priority_to_xp
from deps import get_user_id

router = APIRouter(tags=["tasks"])

class TaskInput(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    due_date: Optional[str] = None
    category: Optional[str] = None
    stat_bonus_type: Optional[str] = None
    stat_bonus_value: Optional[int] = None
    boss_id: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    category: Optional[str] = None
    completed: Optional[bool] = None

def task_to_dict(row):
    d = dict(row)
    d["completed"] = bool(d["completed"])
    return d

@router.get("/tasks")
def list_tasks(completed: Optional[bool] = None, priority: Optional[str] = None,
               user_id: str = Depends(get_user_id)):
    conn = get_db()
    query = "SELECT * FROM tasks WHERE user_id = ?"
    params = [user_id]
    if completed is not None:
        query += " AND completed = ?"
        params.append(1 if completed else 0)
    if priority:
        query += " AND priority = ?"
        params.append(priority)
    query += " ORDER BY created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [task_to_dict(r) for r in rows]

@router.post("/tasks", status_code=201)
def create_task(data: TaskInput, user_id: str = Depends(get_user_id)):
    xp = priority_to_xp(data.priority)
    conn = get_db()
    cur = conn.execute("""
        INSERT INTO tasks (user_id, title, description, priority, xp_reward, stat_bonus_type,
            stat_bonus_value, due_date, category, boss_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    """, (user_id, data.title, data.description, data.priority, xp, data.stat_bonus_type,
          data.stat_bonus_value, data.due_date, data.category, data.boss_id))
    conn.commit()
    row = conn.execute("SELECT * FROM tasks WHERE id = ?", (cur.lastrowid,)).fetchone()
    conn.close()
    return task_to_dict(row)

@router.get("/tasks/{id}")
def get_task(id: int, user_id: str = Depends(get_user_id)):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM tasks WHERE id = ? AND user_id = ?", (id, user_id)
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_to_dict(row)

@router.put("/tasks/{id}")
def update_task(id: int, data: TaskUpdate, user_id: str = Depends(get_user_id)):
    conn = get_db()
    existing = conn.execute(
        "SELECT * FROM tasks WHERE id = ? AND user_id = ?", (id, user_id)
    ).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")
    fields = data.model_dump(exclude_none=True)
    if not fields:
        conn.close()
        return task_to_dict(existing)
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values()) + [id, user_id]
    conn.execute(f"UPDATE tasks SET {set_clause} WHERE id = ? AND user_id = ?", values)
    conn.commit()
    row = conn.execute("SELECT * FROM tasks WHERE id = ?", (id,)).fetchone()
    conn.close()
    return task_to_dict(row)

@router.delete("/tasks/{id}", status_code=204)
def delete_task(id: int, user_id: str = Depends(get_user_id)):
    conn = get_db()
    conn.execute("DELETE FROM tasks WHERE id = ? AND user_id = ?", (id, user_id))
    conn.commit()
    conn.close()

@router.post("/tasks/{id}/complete")
def complete_task(id: int, user_id: str = Depends(get_user_id)):
    conn = get_db()
    task = conn.execute(
        "SELECT * FROM tasks WHERE id = ? AND user_id = ?", (id, user_id)
    ).fetchone()
    if not task:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")
    if task["completed"]:
        conn.close()
        raise HTTPException(status_code=400, detail="Task already completed")

    now = datetime.now().isoformat()
    conn.execute("UPDATE tasks SET completed = 1, completed_at = ? WHERE id = ?", (now, id))

    xp_gained = task["xp_reward"]
    stat_type = task["stat_bonus_type"]
    stat_val = task["stat_bonus_value"]

    char = conn.execute(
        "SELECT * FROM character WHERE user_id = ?", (user_id,)
    ).fetchone()
    leveled_up = False
    new_level = None

    if char:
        new_xp = char["xp"] + xp_gained
        new_total_xp = char["total_xp_earned"] + xp_gained
        new_tasks = char["total_tasks_completed"] + 1
        new_level_val = char["level"]
        xp_needed = char["xp_to_next_level"]

        while new_xp >= xp_needed:
            new_xp -= xp_needed
            new_level_val += 1
            leveled_up = True
            xp_needed = xp_for_next_level(new_level_val)

        new_level = new_level_val if leveled_up else None
        xp_to_next = xp_for_next_level(new_level_val)

        updates = {
            "xp": new_xp,
            "xp_to_next_level": xp_to_next,
            "level": new_level_val,
            "total_tasks_completed": new_tasks,
            "total_xp_earned": new_total_xp,
        }

        if stat_type and stat_val and stat_type in ("strength", "endurance", "focus", "agility", "luck"):
            updates[stat_type] = char[stat_type] + stat_val

        today = date.today().isoformat()
        last_date = char["last_completed_date"]
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        if last_date == yesterday:
            updates["streak_days"] = char["streak_days"] + 1
        elif last_date != today:
            updates["streak_days"] = 1
        updates["last_completed_date"] = today

        set_clause = ", ".join(f"{k} = ?" for k in updates)
        conn.execute(
            f"UPDATE character SET {set_clause} WHERE user_id = ?",
            list(updates.values()) + [user_id]
        )

    conn.commit()
    char_updated = conn.execute(
        "SELECT * FROM character WHERE user_id = ?", (user_id,)
    ).fetchone()
    task_updated = conn.execute("SELECT * FROM tasks WHERE id = ?", (id,)).fetchone()
    conn.close()

    return {
        "xp_gained": xp_gained,
        "leveled_up": leveled_up,
        "new_level": new_level,
        "stat_bonus_type": stat_type,
        "stat_bonus_value": stat_val,
        "character": dict(char_updated) if char_updated else {},
        "task_or_quest": task_to_dict(task_updated),
    }
