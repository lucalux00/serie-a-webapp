import os
import psycopg2

DB_URL = os.environ.get("POSTGRES_URL")

def main():
    if not DB_URL:
        print("Errore: POSTGRES_URL non trovato.")
        return

    print("Connessione al database di produzione Vercel in corso...")
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # 1. Droppiamo le vecchie tabelle
        print("Rimozione vecchie tabelle...")
        cur.execute("DROP TABLE IF EXISTS players CASCADE;")
        cur.execute("DROP TABLE IF EXISTS transfers CASCADE;")
        cur.execute("DROP TABLE IF EXISTS ml_predictions CASCADE;")
        cur.execute("DROP TABLE IF EXISTS ml_team_weights CASCADE;")
        
        # 2. Ricreiamo le tabelle con lo schema corretto
        print("Creazione nuove tabelle...")
        cur.execute("""
            CREATE TABLE players (
                id SERIAL PRIMARY KEY,
                team_id VARCHAR(50) NOT NULL,
                name VARCHAR(100) NOT NULL,
                position VARCHAR(20),
                number INT,
                role VARCHAR(50),
                module VARCHAR(20),
                is_coach BOOLEAN DEFAULT FALSE,
                is_staff BOOLEAN DEFAULT FALSE,
                squad_type VARCHAR(20) DEFAULT 'first',
                status VARCHAR(50)
            );
        """)
        
        cur.execute("""
            CREATE TABLE transfers (
                id SERIAL PRIMARY KEY,
                team_id VARCHAR(50) NOT NULL,
                type VARCHAR(50) NOT NULL,
                player VARCHAR(100) NOT NULL,
                other_team VARCHAR(100),
                fee VARCHAR(50),
                date VARCHAR(50),
                status VARCHAR(50)
            );
        """)
        
        cur.execute("""
            CREATE TABLE ml_predictions (
                id VARCHAR(255) PRIMARY KEY,
                match_name VARCHAR(255) NOT NULL,
                competition VARCHAR(100),
                pick VARCHAR(50) NOT NULL,
                odds NUMERIC(5,2) NOT NULL,
                match_date TIMESTAMP WITH TIME ZONE NOT NULL,
                confidence_score NUMERIC(5,2),
                algorithm_version VARCHAR(50),
                actual_result VARCHAR(50),
                is_correct BOOLEAN,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        cur.execute("""
            CREATE TABLE ml_team_weights (
                team_name VARCHAR(255) PRIMARY KEY,
                competition VARCHAR(100) NOT NULL,
                form_rating NUMERIC(5,2) DEFAULT 1.0,
                historical_accuracy NUMERIC(5,2) DEFAULT 0.5,
                matches_analyzed INTEGER DEFAULT 0,
                last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        conn.commit()
        print("MIGRAZIONE DATABASE COMPLETATA CON SUCCESSO! Lo schema ora contiene tutte le colonne (incluso 'module' e 'competition').")
        
    except Exception as e:
        print(f"ERRORE CRITICO DB: {e}")
    finally:
        if cur: cur.close()
        if conn: conn.close()

if __name__ == "__main__":
    main()
