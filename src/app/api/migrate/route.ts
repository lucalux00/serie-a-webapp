import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!process.env.POSTGRES_URL) {
    return NextResponse.json({ error: 'POSTGRES_URL is not set. Database not connected.' }, { status: 500 });
  }

  try {
    console.log('Avvio migrazione dati...');

    // 1. Creazione Tabelle
    await sql`
      CREATE TABLE IF NOT EXISTS players (
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
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS transfers (
        id SERIAL PRIMARY KEY,
        team_id VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL,
        player VARCHAR(100) NOT NULL,
        other_team VARCHAR(100),
        fee VARCHAR(50),
        date VARCHAR(50),
        status VARCHAR(50)
      );
    `;

    // Svuota le tabelle per evitare duplicati se la migrazione viene lanciata due volte
    await sql`TRUNCATE TABLE players RESTART IDENTITY;`;
    await sql`TRUNCATE TABLE transfers RESTART IDENTITY;`;
    
    // --- MLOps Tables ---
    await sql`DROP TABLE IF EXISTS ml_predictions;`;
    await sql`
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
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS ml_team_weights (
        team_name VARCHAR(255) PRIMARY KEY,
        competition VARCHAR(100) NOT NULL,
        form_rating NUMERIC(5,2) DEFAULT 1.0,
        historical_accuracy NUMERIC(5,2) DEFAULT 0.5,
        matches_analyzed INTEGER DEFAULT 0,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Lettura file JSON
    const squadsPath = path.join(process.cwd(), 'src', 'data', 'deepSquads.json');
    if (!fs.existsSync(squadsPath)) {
      return NextResponse.json({ error: 'deepSquads.json not found' }, { status: 404 });
    }
    
    const allSquads = JSON.parse(fs.readFileSync(squadsPath, 'utf8'));

    // 3. Inserimento dati per ogni squadra
    let playersCount = 0;
    let transfersCount = 0;

    for (const [teamId, squadData] of Object.entries<any>(allSquads)) {
      // --- FIRST TEAM ---
      if (squadData.firstTeam) {
        // Coach
        if (squadData.firstTeam.coach) {
          await sql`
            INSERT INTO players (team_id, name, role, module, is_coach, squad_type)
            VALUES (${teamId}, ${squadData.firstTeam.coach.name}, ${squadData.firstTeam.coach.role}, ${squadData.firstTeam.coach.module || null}, TRUE, 'first')
          `;
          playersCount++;
        }
        // Staff
        if (Array.isArray(squadData.firstTeam.staff)) {
          for (const staff of squadData.firstTeam.staff) {
            await sql`
              INSERT INTO players (team_id, name, role, is_staff, squad_type)
              VALUES (${teamId}, ${staff.name}, ${staff.role}, TRUE, 'first')
            `;
            playersCount++;
          }
        }
        // Players
        if (Array.isArray(squadData.firstTeam.players)) {
          for (const player of squadData.firstTeam.players) {
            const num = (player.number && player.number !== '-') ? parseInt(player.number) : null;
            await sql`
              INSERT INTO players (team_id, name, position, number, status, squad_type)
              VALUES (${teamId}, ${player.name}, ${player.position}, ${num}, ${player.status || null}, 'first')
            `;
            playersCount++;
          }
        }
      }

      // --- PRIMAVERA ---
      if (squadData.primavera) {
        if (squadData.primavera.coach) {
          await sql`
            INSERT INTO players (team_id, name, role, module, is_coach, squad_type)
            VALUES (${teamId}, ${squadData.primavera.coach.name}, ${squadData.primavera.coach.role}, ${squadData.primavera.coach.module || null}, TRUE, 'primavera')
          `;
          playersCount++;
        }
        if (Array.isArray(squadData.primavera.players)) {
          for (const player of squadData.primavera.players) {
            const num = (player.number && player.number !== '-') ? parseInt(player.number) : null;
            await sql`
              INSERT INTO players (team_id, name, position, number, status, squad_type)
              VALUES (${teamId}, ${player.name}, ${player.position}, ${num}, ${player.status || null}, 'primavera')
            `;
            playersCount++;
          }
        }
      }

      // --- TRANSFERS ---
      if (Array.isArray(squadData.transfers)) {
        for (const tr of squadData.transfers) {
          await sql`
            INSERT INTO transfers (team_id, type, player, other_team, fee, date, status)
            VALUES (${teamId}, ${tr.type}, ${tr.player}, ${tr.otherTeam}, ${tr.fee}, ${tr.date}, ${tr.status})
          `;
          transfersCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migrazione completata con successo!',
      stats: {
        playersInserted: playersCount,
        transfersInserted: transfersCount
      }
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed', details: error.message }, { status: 500 });
  }
}
