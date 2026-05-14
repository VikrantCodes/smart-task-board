import sqlite3

DATABASE = 'tasks.db'   # SQLite creates this file automatically

def get_db():
    '''Return an open database connection. row_factory enables
       column access by name: row['title'] instead of row[1]'''
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    '''Create the tasks table if it does not already exist.
       Call this once when the server starts.'''
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            title       TEXT    NOT NULL,
            completed   INTEGER DEFAULT 0,
            created_at  TEXT    DEFAULT (datetime('now'))
        )
    ''')
    conn.commit()
    conn.close()
    print('Database ready.')
