from sqlalchemy import create_engine, text  # <- import text

# Your URL with encoded dot
engine = create_engine("postgresql+psycopg2://postgres:bdupassword%2E@localhost:5432/postgres")
conn = engine.connect()

# Wrap SQL in text()
result = conn.execute(text("SELECT 1"))
print(result.fetchall())

conn.close()
