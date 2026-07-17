import os
import psycopg2
import requests
from datetime import datetime, timedelta

API_KEY = "2fc579dbb539cbc9c2e4caa650d7b47f"
DB_URL = os.environ.get("POSTGRES_URL")

SPORTS = [
    'soccer_italy_serie_a', 
    'soccer_uefa_champs_league', 
    'soccer_uefa_europa_league',
    'soccer_epl',
    'soccer_spain_la_liga',
    'soccer_germany_bundesliga',
    'soccer_france_ligue_one',
    'soccer_friendly_international',
    'soccer_friendly_club'
]

def fetch_scores(sport, days_from=3):
    url = f"https://api.the-odds-api.com/v4/sports/{sport}/scores/?apiKey={API_KEY}&daysFrom={days_from}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching scores for {sport}: {e}")
        return []

def determine_result(home_score, away_score):
    if home_score is None or away_score is None:
        return None
    try:
        h = int(home_score)
        a = int(away_score)
        if h > a: return '1'
        elif a > h: return '2'
        else: return 'X'
    except ValueError:
        return None

def main():
    if not DB_URL:
        print("POSTGRES_URL environment variable is not set. Exiting.")
        return

    print("Inizio ciclo di Feedback Loop (Continuous Learning)...")
    
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # 1. Trova le partite passate che non hanno ancora un esito
        cur.execute("""
            SELECT id, match_name, pick, competition 
            FROM ml_predictions 
            WHERE match_date < NOW() AND is_correct IS NULL
        """)
        pending_matches = cur.fetchall()
        
        if not pending_matches:
            print("Nessuna previsione pendente da verificare.")
            return
            
        print(f"Trovate {len(pending_matches)} partite da verificare.")
        
        # 2. Scarica i risultati reali degli ultimi 3 giorni
        all_scores = []
        for sport in SPORTS:
            all_scores.extend(fetch_scores(sport, days_from=3))
            
        # Creiamo un dizionario basato sull'id del match (the-odds-api usa lo stesso ID per odds e scores)
        scores_dict = {m['id']: m for m in all_scores if m.get('completed')}
        
        correct_count = 0
        evaluated_count = 0
        
        for match_id, match_name, pick, competition in pending_matches:
            real_match = scores_dict.get(match_id)
            if not real_match:
                continue
                
            scores = real_match.get('scores')
            if not scores:
                continue
                
            home_team = real_match['home_team']
            away_team = real_match['away_team']
            home_score = next((s['score'] for s in scores if s['name'] == home_team), None)
            away_score = next((s['score'] for s in scores if s['name'] == away_team), None)
            
            actual_res = determine_result(home_score, away_score)
            if not actual_res:
                continue
                
            is_correct = False
            # Verifica semplice
            if pick == actual_res:
                is_correct = True
            elif pick == '1X' and actual_res in ['1', 'X']:
                is_correct = True
            elif pick == 'X2' and actual_res in ['X', '2']:
                is_correct = True
            elif pick == 'Gol' and home_score and away_score and int(home_score) > 0 and int(away_score) > 0:
                is_correct = True
                
            evaluated_count += 1
            if is_correct: correct_count += 1
            
            # 3. Aggiorna ml_predictions
            cur.execute("""
                UPDATE ml_predictions 
                SET actual_result = %s, is_correct = %s 
                WHERE id = %s
            """, (actual_res, is_correct, match_id))
            
            # 4. Aggiorna ml_team_weights (Loss Function semplificata)
            # Penalizziamo o premiamo entrambe le squadre coinvolte
            teams = [home_team, away_team]
            for team in teams:
                # Upsert logica per i pesi
                cur.execute("SELECT form_rating, matches_analyzed FROM ml_team_weights WHERE team_name = %s", (team,))
                row = cur.fetchone()
                
                # Se l'algoritmo ha indovinato, la forma della squadra è "prevedibile", quindi aumentiamo il peso
                # Se ha sbagliato, c'è un'anomalia (underperformance o overperformance), riduciamo il rating
                adjustment = 0.05 if is_correct else -0.05
                
                if row:
                    current_rating, matches_played = row
                    new_rating = max(0.5, min(1.5, float(current_rating) + adjustment))
                    cur.execute("""
                        UPDATE ml_team_weights 
                        SET form_rating = %s, matches_analyzed = matches_analyzed + 1, last_updated = NOW()
                        WHERE team_name = %s
                    """, (new_rating, team))
                else:
                    new_rating = max(0.5, min(1.5, 1.0 + adjustment))
                    cur.execute("""
                        INSERT INTO ml_team_weights (team_name, competition, form_rating, matches_analyzed)
                        VALUES (%s, %s, %s, 1)
                    """, (team, competition, new_rating))

        conn.commit()
        print(f"Feedback Loop Completato! Verificate {evaluated_count} partite. Corrette: {correct_count}.")
        
    except Exception as e:
        print(f"ERRORE Database nel Feedback Loop: {e}")
    finally:
        if cur: cur.close()
        if conn: conn.close()

if __name__ == "__main__":
    main()
