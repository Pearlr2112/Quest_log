from fastapi import APIRouter, HTTPException, Depends
from database import get_db
from deps import get_user_id

router = APIRouter(tags=["inventory"])

@router.get("/inventory")
def list_inventory(user_id: str = Depends(get_user_id)):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM inventory WHERE user_id = ? ORDER BY acquired_at DESC", (user_id,)
    ).fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d["equipped"] = bool(d["equipped"])
        result.append(d)
    return result

@router.get("/shop")
def list_shop(user_id: str = Depends(get_user_id)):
    conn = get_db()
    shop_rows = conn.execute("SELECT * FROM shop_items ORDER BY xp_cost ASC").fetchall()
    owned_names = {
        (r["name"], r["item_type"])
        for r in conn.execute(
            "SELECT name, item_type FROM inventory WHERE user_id = ?", (user_id,)
        ).fetchall()
    }
    conn.close()
    result = []
    for r in shop_rows:
        d = dict(r)
        d["unlocked"] = (d["name"], d["item_type"]) in owned_names
        result.append(d)
    return result

@router.post("/shop/{id}/purchase")
def purchase_item(id: int, user_id: str = Depends(get_user_id)):
    conn = get_db()
    item = conn.execute("SELECT * FROM shop_items WHERE id = ?", (id,)).fetchone()
    if not item:
        conn.close()
        raise HTTPException(status_code=404, detail="Item not found")

    char = conn.execute(
        "SELECT * FROM character WHERE user_id = ?", (user_id,)
    ).fetchone()
    if not char:
        conn.close()
        raise HTTPException(status_code=400, detail="No character found")

    if char["total_xp_earned"] < item["xp_cost"]:
        conn.close()
        raise HTTPException(status_code=400, detail="Not enough XP")

    already_owned = conn.execute(
        "SELECT id FROM inventory WHERE user_id = ? AND name = ? AND item_type = ?",
        (user_id, item["name"], item["item_type"])
    ).fetchone()
    if already_owned:
        conn.close()
        raise HTTPException(status_code=400, detail="Item already owned")

    cur = conn.execute("""
        INSERT INTO inventory (user_id, item_type, name, description, rarity, emoji, equipped, acquired_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'))
    """, (user_id, item["item_type"], item["name"], item["description"],
          item["rarity"], item["emoji"]))
    conn.commit()
    row = conn.execute("SELECT * FROM inventory WHERE id = ?", (cur.lastrowid,)).fetchone()
    conn.close()
    d = dict(row)
    d["equipped"] = bool(d["equipped"])
    return d
