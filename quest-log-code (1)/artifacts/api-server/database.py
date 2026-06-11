import sqlite3
import os
from datetime import datetime, date, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "questlog.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def _needs_migration(conn) -> bool:
    try:
        conn.execute("SELECT user_id FROM character LIMIT 1")
        return False
    except Exception:
        return True

def init_db():
    conn = get_db()

    if _needs_migration(conn):
        conn.close()
        if os.path.exists(DB_PATH):
            os.remove(DB_PATH)
        conn = get_db()

    c = conn.cursor()
    c.executescript("""
        CREATE TABLE IF NOT EXISTS character (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL DEFAULT 'default',
            name TEXT NOT NULL,
            class_name TEXT NOT NULL DEFAULT 'Adventurer',
            level INTEGER NOT NULL DEFAULT 1,
            xp INTEGER NOT NULL DEFAULT 0,
            xp_to_next_level INTEGER NOT NULL DEFAULT 100,
            strength INTEGER NOT NULL DEFAULT 5,
            endurance INTEGER NOT NULL DEFAULT 5,
            focus INTEGER NOT NULL DEFAULT 5,
            agility INTEGER NOT NULL DEFAULT 5,
            luck INTEGER NOT NULL DEFAULT 5,
            avatar_emoji TEXT NOT NULL DEFAULT '🧚',
            equipped_outfit TEXT,
            equipped_pet TEXT,
            equipped_weapon TEXT,
            total_tasks_completed INTEGER NOT NULL DEFAULT 0,
            total_xp_earned INTEGER NOT NULL DEFAULT 0,
            streak_days INTEGER NOT NULL DEFAULT 0,
            last_completed_date TEXT,
            UNIQUE(user_id)
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL DEFAULT 'default',
            title TEXT NOT NULL,
            description TEXT,
            priority TEXT NOT NULL DEFAULT 'medium',
            xp_reward INTEGER NOT NULL DEFAULT 50,
            stat_bonus_type TEXT,
            stat_bonus_value INTEGER,
            due_date TEXT,
            completed INTEGER NOT NULL DEFAULT 0,
            completed_at TEXT,
            category TEXT,
            boss_id INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS daily_quests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL DEFAULT 'default',
            title TEXT NOT NULL,
            description TEXT,
            xp_reward INTEGER NOT NULL DEFAULT 30,
            completed INTEGER NOT NULL DEFAULT 0,
            difficulty TEXT NOT NULL DEFAULT 'easy',
            icon TEXT NOT NULL DEFAULT '⭐',
            quest_date TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS bosses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL DEFAULT 'default',
            title TEXT NOT NULL,
            description TEXT,
            max_hp INTEGER NOT NULL DEFAULT 100,
            current_hp INTEGER NOT NULL DEFAULT 100,
            xp_reward INTEGER NOT NULL DEFAULT 500,
            defeated INTEGER NOT NULL DEFAULT 0,
            difficulty TEXT NOT NULL DEFAULT 'normal',
            emoji TEXT NOT NULL DEFAULT '🐉',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL DEFAULT 'default',
            item_type TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            rarity TEXT NOT NULL DEFAULT 'common',
            emoji TEXT NOT NULL DEFAULT '🎁',
            equipped INTEGER NOT NULL DEFAULT 0,
            acquired_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS shop_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_type TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            rarity TEXT NOT NULL DEFAULT 'common',
            emoji TEXT NOT NULL DEFAULT '🎁',
            xp_cost INTEGER NOT NULL DEFAULT 100
        );
    """)
    conn.commit()

    shop_count = c.execute("SELECT COUNT(*) FROM shop_items").fetchone()[0]
    if shop_count == 0:
        shop_items = [
            ("outfit", "Starlight Dress",     "A gown woven from starlight",          "rare",      "👗", 500),
            ("outfit", "Crystal Armor",       "Shimmering magical plate armor",       "epic",      "🛡️", 1200),
            ("outfit", "Enchanted Robes",     "Ancient robes imbued with magic",      "rare",      "🧙‍♀️", 600),
            ("outfit", "Dragon Scale Gown",   "A gown forged from dragon scales",     "legendary", "🐉", 3000),
            ("outfit", "Adventurer's Cloak",  "A well-worn cloak for the road",       "common",    "🎒", 150),
            ("pet",    "Baby Dragon",         "A small fire-breathing companion",     "epic",      "🐲", 1500),
            ("pet",    "Wise Owl",            "An owl that grants +Focus nearby",     "rare",      "🦉", 800),
            ("pet",    "Lucky Cat",           "Brings fortune to all your quests",    "rare",      "🐱", 700),
            ("pet",    "Phoenix Chick",       "A rare bird reborn from the ashes",    "legendary", "🦅", 2500),
            ("pet",    "Tiny Slime",          "Squishy and surprisingly helpful",     "common",    "🫧", 100),
            ("weapon", "Wand of Productivity","Cuts through procrastination",          "epic",      "🪄", 1000),
            ("weapon", "Scholar's Staff",     "Boosts all learning-related tasks",    "rare",      "📚", 750),
            ("weapon", "Lightning Bow",       "Strike tasks down with speed",         "rare",      "🏹", 800),
            ("weapon", "Sparkle Hammer",      "Heavy but mighty — for hard tasks",    "epic",      "✨", 1100),
            ("weapon", "Legendary Blade",     "The ultimate weapon for legendary heroes","legendary","🗡️", 3500),
        ]
        for item_type, name, desc, rarity, emoji, xp_cost in shop_items:
            c.execute("""
                INSERT INTO shop_items (item_type, name, description, rarity, emoji, xp_cost)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (item_type, name, desc, rarity, emoji, xp_cost))
    conn.commit()
    conn.close()

DAILY_QUESTS_POOL = [
    ("Complete 3 tasks today",  "Finish any 3 tasks from your quest log",             60, "medium", "📋"),
    ("Morning routine",         "Start your day strong — wake up and get moving",     30, "easy",   "🌅"),
    ("Study session",           "Spend at least 30 minutes learning something new",   50, "medium", "📚"),
    ("Hydration quest",         "Drink 8 glasses of water today",                     20, "easy",   "💧"),
    ("Boss encounter",          "Deal damage to an active boss battle",               80, "hard",   "⚔️"),
    ("Inbox zero",              "Clear out your messages and emails",                 40, "medium", "📬"),
    ("Focus sprint",            "Work without distractions for 25 minutes",           50, "medium", "🎯"),
    ("Gratitude journal",       "Write down 3 things you're grateful for",            25, "easy",   "✍️"),
    ("Stretch break",           "Take a 5-minute stretch or walk break",              20, "easy",   "🧘"),
    ("Legendary challenge",     "Complete one high or legendary priority task",      100, "hard",   "🏆"),
]

def seed_user_data(user_id: str):
    """Called once when a new user creates their character."""
    conn = get_db()
    c = conn.cursor()
    today = date.today().isoformat()

    existing_daily = c.execute(
        "SELECT id FROM daily_quests WHERE user_id = ? AND quest_date = ?",
        (user_id, today)
    ).fetchone()
    if not existing_daily:
        import random
        selected = random.sample(DAILY_QUESTS_POOL, 5)
        for title, desc, xp, diff, icon in selected:
            c.execute("""
                INSERT INTO daily_quests (user_id, title, description, xp_reward, completed, difficulty, icon, quest_date)
                VALUES (?, ?, ?, ?, 0, ?, ?, ?)
            """, (user_id, title, desc, xp, diff, icon, today))

    task_count = c.execute("SELECT COUNT(*) FROM tasks WHERE user_id = ?", (user_id,)).fetchone()[0]
    if task_count == 0:
        sample_tasks = [
            ("Clean your room",      "Tidy up the bedroom and organize your desk", "low",    25,  "strength", 1, None, "home"),
            ("Finish assignment",    "Complete the homework due this week",         "high",  150, "focus",    2, None, "study"),
            ("Go to the gym",        "30 minute workout session",                   "medium", 75, "endurance",2, None, "health"),
            ("Read for 20 minutes",  "Read any book of your choice",                "low",   25,  "focus",    1, None, "study"),
        ]
        for title, desc, priority, xp, stat_type, stat_val, due, cat in sample_tasks:
            c.execute("""
                INSERT INTO tasks (user_id, title, description, priority, xp_reward,
                    stat_bonus_type, stat_bonus_value, due_date, category, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            """, (user_id, title, desc, priority, xp, stat_type, stat_val, due, cat))

    boss_count = c.execute("SELECT COUNT(*) FROM bosses WHERE user_id = ?", (user_id,)).fetchone()[0]
    if boss_count == 0:
        c.execute("""
            INSERT INTO bosses (user_id, title, description, max_hp, current_hp, xp_reward, defeated, difficulty, emoji)
            VALUES (?, 'Final Exam Dragon', 'A terrifying boss representing your upcoming exams. Study hard to defeat it!',
                    300, 300, 600, 0, 'hard', '🐉')
        """, (user_id,))

    conn.commit()
    conn.close()

def ensure_daily_quests(conn, user_id: str, today: str):
    existing = conn.execute(
        "SELECT id FROM daily_quests WHERE user_id = ? AND quest_date = ?",
        (user_id, today)
    ).fetchone()
    if not existing:
        import random
        selected = random.sample(DAILY_QUESTS_POOL, 5)
        for title, desc, xp, diff, icon in selected:
            conn.execute("""
                INSERT INTO daily_quests (user_id, title, description, xp_reward, completed, difficulty, icon, quest_date)
                VALUES (?, ?, ?, ?, 0, ?, ?, ?)
            """, (user_id, title, desc, xp, diff, icon, today))
        conn.commit()

XP_TABLE = {
    1: 100, 2: 200, 3: 350, 4: 550, 5: 800,
    6: 1100, 7: 1500, 8: 2000, 9: 2600, 10: 3300,
    11: 4100, 12: 5000, 13: 6000, 14: 7200, 15: 8500,
    16: 10000, 17: 11700, 18: 13600, 19: 15700, 20: 18000,
}

def xp_for_next_level(level: int) -> int:
    return XP_TABLE.get(level, 18000 + (level - 20) * 2500)

def priority_to_xp(priority: str) -> int:
    return {"low": 25, "medium": 75, "high": 150, "legendary": 300}.get(priority, 50)

def boss_difficulty_to_xp(difficulty: str, max_hp: int) -> int:
    return {"normal": 300, "hard": 600, "legendary": 1200}.get(difficulty, 300)
